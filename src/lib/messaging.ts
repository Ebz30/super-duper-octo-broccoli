import { supabaseAdmin } from './supabase'
import { validateContent } from './profanity'
import type { Conversation, Message } from './supabase'

export interface CreateConversationData {
  item_id: string
  seller_id: string
}

export interface SendMessageData {
  conversation_id: string
  content: string
}

export interface ConversationsResponse {
  conversations: (Conversation & {
    item: any
    buyer: any
    seller: any
    lastMessage?: Message
    unreadCount: number
  })[]
  total: number
}

export class MessagingService {
  // Create or get existing conversation
  static async createConversation(
    buyerId: string,
    data: CreateConversationData
  ): Promise<{ success: boolean; conversation?: Conversation; error?: string }> {
    try {
      // Check if conversation already exists
      const { data: existing, error: existingError } = await supabaseAdmin
        .from('conversations')
        .select(`
          *,
          item:items(id, title, images, price, seller_id),
          buyer:users(id, name),
          seller:users(id, name)
        `)
        .match({
          item_id: data.item_id,
          buyer_id: buyerId,
          seller_id: data.seller_id,
        })
        .single()

      if (existing) {
        return { success: true, conversation: existing }
      }

      // Verify item exists and buyer is not the seller
      const { data: item, error: itemError } = await supabaseAdmin
        .from('items')
        .select('id, title, seller_id, is_available')
        .eq('id', data.item_id)
        .single()

      if (itemError || !item) {
        return { success: false, error: 'Item not found' }
      }

      if (item.seller_id === buyerId) {
        return { success: false, error: 'Cannot message yourself about your own item' }
      }

      if (item.seller_id !== data.seller_id) {
        return { success: false, error: 'Invalid seller ID' }
      }

      // Create new conversation
      const { data: conversation, error } = await supabaseAdmin
        .from('conversations')
        .insert({
          item_id: data.item_id,
          buyer_id: buyerId,
          seller_id: data.seller_id,
        })
        .select(`
          *,
          item:items(id, title, images, price, seller_id),
          buyer:users(id, name),
          seller:users(id, name)
        `)
        .single()

      if (error) {
        console.error('Create conversation error:', error)
        return { success: false, error: 'Failed to create conversation' }
      }

      return { success: true, conversation }
    } catch (error) {
      console.error('Create conversation error:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  // Send message in conversation
  static async sendMessage(
    senderId: string,
    data: SendMessageData
  ): Promise<{ success: boolean; message?: Message; error?: string }> {
    try {
      // Validate content
      const contentValidation = validateContent({ notes: data.content })
      if (!contentValidation.isValid) {
        return { success: false, error: contentValidation.errors[0] }
      }

      if (data.content.trim().length === 0) {
        return { success: false, error: 'Message cannot be empty' }
      }

      if (data.content.length > 1000) {
        return { success: false, error: 'Message too long (max 1000 characters)' }
      }

      // Verify user is part of conversation
      const { data: conversation, error: convError } = await supabaseAdmin
        .from('conversations')
        .select('buyer_id, seller_id')
        .eq('id', data.conversation_id)
        .single()

      if (convError || !conversation) {
        return { success: false, error: 'Conversation not found' }
      }

      if (conversation.buyer_id !== senderId && conversation.seller_id !== senderId) {
        return { success: false, error: 'Not authorized to send messages in this conversation' }
      }

      // Insert message
      const { data: message, error } = await supabaseAdmin
        .from('messages')
        .insert({
          conversation_id: data.conversation_id,
          sender_id: senderId,
          content: data.content.trim(),
        })
        .select(`
          *,
          sender:users(id, name)
        `)
        .single()

      if (error) {
        console.error('Send message error:', error)
        return { success: false, error: 'Failed to send message' }
      }

      // Update conversation timestamp
      await supabaseAdmin
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', data.conversation_id)

      return { success: true, message }
    } catch (error) {
      console.error('Send message error:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  // Get user's conversations
  static async getUserConversations(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<ConversationsResponse> {
    try {
      const offset = (page - 1) * limit

      const { data: conversations, error, count } = await supabaseAdmin
        .from('conversations')
        .select(`
          *,
          item:items(id, title, images, price),
          buyer:users(id, name),
          seller:users(id, name)
        `, { count: 'exact' })
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('Get conversations error:', error)
        return { conversations: [], total: 0 }
      }

      // Get last message and unread count for each conversation
      const conversationsWithDetails = await Promise.all(
        (conversations || []).map(async (conv) => {
          // Get last message
          const { data: lastMessage } = await supabaseAdmin
            .from('messages')
            .select(`
              *,
              sender:users(id, name)
            `)
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          // Get unread count (messages not read by current user)
          const { count: unreadCount } = await supabaseAdmin
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', userId)
            .eq('is_read', false)

          return {
            ...conv,
            lastMessage: lastMessage || undefined,
            unreadCount: unreadCount || 0,
          }
        })
      )

      const total = count || 0

      return { conversations: conversationsWithDetails, total }
    } catch (error) {
      console.error('Get conversations error:', error)
      return { conversations: [], total: 0 }
    }
  }

  // Get messages in conversation
  static async getConversationMessages(
    conversationId: string,
    userId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{
    success: boolean
    messages?: Message[]
    hasMore?: boolean
    error?: string
  }> {
    try {
      // Verify user is part of conversation
      const { data: conversation, error: convError } = await supabaseAdmin
        .from('conversations')
        .select('buyer_id, seller_id')
        .eq('id', conversationId)
        .single()

      if (convError || !conversation) {
        return { success: false, error: 'Conversation not found' }
      }

      if (conversation.buyer_id !== userId && conversation.seller_id !== userId) {
        return { success: false, error: 'Not authorized to view this conversation' }
      }

      const offset = (page - 1) * limit

      const { data: messages, error } = await supabaseAdmin
        .from('messages')
        .select(`
          *,
          sender:users(id, name)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('Get messages error:', error)
        return { success: false, error: 'Failed to load messages' }
      }

      // Reverse to show oldest first
      const reversedMessages = (messages || []).reverse()
      const hasMore = (messages || []).length === limit

      return { success: true, messages: reversedMessages, hasMore }
    } catch (error) {
      console.error('Get messages error:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  // Mark messages as read
  static async markMessagesAsRead(
    conversationId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Mark all unread messages in conversation as read (where user is recipient)
      const { error } = await supabaseAdmin
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId)
        .eq('is_read', false)

      if (error) {
        console.error('Mark messages as read error:', error)
        return { success: false, error: 'Failed to mark messages as read' }
      }

      return { success: true }
    } catch (error) {
      console.error('Mark messages as read error:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  // Get total unread count for user
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      // Get all conversations where user is participant
      const { data: conversations } = await supabaseAdmin
        .from('conversations')
        .select('id')
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)

      if (!conversations || conversations.length === 0) {
        return 0
      }

      const conversationIds = conversations.map(c => c.id)

      // Count unread messages across all conversations
      const { count, error } = await supabaseAdmin
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', conversationIds)
        .neq('sender_id', userId)
        .eq('is_read', false)

      if (error) {
        console.error('Get unread count error:', error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error('Get unread count error:', error)
      return 0
    }
  }

  // Delete conversation (soft delete - mark as deleted for user)
  static async deleteConversation(
    conversationId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // For now, we'll just implement this as a placeholder
      // In a full implementation, you might want to add a deleted_by field
      // or create a separate table for tracking deleted conversations per user
      
      return { success: true }
    } catch (error) {
      console.error('Delete conversation error:', error)
      return { success: false, error: 'Internal server error' }
    }
  }
}