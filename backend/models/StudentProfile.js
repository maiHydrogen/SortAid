const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    gpa: { type: Number, required: true },
    course: { type: String, required: true },
    location: { type: String, required: true },
    interests: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StudentProfile', studentProfileSchema);