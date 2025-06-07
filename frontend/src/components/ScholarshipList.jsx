import React, { useEffect, useState } from 'react';
import './ScholarshipList.css';
import axios from 'axios';

const ScholarshipList = () => {
  const [scholarships, setScholarships] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchScholarships = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/scholarships');
        setScholarships(response.data);
      } catch (err) {
        console.error("Error fetching scholarships:", err);
        setError("Failed to load scholarships.");
      }
    };

    fetchScholarships();
  }, []);

  return (
    <div className="scholarship-list-container">
      <h2>Available Scholarships</h2>
      {error && <p className="error">{error}</p>}
      <div className="scholarship-grid">
        {Array.isArray(scholarships) && scholarships.map((sch, index) => (
          <div className="scholarship-card" key={index}>
            <h3 className="title">{sch.title}</h3>
            <p className="amount">{sch.amount}</p>
            <p><strong>Source:</strong> {sch.source}</p>
            <p><strong>Deadline:</strong> {sch.deadline}</p>
            <p><strong>Course:</strong> {sch.eligibility?.course || 'N/A'}</p>
            <p><strong>Location:</strong> {sch.eligibility?.location || 'N/A'}</p>
            <a className="apply-button" href={sch.applicationLink} target="_blank" rel="noopener noreferrer">
              Apply Now
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScholarshipList;