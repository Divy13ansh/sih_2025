import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./LandingPage";
import MapView from "./MapView";
import FloatDetails from "./FloatDetails";
import Chat from "./Chat";
import Layout from "./Layout";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route path="/" element={<Layout />}>
          <Route path="map" element={<MapView />} />
          <Route path="float/:id" element={<FloatDetails />} />
          <Route path="chat" element={<Chat />} />
        </Route>
      </Routes>

    </Router>
  );
}
 