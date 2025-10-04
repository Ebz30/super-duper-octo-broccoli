import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { authenticateRequest } from '@/lib/auth';

// PUT /api/messages/mark-read - Mark messages as read
export async function PUT(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { conversation_id } = body;

    if (!conversation_id) {
      return NextResponse.json(
        { success: false, error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    // Check if user is part of this conversation
    const { data: conversation } = await supabaseAdmin
      .from('conversations')
      .select('buyer_id, seller_id')
      .eq('id', conversation_id)
      .single();

    if (!conversation || (conversation.buyer_id !== user.id && conversation.seller_id !== user.id)) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to mark messages as read in this conversation' },
        { status: 403 }
      );
    }

    // Mark messages as read
    const { error } = await supabaseAdmin
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversation_id)
      .neq('sender_id', user.id)
      .eq('is_read', false);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Messages marked as read',
    });
  } catch (error) {
    console.error('Mark messages as read error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to mark messages as read' },
      { status: 500 }
    );
  }
}