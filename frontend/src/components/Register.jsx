import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { API_BASE_URL, authFetch } from "../api";
import "./Auth.css";

const Register = ({ onRegister }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [gpa, setGpa] = useState("");
  const [location, setLocation] = useState("");
  const [course, setCourse] = useState("");
  const [interests, setInterests] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { setUser } = useUser();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const userData = { name, email, password, gpa, location, course };

    try {
      const response = await fetch(`${API_BASE_URL}/api/profile/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("userId", data.userId);
        localStorage.setItem("token", data.token);
        localStorage.setItem("isAdmin", String(Boolean(data.isAdmin)));

        // Persist the richer profile fields (gpa/course/location/interests)
        // against the new user, now that we're authenticated.
        await authFetch("/api/profile", {
          method: "POST",
          body: JSON.stringify({
            gpa: Number(gpa) || undefined,
            course,
            location,
            interests: interests
              .split(",")
              .map((i) => i.trim())
              .filter(Boolean),
          }),
        });

        setUser(userData);
        onRegister();
        navigate("/home");
      } else {
        setError(data.error || "Registration failed");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError("Server error during registration");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-heading">
        <h1>Don't have an account ?</h1>
        <h1>No Worries, Register Now !</h1>
        <p>Please provide the following details to register</p>
      </div>

      <div className="auth-card">
        <form onSubmit={handleSubmit} className="auth-form">
          <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="auth-form-row">
            <input
              type="number"
              step="0.01"
              placeholder="Current GPA"
              value={gpa}
              onChange={(e) => setGpa(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>
          <input
            type="text"
            placeholder="Course/Academic Major"
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Your Interests"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="auth-submit auth-submit--green">
            Register
          </button>
        </form>
      </div>

      <p className="auth-switch">
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
};

export default Register;
