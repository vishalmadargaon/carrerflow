/**
 * Main Express Server
 * Initializes the API with CORS, middleware, and routes
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import resumeRoutes from './routes/resume.routes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/**
 * Middleware Setup
 */

// CORS configuration
app.use(
  cors({
    origin:
      process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

/**
 * Routes
 */
app.use('/api', resumeRoutes);

/**
 * Root endpoint
 */
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Resume AI Tailoring API',
    version: '1.0.0',
    endpoints: {
      'POST /api/parse-resume': 'Parse uploaded resume file',
      'POST /api/extract-skills':
        'Extract skills from resume and job description',
      'POST /api/rewrite-bullets': 'Rewrite bullets emphasizing selected skills',
      'POST /api/ats-score': 'Calculate ATS match score',
      'POST /api/generate-pdf': 'Generate final PDF with changes',
      'GET /api/health': 'Health check',
    },
  });
});

/**
 * Error Handling Middleware
 */
app.use(
  (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    console.error('Error:', error);

    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      timestamp: new Date(),
    });
  }
);

/**
 * 404 Handling
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    timestamp: new Date(),
  });
});

/**
 * Start Server
 */
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   Resume AI Tailoring API              ║
║   Server running on port ${PORT}         ║
║   Environment: ${process.env.NODE_ENV || 'development'}      ║
╚════════════════════════════════════════╝
  `);
  console.log(`API available at: http://localhost:${PORT}`);
});

export default app;
