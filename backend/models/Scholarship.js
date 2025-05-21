const mongoose = require('mongoose');

const scholarshipSchema = new mongoose.Schema({
    title: { type: String, required: true },
    source: { type: String, required: true },
    amount: { type: String, required: true },
    eligibility: {
        course: { type: String },
        gpa: { type: Number },
        location: { type: String }
    },
    deadline: { type: String, required: true },
    applicationLink: { type: String, required: true },
    scrapedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Scholarship', scholarshipSchema);