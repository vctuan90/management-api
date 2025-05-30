const logger = require('../utils/logger');

/**
 * Request logging middleware
 * Logs all incoming HTTP requests with method, URL, IP, and user agent
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request details
  logger.http(`${req.method} ${req.originalUrl} - IP: ${req.ip} - User-Agent: ${req.get('User-Agent')}`);
  
  // Capture the original response end function
  const originalEnd = res.end;
  
  // Override the response end function to log response details
  res.end = function(...args) {
    const duration = Date.now() - start;
    logger.http(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    
    // Call the original end function
    originalEnd.apply(this, args);
  };
  
  next();
};

module.exports = requestLogger; 