import React from "react";
import { Link } from "react-router-dom";
import "./LandingPage.css";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>FloatChat</h1>
          <p>Making Ocean Data Effortless for Researchers</p>
          <Link to="/map">
            <button className="btn-primary">Explore Map</button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <h2>Why FloatChat?</h2>
        <div className="feature-cards">
          <div className="card">
            <h3>Real-time Data</h3>
            <p>Access ocean float data instantly and interactively.</p>
          </div>
          <div className="card">
            <h3>AI Assistance</h3>
            <p>Get insights and answers using AI-powered conversation.</p>
          </div>
          <div className="card">
            <h3>Easy Navigation</h3>
            <p>Simple interface to explore floats and ocean data maps.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
