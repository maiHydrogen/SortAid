// routes/profile.js
const express = require('express');
const router = express.Router();
const StudentProfile = require('../models/StudentProfile'); // Adjust the path if needed

// POST: Create or update a student profile
router.post('/', async (req, res) => {
    try {
        const { userId, gpa, course, location, interests } = req.body;
        let profile = await StudentProfile.findOne({ userId });

        if (profile) {
            // Update existing profile
            profile.gpa = gpa;
            profile.course = course;
            profile.location = location;
            profile.interests = interests;
            await profile.save();
            return res.json(profile);
        }

        // Create new profile
        profile = new StudentProfile({ userId, gpa, course, location, interests });
        await profile.save();
        res.status(201).json(profile);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router; // Don’t forget this!