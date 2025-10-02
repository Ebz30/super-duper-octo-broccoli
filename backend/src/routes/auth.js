const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../config/database');
const { isValidEmail, isValidPassword } = require('../utils/validators');
const { loginRateLimit, clearLoginAttempts } = require('../middleware/rateLimit');

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Email, password, and name are required' 
      });
    }
    
    // Validate email
    if (!isValidEmail(email)) {
      return res.status(400).json({ 
        error: 'Invalid email',
        message: 'Please provide a valid email address' 
      });
    }
    
    // Validate password
    const passwordValidation = isValidPassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ 
        error: 'Invalid password',
        message: 'Password does not meet requirements',
        requirements: passwordValidation.errors
      });
    }
    
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Email already registered',
        message: 'An account with this email already exists' 
      });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING id, email, name, created_at`,
      [email.toLowerCase(), passwordHash, name]
    );
    
    const user = result.rows[0];
    
    // Create session
    req.session.userId = user.id;
    req.session.email = user.email;
    
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at
      }
    });
    
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: 'An error occurred during registration' 
    });
  }
});

// Login
router.post('/login', loginRateLimit, async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Missing credentials',
        message: 'Email and password are required' 
      });
    }
    
    // Find user
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'Email or password is incorrect' 
      });
    }
    
    const user = result.rows[0];
    
    // Check if banned
    if (user.is_banned) {
      return res.status(403).json({ 
        error: 'Account banned',
        message: `Your account has been banned. Reason: ${user.ban_reason || 'Violation of terms'}` 
      });
    }
    
    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordMatch) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'Email or password is incorrect' 
      });
    }
    
    // Clear login attempts on successful login
    clearLoginAttempts(email);
    
    // Create session
    req.session.userId = user.id;
    req.session.email = user.email;
    
    // Set session expiry
    if (rememberMe) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    } else {
      req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    }
    
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        university: user.university,
        profile_picture: user.profile_picture
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: 'An error occurred during login' 
    });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ 
        error: 'Server error',
        message: 'An error occurred during logout' 
      });
    }
    
    res.clearCookie('connect.sid');
    res.json({ 
      success: true,
      message: 'Logged out successfully' 
    });
  });
});

// Get current user
router.get('/me', async (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ 
      error: 'Not authenticated',
      message: 'Please log in' 
    });
  }
  
  try {
    const result = await pool.query(
      `SELECT id, email, name, university, phone, bio, profile_picture, created_at
       FROM users WHERE id = $1`,
      [req.session.userId]
    );
    
    if (result.rows.length === 0) {
      req.session.destroy();
      return res.status(401).json({ 
        error: 'User not found',
        message: 'Please log in again' 
      });
    }
    
    res.json({
      success: true,
      user: result.rows[0]
    });
    
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: 'An error occurred' 
    });
  }
});

module.exports = router;
