const pool = require('../config/database');

// Middleware to check if user is authenticated
async function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Please log in to access this resource' 
    });
  }
  
  try {
    // Verify user exists and is not banned
    const result = await pool.query(
      'SELECT id, email, name, is_banned FROM users WHERE id = $1',
      [req.session.userId]
    );
    
    if (result.rows.length === 0) {
      req.session.destroy();
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'User not found' 
      });
    }
    
    const user = result.rows[0];
    
    if (user.is_banned) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'Your account has been banned' 
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: 'An error occurred during authentication' 
    });
  }
}

// Optional auth - sets req.user if logged in, but doesn't require it
async function optionalAuth(req, res, next) {
  if (req.session && req.session.userId) {
    try {
      const result = await pool.query(
        'SELECT id, email, name, is_banned FROM users WHERE id = $1',
        [req.session.userId]
      );
      
      if (result.rows.length > 0 && !result.rows[0].is_banned) {
        req.user = result.rows[0];
      }
    } catch (error) {
      console.error('Optional auth error:', error);
    }
  }
  next();
}

module.exports = {
  requireAuth,
  optionalAuth
};
