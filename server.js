/**
 * @file server.js
 * @description Initializes the backend server
 * @copyright Rongbin Gu 2025
 */

// Import needed modules
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { plannerRouter } from './routes/planner.js';

// Load environment variables from .env file
dotenv.config();

// Initialize Express backend server and middleware
const app = express();
const PORT = process.env.PORT || 4000;
app.use(cors());
app.use(express.json());
app.use("/planner", plannerRouter);

// Begin backend server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
