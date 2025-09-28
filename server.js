const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
// const passport = require('passport');
// const session = require('express-session');
require('dotenv').config();

// Import routes
const authRoutes = require('./app/routes/auth.routes');
const userRoutes = require('./app/routes/users.routes');
const eventRoutes = require('./app/routes/event.routes');
const topicRoutes = require('./app/routes/topic.routes');
const paymentRoutes = require('./app/routes/payment.routes');
const webhookRoutes = require('./app/routes/webhook.routes');
const googleAuthRoutes = require('./app/routes/google-auth.routes');
const scraperRoutes = require('./app/routes/scraper.routes');
const openwebninjaRoutes = require('./app/routes/openwebninja.routes');
const serpapiRoutes = require('./app/routes/serpapi.routes');
const stripeRoutes = require('./app/routes/stripe.routes');
// Import middleware
const { authMiddleware } = require('./app/middleware/auth');

// // Import passport configuration
// require('./lib/passport');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://find-my-stage-frontend-o4ibz33ry-clevergoldfox-8975s-projects.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/user', authMiddleware, userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/topics', authMiddleware, topicRoutes);
app.use('/api/payments', authMiddleware, paymentRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/auth/google', googleAuthRoutes);
app.use('/api/scraper', scraperRoutes);
app.use('/api/openwebninja', openwebninjaRoutes);
app.use('/api/serpapi', serpapiRoutes);
app.use('/api/stripe', stripeRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(400).json({
      success: false,
      message: 'A record with this information already exists'
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }
  
  // Default error
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
