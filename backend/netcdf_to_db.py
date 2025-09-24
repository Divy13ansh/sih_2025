import os, xarray as xr, psycopg2, glob
from dateutil import parser
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv('DB_URL')  # use env var in production
conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

# Create tables if not exist
cur.execute("""
CREATE TABLE IF NOT EXISTS floats (
  float_id TEXT PRIMARY KEY,
  wmo TEXT,
  deploy_lat REAL,
  deploy_lon REAL
);
""")
cur.execute("""
CREATE TABLE IF NOT EXISTS profiles (
  profile_id SERIAL PRIMARY KEY,
  float_id TEXT,
  timestamp TIMESTAMP,
  lat REAL,
  lon REAL
);
""")
cur.execute("""
CREATE TABLE IF NOT EXISTS measurements (
  id SERIAL PRIMARY KEY,
  profile_id INT REFERENCES profiles(profile_id),
  variable TEXT,
  depth REAL,
  value REAL
);
""")
conn.commit()

files = glob.glob("data/*.nc")
for f in files:
    try:
        ds = xr.open_dataset(f)
    except Exception as e:
        print("skip", f, e); continue
    # Many ARGO files have variable names in upper-case; adjust if different
    try:
        float_id = str(ds.PLATFORM_NUMBER.values) if 'PLATFORM_NUMBER' in ds else str(ds.WMO_NUMBER.values)
    except:
        float_id = os.path.basename(f).split("_")[0]
    # basic lat lon timestamp extraction
    lat = float(ds.LATITUDE.values) if 'LATITUDE' in ds else float(ds.latitude.values)
    lon = float(ds.LONGITUDE.values) if 'LONGITUDE' in ds else float(ds.longitude.values)
    # JULD is ARGO time (days since ref) — xarray may already present as datetime
    try:
        juld = ds.JULD.values
        # juld may be array; pick first
        import numpy as np
        if hasattr(juld, "__len__"):
            juld = juld[0]
    except:
        juld = None

    # Insert float if not exists
    cur.execute("INSERT INTO floats (float_id, wmo, deploy_lat, deploy_lon) VALUES (%s,%s,%s,%s) ON CONFLICT (float_id) DO NOTHING",
                (float_id, float_id, lat, lon))
    # Insert profile
    ts = None
    if juld is not None:
        try:
            ts = str(juld)  # Postgres can parse ISO / numpy datetime
        except:
            ts = None
    cur.execute("INSERT INTO profiles (float_id, timestamp, lat, lon) VALUES (%s,%s,%s,%s) RETURNING profile_id",
                (float_id, ts, lat, lon))
    pid = cur.fetchone()[0]
    # For variables, common ARGO names: PRES, TEMP, PSAL
    for var_name in ["PRES","TEMP","PSAL","DOXY","NITRATE","CHLA"]:
        if var_name in ds:
            arr_var = ds[var_name].values
            arr_pres = ds['PRES'].values if 'PRES' in ds else None
            # flatten and iterate if arrays
            try:
                # handle shape: (Nlevels,) or (1, Nlevels)
                if arr_var.ndim == 2:
                    arr = arr_var[0]
                else:
                    arr = arr_var
            except:
                arr = arr_var
            pres = None
            if 'PRES' in ds:
                presv = ds['PRES'].values
                pres = presv[0] if presv.ndim==2 else presv
            for i, val in enumerate(arr):
                try:
                    depth = float(pres[i]) if pres is not None else None
                    value = float(val) if val is not None and not (str(val).lower()=='nan') else None
                    if value is None:
                        continue
                    cur.execute("INSERT INTO measurements (profile_id, variable, depth, value) VALUES (%s,%s,%s,%s)",
                                (pid, var_name.lower(), depth, value))
                except Exception as e:
                    continue
    conn.commit()
print("ETL done")
