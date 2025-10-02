import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { authenticateRequest } from '@/lib/auth';

// GET /api/favorites - Get user's favorites
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const { data: favorites, error, count } = await supabaseAdmin
      .from('favorites')
      .select(`
        id,
        created_at,
        item:items (
          id,
          title,
          price,
          discount_percentage,
          images,
          condition,
          location,
          is_available,
          view_count,
          created_at,
          seller:users (
            id,
            name,
            university
          ),
          category:categories (
            id,
            name,
            icon
          )
        )
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: favorites || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
        has_more: (count || 0) > offset + limit,
      },
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch favorites' },
      { status: 500 }
    );
  }
}

// POST /api/favorites - Add item to favorites
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
    const { item_id } = body;

    if (!item_id) {
      return NextResponse.json(
        { success: false, error: 'Item ID is required' },
        { status: 400 }
      );
    }

    // Check if item exists
    const { data: item, error: itemError } = await supabaseAdmin
      .from('items')
      .select('id, seller_id')
      .eq('id', item_id)
      .eq('deleted_at', null)
      .single();

    if (itemError || !item) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      );
    }

    // Check if user is trying to favorite their own item
    if (item.seller_id === user.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot favorite your own item' },
        { status: 400 }
      );
    }

    // Check if already favorited
    const { data: existingFavorite } = await supabaseAdmin
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('item_id', item_id)
      .single();

    if (existingFavorite) {
      return NextResponse.json({
        success: true,
        message: 'Item already in favorites',
        favorite_id: existingFavorite.id,
      });
    }

    // Add to favorites
    const { data: favorite, error } = await supabaseAdmin
      .from('favorites')
      .insert({
        user_id: user.id,
        item_id,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Track activity for recommendations
    await supabaseAdmin
      .from('user_activities')
      .insert({
        user_id: user.id,
        activity_type: 'favorite',
        item_id,
        category_id: item.category_id,
        item_price: item.price,
        condition: item.condition,
      });

    return NextResponse.json({
      success: true,
      data: favorite,
      message: 'Item added to favorites',
    });
  } catch (error) {
    console.error('Add favorite error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add favorite' },
      { status: 500 }
    );
  }
}

// DELETE /api/favorites - Remove item from favorites
export async function DELETE(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const item_id = searchParams.get('item_id');

    if (!item_id) {
      return NextResponse.json(
        { success: false, error: 'Item ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('item_id', item_id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Item removed from favorites',
    });
  } catch (error) {
    console.error('Remove favorite error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove favorite' },
      { status: 500 }
    );
  }
}