import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { authenticateRequest } from '@/lib/auth';
import { validateListingContent } from '@/lib/content-moderation';
import { CATEGORIES } from '@/lib/types';

// GET /api/items/[id] - Get single item
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Get item with seller and category info
    const { data: item, error } = await supabaseAdmin
      .from('items')
      .select(`
        *,
        seller:users(id, name, university, created_at),
        category:categories(id, name, icon)
      `)
      .eq('id', id)
      .eq('deleted_at', null)
      .single();

    if (error || !item) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      );
    }

    // Increment view count
    await supabaseAdmin
      .from('items')
      .update({ view_count: item.view_count + 1 })
      .eq('id', id);

    // Get similar items (same category, different seller)
    const { data: similarItems } = await supabaseAdmin
      .from('items')
      .select(`
        id,
        title,
        price,
        discount_percentage,
        images,
        condition,
        location,
        seller:users(id, name)
      `)
      .eq('category_id', item.category_id)
      .eq('is_available', true)
      .eq('deleted_at', null)
      .neq('seller_id', item.seller_id)
      .order('created_at', { ascending: false })
      .limit(6);

    return NextResponse.json({
      success: true,
      data: {
        ...item,
        view_count: item.view_count + 1, // Return updated count
        similar_items: similarItems || [],
      },
    });
  } catch (error) {
    console.error('Get item error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch item' },
      { status: 500 }
    );
  }
}

// PUT /api/items/[id] - Update item
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { title, description, category_id, price, discount_percentage, condition, location, images } = body;

    // Check if item exists and user owns it
    const { data: existingItem, error: fetchError } = await supabaseAdmin
      .from('items')
      .select('seller_id')
      .eq('id', id)
      .eq('deleted_at', null)
      .single();

    if (fetchError || !existingItem) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      );
    }

    if (existingItem.seller_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to update this item' },
        { status: 403 }
      );
    }

    // Validate content if provided
    if (title || description) {
      const contentValidation = validateListingContent(
        title || existingItem.title,
        description || existingItem.description
      );
      if (!contentValidation.valid) {
        return NextResponse.json(
          { success: false, error: contentValidation.errors[0] },
          { status: 400 }
        );
      }
    }

    // Validate category if provided
    if (category_id) {
      const validCategory = CATEGORIES.find(cat => cat.id === category_id);
      if (!validCategory) {
        return NextResponse.json(
          { success: false, error: 'Invalid category' },
          { status: 400 }
        );
      }
    }

    // Validate price if provided
    if (price !== undefined) {
      if (price <= 0 || price > 999999.99) {
        return NextResponse.json(
          { success: false, error: 'Price must be between 0 and 999,999.99' },
          { status: 400 }
        );
      }
    }

    // Validate discount if provided
    if (discount_percentage !== undefined) {
      if (discount_percentage < 0 || discount_percentage > 90) {
        return NextResponse.json(
          { success: false, error: 'Discount must be between 0 and 90 percent' },
          { status: 400 }
        );
      }
    }

    // Validate condition if provided
    if (condition) {
      const validConditions = ['New', 'Like New', 'Good', 'Fair', 'Poor'];
      if (!validConditions.includes(condition)) {
        return NextResponse.json(
          { success: false, error: 'Invalid condition' },
          { status: 400 }
        );
      }
    }

    // Update item
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category_id !== undefined) updateData.category_id = category_id;
    if (price !== undefined) updateData.price = price;
    if (discount_percentage !== undefined) updateData.discount_percentage = discount_percentage;
    if (condition !== undefined) updateData.condition = condition;
    if (location !== undefined) updateData.location = location;
    if (images !== undefined) updateData.images = images;

    const { data: item, error } = await supabaseAdmin
      .from('items')
      .update(updateData)
      .eq('id', id)
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
      message: 'Item updated successfully',
    });
  } catch (error) {
    console.error('Update item error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update item' },
      { status: 500 }
    );
  }
}

// DELETE /api/items/[id] - Delete item (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Check if item exists and user owns it
    const { data: existingItem, error: fetchError } = await supabaseAdmin
      .from('items')
      .select('seller_id')
      .eq('id', id)
      .eq('deleted_at', null)
      .single();

    if (fetchError || !existingItem) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      );
    }

    if (existingItem.seller_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to delete this item' },
        { status: 403 }
      );
    }

    // Soft delete item
    const { error } = await supabaseAdmin
      .from('items')
      .update({ 
        deleted_at: new Date().toISOString(),
        is_available: false 
      })
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Item deleted successfully',
    });
  } catch (error) {
    console.error('Delete item error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete item' },
      { status: 500 }
    );
  }
}