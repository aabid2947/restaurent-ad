import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import displayRoutes from './routes/v1/displayRoutes.js';
import adminRoutes from './routes/v1/adminRoutes.js';
import userRoutes from './routes/v1/userRoutes.js';

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
// Spec says /v1/displays/pair, /v1/player/config, /v1/admin/upload
// So we need to map them correctly.

// Display Routes (Pairing is under /displays, Config/Heartbeat under /player)
// We mount displayRoutes at /v1 because it handles both /displays and /player subpaths
app.use('/v1', displayRoutes);

// Admin Routes
// Mounted at /v1/admin
app.use('/v1/admin', adminRoutes);

// User Routes
// Mounted at /v1/users
app.use('/v1/users', userRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Advertisement Backend API is running');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ message: err.message });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
