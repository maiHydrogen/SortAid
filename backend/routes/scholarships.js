const express = require('express');
const router = express.Router();
const StudentProfile = require('../models/StudentProfile');
const Scholarship = require('../models/Scholarship');
const { requireAuth, requireSelf, requireAdmin } = require('../middleware/auth');
const { matchScholarships } = require('../utils/matching');

// POST: Create a scholarship (admin only)
router.post('/', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { title, source, amount, amountValue, eligibility, deadline, deadlineDate, applicationLink } = req.body;
        const scholarship = new Scholarship({
            title,
            source,
            amount,
            amountValue,
            eligibility,
            deadline,
            deadlineDate,
            applicationLink
        });
        await scholarship.save();
        res.status(201).json(scholarship);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET: Fetch all scholarships (public)
router.get('/', async (req, res) => {
    try {
        const scholarships = await Scholarship.find();
        res.json(scholarships);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET: Match scholarships for a user (only your own profile)
router.get('/match/:userId', requireAuth, requireSelf, async (req, res) => {
    try {
        const profile = await StudentProfile.findOne({ userId: req.params.userId });
        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        const scholarships = await Scholarship.find();
        res.json(matchScholarships(scholarships, profile));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET: Fetch a single scholarship by ID (public)
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

// PUT: Update a scholarship (admin only)
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { title, source, amount, amountValue, eligibility, deadline, deadlineDate, applicationLink } = req.body;
        const scholarship = await Scholarship.findByIdAndUpdate(
            req.params.id,
            { title, source, amount, amountValue, eligibility, deadline, deadlineDate, applicationLink },
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

// DELETE: Delete a scholarship (admin only)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
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
