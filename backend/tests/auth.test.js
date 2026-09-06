const request = require("supertest");
const app = require("../app");
const User = require("../models/User");
const { connect, closeDatabase, clearDatabase } = require("./testDb");

beforeAll(async () => connect());
afterEach(async () => clearDatabase());
afterAll(async () => closeDatabase());

const sampleUser = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  password: "correct-horse-battery",
  gpa: 3.8,
  location: "New York",
  course: "Computer Science",
};

describe("POST /api/profile/register", () => {
  test("creates a user and returns a token", async () => {
    const res = await request(app).post("/api/profile/register").send(sampleUser);

    expect(res.status).toBe(201);
    expect(res.body.userId).toBeDefined();
    expect(res.body.token).toBeDefined();
  });

  test("hashes the password instead of storing it in plaintext", async () => {
    await request(app).post("/api/profile/register").send(sampleUser);

    const stored = await User.findOne({ email: sampleUser.email });
    expect(stored.password).not.toBe(sampleUser.password);
    expect(stored.password.length).toBeGreaterThan(20);
  });

  test("rejects a duplicate email", async () => {
    await request(app).post("/api/profile/register").send(sampleUser);
    const res = await request(app).post("/api/profile/register").send(sampleUser);

    expect(res.status).toBe(400);
  });
});

describe("POST /api/profile/login", () => {
  beforeEach(async () => {
    await request(app).post("/api/profile/register").send(sampleUser);
  });

  test("logs in with correct credentials", async () => {
    const res = await request(app)
      .post("/api/profile/login")
      .send({ email: sampleUser.email, password: sampleUser.password });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test("rejects an incorrect password", async () => {
    const res = await request(app)
      .post("/api/profile/login")
      .send({ email: sampleUser.email, password: "wrong-password" });

    expect(res.status).toBe(401);
  });

  test("rejects an unknown email", async () => {
    const res = await request(app)
      .post("/api/profile/login")
      .send({ email: "nobody@example.com", password: sampleUser.password });

    expect(res.status).toBe(401);
  });
});
