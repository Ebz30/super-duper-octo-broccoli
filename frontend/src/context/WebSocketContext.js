import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';

const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:5001';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [ws, setWs] = useState(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const reconnectTimeoutRef = useRef(null);
  const wsRef = useRef(null);

  const connect = useCallback(() => {
    if (!user || wsRef.current) return;

    try {
      const websocket = new WebSocket(`${WS_URL}?userId=${user.id}`);
      
      websocket.onopen = () => {
        console.log('WebSocket connected');
        setConnected(true);
      };

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data.type);
          
          if (data.type === 'new_message') {
            setMessages(prev => [...prev, data.message]);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      websocket.onclose = () => {
        console.log('WebSocket disconnected');
        setConnected(false);
        wsRef.current = null;
        
        // Attempt to reconnect after 3 seconds
        if (user) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect WebSocket...');
            connect();
          }, 3000);
        }
      };

      wsRef.current = websocket;
      setWs(websocket);
    } catch (err) {
      console.error('Error creating WebSocket:', err);
    }
  }, [user]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setWs(null);
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [user, connect, disconnect]);

  const sendMessage = useCallback((conversationId, content) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return false;
    }

    try {
      wsRef.current.send(JSON.stringify({
        type: 'send_message',
        conversation_id: conversationId,
        content: content
      }));
      return true;
    } catch (err) {
      console.error('Error sending message:', err);
      return false;
    }
  }, []);

  const sendTyping = useCallback((conversationId, isTyping) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    try {
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        conversation_id: conversationId,
        is_typing: isTyping
      }));
    } catch (err) {
      console.error('Error sending typing indicator:', err);
    }
  }, []);

  const markRead = useCallback((conversationId) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    try {
      wsRef.current.send(JSON.stringify({
        type: 'mark_read',
        conversation_id: conversationId
      }));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  }, []);

  const value = {
    ws,
    connected,
    messages,
    sendMessage,
    sendTyping,
    markRead
  };

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export default WebSocketContext;
