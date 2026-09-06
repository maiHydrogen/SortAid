const jwt = require("jsonwebtoken");

// Verifies the `Authorization: Bearer <token>` header and attaches the
// decoded user id to req.userId. Routes that touch a specific user's data
// use this instead of trusting a :userId route param, which anyone could
// swap out to read/edit someone else's profile.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// For routes shaped as /:userId, this ensures the authenticated user can
// only act on their own resource, even though the id is also in the URL
// (kept there so the frontend/tests can stay readable).
function requireSelf(req, res, next) {
  if (req.params.userId !== req.userId) {
    return res.status(403).json({ error: "You can only access your own data" });
  }
  next();
}

module.exports = { requireAuth, requireSelf };
