const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Get all categories
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM categories ORDER BY id'
    );
    
    res.json({
      success: true,
      categories: result.rows
    });
    
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: 'An error occurred while fetching categories' 
    });
  }
});

// Get category with item count
router.get('/with-counts', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, COUNT(i.id) as item_count
       FROM categories c
       LEFT JOIN items i ON c.id = i.category_id 
         AND i.is_available = true 
         AND i.is_deleted = false
       GROUP BY c.id
       ORDER BY c.id`
    );
    
    res.json({
      success: true,
      categories: result.rows
    });
    
  } catch (error) {
    console.error('Get categories with counts error:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: 'An error occurred while fetching categories' 
    });
  }
});

module.exports = router;
