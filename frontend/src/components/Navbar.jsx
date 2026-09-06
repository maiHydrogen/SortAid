import { useContext, useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { UserContext } from "./UserContext";
import ProfileForm from "./ProfileForm";
import { LogoMark, UserCircle } from "./icons";
import "./Navbar.css";

// Auth pages get a stripped-down bar: just the Log In / Register toggle,
// no logo or nav links, per the Figma.
const MINIMAL_ROUTES = ["/login", "/register"];
// Pages rendered on the dark surface use the light/orange navbar treatment;
// pages on the light surface use the dark-text/muted treatment.
const DARK_SURFACE_ROUTES = ["/home", "/login", "/register"];

const Navbar = ({ isAuthenticated }) => {
  const location = useLocation();
  const { user } = useContext(UserContext);
  const [panelOpen, setPanelOpen] = useState(false);
  const panelRef = useRef(null);

  const isMinimal = MINIMAL_ROUTES.includes(location.pathname);
  const onDarkSurface = DARK_SURFACE_ROUTES.includes(location.pathname);

  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setPanelOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const surfaceClass = onDarkSurface ? "navbar--dark" : "navbar--light";

  if (isMinimal) {
    return (
      <nav className={`navbar navbar--minimal ${surfaceClass}`}>
        <div className="navbar-auth-toggle">
          <Link
            to="/login"
            className={`pill-btn ${location.pathname === "/login" ? "pill-btn--filled" : "pill-btn--outline"}`}
          >
            Log In
          </Link>
          <Link
            to="/register"
            className={`pill-btn ${location.pathname === "/register" ? "pill-btn--filled" : "pill-btn--outline"}`}
          >
            Register
          </Link>
        </div>
      </nav>
    );
  }

  return (
    <nav className={`navbar ${surfaceClass}`}>
      <Link to="/home" className="navbar-brand">
        <span>Sort</span>
        <LogoMark size={17} />
        <span>id</span>
      </Link>

      <div className="navbar-links">
        <Link to="/home">Home</Link>
        <Link to="/scholarships">Find Scholarships</Link>
        <Link to="/about">About Us</Link>
      </div>

      {isAuthenticated ? (
        <div className="navbar-profile" ref={panelRef}>
          <button
            type="button"
            className={`user-pill ${panelOpen ? "user-pill--active" : ""}`}
            onClick={() => setPanelOpen((v) => !v)}
          >
            <span>{user?.name || "User Name"}</span>
            <span className="user-pill-avatar">
              <UserCircle size={18} color="#ffffff" />
            </span>
          </button>
          {panelOpen && (
            <div className="navbar-profile-panel">
              <ProfileForm variant="panel" />
            </div>
          )}
        </div>
      ) : (
        <div className="navbar-auth-toggle">
          <Link to="/login" className="pill-btn pill-btn--filled">
            Log In
          </Link>
          <Link to="/register" className="pill-btn pill-btn--outline">
            Register
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
