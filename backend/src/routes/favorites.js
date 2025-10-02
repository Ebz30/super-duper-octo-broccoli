const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireAuth } = require('../middleware/auth');

// Helper function to track user activity
async function trackActivity(userId, itemId, activityType, additionalData = {}) {
  try {
    await pool.query(
      `INSERT INTO user_activities 
       (user_id, item_id, activity_type, category_id, item_price, item_condition)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        itemId,
        activityType,
        additionalData.category_id || null,
        additionalData.price || null,
        additionalData.condition || null
      ]
    );
  } catch (error) {
    console.error('Error tracking activity:', error);
  }
}

// Get user favorites
router.get('/', requireAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;
    
    const result = await pool.query(
      `SELECT 
        f.id as favorite_id, f.created_at as favorited_at,
        i.id, i.title, i.price, i.discount_percentage, i.images, 
        i.condition, i.location, i.is_available,
        u.id as seller_id, u.name as seller_name,
        c.name as category_name
       FROM favorites f
       JOIN items i ON f.item_id = i.id
       JOIN users u ON i.seller_id = u.id
       JOIN categories c ON i.category_id = c.id
       WHERE f.user_id = $1 AND i.is_deleted = false
       ORDER BY f.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );
    
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM favorites f
       JOIN items i ON f.item_id = i.id
       WHERE f.user_id = $1 AND i.is_deleted = false`,
      [req.user.id]
    );
    
    const totalCount = parseInt(countResult.rows[0].count);
    
    res.json({
      success: true,
      favorites: result.rows.map(item => ({
        ...item,
        image: item.images[0] || null
      })),
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
    
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: 'An error occurred while fetching favorites' 
    });
  }
});

// Add to favorites
router.post('/', requireAuth, async (req, res) => {
  try {
    const { item_id } = req.body;
    
    if (!item_id) {
      return res.status(400).json({
        error: 'Missing item_id',
        message: 'Item ID is required'
      });
    }
    
    // Check if item exists
    const itemResult = await pool.query(
      'SELECT id, category_id, price, condition FROM items WHERE id = $1 AND is_deleted = false',
      [item_id]
    );
    
    if (itemResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Item not found',
        message: 'The requested item does not exist'
      });
    }
    
    const item = itemResult.rows[0];
    
    // Check if already favorited
    const existingFavorite = await pool.query(
      'SELECT id FROM favorites WHERE user_id = $1 AND item_id = $2',
      [req.user.id, item_id]
    );
    
    if (existingFavorite.rows.length > 0) {
      return res.json({
        success: true,
        message: 'Already in favorites',
        favorite_id: existingFavorite.rows[0].id
      });
    }
    
    // Add to favorites
    const result = await pool.query(
      'INSERT INTO favorites (user_id, item_id, created_at) VALUES ($1, $2, NOW()) RETURNING id',
      [req.user.id, item_id]
    );
    
    // Track activity for recommendations
    await trackActivity(req.user.id, item_id, 'favorite', {
      category_id: item.category_id,
      price: item.price,
      condition: item.condition
    });
    
    res.status(201).json({
      success: true,
      message: 'Added to favorites',
      favorite_id: result.rows[0].id
    });
    
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: 'An error occurred while adding to favorites' 
    });
  }
});

// Remove from favorites
router.delete('/:itemId', requireAuth, async (req, res) => {
  try {
    const { itemId } = req.params;
    
    const result = await pool.query(
      'DELETE FROM favorites WHERE user_id = $1 AND item_id = $2 RETURNING id',
      [req.user.id, itemId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Favorite not found',
        message: 'This item is not in your favorites'
      });
    }
    
    res.json({
      success: true,
      message: 'Removed from favorites'
    });
    
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: 'An error occurred while removing from favorites' 
    });
  }
});

// Check if item is favorited
router.get('/check/:itemId', requireAuth, async (req, res) => {
  try {
    const { itemId } = req.params;
    
    const result = await pool.query(
      'SELECT id FROM favorites WHERE user_id = $1 AND item_id = $2',
      [req.user.id, itemId]
    );
    
    res.json({
      success: true,
      is_favorited: result.rows.length > 0,
      favorite_id: result.rows.length > 0 ? result.rows[0].id : null
    });
    
  } catch (error) {
    console.error('Check favorite error:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: 'An error occurred while checking favorite status' 
    });
  }
});

module.exports = router;
