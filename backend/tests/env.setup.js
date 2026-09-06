// Loaded by Jest before any test file, so JWT_SECRET exists before app.js /
// middleware/auth.js are required anywhere.
process.env.JWT_SECRET = "test-secret-do-not-use-in-production";
process.env.NODE_ENV = "test";
