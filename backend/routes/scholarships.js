const express = require('express');
const router = express.Router();
const StudentProfile = require('../models/StudentProfile');
const Scholarship = require('../models/Scholarship');

// POST: Create a scholarship (for testing or admin use)
router.post('/', async (req, res) => {
    try {
        const { title, source, amount, eligibility, deadline, applicationLink } = req.body;
        const scholarship = new Scholarship({
            title,
            source,
            amount,
            eligibility,
            deadline,
            applicationLink
        });
        await scholarship.save();
        res.status(201).json(scholarship);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET: Fetch all scholarships
router.get('/', async (req, res) => {
    try {
        const scholarships = await Scholarship.find();
        res.json(scholarships);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET: Fetch a single scholarship by ID
router.get('/:id', async (req, res) => {
    try {
        const scholarship = await Scholarship.findById(req.params.id);
        if (!scholarship) {
            return res.status(404).json({ error: 'Scholarship not found' });
        }
        res.json(scholarship);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET: Match scholarships for a user
router.get('/match/:userId', async (req, res) => {
    try {
        const profile = await StudentProfile.findOne({ userId: req.params.userId });
        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        const scholarships = await Scholarship.find();
        const matchedScholarships = [];

        for (const scholarship of scholarships) {
            const { eligibility } = scholarship;
            const courseMatch = eligibility.course ? eligibility.course.toLowerCase() === profile.course.toLowerCase() : true;
            const gpaMatch = eligibility.gpa ? profile.gpa >= eligibility.gpa : true;

            if (courseMatch && gpaMatch) {
                let score = 0;
                const deadlineDate = new Date(scholarship.deadline);
                const daysToDeadline = (deadlineDate - new Date()) / (1000 * 60 * 60 * 24);
                if (daysToDeadline < 30) score += 5;

                const amount = parseFloat(scholarship.amount.replace(/[^0-9.-]+/g, ''));
                if (amount > 5000) score += 3;

                matchedScholarships.push({ ...scholarship._doc, score });
            }
        }

        matchedScholarships.sort((a, b) => b.score - a.score);
        res.json(matchedScholarships);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT: Update a scholarship
router.put('/:id', async (req, res) => {
    try {
        const { title, source, amount, eligibility, deadline, applicationLink } = req.body;
        const scholarship = await Scholarship.findByIdAndUpdate(
            req.params.id,
            { title, source, amount, eligibility, deadline, applicationLink },
            { new: true }
        );
        if (!scholarship) {
            return res.status(404).json({ error: 'Scholarship not found' });
        }
        res.json(scholarship);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE: Delete a scholarship
router.delete('/:id', async (req, res) => {
    try {
        const scholarship = await Scholarship.findByIdAndDelete(req.params.id);
        if (!scholarship) {
            return res.status(404).json({ error: 'Scholarship not found' });
        }
        res.json({ message: 'Scholarship deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;