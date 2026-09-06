const express = require('express');
const cors = require('cors');
const profileRoutes = require('./routes/profile');
const scholarshipRoutes = require('./routes/scholarships');

// Configured Express app, with no DB connection or listen() call — kept
// separate from index.js so tests can import it directly against an
// in-memory database instead of a real one.
const app = express();
app.use(express.json());
app.use(cors());

app.use('/api/profile', profileRoutes);
app.use('/api/scholarships', scholarshipRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'SortAid Backend' });
});

module.exports = app;
