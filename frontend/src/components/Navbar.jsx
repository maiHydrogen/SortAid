import React from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

const Navbar = ({ isAuthenticated }) => {
  return (
    <nav className="navbar">
      <div className="navbar-brand">SortAid</div>
      <div className="navbar-links">
        {isAuthenticated ? (
          <>
            <Link to="/home">Home</Link>
            <Link to="/scholarships">Find Scholarships</Link>
            <Link to="/profile">Profile</Link>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;