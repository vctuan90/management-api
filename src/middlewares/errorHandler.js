const logger = require('../utils/logger');

/**
 * Global error handling middleware
 * Handles all errors and sends appropriate responses
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error(`Error ${req.method} ${req.originalUrl}: ${err.message}`);
  logger.error(err.stack);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }

  // SQLite errors
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    const message = 'Duplicate entry found';
    error = { message, statusCode: 400 };
  }

  if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    const message = 'Foreign key constraint failed';
    error = { message, statusCode: 400 };
  }

  res.status(error.statusCode || 500).json({
    status: 'error',
    message: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler; 