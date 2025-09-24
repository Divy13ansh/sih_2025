import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MapView from "./MapView";
import FloatDetails from "./FloatDetails";
import Chat from "./Chat";
import Layout from "./Layout";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<MapView />} />
          <Route path="float/:id" element={<FloatDetails />} />
          <Route path="chat" element={<Chat />} />
        </Route>
      </Routes>
    </Router>
  );
}
