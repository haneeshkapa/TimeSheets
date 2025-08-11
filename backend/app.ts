import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { connectDB } from './config';
import { errorHandler, requestLogger } from './middlewares';
import { errorHandler as newErrorHandler, notFoundHandler } from './middlewares/errorMiddleware';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import adminRoutes from './routes/admin';

const corsOption = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
};

const app = express();

// Initialize database
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOption));
app.use(requestLogger);


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);

// Health check routes
app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Timesheet API Server is running', status: 'ok' });
});

app.get('/api', (_req: Request, res: Response) => {
  res.json({ message: 'Timesheet API Server is running' });
});

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(newErrorHandler);

export default app;