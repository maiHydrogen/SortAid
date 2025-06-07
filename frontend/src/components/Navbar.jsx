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
          <div className="authen">
            <Link to="/home">Home</Link>
            <Link to="/scholarships">Find Scholarships</Link>
            <Link to="/profile">Profile</Link>
          </div>
          </>
        ) : (
          <>
          <div className="linkcontainer">
          <div className="start">
            <Link to="/home" >Home</Link>
            <Link to="/scholarships">Find Scholarships</Link>
          </div>
          <div className="last">
            <Link to="/login" className="login">Login</Link>
            <Link to="/register" className="register">Register</Link>
          </div>
          </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;