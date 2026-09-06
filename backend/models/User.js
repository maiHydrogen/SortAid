const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  gpa: Number,
  location: String,
  course: String,
  // No self-serve way to become an admin — flip this directly in the
  // database for whoever should be able to curate scholarships:
  //   db.users.updateOne({ email: "..." }, { $set: { isAdmin: true } })
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// Hash the password whenever it's set/changed, so callers never have to
// remember to hash it themselves before saving.
userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("User", userSchema);
