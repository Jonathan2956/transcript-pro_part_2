const winston = require('winston');
const path = require('path');

/**
 * Advanced Logger Utility - Production-ready logging system
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'transcript-pro-backend' },
  transports: [
    // Write all logs with importance level of 'error' or less to 'error.log'
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // Write all logs with importance level of 'info' or less to 'combined.log'
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ],
  
  // Exception handling
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/exceptions.log') 
    })
  ],
  
  // Rejection handling
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/rejections.log') 
    })
  ]
});

// Create a stream object for Morgan integration
logger.stream = {
  write: function(message) {
    logger.info(message.trim());
  }
};

// Custom logging methods
logger.apiLog = function(route, method, userId, additionalData = {}) {
  this.info('API Request', {
    route,
    method,
    userId,
    timestamp: new Date().toISOString(),
    ...additionalData
  });
};

logger.errorLog = function(error, context = {}) {
  this.error('Application Error', {
    error: error.message,
    stack: error.stack,
    ...context
  });
};

logger.securityLog = function(event, userId, ip, details = {}) {
  this.warn('Security Event', {
    event,
    userId,
    ip,
    timestamp: new Date().toISOString(),
    ...details
  });
};

logger.performanceLog = function(operation, duration, details = {}) {
  this.info('Performance Metric', {
    operation,
    duration,
    timestamp: new Date().toISOString(),
    ...details
  });
};

module.exports = logger;
