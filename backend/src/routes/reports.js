const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireAuth } = require('../middleware/auth');

// Submit report
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      report_type,
      reported_item_id,
      reported_user_id,
      description,
      evidence_urls
    } = req.body;
    
    // Validate report type
    const validTypes = ['scam', 'inappropriate_content', 'fake_listing', 'spam', 'safety_concern', 'other'];
    if (!report_type || !validTypes.includes(report_type)) {
      return res.status(400).json({
        error: 'Invalid report type',
        message: 'Please select a valid report type'
      });
    }
    
    // Must report either an item or user
    if (!reported_item_id && !reported_user_id) {
      return res.status(400).json({
        error: 'Missing target',
        message: 'You must report either an item or a user'
      });
    }
    
    // Description is required
    if (!description || description.trim().length === 0) {
      return res.status(400).json({
        error: 'Missing description',
        message: 'Please provide a description of the issue'
      });
    }
    
    if (description.length > 1000) {
      return res.status(400).json({
        error: 'Description too long',
        message: 'Description must be less than 1000 characters'
      });
    }
    
    // Can't report yourself
    if (reported_user_id === req.user.id) {
      return res.status(400).json({
        error: 'Invalid report',
        message: 'You cannot report yourself'
      });
    }
    
    // Insert report
    const result = await pool.query(
      `INSERT INTO reports 
       (reporter_id, reported_user_id, reported_item_id, report_type, description, evidence_urls, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [
        req.user.id,
        reported_user_id || null,
        reported_item_id || null,
        report_type,
        description.trim(),
        evidence_urls || []
      ]
    );
    
    // Auto-action for inappropriate content
    if (report_type === 'inappropriate_content' && reported_user_id) {
      await pool.query(
        'UPDATE users SET warning_count = warning_count + 1 WHERE id = $1',
        [reported_user_id]
      );
      
      // Check if user should be banned (3+ warnings)
      const userCheck = await pool.query(
        'SELECT warning_count FROM users WHERE id = $1',
        [reported_user_id]
      );
      
      if (userCheck.rows[0]?.warning_count >= 3) {
        await pool.query(
          `UPDATE users 
           SET is_banned = true, ban_reason = $1, banned_at = NOW()
           WHERE id = $2`,
          ['Multiple reports of inappropriate content', reported_user_id]
        );
        
        // Deactivate user's listings
        await pool.query(
          'UPDATE items SET is_available = false WHERE seller_id = $1',
          [reported_user_id]
        );
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Report submitted successfully. We will review it shortly.',
      report_id: result.rows[0].id
    });
    
  } catch (error) {
    console.error('Submit report error:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: 'An error occurred while submitting the report' 
    });
  }
});

// Get user's reports
router.get('/my-reports', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*,
        CASE 
          WHEN r.reported_item_id IS NOT NULL THEN i.title
          ELSE NULL
        END as item_title,
        CASE 
          WHEN r.reported_user_id IS NOT NULL THEN u.name
          ELSE NULL
        END as reported_user_name
       FROM reports r
       LEFT JOIN items i ON r.reported_item_id = i.id
       LEFT JOIN users u ON r.reported_user_id = u.id
       WHERE r.reporter_id = $1
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    
    res.json({
      success: true,
      reports: result.rows
    });
    
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: 'An error occurred while fetching reports' 
    });
  }
});

module.exports = router;
