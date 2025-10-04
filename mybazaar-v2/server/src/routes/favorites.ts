import { Router } from 'express';
import { db, favorites, items, users, categories } from '../db';
import { eq, and, desc } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';

const router = Router();

// GET /api/favorites - Get user's favorite items
router.get('/', requireAuth, async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const userFavorites = await db
      .select({
        id: items.id,
        title: items.title,
        description: items.description,
        price: items.price,
        currency: items.currency,
        discountPercentage: items.discountPercentage,
        condition: items.condition,
        images: items.images,
        location: items.location,
        viewCount: items.viewCount,
        favoriteCount: items.favoriteCount,
        createdAt: items.createdAt,
        sellerId: items.sellerId,
        sellerName: users.fullName,
        categoryId: items.categoryId,
        categoryName: categories.name,
      })
      .from(favorites)
      .innerJoin(items, eq(favorites.itemId, items.id))
      .leftJoin(users, eq(items.sellerId, users.id))
      .leftJoin(categories, eq(items.categoryId, categories.id))
      .where(eq(favorites.userId, req.session.userId))
      .orderBy(desc(favorites.createdAt));

    res.json({
      success: true,
      items: userFavorites,
      pagination: {
        totalCount: userFavorites.length,
      },
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'An error occurred while fetching favorites',
    });
  }
});

// POST /api/favorites - Add item to favorites
router.post('/', requireAuth, async (req, res) => {
  try {
    const { itemId } = req.body;

    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    if (!itemId) {
      return res.status(400).json({
        success: false,
        error: 'Item ID is required',
      });
    }

    // Check if already favorited
    const existing = await db.query.favorites.findFirst({
      where: and(
        eq(favorites.userId, req.session.userId),
        eq(favorites.itemId, itemId)
      ),
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Item already in favorites',
      });
    }

    // Add to favorites
    await db.insert(favorites).values({
      userId: req.session.userId,
      itemId,
    });

    res.status(201).json({
      success: true,
      message: 'Item added to favorites',
    });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'An error occurred while adding to favorites',
    });
  }
});

// DELETE /api/favorites/:itemId - Remove item from favorites
router.delete('/:itemId', requireAuth, async (req, res) => {
  try {
    const { itemId } = req.params;

    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    await db
      .delete(favorites)
      .where(
        and(
          eq(favorites.userId, req.session.userId),
          eq(favorites.itemId, itemId)
        )
      );

    res.json({
      success: true,
      message: 'Item removed from favorites',
    });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'An error occurred while removing from favorites',
    });
  }
});

// GET /api/favorites/check/:itemId - Check if item is favorited
router.get('/check/:itemId', requireAuth, async (req, res) => {
  try {
    const { itemId } = req.params;

    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const favorite = await db.query.favorites.findFirst({
      where: and(
        eq(favorites.userId, req.session.userId),
        eq(favorites.itemId, itemId)
      ),
    });

    res.json({
      success: true,
      isFavorited: !!favorite,
    });
  } catch (error) {
    console.error('Check favorite error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
});

export default router;
