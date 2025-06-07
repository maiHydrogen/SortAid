const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const profileRoutes = require('./routes/profile');
const scholarshipRoutes = require('./routes/scholarships');

dotenv.config();

const app = express();
app.use(express.json());
const cors =require('cors');
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {})
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/profile', profileRoutes);
app.use('/api/scholarships', scholarshipRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'SortAid Backend' });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));