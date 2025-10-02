import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { useAuth } from '../context/AuthContext';
import apiService, { API_URL } from '../services/api';
import './Messages.css';

function Messages() {
  const { user } = useAuth();
  const { connected, sendMessage, messages: wsMessages } = useWebSocket();
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    // Listen for new WebSocket messages
    if (wsMessages.length > 0) {
      const latestMessage = wsMessages[wsMessages.length - 1];
      if (selectedConv && latestMessage.conversation_id === selectedConv.id) {
        setMessages(prev => [...prev, latestMessage]);
      }
      fetchConversations(); // Refresh conversation list
    }
  }, [wsMessages, selectedConv]);

  const fetchConversations = async () => {
    try {
      const response = await apiService.conversations.getAll();
      if (response.data.success) {
        setConversations(response.data.conversations);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (conv) => {
    setSelectedConv(conv);
    try {
      const response = await apiService.conversations.getMessages(conv.id);
      if (response.data.success) {
        setMessages(response.data.messages);
      }
      // Mark as read
      await apiService.conversations.markRead(conv.id);
      fetchConversations(); // Refresh unread count
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConv) return;

    const success = sendMessage(selectedConv.id, newMessage.trim());
    if (success) {
      setNewMessage('');
    } else {
      alert('Failed to send message. Please check your connection.');
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="messages-page">
      <div className="container">
        <h1>Messages</h1>
        
        <div className="messages-layout">
          {/* Conversations List */}
          <div className="conversations-list">
            <div className="conversations-header">
              <h2>Conversations</h2>
              {!connected && (
                <span className="status-offline">⚠️ Offline</span>
              )}
            </div>
            
            {conversations.length === 0 ? (
              <div className="empty-conversations">
                <p>No conversations yet</p>
                <p className="text-sm">Start messaging sellers to see conversations here</p>
              </div>
            ) : (
              <div className="conversations-items">
                {conversations.map(conv => (
                  <div
                    key={conv.id}
                    className={`conversation-item ${selectedConv?.id === conv.id ? 'active' : ''}`}
                    onClick={() => selectConversation(conv)}
                  >
                    <div className="conv-header">
                      <h3>{conv.other_user_name}</h3>
                      {conv.unread_count > 0 && (
                        <span className="unread-badge">{conv.unread_count}</span>
                      )}
                    </div>
                    <p className="conv-item-title">{conv.item_title}</p>
                    {conv.last_message && (
                      <p className="conv-last-message">{conv.last_message}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Messages Area */}
          <div className="messages-area">
            {selectedConv ? (
              <>
                <div className="messages-header">
                  <div>
                    <h2>{selectedConv.other_user_name}</h2>
                    <p className="item-title-small">{selectedConv.item_title}</p>
                  </div>
                  {selectedConv.item_image && (
                    <img 
                      src={`${API_URL}${selectedConv.item_image}`} 
                      alt={selectedConv.item_title}
                      className="item-thumbnail"
                    />
                  )}
                </div>

                <div className="messages-list">
                  {messages.map((msg, index) => (
                    <div
                      key={msg.id || index}
                      className={`message ${msg.sender_id === user.id ? 'sent' : 'received'}`}
                    >
                      <div className="message-bubble">
                        <p>{msg.content}</p>
                        <span className="message-time">
                          {new Date(msg.created_at).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendMessage} className="message-input-form">
                  <input
                    type="text"
                    className="message-input"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    maxLength="1000"
                  />
                  <button type="submit" className="btn btn-primary" disabled={!connected || !newMessage.trim()}>
                    Send
                  </button>
                </form>
              </>
            ) : (
              <div className="empty-messages">
                <p>Select a conversation to start messaging</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Messages;
