import { Router } from 'express';
import { db, categories } from '../db';

const router = Router();

// GET /api/categories - Get all categories
router.get('/', async (req, res) => {
  try {
    const allCategories = await db.query.categories.findMany({
      where: (categories, { eq }) => eq(categories.isActive, true),
      orderBy: (categories, { asc }) => [asc(categories.sortOrder)],
    });

    res.json({
      success: true,
      categories: allCategories,
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'An error occurred while fetching categories',
    });
  }
});

export default router;
