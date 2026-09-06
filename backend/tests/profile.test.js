const request = require("supertest");
const app = require("../app");
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
  return res.body; // { userId, token }
};

describe("student profile authorization", () => {
  test("rejects requests with no token", async () => {
    const { userId } = await registerUser("a@example.com");
    const res = await request(app).get(`/api/profile/${userId}`);
    expect(res.status).toBe(401);
  });

  test("rejects a malformed token", async () => {
    const { userId } = await registerUser("a@example.com");
    const res = await request(app)
      .get(`/api/profile/${userId}`)
      .set("Authorization", "Bearer not-a-real-token");
    expect(res.status).toBe(401);
  });

  test("lets a user create and then read their own profile", async () => {
    const { userId, token } = await registerUser("a@example.com");

    const create = await request(app)
      .post("/api/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ gpa: 3.9, course: "Computer Science", location: "New York", interests: ["AI"] });
    expect(create.status).toBe(201);

    const read = await request(app)
      .get(`/api/profile/${userId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(read.status).toBe(200);
    expect(read.body.course).toBe("Computer Science");
  });

  test("blocks a user from reading someone else's profile", async () => {
    const userA = await registerUser("a@example.com");
    const userB = await registerUser("b@example.com");

    const res = await request(app)
      .get(`/api/profile/${userA.userId}`)
      .set("Authorization", `Bearer ${userB.token}`);

    expect(res.status).toBe(403);
  });

  test("blocks a user from overwriting someone else's profile", async () => {
    const userA = await registerUser("a@example.com");
    const userB = await registerUser("b@example.com");

    const res = await request(app)
      .put(`/api/profile/${userA.userId}`)
      .set("Authorization", `Bearer ${userB.token}`)
      .send({ gpa: 4.0, course: "Hacked", location: "Nowhere", interests: [] });

    expect(res.status).toBe(403);
  });
});
