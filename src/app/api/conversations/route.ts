import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { authenticateRequest } from '@/lib/auth';

// GET /api/conversations - Get user's conversations
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
    const item_id = searchParams.get('item_id');
    const seller_id = searchParams.get('seller_id');

    let query = supabaseAdmin
      .from('conversations')
      .select(`
        id,
        buyer_id,
        seller_id,
        item_id,
        created_at,
        updated_at,
        buyer:users!conversations_buyer_id_fkey(id, name, university),
        seller:users!conversations_seller_id_fkey(id, name, university),
        item:items(id, title, price, images, is_available),
        messages:messages(
          id,
          sender_id,
          content,
          created_at,
          is_read
        )
      `)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order('updated_at', { ascending: false });

    // If looking for specific conversation
    if (item_id && seller_id) {
      query = query
        .eq('item_id', item_id)
        .eq('seller_id', seller_id)
        .eq('buyer_id', user.id);
    }

    const { data: conversations, error } = await query;

    if (error) {
      throw error;
    }

    // Process conversations to add unread count and last message
    const processedConversations = conversations?.map(conv => {
      const messages = conv.messages || [];
      const unreadCount = messages.filter((msg: any) => 
        !msg.is_read && msg.sender_id !== user.id
      ).length;
      
      const lastMessage = messages.length > 0 
        ? messages[messages.length - 1] 
        : null;

      return {
        ...conv,
        unread_count: unreadCount,
        last_message: lastMessage,
        messages: undefined, // Remove messages from response to reduce payload
      };
    });

    return NextResponse.json({
      success: true,
      data: processedConversations || [],
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

// POST /api/conversations - Create new conversation
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
    const { item_id, seller_id } = body;

    if (!item_id || !seller_id) {
      return NextResponse.json(
        { success: false, error: 'Item ID and seller ID are required' },
        { status: 400 }
      );
    }

    // Check if user is trying to message themselves
    if (seller_id === user.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot message yourself' },
        { status: 400 }
      );
    }

    // Check if item exists and is available
    const { data: item, error: itemError } = await supabaseAdmin
      .from('items')
      .select('id, seller_id, title, price, images, is_available')
      .eq('id', item_id)
      .eq('deleted_at', null)
      .single();

    if (itemError || !item) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      );
    }

    if (!item.is_available) {
      return NextResponse.json(
        { success: false, error: 'Item is no longer available' },
        { status: 400 }
      );
    }

    if (item.seller_id !== seller_id) {
      return NextResponse.json(
        { success: false, error: 'Invalid seller ID' },
        { status: 400 }
      );
    }

    // Check if conversation already exists
    const { data: existingConversation } = await supabaseAdmin
      .from('conversations')
      .select(`
        id,
        buyer_id,
        seller_id,
        item_id,
        created_at,
        updated_at,
        buyer:users!conversations_buyer_id_fkey(id, name, university),
        seller:users!conversations_seller_id_fkey(id, name, university),
        item:items(id, title, price, images, is_available)
      `)
      .eq('buyer_id', user.id)
      .eq('seller_id', seller_id)
      .eq('item_id', item_id)
      .single();

    if (existingConversation) {
      return NextResponse.json({
        success: true,
        data: existingConversation,
        message: 'Conversation already exists',
      });
    }

    // Create new conversation
    const { data: conversation, error } = await supabaseAdmin
      .from('conversations')
      .insert({
        buyer_id: user.id,
        seller_id,
        item_id,
      })
      .select(`
        id,
        buyer_id,
        seller_id,
        item_id,
        created_at,
        updated_at,
        buyer:users!conversations_buyer_id_fkey(id, name, university),
        seller:users!conversations_seller_id_fkey(id, name, university),
        item:items(id, title, price, images, is_available)
      `)
      .single();

    if (error) {
      throw error;
    }

    // Track activity for recommendations
    await supabaseAdmin
      .from('user_activities')
      .insert({
        user_id: user.id,
        activity_type: 'contact',
        item_id,
        category_id: item.category_id,
        item_price: item.price,
        condition: item.condition,
      });

    return NextResponse.json({
      success: true,
      data: conversation,
      message: 'Conversation created successfully',
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}