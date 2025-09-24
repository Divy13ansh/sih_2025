import xarray as xr
import pandas as pd
import psycopg2
from psycopg2.extras import execute_batch
from dotenv import load_dotenv
import os

load_dotenv()

# ---------------------------
# CONFIGURATION
# ---------------------------
NETCDF_FILE = "20250901_prof.nc"  # Path to your NetCDF file
CONN_STRING = os.getenv("DB_URL")  # Your NeonDB connection string
TABLE_NAME = "argo_profiles"

# ---------------------------
# STEP 1: LOAD AND FLATTEN NETCDF
# ---------------------------
ds = xr.open_dataset(NETCDF_FILE)

profiles = ds.sizes['N_PROF']
levels = ds.sizes['N_LEVELS']

data_list = []

for i in range(profiles):
    for j in range(levels):
        data_list.append({
            "profile_id": i,
            "lat": float(ds['LATITUDE'][i]),
            "lon": float(ds['LONGITUDE'][i]),
            "time": pd.to_datetime(ds['JULD'][i].values),
            "level": j,
            "pres": float(ds['PRES'][i,j]),
            "temp": float(ds['TEMP'][i,j]),
            "psal": float(ds['PSAL'][i,j])
        })

df = pd.DataFrame(data_list)
print(f"Flattened DataFrame size: {df.shape}")

# ---------------------------
# STEP 2: CONNECT TO NEONDB
# ---------------------------
conn = psycopg2.connect(CONN_STRING)
cursor = conn.cursor()

# ---------------------------
# STEP 3: CREATE TABLE IF NOT EXISTS
# ---------------------------
create_table_query = f"""
CREATE TABLE IF NOT EXISTS {TABLE_NAME} (
    profile_id INT,
    lat DOUBLE PRECISION,
    lon DOUBLE PRECISION,
    time TIMESTAMP,
    level INT,
    pres REAL,
    temp REAL,
    psal REAL
);
"""
cursor.execute(create_table_query)
conn.commit()
print(f"Table '{TABLE_NAME}' ready.")

# ---------------------------
# STEP 4: BULK INSERT
# ---------------------------
cols = ','.join(df.columns)
values = [tuple(x) for x in df.to_numpy()]
insert_query = f"INSERT INTO {TABLE_NAME} ({cols}) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"

execute_batch(cursor, insert_query, values, page_size=1000)
conn.commit()
print(f"Inserted {len(df)} rows into '{TABLE_NAME}'.")

# ---------------------------
# STEP 5: CLOSE CONNECTION
# ---------------------------
cursor.close()
conn.close()
print("NeonDB connection closed.")
