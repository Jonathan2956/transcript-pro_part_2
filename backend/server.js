/**
 * TranscriptPro - Main Server File
 * यह file server start करती है और सभी routes और middleware configure करती है
 */

// Required modules import करें
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Logger import करें
const logger = require('./utils/logger');

// Express app create करें
const app = express();

// Security middleware apply करें
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://www.youtube.com", "https://apis.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://img.youtube.com", "https://i.ytimg.com"],
      connectSrc: ["'self'", "https://www.googleapis.com", "https://api.openai.com", "https://translation.googleapis.com"]
    }
  }
}));

// Rate limiting setup करें - DDoS attacks से बचाव के लिए
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // प्रति IP 1000 requests की limit
  message: {
    error: 'Too many requests from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// CORS setup करें - Frontend से requests allow करने के लिए
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware - JSON और URL encoded data parse करने के लिए
app.use(express.json({ limit: '10mb' })); // Large transcripts के लिए limit बढ़ाई है
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware - Response size reduce करने के लिए
app.use(compression());

// Logging middleware - सभी requests log करने के लिए
app.use(morgan('combined', { 
  stream: { write: (message) => logger.info(message.trim()) } 
}));

// Static files serve करें - Uploaded files के लिए
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// MongoDB connection setup करें
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/transcript-pro', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Connection events handle करें
    mongoose.connection.on('error', (err) => {
      logger.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('🔌 MongoDB disconnected');
    });

  } catch (error) {
    logger.error('❌ MongoDB connection failed:', error);
    process.exit(1); // Database connection नहीं हो तो app stop कर दें
  }
};

// Database connect करें
connectDB();

// API Routes import और setup करें
app.use('/api/auth', require('./routes/auth'));          // Authentication routes
app.use('/api/transcripts', require('./routes/transcripts')); // Transcript management
app.use('/api/vocabulary', require('./routes/vocabulary'));   // Vocabulary management
app.use('/api/progress', require('./routes/progress'));       // User progress tracking
app.use('/api/ai', require('./routes/ai'));                   // NEW: AI processing routes
app.use('/api/youtube', require('./routes/youtube'));         // YouTube integration

// Health check route - Server status check करने के लिए
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root route - API information के लिए
app.get('/', (req, res) => {
  res.json({
    message: '🚀 TranscriptPro API Server',
    version: '1.0.0',
    documentation: '/api/docs',
    health: '/api/health',
    endpoints: {
      auth: '/api/auth',
      transcripts: '/api/transcripts',
      vocabulary: '/api/vocabulary',
      progress: '/api/progress',
      ai: '/api/ai',
      youtube: '/api/youtube'
    }
  });
});

// 404 handler - Invalid routes के लिए
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      'GET /api/health',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/transcripts/:videoId',
      'POST /api/transcripts'
    ]
  });
});

// Global error handler - सभी unhandled errors handle करने के लिए
app.use((error, req, res, next) => {
  logger.error('🚨 Unhandled Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  // Production में detailed error ना दिखाएं
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.status(error.status || 500).json({
    error: isProduction ? 'Something went wrong!' : error.message,
    ...(isProduction ? {} : { stack: error.stack }),
    requestId: req.id
  });
});

// Server start करें
// ✅ CHANGED LINE 1: PORT changed from 5000 to 10000
const PORT = process.env.PORT || 10000;

// ✅ CHANGED LINE 2: Added '0.0.0.0' for Docker
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/api/health`);
  logger.info(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
});

// Graceful shutdown handling - Ctrl+C दबाने पर properly stop करने के लिए
process.on('SIGINT', async () => {
  logger.info('🛑 Received SIGINT signal, shutting down gracefully...');
  
  // New connections accept ना करें
  server.close(() => {
    logger.info('🔒 HTTP server closed');
  });

  // Database connection close करें
  await mongoose.connection.close();
  logger.info('🔒 Database connection closed');

  process.exit(0);
});

// Unhandled promise rejections handle करें
process.on('unhandledRejection', (err) => {
  logger.error('🚨 Unhandled Promise Rejection:', err);
  // Server restart करें (production में)
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Uncaught exceptions handle करें
process.on('uncaughtException', (err) => {
  logger.error('🚨 Uncaught Exception:', err);
  // Server restart करें (production में)
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

module.exports = app; // Testing के लिए export करें
