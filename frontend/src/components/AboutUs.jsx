import { useNavigate } from "react-router-dom";
import SiteFooter from "./SiteFooter";
import "./AboutUs.css";

const VALUES = [
  {
    title: "What We Do",
    body: "SortAid pulls scholarship listings from education portals, government sites, and scholarship platforms into one place, so you're not hunting across a dozen tabs.",
  },
  {
    title: "How It Works",
    body: "Build your profile once — GPA, course, location, interests — and our matching engine ranks scholarships against it automatically, every time new ones come in.",
  },
  {
    title: "Our Mission",
    body: "Funding shouldn't be the hardest part of getting an education. We want every student to find the aid they qualify for, without the noise.",
  },
];

const AboutUs = () => {
  const navigate = useNavigate();

  return (
    <div className="about-page">
      <section className="about-hero">
        <h1>About SortAid</h1>
        <p>A scholarship portal that finds the funding, so you can focus on the studying.</p>
      </section>

      <section className="about-values">
        {VALUES.map((v) => (
          <div className="about-value" key={v.title}>
            <div className="about-value-bar" />
            <div>
              <h3>{v.title}</h3>
              <p>{v.body}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="about-cta">
        <div>
          <h3>Ready to find yours?</h3>
          <p>Create a profile and start matching with scholarships in minutes.</p>
        </div>
        <button className="pill-btn pill-btn--filled" onClick={() => navigate("/register")}>
          Get Started
        </button>
      </section>

      <SiteFooter />
    </div>
  );
};

export default AboutUs;
