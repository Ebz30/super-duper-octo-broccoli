const WebSocket = require('ws');
const pool = require('../config/database');
const { validateMessage } = require('../utils/validators');

const clients = new Map(); // userId -> WebSocket connection

function initializeWebSocketServer(port = 5001) {
  const wss = new WebSocket.Server({ port });
  
  console.log(`WebSocket server running on port ${port}`);
  
  wss.on('connection', async (ws, req) => {
    console.log('New WebSocket connection attempt');
    
    // Extract userId from query params (sent by client after authentication)
    const urlParams = new URLSearchParams(req.url.split('?')[1]);
    const userId = urlParams.get('userId');
    
    if (!userId) {
      console.log('WebSocket connection rejected: No userId');
      ws.close(4001, 'Unauthorized: Missing user ID');
      return;
    }
    
    // Verify user exists
    try {
      const userCheck = await pool.query(
        'SELECT id, is_banned FROM users WHERE id = $1',
        [userId]
      );
      
      if (userCheck.rows.length === 0) {
        console.log('WebSocket connection rejected: User not found');
        ws.close(4001, 'Unauthorized: User not found');
        return;
      }
      
      if (userCheck.rows[0].is_banned) {
        console.log('WebSocket connection rejected: User banned');
        ws.close(4003, 'Forbidden: Account banned');
        return;
      }
    } catch (error) {
      console.error('Error verifying user:', error);
      ws.close(5000, 'Server error');
      return;
    }
    
    // Store connection
    clients.set(userId, ws);
    console.log(`User ${userId} connected. Total connections: ${clients.size}`);
    
    // Send connection confirmation
    ws.send(JSON.stringify({
      type: 'connected',
      userId: userId,
      timestamp: new Date().toISOString()
    }));
    
    // Handle incoming messages
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('Received message:', message.type, 'from user', userId);
        
        switch (message.type) {
          case 'send_message':
            await handleSendMessage(userId, message, ws);
            break;
            
          case 'typing':
            await handleTypingIndicator(userId, message);
            break;
            
          case 'mark_read':
            await handleMarkRead(userId, message);
            break;
            
          default:
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Unknown message type'
            }));
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      clients.delete(userId);
      console.log(`User ${userId} disconnected. Total connections: ${clients.size}`);
    });
    
    // Handle errors
    ws.on('error', (error) => {
      console.error('WebSocket error for user', userId, ':', error);
      clients.delete(userId);
    });
  });
  
  return wss;
}

async function handleSendMessage(senderId, message, senderWs) {
  try {
    const { conversation_id, content } = message;
    
    if (!conversation_id || !content) {
      senderWs.send(JSON.stringify({
        type: 'error',
        message: 'Missing conversation_id or content'
      }));
      return;
    }
    
    // Validate message content
    const validation = validateMessage(content);
    if (!validation.valid) {
      senderWs.send(JSON.stringify({
        type: 'error',
        message: validation.error
      }));
      return;
    }
    
    // Verify sender is part of conversation
    const convCheck = await pool.query(
      `SELECT buyer_id, seller_id FROM conversations WHERE id = $1`,
      [conversation_id]
    );
    
    if (convCheck.rows.length === 0) {
      senderWs.send(JSON.stringify({
        type: 'error',
        message: 'Conversation not found'
      }));
      return;
    }
    
    const conversation = convCheck.rows[0];
    const isParticipant = 
      conversation.buyer_id === parseInt(senderId) || 
      conversation.seller_id === parseInt(senderId);
    
    if (!isParticipant) {
      senderWs.send(JSON.stringify({
        type: 'error',
        message: 'You are not part of this conversation'
      }));
      return;
    }
    
    // Insert message into database
    const result = await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, content, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [conversation_id, senderId, content.trim()]
    );
    
    const newMessage = result.rows[0];
    
    // Update conversation timestamp
    await pool.query(
      'UPDATE conversations SET updated_at = NOW() WHERE id = $1',
      [conversation_id]
    );
    
    // Get sender name
    const senderResult = await pool.query(
      'SELECT name FROM users WHERE id = $1',
      [senderId]
    );
    
    const senderName = senderResult.rows[0].name;
    
    // Prepare message object
    const messageObj = {
      type: 'new_message',
      message: {
        id: newMessage.id,
        conversation_id: conversation_id,
        sender_id: newMessage.sender_id,
        sender_name: senderName,
        content: newMessage.content,
        created_at: newMessage.created_at,
        is_read: false
      }
    };
    
    // Send confirmation to sender
    senderWs.send(JSON.stringify({
      type: 'message_sent',
      message: messageObj.message
    }));
    
    // Determine recipient
    const recipientId = conversation.buyer_id === parseInt(senderId) 
      ? conversation.seller_id 
      : conversation.buyer_id;
    
    // Send to recipient if online
    const recipientWs = clients.get(recipientId.toString());
    if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
      recipientWs.send(JSON.stringify(messageObj));
    } else {
      console.log(`Recipient ${recipientId} is offline, message saved to database`);
    }
    
  } catch (error) {
    console.error('Error handling send message:', error);
    senderWs.send(JSON.stringify({
      type: 'error',
      message: 'Failed to send message'
    }));
  }
}

async function handleTypingIndicator(senderId, message) {
  try {
    const { conversation_id, is_typing } = message;
    
    // Get conversation
    const convResult = await pool.query(
      'SELECT buyer_id, seller_id FROM conversations WHERE id = $1',
      [conversation_id]
    );
    
    if (convResult.rows.length === 0) return;
    
    const conversation = convResult.rows[0];
    const recipientId = conversation.buyer_id === parseInt(senderId) 
      ? conversation.seller_id 
      : conversation.buyer_id;
    
    // Send typing indicator to recipient if online
    const recipientWs = clients.get(recipientId.toString());
    if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
      recipientWs.send(JSON.stringify({
        type: 'typing',
        conversation_id,
        user_id: senderId,
        is_typing
      }));
    }
  } catch (error) {
    console.error('Error handling typing indicator:', error);
  }
}

async function handleMarkRead(userId, message) {
  try {
    const { conversation_id } = message;
    
    // Mark messages as read
    await pool.query(
      `UPDATE messages 
       SET is_read = true 
       WHERE conversation_id = $1 
       AND sender_id != $2 
       AND is_read = false`,
      [conversation_id, userId]
    );
    
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
}

module.exports = {
  initializeWebSocketServer,
  clients
};
