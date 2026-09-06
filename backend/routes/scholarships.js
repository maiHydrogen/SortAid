const express = require('express');
const router = express.Router();
const StudentProfile = require('../models/StudentProfile');
const Scholarship = require('../models/Scholarship');
const { requireAuth, requireSelf } = require('../middleware/auth');

// NOTE: these write routes (create/update/delete a scholarship) are meant for
// admin/internal use (e.g. backfilling data) and are not yet behind any auth —
// there's no admin-role concept in this app yet. Don't expose them to the
// public frontend as-is; they need an admin check before that's safe.

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

// GET: Match scholarships for a user (only your own profile)
router.get('/match/:userId', requireAuth, requireSelf, async (req, res) => {
    try {
        const profile = await StudentProfile.findOne({ userId: req.params.userId });
        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        const scholarships = await Scholarship.find();
        const matchedScholarships = [];
        const profileLocation = (profile.location || '').trim().toLowerCase();

        for (const scholarship of scholarships) {
            const { eligibility } = scholarship;
            const courseMatch = eligibility?.course ? eligibility.course.toLowerCase() === profile.course.toLowerCase() : true;
            const gpaMatch = eligibility?.gpa ? profile.gpa >= eligibility.gpa : true;

            if (courseMatch && gpaMatch) {
                let score = 0;

                // Prefer the normalized fields (set at scrape/entry time); fall
                // back to parsing the display strings for older rows that
                // don't have them yet.
                const deadlineDate = scholarship.deadlineDate || new Date(scholarship.deadline);
                if (!isNaN(deadlineDate)) {
                    const daysToDeadline = (deadlineDate - new Date()) / (1000 * 60 * 60 * 24);
                    if (daysToDeadline < 30) score += 5;
                }

                const amountValue = scholarship.amountValue ?? parseFloat((scholarship.amount || '').replace(/[^0-9.-]+/g, ''));
                if (!isNaN(amountValue) && amountValue > 5000) score += 3;

                // Location is a soft signal, not a hard filter — scraped
                // location strings are too inconsistent ("US" vs "New York")
                // to safely exclude on a mismatch.
                const scholarshipLocation = (eligibility?.location || '').trim().toLowerCase();
                const isGlobal = ['any', 'global', 'worldwide', 'international'].includes(scholarshipLocation);
                if (profileLocation && scholarshipLocation && !isGlobal) {
                    if (scholarshipLocation.includes(profileLocation) || profileLocation.includes(scholarshipLocation)) {
                        score += 2;
                    }
                }

                matchedScholarships.push({ ...scholarship._doc, score });
            }
        }

        matchedScholarships.sort((a, b) => b.score - a.score);
        res.json(matchedScholarships);
    } catch (err) {
        console.error(err);
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
