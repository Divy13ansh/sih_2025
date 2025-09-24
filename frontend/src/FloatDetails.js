import { useParams } from "react-router-dom";
import { useEffect, useState, useRef, useMemo } from "react";
import Plot from "react-plotly.js";
import "./FloatDetails.css";

export default function FloatDetails() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const plotContainerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (plotContainerRef.current) {
      const resizeObserver = new ResizeObserver(entries => {
        if (entries && entries.length > 0) {
          const { width, height } = entries[0].contentRect;
          setDimensions({ width, height });
        }
      });
      resizeObserver.observe(plotContainerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, [data]);

  useEffect(() => {
    fetch((process.env.REACT_APP_BACKEND || "http://127.0.0.1:8000") + `/floats/${id}`)
      .then(r => {
        if (!r.ok) throw new Error("Failed to fetch float data.");
        return r.json();
      })
      .then(setData)
      .catch(err => {
        console.error(err);
        setError(err.message);
      });
  }, [id]);

  const chartData = useMemo(() => {
    if (!data || !data.records) return null;
    return {
      levels: data.records.map(rec => rec.level),
      temperatures: data.records.map(rec => rec.temperature),
      salinities: data.records.map(rec => rec.salinity),
      pressures: data.records.map(rec => rec.pressure)
    };
  }, [data]);

  const formatTimestamp = (isoString) => {
    const date = new Date(isoString + 'Z');
    const options = {
      year: 'numeric', month: 'short', day: '2-digit',
      hour: 'numeric', minute: '2-digit', hour12: true,
    };
    return new Intl.DateTimeFormat('en-US', options).format(date);
  };

  if (error) return <p className="loading-message">Error: {error}</p>;
  if (!data || !chartData) return <p className="loading-message">Loading float data...</p>;
  if (!Array.isArray(data.records) || data.records.length === 0) {
    return <p className="loading-message">No records found for this float.</p>;
  }

  return (
    <div className="float-details-container">
      <header className="float-details-header">
        <h2>Float {data.float_id}</h2>
      </header>

      <div className="details-card plot-container" ref={plotContainerRef}>
        {dimensions.width > 0 && (
          <Plot
            // UPDATED: Chart colors now match the requested theme
            data={[
              { x: chartData.levels, y: chartData.temperatures, type: 'scatter', mode: 'lines', name: 'Temperature (°C)', line: { color: '#ff6b6b', width: 3 }, hoverinfo: 'x+y' },
              { x: chartData.levels, y: chartData.salinities, type: 'scatter', mode: 'lines', name: 'Salinity (PSU)', line: { color: '#3d8bfd', width: 3 }, hoverinfo: 'x+y' },
              { x: chartData.levels, y: chartData.pressures, type: 'scatter', mode: 'lines', name: 'Pressure (dbar)', line: { color: '#1dd3a6', width: 3 }, hoverinfo: 'x+y' }
            ]}
            layout={{
              width: dimensions.width, height: dimensions.height,
              title: { text: 'Sensor Measurements by Level', font: { size: 22, weight: '600' } },
              paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
              font: { family: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif", color: '#2d3748' },
              legend: { orientation: 'h', yanchor: 'bottom', y: 1.02, xanchor: 'right', x: 1 },
              margin: { l: 70, r: 40, b: 60, t: 80 }, hovermode: 'x unified',
              xaxis: { title: 'Level', gridcolor: 'rgba(0, 0, 0, 0.08)', zeroline: false },
              yaxis: { title: 'Value', gridcolor: 'rgba(0, 0, 0, 0.08)', zeroline: false },
              hoverlabel: { bgcolor: "#2d3748", font: { color: "#ffffff", size: 14 } }
            }}
            useResizeHandler={false}
            config={{ displayModeBar: true, responsive: true }}
          />
        )}
      </div>

      <div className="download-button-container">
        <button className="download-button"
          onClick={() => {
            const url = (process.env.REACT_APP_BACKEND || "http://localhost:8000") + `/floats/${id}/csv`;
            window.open(url, "_blank");
          }}
        >
          Download CSV
        </button>
      </div>

      <div className="details-card">
        <h3>Recorded Data</h3>
        <ul className="records-list">
          {data.records.map((rec, idx) => (
            <li key={idx}>
              <div><strong>Time:</strong> {formatTimestamp(rec.time)}</div>
              <div><strong>Level:</strong> {rec.level}</div>
              <div><strong>Temp:</strong> {rec.temperature}°C</div>
              <div><strong>Salinity:</strong> {rec.salinity} PSU</div>
              <div><strong>Pressure:</strong> {rec.pressure} dbar</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}