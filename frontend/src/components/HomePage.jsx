import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDoubleDown } from "./icons";
import SiteFooter from "./SiteFooter";
import "./HomePage.css";

// Original, self-contained illustration for the feature section — no
// external image asset required.
const ScholarshipIllustration = () => (
  <svg viewBox="0 0 420 320" className="feature-illustration-svg" role="img" aria-label="Scholarship matching illustration">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#1c2340" />
        <stop offset="100%" stopColor="#0d1024" />
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="420" height="320" rx="24" fill="url(#bgGrad)" />
    {/* constellation / matching network */}
    <g stroke="#3b4478" strokeWidth="1.4" opacity="0.8">
      <line x1="60" y1="70" x2="150" y2="120" />
      <line x1="150" y1="120" x2="120" y2="220" />
      <line x1="150" y1="120" x2="260" y2="90" />
      <line x1="260" y1="90" x2="340" y2="150" />
      <line x1="260" y1="90" x2="300" y2="230" />
      <line x1="120" y1="220" x2="300" y2="230" />
    </g>
    <g>
      <circle cx="60" cy="70" r="5" fill="#5b6bf0" />
      <circle cx="150" cy="120" r="6" fill="#f0481f" />
      <circle cx="120" cy="220" r="5" fill="#6fae47" />
      <circle cx="260" cy="90" r="6" fill="#6fae47" />
      <circle cx="340" cy="150" r="5" fill="#5b6bf0" />
      <circle cx="300" cy="230" r="5" fill="#f0481f" />
    </g>
    {/* graduation cap */}
    <g transform="translate(150,150)">
      <path d="M60 0L120 24L60 48L0 24L60 0Z" fill="#f6f6f4" />
      <path d="M30 34v22c0 8 13.4 14 30 14s30-6 30-14V34L60 48 30 34Z" fill="#e7e7e2" />
      <line x1="118" y1="24" x2="118" y2="62" stroke="#f6f6f4" strokeWidth="2.4" />
      <circle cx="118" cy="66" r="3.4" fill="#f0481f" />
    </g>
    {/* certificate/document */}
    <g transform="translate(56,190)">
      <rect x="0" y="0" width="60" height="76" rx="6" fill="#f6f6f4" />
      <rect x="10" y="14" width="40" height="4" rx="2" fill="#c7c9d6" />
      <rect x="10" y="26" width="40" height="4" rx="2" fill="#c7c9d6" />
      <rect x="10" y="38" width="26" height="4" rx="2" fill="#c7c9d6" />
      <circle cx="44" cy="58" r="10" fill="#6fae47" />
      <path d="M40 58l3 3 6-6" stroke="#f6f6f4" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      {/* Hero */}
      <section className="hero">
        <h1>Find Your Perfect Scholarship Today !</h1>
        <p>
          Start your journey to a debt-free education by discovering the perfect scholarships tailored by us for
          you according to your qualifications and needs. Let us help you in paving a path towards your dreams.
        </p>
        <div className="hero-actions">
          <button className="pill-btn pill-btn--filled" onClick={() => navigate("/register")}>
            Get Started
          </button>
          <button className="pill-btn pill-btn--outline" onClick={() => navigate("/scholarships")}>
            Learn More
          </button>
        </div>
        <div className="hero-scroll-cue" aria-hidden="true">
          <ChevronDoubleDown size={22} color="var(--color-text-on-dark-muted)" />
        </div>
      </section>

      {/* Features */}
      <section className="feature-section">
        <div className="feature-illustration">
          <ScholarshipIllustration />
        </div>
        <div className="feature-copy">
          <div className="feature-block feature-block--left">
            <h3>Find your Scholarship</h3>
            <p>Easily Search and filter through vast database of scholarships</p>
          </div>
          <div className="feature-block feature-block--right">
            <h3>Personalized Scholarship Matches</h3>
            <p>
              Our Advanced algorithm matches scholarships with your qualifications and your profile delivering a
              personalized search results and seamless user experience
            </p>
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="cta-banner">
        <div className="cta-banner-copy">
          <h3>New Scholarships are added everyday !</h3>
          <p>
            So what are you waiting for?
            <br />
            Choose from our vast database and remember new scholarships are added everyday globally !
          </p>
        </div>
        <button className="pill-btn pill-btn--filled cta-banner-btn" onClick={() => navigate("/scholarships")}>
          Search Scholarships Now !
        </button>
      </section>

      <SiteFooter />
    </div>
  );
};

export default HomePage;
