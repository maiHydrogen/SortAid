const mongoose = require('mongoose');

const scholarshipSchema = new mongoose.Schema({
    title: { type: String, required: true },
    source: { type: String, required: true },
    // Original scraped/entered text, kept as-is for display (e.g. "$500", "Full tuition").
    amount: { type: String, required: true },
    // Parsed numeric value for sorting/matching, e.g. 500. Optional because
    // older/scraped rows may not have it yet — matching code falls back to
    // parsing `amount` on the fly when this is missing.
    amountValue: { type: Number },
    eligibility: {
        course: { type: String },
        gpa: { type: Number },
        location: { type: String }
    },
    // Original scraped/entered text, kept as-is for display (e.g. "xx/xx/xxxx").
    deadline: { type: String, required: true },
    // Parsed date for sorting/matching. Same fallback rule as amountValue.
    deadlineDate: { type: Date },
    applicationLink: { type: String, required: true },
    scrapedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Scholarship', scholarshipSchema);