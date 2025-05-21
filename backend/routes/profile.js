const express = require('express');
const router = express.Router();
const StudentProfile = require('../models/StudentProfile');

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
        res.status(500).json({ error: 'Server error' });
    }
});

// GET: Retrieve a student profile
router.get('/:userId', async (req, res) => {
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

module.exports = router;