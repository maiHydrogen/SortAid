const request = require("supertest");
const app = require("../app");
const User = require("../models/User");
const Scholarship = require("../models/Scholarship");
const { connect, closeDatabase, clearDatabase } = require("./testDb");

beforeAll(async () => connect());
afterEach(async () => clearDatabase());
afterAll(async () => closeDatabase());

const registerUser = async (email) => {
  const res = await request(app).post("/api/profile/register").send({
    name: "Test User",
    email,
    password: "correct-horse-battery",
    gpa: 3.5,
    location: "New York",
    course: "Computer Science",
  });
  return res.body; // { userId, token, isAdmin }
};

const sampleScholarship = {
  title: "New Award",
  source: "Test",
  amount: "$500",
  eligibility: { course: "Computer Science" },
  deadline: "2099-01-01",
  applicationLink: "https://example.com",
};

describe("scholarship write routes are admin-only", () => {
  test("register defaults isAdmin to false", async () => {
    const { isAdmin } = await registerUser("student@example.com");
    expect(isAdmin).toBe(false);
  });

  test("a regular user cannot create/update/delete scholarships", async () => {
    const { token } = await registerUser("student@example.com");

    const create = await request(app)
      .post("/api/scholarships")
      .set("Authorization", `Bearer ${token}`)
      .send(sampleScholarship);
    expect(create.status).toBe(403);

    const scholarship = await Scholarship.create(sampleScholarship);
    const update = await request(app)
      .put(`/api/scholarships/${scholarship._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ ...sampleScholarship, title: "Hacked" });
    expect(update.status).toBe(403);

    const del = await request(app)
      .delete(`/api/scholarships/${scholarship._id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(del.status).toBe(403);
  });

  test("promoting a user to admin (directly in the DB) takes effect immediately", async () => {
    const { userId, token } = await registerUser("admin@example.com");
    await User.findByIdAndUpdate(userId, { isAdmin: true });

    const create = await request(app)
      .post("/api/scholarships")
      .set("Authorization", `Bearer ${token}`) // same token issued before the promotion
      .send(sampleScholarship);

    expect(create.status).toBe(201);
    expect(create.body.title).toBe("New Award");
  });

  test("unauthenticated requests are rejected before the admin check", async () => {
    const res = await request(app).post("/api/scholarships").send(sampleScholarship);
    expect(res.status).toBe(401);
  });
});
