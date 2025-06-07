import React from "react";
import "./ScholarshipList.css";

const scholarships = [
  {
    id: 1,
    title: "National Scholarship Portal",
    description: "Available for BTech students.",
  },
  
];
const ScholarshipList = () => {
  return (
    <div className="scholarship-list-container">
      <h2>Available Scholarships</h2>
      <div className="scholarship-cards">
        {scholarships.map((scholarship) => (
          <div key={scholarship.id} className="scholarship-card">
            <h3>{scholarship.title}</h3>
            <p>{scholarship.description}</p>
            <button>Apply Now</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScholarshipList;