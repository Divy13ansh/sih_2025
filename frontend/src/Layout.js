import { Link, Outlet } from "react-router-dom";
import "./Layout.css"; // we'll style it

export default function Layout() {
  return (
    <div className="app-layout">
      <nav className="navbar">
        <h1 className="logo">🌊 FloatChat</h1>
        <ul className="nav-links">
          <li><Link to="/">Map</Link></li>
          <li><Link to="/chat">Chat</Link></li>
        </ul>
      </nav>

      {/* Where nested routes render */}
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
