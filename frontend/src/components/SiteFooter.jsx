import React from "react";
import { GithubMark } from "./icons";
import "./SiteFooter.css";

// Shared footer for the dark-surface pages (Home, About Us).
const SiteFooter = () => (
  <footer className="site-footer">
    <hr />
    <a
      href="https://github.com/maiHydrogen/SortAid"
      target="_blank"
      rel="noopener noreferrer"
      className="site-footer-link"
    >
      <span>https://github.com/maiHydrogen/SortAid</span>
      <GithubMark size={18} />
    </a>
  </footer>
);

export default SiteFooter;
