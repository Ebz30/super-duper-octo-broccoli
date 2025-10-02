import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { authenticateRequest } from '@/lib/auth';

// GET /api/favorites/check/[itemId] - Check if item is favorited
export async function GET(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { itemId } = params;

    const { data: favorite } = await supabaseAdmin
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('item_id', itemId)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        is_favorited: !!favorite,
        favorite_id: favorite?.id || null,
      },
    });
  } catch (error) {
    console.error('Check favorite error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check favorite status' },
      { status: 500 }
    );
  }
}