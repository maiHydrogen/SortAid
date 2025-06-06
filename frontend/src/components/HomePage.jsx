import React from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <h1>Welcome to SortAid</h1>
      <h2>Find Your Perfect Scholarship Today!</h2>
      <p>Start your journey to a debt-free education by discovering the perfect scholarships tailored by us for you according to your</p>
      <p>qualification and needs. Let us help you in paving a path towards your dreams.</p>
      <button onClick={() => navigate("/scholarships")}>Search Scholarships</button>
    </div>
  );
};

export default HomePage;