/**
 * Healthcare Report Explainer - Express Server
 * Main entry point for the backend API
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import routes
const analyzeRoutes = require('./routes/analyze');
const reportsRoutes = require('./routes/reports');
const healthRoutes = require('./routes/health');
const oxloRoutes = require('./routes/oxlo');
const groqRoutes = require('./routes/groq');
const enhancedRoutes = require('./routes/enhanced'); // New enhanced workflow
const sarvamRoutes = require('./routes/sarvam'); // Sarvam AI Multilingual

const app = express();
const PORT = process.env.PORT || 5000;

// Essential for Vercel/Proxies
app.set('trust proxy', 1);

// Debug: Log environment state (Safe check)
console.log('Environment Check:', {
  hasGemini: !!process.env.GEMINI_API_KEY_1 || !!process.env.GEMINI_API_KEY,
  hasGroq: !!process.env.GROQ_API_KEY,
  isVercel: !!process.env.VERCEL,
  nodeEnv: process.env.NODE_ENV
});

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files for uploaded reports
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/analyze', analyzeRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/oxlo', oxloRoutes);
app.use('/api/groq', groqRoutes);
app.use('/api/enhanced', enhancedRoutes); // New enhanced workflow APIs
app.use('/api/sarvam', sarvamRoutes); // Sarvam AI Multilingual APIs

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Healthcare Report Explainer API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      analyze: '/api/analyze',
      reports: '/api/reports',
      health: '/api/health',
      oxlo: '/api/oxlo',
      groq: '/api/groq'
    },
    documentation: '/api/docs'
  });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'Healthcare Report Explainer API Documentation',
    version: '1.0.0',
    endpoints: [
      {
        path: '/api/analyze',
        method: 'POST',
        description: 'Analyze a medical report (radiology or lab)',
        body: {
          file: 'PDF or image file (multipart/form-data)',
          mode: 'patient | clinician',
          language: 'en | ta | hi (optional, default: en)'
        },
        response: {
          success: true,
          reportId: 'string',
          reportType: 'radiology | lab',
          extraction: 'object',
          explanation: 'object',
          citations: 'array',
          disclaimers: 'array'
        }
      },
      {
        path: '/api/reports/:id',
        method: 'GET',
        description: 'Retrieve a previously analyzed report',
        response: {
          success: true,
          report: 'object'
        }
      },
      {
        path: '/api/reports/:id/export',
        method: 'GET',
        description: 'Export report in specified format',
        query: {
          format: 'json | csv | fhir'
        }
      },
      {
        path: '/api/health',
        method: 'GET',
        description: 'Health check endpoint'
      }
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: 'File too large. Maximum size is 10MB.'
    });
  }

  // Generic error response
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'An error occurred processing your request'
      : err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║     Healthcare Report Explainer API Server                ║
  ╠═══════════════════════════════════════════════════════════╣
  ║  Status:  Running                                         ║
  ║  Port:    ${PORT}                                            ║
  ║  Mode:    ${process.env.NODE_ENV || 'development'}                                   ║
  ║  API:     http://localhost:${PORT}/api                       ║
  ║  Docs:    http://localhost:${PORT}/api/docs                  ║
  ╚═══════════════════════════════════════════════════════════╝
    `);
  });
}

// Export for Vercel serverless functions
module.exports = app;

