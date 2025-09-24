import xarray as xr

# Open the NetCDF file
ds = xr.open_dataset("data/20250901_prof.nc")

# See the structure
print(ds)

# List all variables
print(ds.variables)

# View a specific variable (e.g., temperature)
# print(ds['temperature'])
