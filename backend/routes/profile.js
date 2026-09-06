const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const StudentProfile = require('../models/StudentProfile');
const User = require('../models/User');
const { requireAuth, requireSelf } = require('../middleware/auth');

const signToken = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

// Login Route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = signToken(user._id.toString());
    res.json({ message: "Login successful", userId: user._id, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Register Route
router.post("/register", async (req, res) => {
  const { name, email, password, gpa, location, course } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Password is hashed automatically by the User model's pre-save hook.
    const newUser = new User({ name, email, password, gpa, location, course });
    await newUser.save();

    const token = signToken(newUser._id.toString());
    res.status(201).json({ message: "User registered", userId: newUser._id, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error during registration" });
  }
});

// POST: Create or update the caller's own student profile
router.post('/', requireAuth, async (req, res) => {
    try {
        const { gpa, course, location, interests } = req.body;
        const userId = req.userId;
        let profile = await StudentProfile.findOne({ userId });

        if (profile) {
            profile.gpa = gpa;
            profile.course = course;
            profile.location = location;
            profile.interests = interests;
            await profile.save();
            return res.json(profile);
        }

        profile = new StudentProfile({ userId, gpa, course, location, interests });
        await profile.save();
        res.status(201).json(profile);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET: Retrieve a student profile (only your own)
router.get('/:userId', requireAuth, requireSelf, async (req, res) => {
    try {
        const profile = await StudentProfile.findOne({ userId: req.params.userId });
        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }
        res.json(profile);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT: Update a student profile (only your own)
router.put('/:userId', requireAuth, requireSelf, async (req, res) => {
    try {
        const { gpa, course, location, interests } = req.body;
        const profile = await StudentProfile.findOneAndUpdate(
            { userId: req.params.userId },
            { gpa, course, location, interests },
            { new: true, upsert: true }
        );
        res.json(profile);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE: Delete a student profile (only your own)
router.delete('/:userId', requireAuth, requireSelf, async (req, res) => {
    try {
        const profile = await StudentProfile.findOneAndDelete({ userId: req.params.userId });
        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }
        res.json({ message: 'Profile deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
