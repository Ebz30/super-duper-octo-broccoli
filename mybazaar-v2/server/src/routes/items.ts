import { Router } from 'express';
import { z } from 'zod';
import { db, items, users, categories } from '../db';
import { eq, and, desc, asc, gte, lte, ilike, or, sql } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// Validation schemas
const createItemSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().min(50, 'Description must be at least 50 characters').max(1000),
  categoryId: z.string().uuid('Invalid category ID'),
  price: z.number().min(0).max(999999.99),
  discountPercentage: z.number().min(0).max(100).optional(),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'poor']),
  location: z.string().max(100),
});

// GET /api/items - Browse items with filters
router.get('/', async (req, res) => {
  try {
    const {
      category,
      minPrice,
      maxPrice,
      condition,
      location: searchLocation,
      search,
      sort = 'newest',
      page = '1',
      limit = '12',
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    // Build where conditions
    const conditions = [
      eq(items.availabilityStatus, 'available'),
    ];

    if (category) {
      conditions.push(eq(items.categoryId, category as string));
    }

    if (minPrice) {
      conditions.push(gte(items.price, minPrice as string));
    }

    if (maxPrice) {
      conditions.push(lte(items.price, maxPrice as string));
    }

    if (condition) {
      conditions.push(eq(items.condition, condition as any));
    }

    if (searchLocation) {
      conditions.push(ilike(items.location, `%${searchLocation}%`));
    }

    if (search) {
      conditions.push(
        or(
          ilike(items.title, `%${search}%`),
          ilike(items.description, `%${search}%`)
        )!
      );
    }

    // Determine sort order
    let orderBy;
    switch (sort) {
      case 'price_asc':
        orderBy = [asc(items.price)];
        break;
      case 'price_desc':
        orderBy = [desc(items.price)];
        break;
      case 'popular':
        orderBy = [desc(items.viewCount)];
        break;
      default:
        orderBy = [desc(items.createdAt)];
    }

    // Get items with seller and category info
    const itemsList = await db
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
        availabilityStatus: items.availabilityStatus,
        viewCount: items.viewCount,
        favoriteCount: items.favoriteCount,
        createdAt: items.createdAt,
        sellerId: items.sellerId,
        sellerName: users.fullName,
        categoryId: items.categoryId,
        categoryName: categories.name,
      })
      .from(items)
      .leftJoin(users, eq(items.sellerId, users.id))
      .leftJoin(categories, eq(items.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(...orderBy)
      .limit(limitNum)
      .offset(offset);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(items)
      .where(and(...conditions));

    const totalCount = count;
    const totalPages = Math.ceil(totalCount / limitNum);

    res.json({
      success: true,
      items: itemsList,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages,
        hasMore: pageNum < totalPages,
      },
    });
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'An error occurred while fetching items',
    });
  }
});

// GET /api/items/:id - Get single item
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const item = await db.query.items.findFirst({
      where: eq(items.id, id),
      with: {
        seller: {
          columns: {
            id: true,
            fullName: true,
            university: true,
            profilePictureUrl: true,
            createdAt: true,
          },
        },
        category: true,
      },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Item not found',
      });
    }

    // Increment view count
    await db
      .update(items)
      .set({ viewCount: sql`${items.viewCount} + 1` })
      .where(eq(items.id, id));

    res.json({
      success: true,
      item,
    });
  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'An error occurred while fetching the item',
    });
  }
});

// POST /api/items - Create new item (will add image upload later)
router.post('/', requireAuth, async (req, res) => {
  try {
    const validatedData = createItemSchema.parse(req.body);

    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    // For now, use placeholder images - will add Multer in next update
    const placeholderImages = ['https://via.placeholder.com/400x400?text=Placeholder'];

    const [newItem] = await db
      .insert(items)
      .values({
        ...validatedData,
        sellerId: req.session.userId,
        images: placeholderImages,
      })
      .returning();

    res.status(201).json({
      success: true,
      message: 'Item created successfully',
      item: newItem,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Create item error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'An error occurred while creating the item',
    });
  }
});

// PUT /api/items/:id - Update item
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership
    const existingItem = await db.query.items.findFirst({
      where: eq(items.id, id),
    });

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Item not found',
      });
    }

    if (existingItem.sellerId !== req.session.userId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You can only update your own items',
      });
    }

    const validatedData = createItemSchema.partial().parse(req.body);

    const [updatedItem] = await db
      .update(items)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(items.id, id))
      .returning();

    res.json({
      success: true,
      message: 'Item updated successfully',
      item: updatedItem,
    });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'An error occurred while updating the item',
    });
  }
});

// DELETE /api/items/:id - Delete item
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership
    const existingItem = await db.query.items.findFirst({
      where: eq(items.id, id),
    });

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Item not found',
      });
    }

    if (existingItem.sellerId !== req.session.userId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You can only delete your own items',
      });
    }

    // Soft delete by setting status to 'removed'
    await db
      .update(items)
      .set({ availabilityStatus: 'removed' })
      .where(eq(items.id, id));

    res.json({
      success: true,
      message: 'Item deleted successfully',
    });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'An error occurred while deleting the item',
    });
  }
});

export default router;
