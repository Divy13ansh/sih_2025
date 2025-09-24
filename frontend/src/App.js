import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MapView from "./MapView";
import FloatDetails from "./FloatDetails";
import "./App.css";


export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MapView />} />
        <Route path="/float/:id" element={<FloatDetails />} />
      </Routes>
    </Router>
  );
}
