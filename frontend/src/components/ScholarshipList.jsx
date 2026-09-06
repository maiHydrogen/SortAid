import { useEffect, useMemo, useState } from "react";
import { ChevronRight, FunnelPlus, CircleX, KeyIcon } from "./icons";
import { API_BASE_URL } from "../api";
import "./ScholarshipList.css";

const FILTER_CHIPS = ["GPA", "Course", "Location", "Amount", "Deadline", "Source"];
const NEW_WINDOW_DAYS = 7;

const isRecent = (isoDate) => {
  if (!isoDate) return false;
  const days = (Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24);
  return days <= NEW_WINDOW_DAYS;
};

const ScholarshipList = () => {
  const [scholarships, setScholarships] = useState([]);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [activeChips, setActiveChips] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const fetchScholarships = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/scholarships`);
        if (!response.ok) throw new Error("Request failed");
        const data = await response.json();
        setScholarships(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching scholarships:", err);
        setError("Failed to load scholarships.");
      }
    };
    fetchScholarships();
  }, []);

  const toggleChip = (chip) => {
    setActiveChips((chips) => (chips.includes(chip) ? chips.filter((c) => c !== chip) : [...chips, chip]));
  };

  const clearFilters = () => {
    setQuery("");
    setActiveChips([]);
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return scholarships;
    return scholarships.filter(
      (s) => s.title?.toLowerCase().includes(q) || s.source?.toLowerCase().includes(q)
    );
  }, [scholarships, query]);

  return (
    <div className="scholarship-page">
      <div className="scholarship-search-row">
        <input
          type="text"
          className="scholarship-search-input"
          placeholder="Type your keyword here..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="button" className="scholarship-search-btn">
          Search
        </button>
      </div>

      <div className="scholarship-filter-row">
        <button type="button" className="filter-icon-btn" title="More filters">
          <FunnelPlus size={18} color="var(--color-accent)" />
        </button>
        {FILTER_CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            className={`filter-chip ${activeChips.includes(chip) ? "filter-chip--active" : ""}`}
            onClick={() => toggleChip(chip)}
          >
            {chip}
          </button>
        ))}
        <button type="button" className="filter-icon-btn" title="Clear filters" onClick={clearFilters}>
          <CircleX size={22} color="var(--color-accent)" />
        </button>
      </div>

      {error && <p className="scholarship-error">{error}</p>}
      {!error && visible.length === 0 && <p className="scholarship-empty">No scholarships match yet.</p>}

      <div className="scholarship-cards">
        {visible.map((sch) => {
          const id = sch._id || sch.title;
          const expanded = expandedId === id;
          const showLabel = isRecent(sch.scrapedAt);

          return (
            <div key={id} className={`scholarship-card ${expanded ? "scholarship-card--expanded" : ""}`}>
              <div className="scholarship-card-summary">
                <div className="scholarship-card-accent" />
                <div className="scholarship-card-body">
                  <div className="scholarship-card-head">
                    <h3>{sch.title || "Scholarship Title"}</h3>
                    <button
                      type="button"
                      className="scholarship-card-chevron"
                      onClick={() => setExpandedId(expanded ? null : id)}
                      aria-label={expanded ? "Collapse details" : "Expand details"}
                    >
                      <ChevronRight
                        size={18}
                        color="var(--color-text-on-light-muted)"
                        style={{ transform: expanded ? "rotate(90deg)" : "none" }}
                      />
                    </button>
                  </div>
                  <p className="scholarship-card-meta">
                    <KeyIcon size={13} color="#9aa0a6" /> Amount : {sch.amount || "N/A"}
                  </p>
                  <p className="scholarship-card-meta">
                    <KeyIcon size={13} color="#9aa0a6" /> Deadline : {sch.deadline || "N/A"}
                  </p>
                  {showLabel && <span className="scholarship-card-label">NEW</span>}

                  {!expanded && (
                    <>
                      <hr />
                      <a
                        className="scholarship-apply-link"
                        href={sch.applicationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <KeyIcon size={13} color="var(--color-coral)" /> Apply Now
                      </a>
                    </>
                  )}
                </div>
              </div>

              {expanded && (
                <div className="scholarship-card-expanded">
                  <div className="scholarship-expanded-left">
                    <h3>{sch.title || "Scholarship Title"}</h3>
                    <p className="scholarship-expanded-label">Eligibility -</p>
                    <p>GPA - {sch.eligibility?.gpa ?? "N/A"}</p>
                    <p>Course - {sch.eligibility?.course || "N/A"}</p>
                    <p>Location - {sch.eligibility?.location || "N/A"}</p>
                    <p className="scholarship-expanded-spacer" />
                    <p>Source - {sch.source || "N/A"}</p>
                    <p>
                      Scraped At -{" "}
                      {sch.scrapedAt ? new Date(sch.scrapedAt).toLocaleString() : "N/A"}
                    </p>
                  </div>
                  <div className="scholarship-expanded-divider" />
                  <div className="scholarship-expanded-right">
                    <p>Amount : {sch.amount || "N/A"}</p>
                    <p>Deadline : {sch.deadline || "N/A"}</p>
                    <a
                      className="scholarship-apply-btn"
                      href={sch.applicationLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Apply Now !
                    </a>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScholarshipList;
