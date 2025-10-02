const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { validateItem } = require('../utils/validators');
const upload = require('../middleware/upload');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Helper function to track user activity
async function trackActivity(userId, itemId, activityType, additionalData = {}) {
  try {
    await pool.query(
      `INSERT INTO user_activities 
       (user_id, item_id, activity_type, category_id, item_price, item_condition, search_query, filter_params)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        userId,
        itemId,
        activityType,
        additionalData.category_id || null,
        additionalData.price || null,
        additionalData.condition || null,
        additionalData.search_query || null,
        additionalData.filter_params ? JSON.stringify(additionalData.filter_params) : null
      ]
    );
  } catch (error) {
    console.error('Error tracking activity:', error);
  }
}

// Get all items with filtering, search, and pagination
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      category,
      min_price,
      max_price,
      condition,
      location,
      search,
      sort = 'newest',
      page = 1,
      is_available = 'true'
    } = req.query;
    
    const limit = 20;
    const offset = (parseInt(page) - 1) * limit;
    
    // Build query
    let queryConditions = ['is_deleted = false'];
    let queryParams = [];
    let paramCount = 1;
    
    if (is_available === 'true') {
      queryConditions.push('is_available = true');
    }
    
    if (category) {
      queryConditions.push(`category_id = $${paramCount}`);
      queryParams.push(parseInt(category));
      paramCount++;
    }
    
    if (min_price) {
      queryConditions.push(`price >= $${paramCount}`);
      queryParams.push(parseFloat(min_price));
      paramCount++;
    }
    
    if (max_price) {
      queryConditions.push(`price <= $${paramCount}`);
      queryParams.push(parseFloat(max_price));
      paramCount++;
    }
    
    if (condition) {
      queryConditions.push(`condition = $${paramCount}`);
      queryParams.push(condition);
      paramCount++;
    }
    
    if (location) {
      queryConditions.push(`location ILIKE $${paramCount}`);
      queryParams.push(`%${location}%`);
      paramCount++;
    }
    
    if (search) {
      queryConditions.push(`search_vector @@ plainto_tsquery('english', $${paramCount})`);
      queryParams.push(search);
      paramCount++;
      
      // Track search activity if user is logged in
      if (req.user) {
        trackActivity(req.user.id, null, 'search', { search_query: search });
      }
    }
    
    // Sort
    let orderBy = 'created_at DESC';
    switch (sort) {
      case 'price_asc':
        orderBy = 'price ASC';
        break;
      case 'price_desc':
        orderBy = 'price DESC';
        break;
      case 'popular':
        orderBy = 'view_count DESC';
        break;
      default:
        orderBy = 'created_at DESC';
    }
    
    const whereClause = queryConditions.join(' AND ');
    
    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM items WHERE ${whereClause}`,
      queryParams
    );
    
    const totalCount = parseInt(countResult.rows[0].count);
    
    // Get items
    queryParams.push(limit, offset);
    const itemsResult = await pool.query(
      `SELECT 
        i.id, i.title, i.price, i.discount_percentage, i.images, i.condition, 
        i.location, i.created_at, i.view_count,
        u.name as seller_name, u.id as seller_id,
        c.name as category_name
       FROM items i
       JOIN users u ON i.seller_id = u.id
       JOIN categories c ON i.category_id = c.id
       WHERE ${whereClause}
       ORDER BY ${orderBy}
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      queryParams
    );
    
    res.json({
      success: true,
      items: itemsResult.rows.map(item => ({
        ...item,
        image: item.images[0] || null
      })),
      pagination: {
        page: parseInt(page),
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
    
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: 'An error occurred while fetching items' 
    });
  }
});

// Get single item
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT 
        i.*,
        u.name as seller_name, u.university as seller_university, 
        u.created_at as seller_member_since, u.id as seller_id,
        c.name as category_name
       FROM items i
       JOIN users u ON i.seller_id = u.id
       JOIN categories c ON i.category_id = c.id
       WHERE i.id = $1 AND i.is_deleted = false`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Item not found',
        message: 'The requested item does not exist' 
      });
    }
    
    const item = result.rows[0];
    
    // Increment view count
    await pool.query(
      'UPDATE items SET view_count = view_count + 1 WHERE id = $1',
      [id]
    );
    
    // Track view activity if user is logged in
    if (req.user) {
      trackActivity(req.user.id, item.id, 'view', {
        category_id: item.category_id,
        price: item.price,
        condition: item.condition
      });
    }
    
    // Get similar items (same category, excluding this item)
    const similarItems = await pool.query(
      `SELECT i.id, i.title, i.price, i.discount_percentage, i.images, i.location
       FROM items i
       WHERE i.category_id = $1 AND i.id != $2 AND i.is_available = true AND i.is_deleted = false
       ORDER BY i.created_at DESC
       LIMIT 6`,
      [item.category_id, id]
    );
    
    res.json({
      success: true,
      item: {
        ...item,
        similar_items: similarItems.rows.map(si => ({
          ...si,
          image: si.images[0] || null
        }))
      }
    });
    
  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: 'An error occurred while fetching the item' 
    });
  }
});

// Create item
router.post('/', requireAuth, upload.array('images', 10), async (req, res) => {
  try {
    const {
      title,
      description,
      category_id,
      price,
      discount_percentage,
      condition,
      location
    } = req.body;
    
    // Validate item data
    const validation = validateItem({
      title,
      description,
      category_id,
      price,
      condition,
      location,
      discount_percentage
    });
    
    if (!validation.valid) {
      // Clean up uploaded files
      if (req.files) {
        req.files.forEach(file => {
          fs.unlinkSync(file.path);
        });
      }
      
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid item data',
        errors: validation.errors
      });
    }
    
    // Check if images were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'Images required',
        message: 'At least one image is required'
      });
    }
    
    // Process images (create thumbnails and optimize)
    const imageUrls = [];
    for (const file of req.files) {
      try {
        // Generate thumbnail
        const thumbnailPath = file.path.replace(path.extname(file.path), '-thumb.webp');
        await sharp(file.path)
          .resize(400, 400, { fit: 'cover' })
          .webp({ quality: 80 })
          .toFile(thumbnailPath);
        
        // Store relative path
        imageUrls.push(`/uploads/${path.basename(file.path)}`);
      } catch (imgError) {
        console.error('Image processing error:', imgError);
      }
    }
    
    // Insert item
    const result = await pool.query(
      `INSERT INTO items 
       (seller_id, category_id, title, description, price, discount_percentage, 
        condition, location, images, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       RETURNING *`,
      [
        req.user.id,
        category_id,
        title,
        description,
        price,
        discount_percentage || 0,
        condition,
        location,
        imageUrls
      ]
    );
    
    res.status(201).json({
      success: true,
      message: 'Item created successfully',
      item: result.rows[0]
    });
    
  } catch (error) {
    console.error('Create item error:', error);
    
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (e) {}
      });
    }
    
    res.status(500).json({ 
      error: 'Server error',
      message: 'An error occurred while creating the item' 
    });
  }
});

// Update item
router.put('/:id', requireAuth, upload.array('images', 10), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      category_id,
      price,
      discount_percentage,
      condition,
      location,
      is_available
    } = req.body;
    
    // Check if item exists and user owns it
    const itemCheck = await pool.query(
      'SELECT * FROM items WHERE id = $1 AND is_deleted = false',
      [id]
    );
    
    if (itemCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Item not found',
        message: 'The requested item does not exist'
      });
    }
    
    if (itemCheck.rows[0].seller_id !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only edit your own items'
      });
    }
    
    // Validate item data
    const validation = validateItem({
      title,
      description,
      category_id,
      price,
      condition,
      location,
      discount_percentage
    });
    
    if (!validation.valid) {
      if (req.files) {
        req.files.forEach(file => fs.unlinkSync(file.path));
      }
      
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid item data',
        errors: validation.errors
      });
    }
    
    // Handle new images
    let imageUrls = itemCheck.rows[0].images;
    if (req.files && req.files.length > 0) {
      const newImages = [];
      for (const file of req.files) {
        try {
          const thumbnailPath = file.path.replace(path.extname(file.path), '-thumb.webp');
          await sharp(file.path)
            .resize(400, 400, { fit: 'cover' })
            .webp({ quality: 80 })
            .toFile(thumbnailPath);
          
          newImages.push(`/uploads/${path.basename(file.path)}`);
        } catch (imgError) {
          console.error('Image processing error:', imgError);
        }
      }
      imageUrls = [...imageUrls, ...newImages].slice(0, 10);
    }
    
    // Update item
    const result = await pool.query(
      `UPDATE items 
       SET title = $1, description = $2, category_id = $3, price = $4, 
           discount_percentage = $5, condition = $6, location = $7, 
           images = $8, is_available = $9, updated_at = NOW()
       WHERE id = $10
       RETURNING *`,
      [
        title,
        description,
        category_id,
        price,
        discount_percentage || 0,
        condition,
        location,
        imageUrls,
        is_available !== undefined ? is_available : itemCheck.rows[0].is_available,
        id
      ]
    );
    
    res.json({
      success: true,
      message: 'Item updated successfully',
      item: result.rows[0]
    });
    
  } catch (error) {
    console.error('Update item error:', error);
    
    if (req.files) {
      req.files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (e) {}
      });
    }
    
    res.status(500).json({ 
      error: 'Server error',
      message: 'An error occurred while updating the item' 
    });
  }
});

// Delete item (soft delete)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if item exists and user owns it
    const itemCheck = await pool.query(
      'SELECT seller_id FROM items WHERE id = $1 AND is_deleted = false',
      [id]
    );
    
    if (itemCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Item not found',
        message: 'The requested item does not exist'
      });
    }
    
    if (itemCheck.rows[0].seller_id !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only delete your own items'
      });
    }
    
    // Soft delete
    await pool.query(
      'UPDATE items SET is_deleted = true, updated_at = NOW() WHERE id = $1',
      [id]
    );
    
    res.json({
      success: true,
      message: 'Item deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: 'An error occurred while deleting the item' 
    });
  }
});

// Get user's own items
router.get('/user/my-items', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT i.*, c.name as category_name
       FROM items i
       JOIN categories c ON i.category_id = c.id
       WHERE i.seller_id = $1 AND i.is_deleted = false
       ORDER BY i.created_at DESC`,
      [req.user.id]
    );
    
    res.json({
      success: true,
      items: result.rows
    });
    
  } catch (error) {
    console.error('Get user items error:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: 'An error occurred while fetching your items' 
    });
  }
});

// Share item (track share)
router.post('/:id/share', async (req, res) => {
  try {
    const { id } = req.params;
    const { platform } = req.body;
    
    const validPlatforms = ['whatsapp', 'telegram', 'instagram', 'copy'];
    if (!validPlatforms.includes(platform)) {
      return res.status(400).json({
        error: 'Invalid platform',
        message: 'Platform must be one of: whatsapp, telegram, instagram, copy'
      });
    }
    
    await pool.query(
      'INSERT INTO item_shares (item_id, platform, shared_at) VALUES ($1, $2, NOW())',
      [id, platform]
    );
    
    res.json({
      success: true,
      message: 'Share tracked successfully'
    });
    
  } catch (error) {
    console.error('Track share error:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: 'An error occurred while tracking share' 
    });
  }
});

module.exports = router;
