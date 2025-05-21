const express = require('express');
const router = express.Router();
const StudentProfile = require('../models/StudentProfile');
const Scholarship = require('../models/Scholarship');

// GET: Match scholarships for a user
router.get('/match/:userId', async (req, res) => {
    try {
        const profile = await StudentProfile.findOne({ userId: req.params.userId });
        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        const scholarships = await Scholarship.find();
        const matchedScholarships = [];

        // Matching logic: course AND gpa >= required
        for (const scholarship of scholarships) {
            const { eligibility } = scholarship;
            const courseMatch = eligibility.course ? eligibility.course.toLowerCase() === profile.course.toLowerCase() : true;
            const gpaMatch = eligibility.gpa ? profile.gpa >= eligibility.gpa : true;

            if (courseMatch && gpaMatch) {
                // Scoring: +5 for urgent deadline (< 30 days), +3 for high amount (> $5,000)
                let score = 0;
                const deadlineDate = new Date(scholarship.deadline);
                const daysToDeadline = (deadlineDate - new Date()) / (1000 * 60 * 60 * 24);
                if (daysToDeadline < 30) score += 5;

                const amount = parseFloat(scholarship.amount.replace(/[^0-9.-]+/g, ''));
                if (amount > 5000) score += 3;

                matchedScholarships.push({ ...scholarship._doc, score });
            }
        }

        // Sort by score (descending)
        matchedScholarships.sort((a, b) => b.score - a.score);
        res.json(matchedScholarships);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;