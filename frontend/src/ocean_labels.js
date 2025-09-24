const oceanLabels = {
  "type": "FeatureCollection",
  "features": [
    // Oceans
    {
      "type": "Feature",
      "properties": { "name": "Pacific Ocean" },
      "geometry": { "type": "Point", "coordinates": [-150, 0] }
    },
    {
      "type": "Feature",
      "properties": { "name": "Atlantic Ocean" },
      "geometry": { "type": "Point", "coordinates": [-30, 0] }
    },
    {
      "type": "Feature",
      "properties": { "name": "Indian Ocean" },
      "geometry": { "type": "Point", "coordinates": [80, -20] }
    },
    // {
    //   "type": "Feature",
    //   "properties": { "name": "Southern Ocean" },
    //   "geometry": { "type": "Point", "coordinates": [20, -70] }
    // },
    {
      "type": "Feature",
      "properties": { "name": "Arctic Ocean" },
      "geometry": { "type": "Point", "coordinates": [10, 80] }
    },
    // Major Seas
    {
      "type": "Feature",
      "properties": { "name": "Mediterranean Sea" },
      "geometry": { "type": "Point", "coordinates": [15, 38] }
    },
    {
      "type": "Feature",
      "properties": { "name": "Caribbean Sea" },
      "geometry": { "type": "Point", "coordinates": [-75, 15] }
    },
    {
      "type": "Feature",
      "properties": { "name": "South China Sea" },
      "geometry": { "type": "Point", "coordinates": [115, 15] }
    },
    {
      "type": "Feature",
      "properties": { "name": "Arabian Sea" },
      "geometry": { "type": "Point", "coordinates": [65, 15] }
    },
    {
      "type": "Feature",
      "properties": { "name": "Coral Sea" },
      "geometry": { "type": "Point", "coordinates": [155, -15] }
    },
    {
      "type": "Feature",
      "properties": { "name": "Bay of Bengal" },
      "geometry": { "type": "Point", "coordinates": [88, 15] }
    },
    {
      "type": "Feature",
      "properties": { "name": "Gulf of Mexico" },
      "geometry": { "type": "Point", "coordinates": [-90, 25] }
    },
    {
        "type": "Feature",
        "properties": { "name": "Bering Sea" },
        "geometry": { "type": "Point", "coordinates": [-175, 58] }
    }
  ]
};

export default oceanLabels;