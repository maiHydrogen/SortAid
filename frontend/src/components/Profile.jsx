import React, { useContext, useState } from "react";
import { UserContext } from "./UserContext";
import "./Profile.css";

const Profile = () => {
  const { user, setUser } = useContext(UserContext);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(user || {});

  if (!user) {
    return <p className="profile-message">Please log in to view your profile.</p>;
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    setUser(formData);
    setIsEditing(false);
  };

  return (
    <div className="profile-container">
      <h2>User Profile</h2>
      <div className="profile-details">
        {isEditing ? (
          <>
            <input name="name" value={formData.name} onChange={handleChange} placeholder="Name" />
            <input name="email" value={formData.email} onChange={handleChange} placeholder="Email" />
            <input name="grades" value={formData.grades} onChange={handleChange} placeholder="Grades" />
            <input name="location" value={formData.location} onChange={handleChange} placeholder="Location" />
            <input name="course" value={formData.course} onChange={handleChange} placeholder="Course" />
            <button onClick={handleSave}>Save</button>
            <button onClick={() => setIsEditing(false)}>Cancel</button>
          </>
        ) : (
          <>
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Grades:</strong> {user.grades}</p>
            <p><strong>Location:</strong> {user.location}</p>
            <p><strong>Course:</strong> {user.course}</p>
            <button onClick={() => setIsEditing(true)}>Edit Profile</button>
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;