const request = require("supertest");
const app = require("../app");
const Scholarship = require("../models/Scholarship");
const { connect, closeDatabase, clearDatabase } = require("./testDb");

beforeAll(async () => connect());
afterEach(async () => clearDatabase());
afterAll(async () => closeDatabase());

const registerAndBuildProfile = async (overrides = {}) => {
  const profile = {
    gpa: 3.8,
    course: "Computer Science",
    location: "New York",
    interests: [],
    ...overrides,
  };
  const auth = await request(app).post("/api/profile/register").send({
    name: "Test User",
    email: `${Math.random()}@example.com`,
    password: "correct-horse-battery",
    ...profile,
  });
  await request(app)
    .post("/api/profile")
    .set("Authorization", `Bearer ${auth.body.token}`)
    .send(profile);
  return auth.body; // { userId, token }
};

describe("GET /api/scholarships/match/:userId", () => {
  test("requires auth and only allows matching your own profile", async () => {
    const userA = await registerAndBuildProfile();
    const userB = await registerAndBuildProfile();

    const noAuth = await request(app).get(`/api/scholarships/match/${userA.userId}`);
    expect(noAuth.status).toBe(401);

    const wrongUser = await request(app)
      .get(`/api/scholarships/match/${userA.userId}`)
      .set("Authorization", `Bearer ${userB.token}`);
    expect(wrongUser.status).toBe(403);
  });

  test("filters out scholarships the profile doesn't qualify for", async () => {
    const { userId, token } = await registerAndBuildProfile();

    await Scholarship.create([
      {
        title: "CS Award",
        source: "Test",
        amount: "$1000",
        eligibility: { course: "Computer Science", gpa: 3.5, location: "New York" },
        deadline: "2099-01-01",
        applicationLink: "https://example.com",
      },
      {
        title: "Biology Award",
        source: "Test",
        amount: "$1000",
        eligibility: { course: "Biology" },
        deadline: "2099-01-01",
        applicationLink: "https://example.com",
      },
      {
        title: "Too High GPA Award",
        source: "Test",
        amount: "$1000",
        eligibility: { course: "Computer Science", gpa: 3.95 },
        deadline: "2099-01-01",
        applicationLink: "https://example.com",
      },
    ]);

    const res = await request(app)
      .get(`/api/scholarships/match/${userId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    const titles = res.body.map((s) => s.title);
    expect(titles).toContain("CS Award");
    expect(titles).not.toContain("Biology Award");
    expect(titles).not.toContain("Too High GPA Award");
  });

  test("ranks a location match above an otherwise-identical non-match", async () => {
    const { userId, token } = await registerAndBuildProfile({ location: "New York" });

    await Scholarship.create([
      {
        title: "Faraway Award",
        source: "Test",
        amount: "$100",
        eligibility: { course: "Computer Science", location: "Tokyo" },
        deadline: "2099-01-01",
        applicationLink: "https://example.com",
      },
      {
        title: "Local Award",
        source: "Test",
        amount: "$100",
        eligibility: { course: "Computer Science", location: "New York" },
        deadline: "2099-01-01",
        applicationLink: "https://example.com",
      },
    ]);

    const res = await request(app)
      .get(`/api/scholarships/match/${userId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.body[0].title).toBe("Local Award");
  });

  test("uses the normalized amountValue/deadlineDate when present instead of re-parsing strings", async () => {
    const { userId, token } = await registerAndBuildProfile();

    await Scholarship.create({
      title: "Pre-normalized Award",
      source: "Test",
      amount: "this text can't be parsed as a number",
      amountValue: 10000,
      eligibility: { course: "Computer Science" },
      deadline: "not a real date",
      deadlineDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days out
      applicationLink: "https://example.com",
    });

    const res = await request(app)
      .get(`/api/scholarships/match/${userId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body[0].title).toBe("Pre-normalized Award");
    // amountValue >= 10000 (+5) and deadline within 30 days but over 7 (+5) = 10
    expect(res.body[0].score).toBe(10);
  });

  test("excludes a scholarship whose deadline has already passed", async () => {
    const { userId, token } = await registerAndBuildProfile();

    await Scholarship.create([
      {
        title: "Expired Award",
        source: "Test",
        amount: "$1000",
        eligibility: { course: "Computer Science" },
        deadline: "2000-01-01",
        applicationLink: "https://example.com",
      },
      {
        title: "Still Open Award",
        source: "Test",
        amount: "$1000",
        eligibility: { course: "Computer Science" },
        deadline: "2099-01-01",
        applicationLink: "https://example.com",
      },
    ]);

    const res = await request(app)
      .get(`/api/scholarships/match/${userId}`)
      .set("Authorization", `Bearer ${token}`);

    const titles = res.body.map((s) => s.title);
    expect(titles).not.toContain("Expired Award");
    expect(titles).toContain("Still Open Award");
  });
});
