import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleMark, AppleMark } from "./icons";
import { API_BASE_URL } from "../api";
import "./Auth.css";

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/profile/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("userId", data.userId);
        localStorage.setItem("token", data.token);
        localStorage.setItem("isAdmin", String(Boolean(data.isAdmin)));
        onLogin();
        navigate("/home");
      } else {
        setError(data.error || "Invalid credentials");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Server error. Try again later.");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-heading">
        <h1>Welcome Back !</h1>
        <p>please enter your credentials to login</p>
      </div>

      <div className="auth-card">
        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="email"
            placeholder="Email or Username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="auth-submit auth-submit--primary">
            Log In
          </button>
        </form>

        <div className="auth-divider">
          <span />
          <p>or Continue with</p>
          <span />
        </div>

        <div className="auth-social">
          <button type="button" className="auth-social-btn" title="Continue with Google">
            <GoogleMark size={20} />
          </button>
          <button type="button" className="auth-social-btn" title="Continue with Apple">
            <AppleMark size={20} />
          </button>
        </div>
      </div>

      <p className="auth-switch">
        Don't have an account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
};

export default Login;
