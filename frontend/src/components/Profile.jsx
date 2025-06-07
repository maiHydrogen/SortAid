import React, { useContext } from "react";
import { UserContext } from "./UserContext";
import "./Profile.css"; // Optional: if you want to style it nicely

const Profile = () => {
  const { user } = useContext(UserContext);

  if (!user) {
    return <p>Loading profile...</p>;
  }

  return (
    <div className="profile-container">
      <h2>Your Profile</h2>
      <div className="profile-field">
        <strong>Name:</strong> <span>{user.name}</span>
      </div>
      <div className="profile-field">
        <strong>Email:</strong> <span>{user.email}</span>
      </div>
      <div className="profile-field">
        <strong>GPA:</strong> <span>{user.gpa}</span>
      </div>
      <div className="profile-field">
        <strong>Course:</strong> <span>{user.course}</span>
      </div>
      <div className="profile-field">
        <strong>Location:</strong> <span>{user.location}</span>
      </div>
    </div>
  );
};

export default Profile;