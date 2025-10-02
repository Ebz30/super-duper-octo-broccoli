import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { authenticateRequest } from '@/lib/auth';
import { validateListingContent } from '@/lib/content-moderation';
import { CATEGORIES } from '@/lib/types';

// GET /api/items - Get items with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category');
    const minPrice = searchParams.get('min_price');
    const maxPrice = searchParams.get('max_price');
    const condition = searchParams.get('condition');
    const location = searchParams.get('location');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'newest';
    const isAvailable = searchParams.get('is_available');

    const offset = (page - 1) * limit;

    // Build query
    let query = supabaseAdmin
      .from('items')
      .select(`
        *,
        seller:users(id, name, university),
        category:categories(id, name, icon)
      `)
      .eq('deleted_at', null);

    // Apply filters
    if (category) {
      const categoryIds = category.split(',').map(Number);
      query = query.in('category_id', categoryIds);
    }

    if (minPrice) {
      query = query.gte('price', parseFloat(minPrice));
    }

    if (maxPrice) {
      query = query.lte('price', parseFloat(maxPrice));
    }

    if (condition) {
      const conditions = condition.split(',');
      query = query.in('condition', conditions);
    }

    if (location) {
      query = query.ilike('location', `%${location}%`);
    }

    if (isAvailable !== null) {
      query = query.eq('is_available', isAvailable === 'true');
    }

    // Apply search
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply sorting
    switch (sort) {
      case 'price_asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false });
        break;
      case 'popular':
        query = query.order('view_count', { ascending: false });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: items, error, count } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: items || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
        has_more: (count || 0) > offset + limit,
      },
    });
  } catch (error) {
    console.error('Get items error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch items' },
      { status: 500 }
    );
  }
}

// POST /api/items - Create new item
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, description, category_id, price, discount_percentage, condition, location, images } = body;

    // Validate required fields
    if (!title || !description || !category_id || !price || !condition || !location) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate content
    const contentValidation = validateListingContent(title, description);
    if (!contentValidation.valid) {
      return NextResponse.json(
        { success: false, error: contentValidation.errors[0] },
        { status: 400 }
      );
    }

    // Validate category
    const validCategory = CATEGORIES.find(cat => cat.id === category_id);
    if (!validCategory) {
      return NextResponse.json(
        { success: false, error: 'Invalid category' },
        { status: 400 }
      );
    }

    // Validate price
    if (price <= 0 || price > 999999.99) {
      return NextResponse.json(
        { success: false, error: 'Price must be between 0 and 999,999.99' },
        { status: 400 }
      );
    }

    // Validate discount
    if (discount_percentage && (discount_percentage < 0 || discount_percentage > 90)) {
      return NextResponse.json(
        { success: false, error: 'Discount must be between 0 and 90 percent' },
        { status: 400 }
      );
    }

    // Validate condition
    const validConditions = ['New', 'Like New', 'Good', 'Fair', 'Poor'];
    if (!validConditions.includes(condition)) {
      return NextResponse.json(
        { success: false, error: 'Invalid condition' },
        { status: 400 }
      );
    }

    // Create item
    const { data: item, error } = await supabaseAdmin
      .from('items')
      .insert({
        seller_id: user.id,
        title,
        description,
        category_id,
        price,
        discount_percentage: discount_percentage || 0,
        condition,
        location,
        images: images || [],
      })
      .select(`
        *,
        seller:users(id, name, university),
        category:categories(id, name, icon)
      `)
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: item,
      message: 'Item created successfully',
    });
  } catch (error) {
    console.error('Create item error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create item' },
      { status: 500 }
    );
  }
}