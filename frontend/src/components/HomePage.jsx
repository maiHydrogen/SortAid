import React from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <h1>Welcome to SortAid</h1>
      <p>Discover scholarships tailored to your profile.</p>
      <button onClick={() => navigate("/scholarships")}>Search Scholarships</button>
    </div>
  );
};

export default HomePage;