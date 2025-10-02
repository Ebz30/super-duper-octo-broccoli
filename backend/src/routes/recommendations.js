const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireAuth } = require('../middleware/auth');

// Calculate user preferences based on activity
async function calculateUserPreferences(userId) {
  try {
    // Get last 100 user activities
    const activities = await pool.query(
      `SELECT * FROM user_activities 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 100`,
      [userId]
    );
    
    if (activities.rows.length === 0) {
      return null;
    }
    
    // Calculate category weights
    const categoryWeights = {};
    const activityTypeWeights = {
      'view': 1,
      'favorite': 3,
      'contact': 5,
      'search': 2
    };
    
    activities.rows.forEach(activity => {
      if (activity.category_id) {
        const weight = activityTypeWeights[activity.activity_type] || 1;
        categoryWeights[activity.category_id] = 
          (categoryWeights[activity.category_id] || 0) + weight;
      }
    });
    
    // Get top 3 categories
    const topCategories = Object.entries(categoryWeights)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([catId]) => parseInt(catId));
    
    // Calculate price range preference
    const prices = activities.rows
      .filter(a => a.item_price)
      .map(a => parseFloat(a.item_price))
      .sort((a, b) => a - b);
    
    let priceRangeLow = 0;
    let priceRangeHigh = 999999;
    
    if (prices.length > 0) {
      priceRangeLow = prices[Math.floor(prices.length * 0.25)] || 0;
      priceRangeHigh = prices[Math.floor(prices.length * 0.75)] || 999999;
    }
    
    // Preferred conditions
    const conditionCounts = {};
    activities.rows.forEach(a => {
      if (a.item_condition) {
        conditionCounts[a.item_condition] = (conditionCounts[a.item_condition] || 0) + 1;
      }
    });
    
    const preferredConditions = Object.keys(conditionCounts)
      .sort((a, b) => conditionCounts[b] - conditionCounts[a])
      .slice(0, 3);
    
    return {
      topCategories,
      priceRangeLow,
      priceRangeHigh,
      preferredConditions
    };
  } catch (error) {
    console.error('Error calculating preferences:', error);
    return null;
  }
}

// Generate recommendations
router.get('/', requireAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 12;
    
    // Get user preferences
    const prefs = await calculateUserPreferences(req.user.id);
    
    // Get items user has already viewed or favorited (to exclude)
    const excludeResult = await pool.query(
      `SELECT DISTINCT item_id FROM user_activities WHERE user_id = $1
       UNION
       SELECT DISTINCT item_id FROM favorites WHERE user_id = $1`,
      [req.user.id]
    );
    
    const excludeIds = excludeResult.rows.map(r => r.item_id).filter(id => id !== null);
    
    let recommendations;
    
    if (prefs && prefs.topCategories.length > 0) {
      // Personalized recommendations based on user activity
      const categoryScores = prefs.topCategories.map((catId, index) => {
        return { catId, score: 100 - (index * 25) }; // 100, 75, 50
      });
      
      const query = `
        SELECT 
          i.*,
          u.name as seller_name,
          c.name as category_name,
          CASE 
            WHEN i.category_id = $1 THEN $4
            WHEN i.category_id = $2 THEN $5
            WHEN i.category_id = $3 THEN $6
            ELSE 10
          END as category_score,
          CASE
            WHEN i.price BETWEEN $7 AND $8 THEN 50
            ELSE 10
          END as price_score,
          (
            CASE 
              WHEN i.category_id = $1 THEN $4
              WHEN i.category_id = $2 THEN $5
              WHEN i.category_id = $3 THEN $6
              ELSE 10
            END +
            CASE
              WHEN i.price BETWEEN $7 AND $8 THEN 50
              ELSE 10
            END +
            (i.view_count * 0.1)
          ) as total_score
        FROM items i
        JOIN users u ON i.seller_id = u.id
        JOIN categories c ON i.category_id = c.id
        WHERE i.is_available = true
          AND i.is_deleted = false
          AND i.seller_id != $9
          AND (ARRAY_LENGTH($10::int[], 1) IS NULL OR i.id != ALL($10))
        ORDER BY total_score DESC, i.created_at DESC
        LIMIT $11
      `;
      
      recommendations = await pool.query(query, [
        prefs.topCategories[0] || 0,
        prefs.topCategories[1] || 0,
        prefs.topCategories[2] || 0,
        categoryScores[0]?.score || 10,
        categoryScores[1]?.score || 10,
        categoryScores[2]?.score || 10,
        prefs.priceRangeLow,
        prefs.priceRangeHigh,
        req.user.id,
        excludeIds.length > 0 ? excludeIds : null,
        limit
      ]);
    } else {
      // Fallback to popular items for new users
      recommendations = await pool.query(
        `SELECT 
          i.*,
          u.name as seller_name,
          c.name as category_name
         FROM items i
         JOIN users u ON i.seller_id = u.id
         JOIN categories c ON i.category_id = c.id
         WHERE i.is_available = true
           AND i.is_deleted = false
           AND i.seller_id != $1
           AND (ARRAY_LENGTH($2::int[], 1) IS NULL OR i.id != ALL($2))
         ORDER BY i.view_count DESC, i.created_at DESC
         LIMIT $3`,
        [req.user.id, excludeIds.length > 0 ? excludeIds : null, limit]
      );
    }
    
    res.json({
      success: true,
      recommendations: recommendations.rows.map(item => ({
        ...item,
        image: item.images[0] || null
      })),
      personalized: prefs !== null
    });
    
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: 'An error occurred while fetching recommendations' 
    });
  }
});

// Get popular items (public, no auth required)
router.get('/popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 12;
    
    const result = await pool.query(
      `SELECT 
        i.*,
        u.name as seller_name,
        c.name as category_name
       FROM items i
       JOIN users u ON i.seller_id = u.id
       JOIN categories c ON i.category_id = c.id
       WHERE i.is_available = true
         AND i.is_deleted = false
       ORDER BY i.view_count DESC, i.created_at DESC
       LIMIT $1`,
      [limit]
    );
    
    res.json({
      success: true,
      items: result.rows.map(item => ({
        ...item,
        image: item.images[0] || null
      }))
    });
    
  } catch (error) {
    console.error('Get popular items error:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: 'An error occurred while fetching popular items' 
    });
  }
});

module.exports = router;
