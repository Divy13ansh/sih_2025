import xarray as xr
import pandas as pd

ds = xr.open_dataset("data/20250901_prof.nc")

# Extract variables
profiles = ds.dims['N_PROF']
levels = ds.dims['N_LEVELS']

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
print(df.head())
