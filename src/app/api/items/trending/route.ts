import { NextRequest, NextResponse } from 'next/server';
import { getTrendingItems } from '@/lib/recommendations';

// GET /api/items/trending - Get trending items
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '8');

    const trendingItems = await getTrendingItems(limit);

    return NextResponse.json({
      success: true,
      data: trendingItems,
    });
  } catch (error) {
    console.error('Get trending items error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trending items' },
      { status: 500 }
    );
  }
}