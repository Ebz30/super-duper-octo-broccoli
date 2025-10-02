import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { authenticateRequest } from '@/lib/auth';

// GET /api/conversations/unread-count - Get unread message count
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get unread count per conversation
    const { data: unreadData, error } = await supabaseAdmin
      .from('messages')
      .select(`
        conversation_id,
        count(*)
      `)
      .eq('is_read', false)
      .neq('sender_id', user.id)
      .in('conversation_id', 
        supabaseAdmin
          .from('conversations')
          .select('id')
          .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      )
      .group('conversation_id');

    if (error) {
      throw error;
    }

    // Calculate total unread count
    const totalUnread = unreadData?.reduce((sum, item) => sum + item.count, 0) || 0;

    // Format conversations with unread counts
    const conversations = unreadData?.map(item => ({
      conversation_id: item.conversation_id,
      unread_count: item.count,
    })) || [];

    return NextResponse.json({
      success: true,
      data: {
        total_unread: totalUnread,
        conversations,
      },
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch unread count' },
      { status: 500 }
    );
  }
}