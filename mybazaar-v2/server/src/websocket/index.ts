import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { db, messages, conversations } from '../db';
import { eq, and, or } from 'drizzle-orm';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  isAlive?: boolean;
}

interface WebSocketMessage {
  type: 'join_conversation' | 'send_message' | 'typing' | 'mark_read' | 'ping';
  conversationId?: string;
  message?: string;
  recipientId?: string;
}

export class MessagingWebSocket {
  private wss: WebSocketServer;
  private clients: Map<string, Set<AuthenticatedWebSocket>> = new Map();

  constructor(server: any) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws'
    });

    this.setupWebSocketServer();
    this.setupHeartbeat();
  }

  private setupWebSocketServer() {
    this.wss.on('connection', (ws: AuthenticatedWebSocket, request: IncomingMessage) => {
      console.log('New WebSocket connection');
      
      ws.isAlive = true;

      // Handle pong responses
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', async (data: Buffer) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString());
          await this.handleMessage(ws, message);
        } catch (error) {
          console.error('WebSocket message error:', error);
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: 'Invalid message format' 
          }));
        }
      });

      ws.on('close', () => {
        if (ws.userId) {
          this.removeClient(ws.userId, ws);
        }
        console.log('WebSocket connection closed');
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
  }

  private setupHeartbeat() {
    const interval = setInterval(() => {
      this.wss.clients.forEach((ws: AuthenticatedWebSocket) => {
        if (ws.isAlive === false) {
          if (ws.userId) {
            this.removeClient(ws.userId, ws);
          }
          return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30 seconds

    this.wss.on('close', () => {
      clearInterval(interval);
    });
  }

  private async handleMessage(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    switch (message.type) {
      case 'join_conversation':
        await this.handleJoinConversation(ws, message);
        break;

      case 'send_message':
        await this.handleSendMessage(ws, message);
        break;

      case 'typing':
        await this.handleTyping(ws, message);
        break;

      case 'mark_read':
        await this.handleMarkRead(ws, message);
        break;

      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;

      default:
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Unknown message type' 
        }));
    }
  }

  private async handleJoinConversation(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    if (!message.conversationId) {
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Conversation ID required' 
      }));
      return;
    }

    // In a real app, you'd verify the user has access to this conversation
    // For now, we'll extract userId from a simple auth token or session

    // Store the connection
    const userId = message.conversationId.split('-')[0]; // Simplified
    ws.userId = userId;
    
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId)!.add(ws);

    ws.send(JSON.stringify({ 
      type: 'joined', 
      conversationId: message.conversationId 
    }));
  }

  private async handleSendMessage(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    if (!message.conversationId || !message.message || !ws.userId) {
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Invalid message data' 
      }));
      return;
    }

    try {
      // Save message to database
      const [newMessage] = await db.insert(messages).values({
        conversationId: message.conversationId,
        senderId: ws.userId,
        content: message.message,
      }).returning();

      // Get conversation to find recipient
      const conversation = await db.query.conversations.findFirst({
        where: eq(conversations.id, message.conversationId),
      });

      if (!conversation) {
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Conversation not found' 
        }));
        return;
      }

      // Determine recipient
      const recipientId = conversation.buyerId === ws.userId 
        ? conversation.sellerId 
        : conversation.buyerId;

      // Broadcast to recipient
      const recipientMessage = {
        type: 'new_message',
        conversationId: message.conversationId,
        message: {
          id: newMessage.id,
          content: newMessage.content,
          senderId: ws.userId,
          createdAt: newMessage.createdAt,
        }
      };

      this.sendToUser(recipientId, recipientMessage);

      // Confirm to sender
      ws.send(JSON.stringify({
        type: 'message_sent',
        message: newMessage,
      }));
    } catch (error) {
      console.error('Error sending message:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Failed to send message' 
      }));
    }
  }

  private async handleTyping(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    if (!message.conversationId || !message.recipientId) return;

    this.sendToUser(message.recipientId, {
      type: 'typing',
      conversationId: message.conversationId,
      userId: ws.userId,
    });
  }

  private async handleMarkRead(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    if (!message.conversationId || !ws.userId) return;

    try {
      // Update messages as read in database
      await db.update(messages)
        .set({ isRead: true })
        .where(
          and(
            eq(messages.conversationId, message.conversationId),
            eq(messages.isRead, false)
          )
        );

      ws.send(JSON.stringify({ 
        type: 'marked_read', 
        conversationId: message.conversationId 
      }));
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  private sendToUser(userId: string, message: any) {
    const userClients = this.clients.get(userId);
    if (!userClients) return;

    const messageStr = JSON.stringify(message);
    userClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  private removeClient(userId: string, ws: AuthenticatedWebSocket) {
    const userClients = this.clients.get(userId);
    if (userClients) {
      userClients.delete(ws);
      if (userClients.size === 0) {
        this.clients.delete(userId);
      }
    }
  }
}
