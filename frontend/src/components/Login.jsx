import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import "./Login.css";

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const response = await fetch("http://localhost:8000/api/profile/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      onLogin(); // set isAuthenticated = true
      localStorage.setItem("userId", data.userId); // Save user ID if needed
      navigate("/home");
    } else {
      alert(data.error || "Invalid credentials");
    }
  } catch (err) {
    console.error("Login error:", err);
    alert("Server error. Try again later.");
  }
};

  return (
    <>
    <div className="heading">
      <h1>Welcome Back!</h1>
      <p>Please enter your credentials to login</p>
    </div>
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit} className="login-form">
        <input
          type="email"
          placeholder="Email"
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
        <button type="submit">Login</button>
      </form>
      <p>Don't have an account ? <Link to="/register">Register</Link></p>
    </div>
    </>
  );
};

export default Login;