const { scoreScholarship, matchScholarships } = require("../utils/matching");

const baseProfile = { gpa: 3.8, course: "Computer Science", location: "New York", interests: [] };

const baseScholarship = (overrides = {}) => ({
  title: "Award",
  source: "Test",
  amount: "$100",
  eligibility: { course: "Computer Science" },
  deadline: "2099-01-01",
  applicationLink: "https://example.com",
  ...overrides,
});

describe("scoreScholarship", () => {
  test("returns null when the course doesn't match", () => {
    const scholarship = baseScholarship({ eligibility: { course: "Biology" } });
    expect(scoreScholarship(scholarship, baseProfile)).toBeNull();
  });

  test("returns null when the profile's GPA is below the requirement", () => {
    const scholarship = baseScholarship({ eligibility: { course: "Computer Science", gpa: 3.95 } });
    expect(scoreScholarship(scholarship, baseProfile)).toBeNull();
  });

  test("returns null for a scholarship whose deadline has passed", () => {
    const scholarship = baseScholarship({ deadline: "2000-01-01" });
    expect(scoreScholarship(scholarship, baseProfile)).toBeNull();
  });

  test("scores an urgent, high-value, location-matching scholarship higher", () => {
    const urgent = baseScholarship({
      title: "Urgent Award",
      amountValue: 10000,
      deadlineDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      eligibility: { course: "Computer Science", location: "New York" },
    });
    const distant = baseScholarship({
      title: "Distant Award",
      amountValue: 100,
      deadlineDate: new Date(Date.now() + 89 * 24 * 60 * 60 * 1000),
    });

    expect(scoreScholarship(urgent, baseProfile)).toBeGreaterThan(scoreScholarship(distant, baseProfile));
  });

  test("gives a small bonus for each matching interest, capped at 3", () => {
    const scholarship = baseScholarship({ title: "STEM Robotics AI Award" });
    const profile = { ...baseProfile, interests: ["robotics", "AI", "stem", "unrelated"] };
    const withInterests = scoreScholarship(scholarship, profile);
    const without = scoreScholarship(scholarship, baseProfile);
    expect(withInterests - without).toBe(3);
  });
});

describe("matchScholarships", () => {
  test("drops ineligible scholarships and sorts the rest by score descending", () => {
    const scholarships = [
      baseScholarship({ title: "Wrong Course", eligibility: { course: "Biology" } }),
      baseScholarship({ title: "Low Value", amountValue: 100, deadlineDate: new Date(Date.now() + 89 * 24 * 60 * 60 * 1000) }),
      baseScholarship({ title: "High Value", amountValue: 10000, deadlineDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) }),
    ];

    const result = matchScholarships(scholarships, baseProfile);

    expect(result.map((s) => s.title)).toEqual(["High Value", "Low Value"]);
    expect(result[0].score).toBeGreaterThan(result[1].score);
  });
});
