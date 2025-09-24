import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import "./FloatDetails.css";

export default function FloatDetails() {
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch((process.env.REACT_APP_BACKEND || "http://127.0.0.1:8000") + `/floats/${id}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, [id]);

  if (!data) return <p>Loading float data...</p>;

  // Prepare data for Plotly
  const levels = data.records.map(rec => rec.level);
  const temperatures = data.records.map(rec => rec.temperature);
  const salinities = data.records.map(rec => rec.salinity);
  const pressures = data.records.map(rec => rec.pressure);

  return (
    <div className="float-details">
      <h2>Float {data.float_id}</h2>

      <Plot
        data={[
          {
            x: levels,
            y: temperatures,
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Temperature (°C)',
            marker: { color: 'red' },
          },
          {
            x: levels,
            y: salinities,
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Salinity',
            marker: { color: 'blue' },
          },
          {
            x: levels,
            y: pressures,
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Pressure',
            marker: { color: 'green' },
          }
        ]}
        layout={{
          width: 800,
          height: 500,
          title: `Float ${data.float_id} Measurements by Level`,
          xaxis: { title: 'Level' },
          yaxis: { title: 'Value' },
          legend: { orientation: 'h' }
        }}
      />

    <button
        onClick={() => {
            const url = (process.env.REACT_APP_BACKEND || "http://localhost:8000") + `/floats/${id}/csv`;
            window.open(url, "_blank");
        }}
        >
        Download CSV
    </button>


      <ul>
        {data.records.map((rec, idx) => (
          <li key={idx}>
            <strong>{rec.time}</strong>: Level: <strong>{rec.level}</strong> - Temp: {rec.temperature}°C, Salinity: {rec.salinity}, Pressure: {rec.pressure}
          </li>
        ))}
      </ul>
    </div>
  );
}