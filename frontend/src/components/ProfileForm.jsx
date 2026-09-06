import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "./UserContext";
import { authFetch } from "../api";
import "./ProfileForm.css";

// Shared edit-info form: rendered both inline in the Navbar's profile
// dropdown ("panel" variant) and full-width on the standalone /profile
// page ("page" variant).
const ProfileForm = ({ variant = "page" }) => {
  const { user, setUser } = useContext(UserContext);
  const [form, setForm] = useState({
    name: "",
    email: "",
    gpa: "",
    location: "",
    course: "",
    interests: "",
  });
  const [status, setStatus] = useState("");

  const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  useEffect(() => {
    setForm((f) => ({
      ...f,
      name: user?.name || f.name,
      email: user?.email || f.email,
    }));
  }, [user]);

  useEffect(() => {
    if (!userId) return;
    authFetch(`/api/profile/${userId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        setForm((f) => ({
          ...f,
          gpa: data.gpa ?? f.gpa,
          location: data.location ?? f.location,
          course: data.course ?? f.course,
          interests: (data.interests || []).join(", "),
        }));
      })
      .catch(() => {});
  }, [userId]);

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) {
      setStatus("You need to be logged in to update your info.");
      return;
    }
    try {
      const res = await authFetch(`/api/profile/${userId}`, {
        method: "PUT",
        body: JSON.stringify({
          gpa: Number(form.gpa) || undefined,
          location: form.location,
          course: form.course,
          interests: form.interests
            .split(",")
            .map((i) => i.trim())
            .filter(Boolean),
        }),
      });
      if (res.ok) {
        setStatus("Info updated!");
        setUser((u) => ({ ...u, name: form.name, email: form.email }));
      } else {
        setStatus("Couldn't save right now.");
      }
    } catch {
      setStatus("Server error. Try again later.");
    }
  };

  return (
    <form className={`profile-form profile-form--${variant}`} onSubmit={handleSubmit}>
      <input type="text" placeholder="Full Name" value={form.name} onChange={handleChange("name")} />
      <input type="email" placeholder="Email Address" value={form.email} onChange={handleChange("email")} />
      <div className="profile-form-row">
        <input type="number" step="0.01" placeholder="Current GPA" value={form.gpa} onChange={handleChange("gpa")} />
        <input type="text" placeholder="Location" value={form.location} onChange={handleChange("location")} />
      </div>
      <input
        type="text"
        placeholder="Course/Academic Major"
        value={form.course}
        onChange={handleChange("course")}
      />
      <input
        type="text"
        placeholder="Your Interests"
        value={form.interests}
        onChange={handleChange("interests")}
      />
      <button type="submit" className="profile-form-submit">
        Update info
      </button>
      {status && <p className="profile-form-status">{status}</p>}
    </form>
  );
};

export default ProfileForm;
