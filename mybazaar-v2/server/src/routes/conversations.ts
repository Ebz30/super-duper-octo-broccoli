import { Router } from 'express';
import { z } from 'zod';
import { db, conversations, messages, items, users } from '../db';
import { eq, and, or, desc, sql } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';

const router = Router();

// GET /api/conversations - Get all user's conversations
router.get('/', requireAuth, async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    // Get conversations with last message and unread count
    const userConversations = await db
      .select({
        id: conversations.id,
        itemId: conversations.itemId,
        buyerId: conversations.buyerId,
        sellerId: conversations.sellerId,
        createdAt: conversations.createdAt,
        itemTitle: items.title,
        itemImage: items.images,
        otherUserName: users.fullName,
        otherUserId: users.id,
      })
      .from(conversations)
      .leftJoin(items, eq(conversations.itemId, items.id))
      .leftJoin(
        users,
        or(
          and(
            eq(conversations.buyerId, req.session.userId),
            eq(users.id, conversations.sellerId)
          ),
          and(
            eq(conversations.sellerId, req.session.userId),
            eq(users.id, conversations.buyerId)
          )
        )!
      )
      .where(
        or(
          eq(conversations.buyerId, req.session.userId),
          eq(conversations.sellerId, req.session.userId)
        )!
      )
      .orderBy(desc(conversations.updatedAt));

    // Get last message and unread count for each conversation
    const conversationsWithDetails = await Promise.all(
      userConversations.map(async (conv) => {
        // Get last message
        const lastMessage = await db.query.messages.findFirst({
          where: eq(messages.conversationId, conv.id),
          orderBy: desc(messages.createdAt),
        });

        // Get unread count
        const [{ count }] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(messages)
          .where(
            and(
              eq(messages.conversationId, conv.id),
              eq(messages.isRead, false),
              sql`${messages.senderId} != ${req.session.userId}`
            )
          );

        return {
          ...conv,
          lastMessage: lastMessage ? {
            content: lastMessage.content,
            createdAt: lastMessage.createdAt,
            senderId: lastMessage.senderId,
          } : null,
          unreadCount: count,
        };
      })
    );

    res.json({
      success: true,
      conversations: conversationsWithDetails,
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'An error occurred while fetching conversations',
    });
  }
});

// POST /api/conversations - Create or get existing conversation
router.post('/', requireAuth, async (req, res) => {
  try {
    const { itemId, sellerId } = req.body;

    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    if (!itemId || !sellerId) {
      return res.status(400).json({
        success: false,
        error: 'Item ID and Seller ID are required',
      });
    }

    // Check if conversation already exists
    const existing = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.itemId, itemId),
        eq(conversations.buyerId, req.session.userId),
        eq(conversations.sellerId, sellerId)
      ),
    });

    if (existing) {
      return res.json({
        success: true,
        conversation: existing,
      });
    }

    // Create new conversation
    const [newConversation] = await db
      .insert(conversations)
      .values({
        itemId,
        buyerId: req.session.userId,
        sellerId,
      })
      .returning();

    res.status(201).json({
      success: true,
      conversation: newConversation,
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'An error occurred while creating conversation',
    });
  }
});

// GET /api/conversations/:id/messages - Get messages in conversation
router.get('/:id/messages', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '50' } = req.query;

    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    // Verify user is part of conversation
    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.id, id),
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found',
      });
    }

    if (
      conversation.buyerId !== req.session.userId &&
      conversation.sellerId !== req.session.userId
    ) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    // Get messages
    const conversationMessages = await db
      .select({
        id: messages.id,
        content: messages.content,
        senderId: messages.senderId,
        isRead: messages.isRead,
        createdAt: messages.createdAt,
        senderName: users.fullName,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.conversationId, id))
      .orderBy(desc(messages.createdAt))
      .limit(limitNum)
      .offset(offset);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(messages)
      .where(eq(messages.conversationId, id));

    const totalCount = count;
    const totalPages = Math.ceil(totalCount / limitNum);

    // Mark messages as read
    await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.conversationId, id),
          sql`${messages.senderId} != ${req.session.userId}`,
          eq(messages.isRead, false)
        )
      );

    res.json({
      success: true,
      messages: conversationMessages.reverse(), // Oldest first
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages,
        hasMore: pageNum < totalPages,
      },
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'An error occurred while fetching messages',
    });
  }
});

// POST /api/conversations/:id/messages - Send message (REST fallback)
router.post('/:id/messages', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message content is required',
      });
    }

    // Verify user is part of conversation
    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.id, id),
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found',
      });
    }

    if (
      conversation.buyerId !== req.session.userId &&
      conversation.sellerId !== req.session.userId
    ) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    // Create message
    const [newMessage] = await db
      .insert(messages)
      .values({
        conversationId: id,
        senderId: req.session.userId,
        content: content.trim(),
      })
      .returning();

    // Update conversation timestamp
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, id));

    res.status(201).json({
      success: true,
      message: newMessage,
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'An error occurred while sending message',
    });
  }
});

export default router;
