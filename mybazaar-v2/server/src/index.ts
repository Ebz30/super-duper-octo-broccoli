import express from 'express';
import cors from 'cors';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth';
import itemsRoutes from './routes/items';
import categoriesRoutes from './routes/categories';
import favoritesRoutes from './routes/favorites';
import conversationsRoutes from './routes/conversations';

// Import WebSocket
import { MessagingWebSocket } from './websocket/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
const PgSession = connectPg(session);
const pgPool = postgres(process.env.DATABASE_URL!, {
  max: 1, // Session store doesn't need many connections
});

app.use(
  session({
    store: new PgSession({
      pool: pgPool as any,
      tableName: 'sessions',
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    },
  })
);

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/conversations', conversationsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'MyBazaar API v2.0',
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'MyBazaar API v2.0',
    version: '2.0.0',
    description: 'Student Marketplace API with TypeScript + Drizzle ORM',
    endpoints: {
      auth: '/api/auth',
      items: '/api/items',
      favorites: '/api/favorites',
      conversations: '/api/conversations',
      categories: '/api/categories',
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
    path: req.path,
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);

  res.status(err.status || 500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message,
  });
});

// Create HTTP server
const httpServer = createServer(app);

// Initialize WebSocket server
const messagingWS = new MessagingWebSocket(httpServer);

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 MyBazaar API v2.0 running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`💬 WebSocket server running on ws://localhost:${PORT}/ws`);
});

export default app;
