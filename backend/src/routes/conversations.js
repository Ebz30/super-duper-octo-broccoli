const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireAuth } = require('../middleware/auth');

// Get user's conversations
router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        c.id, c.created_at, c.updated_at,
        CASE 
          WHEN c.buyer_id = $1 THEN c.seller_id
          ELSE c.buyer_id
        END as other_user_id,
        CASE 
          WHEN c.buyer_id = $1 THEN u_seller.name
          ELSE u_buyer.name
        END as other_user_name,
        i.id as item_id, i.title as item_title, i.images as item_images, i.price as item_price,
        (SELECT COUNT(*) FROM messages m 
         WHERE m.conversation_id = c.id 
         AND m.sender_id != $1 
         AND m.is_read = false) as unread_count,
        (SELECT content FROM messages m 
         WHERE m.conversation_id = c.id 
         ORDER BY m.created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM messages m 
         WHERE m.conversation_id = c.id 
         ORDER BY m.created_at DESC LIMIT 1) as last_message_time
       FROM conversations c
       JOIN users u_buyer ON c.buyer_id = u_buyer.id
       JOIN users u_seller ON c.seller_id = u_seller.id
       JOIN items i ON c.item_id = i.id
       WHERE c.buyer_id = $1 OR c.seller_id = $1
       ORDER BY c.updated_at DESC`,
      [req.user.id]
    );
    
    res.json({
      success: true,
      conversations: result.rows.map(conv => ({
        ...conv,
        item_image: conv.item_images ? conv.item_images[0] : null
      }))
    });
    
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: 'An error occurred while fetching conversations' 
    });
  }
});

// Create or get conversation
router.post('/', requireAuth, async (req, res) => {
  try {
    const { item_id, seller_id } = req.body;
    
    if (!item_id || !seller_id) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'item_id and seller_id are required'
      });
    }
    
    // Can't message yourself
    if (seller_id === req.user.id) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'You cannot message yourself'
      });
    }
    
    // Check if item exists
    const itemResult = await pool.query(
      'SELECT id, title, images, price, seller_id FROM items WHERE id = $1 AND is_deleted = false',
      [item_id]
    );
    
    if (itemResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Item not found',
        message: 'The requested item does not exist'
      });
    }
    
    const item = itemResult.rows[0];
    
    // Verify seller_id matches item seller
    if (item.seller_id !== seller_id) {
      return res.status(400).json({
        error: 'Invalid seller',
        message: 'Seller ID does not match item seller'
      });
    }
    
    // Check if conversation already exists
    const existingConv = await pool.query(
      `SELECT c.*, u.name as seller_name
       FROM conversations c
       JOIN users u ON c.seller_id = u.id
       WHERE c.buyer_id = $1 AND c.seller_id = $2 AND c.item_id = $3`,
      [req.user.id, seller_id, item_id]
    );
    
    if (existingConv.rows.length > 0) {
      return res.json({
        success: true,
        conversation: {
          ...existingConv.rows[0],
          item: {
            id: item.id,
            title: item.title,
            image: item.images[0],
            price: item.price
          }
        }
      });
    }
    
    // Create new conversation
    const newConv = await pool.query(
      `INSERT INTO conversations (buyer_id, seller_id, item_id, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING *`,
      [req.user.id, seller_id, item_id]
    );
    
    const sellerResult = await pool.query(
      'SELECT name FROM users WHERE id = $1',
      [seller_id]
    );
    
    // Track contact activity for recommendations
    await pool.query(
      `INSERT INTO user_activities (user_id, item_id, activity_type)
       VALUES ($1, $2, 'contact')`,
      [req.user.id, item_id]
    );
    
    res.status(201).json({
      success: true,
      conversation: {
        ...newConv.rows[0],
        seller_name: sellerResult.rows[0].name,
        item: {
          id: item.id,
          title: item.title,
          image: item.images[0],
          price: item.price
        }
      }
    });
    
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: 'An error occurred while creating conversation' 
    });
  }
});

// Get messages in conversation
router.get('/:id/messages', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = 50;
    const offset = (page - 1) * limit;
    
    // Verify user is part of conversation
    const convCheck = await pool.query(
      'SELECT * FROM conversations WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)',
      [id, req.user.id]
    );
    
    if (convCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Conversation not found',
        message: 'You do not have access to this conversation'
      });
    }
    
    // Get messages
    const result = await pool.query(
      `SELECT m.*, u.name as sender_name
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at DESC
       LIMIT $2 OFFSET $3`,
      [id, limit, offset]
    );
    
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM messages WHERE conversation_id = $1',
      [id]
    );
    
    const totalCount = parseInt(countResult.rows[0].count);
    
    res.json({
      success: true,
      messages: result.rows.reverse(), // Reverse to show oldest first
      pagination: {
        page,
        limit,
        total: totalCount,
        has_more: totalCount > (page * limit)
      }
    });
    
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: 'An error occurred while fetching messages' 
    });
  }
});

// Mark messages as read
router.put('/messages/mark-read', requireAuth, async (req, res) => {
  try {
    const { conversation_id } = req.body;
    
    if (!conversation_id) {
      return res.status(400).json({
        error: 'Missing conversation_id',
        message: 'conversation_id is required'
      });
    }
    
    // Mark all messages as read where user is recipient
    await pool.query(
      `UPDATE messages 
       SET is_read = true 
       WHERE conversation_id = $1 
       AND sender_id != $2 
       AND is_read = false`,
      [conversation_id, req.user.id]
    );
    
    res.json({
      success: true,
      message: 'Messages marked as read'
    });
    
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: 'An error occurred while marking messages as read' 
    });
  }
});

// Get unread count
router.get('/unread-count', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_unread,
        m.conversation_id,
        COUNT(*) as unread_count
       FROM messages m
       JOIN conversations c ON m.conversation_id = c.id
       WHERE (c.buyer_id = $1 OR c.seller_id = $1)
       AND m.sender_id != $1
       AND m.is_read = false
       GROUP BY m.conversation_id`,
      [req.user.id]
    );
    
    const totalResult = await pool.query(
      `SELECT COUNT(*) as total
       FROM messages m
       JOIN conversations c ON m.conversation_id = c.id
       WHERE (c.buyer_id = $1 OR c.seller_id = $1)
       AND m.sender_id != $1
       AND m.is_read = false`,
      [req.user.id]
    );
    
    res.json({
      success: true,
      total_unread: parseInt(totalResult.rows[0]?.total || 0),
      conversations: result.rows
    });
    
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: 'An error occurred while fetching unread count' 
    });
  }
});

module.exports = router;
