/**
 * TranscriptPro - Main Server File
 * Fixed version for Render deployment
 */

console.log("=== 🚀 TranscriptPro Server Starting ===");
console.log("Time:", new Date().toISOString());

// Required modules
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// Debug: Check environment
console.log("📌 Environment Check:");
console.log("PORT:", process.env.PORT || "Not set");
console.log("NODE_ENV:", process.env.NODE_ENV || "Not set");
console.log("MONGODB_URI present:", process.env.MONGODB_URI ? "Yes" : "No");
console.log("FRONTEND_URL:", process.env.FRONTEND_URL || "Not set");

const app = express();

// Basic middleware - SIMPLIFIED VERSION
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ====== DATABASE CONNECTION (OPTIONAL - WILL NOT CRASH IF FAILS) ======
let mongoose;
let dbConnected = false;

try {
  mongoose = require('mongoose');
  
  const connectDB = async () => {
    try {
      if (!process.env.MONGODB_URI) {
        console.log("⚠️  MONGODB_URI not set, skipping database connection");
        return;
      }
      
      console.log("🔗 Attempting MongoDB connection...");
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      });
      
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      dbConnected = true;
      
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err.message);
      });
      
      mongoose.connection.on('disconnected', () => {
        console.warn('🔌 MongoDB disconnected');
        dbConnected = false;
      });
      
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      console.log('⚠️  Server will run without database');
      dbConnected = false;
    }
  };
  
  // Connect to DB (but don't crash if fails)
  connectDB();
  
} catch (error) {
  console.log("⚠️  mongoose not available, running without database");
}
// ====== END DATABASE ======

// ====== ROUTES ======
console.log("🔄 Loading routes...");

// Test route
app.get('/api/test', (req, res) => {
  res.json({
    message: '✅ Server is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: dbConnected ? 'connected' : 'not connected'
  });
});

// Health check route (REQUIRED FOR RENDER)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'TranscriptPro Backend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: dbConnected ? 'connected' : 'not connected',
    node: process.version
  });
});

// AI Routes
try {
  const aiRoutes = require('./routes/al');
  app.use('/api/ai', aiRoutes);
  console.log("✅ AI routes loaded");
} catch (error) {
  console.error("❌ Failed to load AI routes:", error.message);
  
  // Create placeholder route
  app.use('/api/ai', (req, res) => {
    res.status(501).json({
      error: 'AI routes temporarily disabled',
      message: error.message
    });
  });
}

// YouTube Routes
try {
  const youtubeRoutes = require('./routes/youtube');
  app.use('/api/youtube', youtubeRoutes);
  console.log("✅ YouTube routes loaded");
} catch (error) {
  console.error("❌ Failed to load YouTube routes:", error.message);
  
  // Create placeholder route
  app.use('/api/youtube', (req, res) => {
    res.status(501).json({
      error: 'YouTube routes temporarily disabled',
      message: error.message
    });
  });
}

// Root route
app.get('/', (req, res) => {
  res.json({
    message: '🚀 TranscriptPro API Server',
    version: '1.0.0',
    status: 'operational',
    endpoints: {
      health: '/api/health',
      test: '/api/test',
      ai: '/api/ai',
      youtube: '/api/youtube'
    },
    documentation: 'https://github.com/yourusername/transcript-pro'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    suggestion: 'Check / endpoint for available routes'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('🚨 Server error:', err.message);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
    status: 'error'
  });
});

// ====== START SERVER ======
const PORT = process.env.PORT || 10000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🎉 ===========================================`);
  console.log(`✅ Server successfully started!`);
  console.log(`✅ Port: ${PORT}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ Database: ${dbConnected ? 'Connected' : 'Not connected'}`);
  console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
  console.log(`✅ Test route: http://localhost:${PORT}/api/test`);
  console.log(`=============================================\n`);
});

// Graceful shutdown
const shutdown = async () => {
  console.log('\n🛑 Received shutdown signal...');
  
  server.close(() => {
    console.log('🔒 HTTP server closed');
    
    if (mongoose && mongoose.connection.readyState === 1) {
      mongoose.connection.close(false, () => {
        console.log('🔒 MongoDB connection closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.log('⏰ Force shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION:', err.message);
  console.error(err.stack);
  // Don't exit - let the server keep running
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

module.exports = app;
