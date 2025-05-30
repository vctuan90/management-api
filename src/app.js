// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const logger = require('./utils/logger');
const { initializeDatabase } = require('./database/database');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const newsRoutes = require('./routes/newsRoutes');

// Import middlewares
const errorHandler = require('./middlewares/errorHandler');
const requestLogger = require('./middlewares/requestLogger');

const app = express();

// Environment variables
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});

// Security middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));
app.use(cors());
app.use(limiter);

// Body parsing middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use(requestLogger);

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Management API Documentation'
}));

// Swagger JSON endpoint
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running successfully',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    documentation: {
      swagger: '/api-docs',
      json: '/api-docs.json'
    }
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/news', newsRoutes);

// Root endpoint with API information
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to News Management API',
    version: '1.0.0',
    documentation: {
      swagger: '/api-docs',
      json: '/api-docs.json'
    },
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      categories: '/api/categories',
      news: '/api/news'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    logger.info('Database initialized successfully');
    
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${NODE_ENV} mode`);
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection:', error);
  process.exit(1);
});

startServer();

module.exports = app; 