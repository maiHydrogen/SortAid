const express = require('express');
const app = express();

// Middleware to parse JSON
app.use(express.json());

// Routes
const profileRoutes = require('./routes/profile'); // Ensure the path matches your folder structure
app.use('/api/profile', profileRoutes);

// Start the server
app.listen(8000, () => {
    console.log('Server running on port 8000');
});