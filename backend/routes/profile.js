const express = require('express');
const router = express.Router();
const StudentProfile = require('../models/StudentProfile');

// POST: Create or update a student profile
router.post('/', async (req, res) => {
    try {
        const { userId, gpa, course, location, interests } = req.body;
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

// PUT: Update a student profile
router.put('/:userId', async (req, res) => {
    try {
        const { gpa, course, location, interests } = req.body;
        const profile = await StudentProfile.findOneAndUpdate(
            { userId: req.params.userId },
            { gpa, course, location, interests },
            { new: true }
        );
        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }
        res.json(profile);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE: Delete a student profile
router.delete('/:userId', async (req, res) => {
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