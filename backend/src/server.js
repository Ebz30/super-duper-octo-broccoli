const express = require('express');
const cors = require('cors');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const pool = require('./config/database');
const { initializeWebSocketServer } = require('./websocket/messaging');
const { rateLimit } = require('./middleware/rateLimit');

// Import routes
const authRoutes = require('./routes/auth');
const itemsRoutes = require('./routes/items');
const favoritesRoutes = require('./routes/favorites');
const categoriesRoutes = require('./routes/categories');
const conversationsRoutes = require('./routes/conversations');
const recommendationsRoutes = require('./routes/recommendations');
const reportsRoutes = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 5000;
const WS_PORT = process.env.WS_PORT || 5001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Session configuration
const pgSession = require('connect-pg-simple')(session);

app.use(session({
  store: new pgSession({
    pool: pool,
    tableName: 'sessions',
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
}));

// Rate limiting
app.use('/api/', rateLimit(100, 60000)); // 100 requests per minute

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/conversations', conversationsRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/reports', reportsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'MyBazaar API'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'MyBazaar API',
    version: '1.0.0',
    description: 'Student Marketplace API for Northern Cyprus Universities',
    endpoints: {
      auth: '/api/auth',
      items: '/api/items',
      favorites: '/api/favorites',
      categories: '/api/categories',
      conversations: '/api/conversations',
      recommendations: '/api/recommendations',
      reports: '/api/reports'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  if (err.name === 'MulterError') {
    return res.status(400).json({
      error: 'File upload error',
      message: err.message
    });
  }
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 MyBazaar API server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});

// Start WebSocket server
initializeWebSocketServer(WS_PORT);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  pool.end(() => {
    console.log('Database pool closed');
    process.exit(0);
  });
});

module.exports = app;
