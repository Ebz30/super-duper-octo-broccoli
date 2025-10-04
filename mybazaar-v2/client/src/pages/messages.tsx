import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Send, ArrowLeft } from 'lucide-react';
import apiService from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { useWebSocket } from '@/contexts/websocket-context';
import { useAuth } from '@/contexts/auth-context';

export default function Messages() {
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = React.useState<string | null>(null);
  const [messageInput, setMessageInput] = React.useState('');
  const [localMessages, setLocalMessages] = React.useState<any[]>([]);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const { isConnected, sendMessage: sendWSMessage, joinConversation, onMessage } = useWebSocket();

  // Fetch conversations
  const { data: conversationsData, isLoading: loadingConversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await apiService.conversations.getAll();
      return response.data.conversations;
    },
  });

  // Fetch messages for selected conversation
  const { data: messagesData, refetch: refetchMessages } = useQuery({
    queryKey: ['messages', selectedConversation],
    queryFn: async () => {
      if (!selectedConversation) return null;
      const response = await apiService.conversations.getMessages(selectedConversation);
      return response.data.messages;
    },
    enabled: !!selectedConversation,
  });

  // Update local messages when data changes
  React.useEffect(() => {
    if (messagesData) {
      setLocalMessages(messagesData);
    }
  }, [messagesData]);

  // Join conversation when selected
  React.useEffect(() => {
    if (selectedConversation && isConnected) {
      joinConversation(selectedConversation);
    }
  }, [selectedConversation, isConnected, joinConversation]);

  // Listen for new messages via WebSocket
  React.useEffect(() => {
    const unsubscribe = onMessage((data) => {
      if (data.type === 'new_message' && data.conversationId === selectedConversation) {
        setLocalMessages(prev => [...prev, data.message]);
        scrollToBottom();
      } else if (data.type === 'message_sent') {
        // Message confirmed sent
        scrollToBottom();
      }
    });

    return unsubscribe;
  }, [onMessage, selectedConversation]);

  // Scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [localMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageInput.trim() || !selectedConversation) return;

    const content = messageInput.trim();
    setMessageInput('');

    // Send via WebSocket if connected, otherwise use REST API
    if (isConnected) {
      sendWSMessage(selectedConversation, content);
      
      // Optimistically add message to UI
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        content,
        senderId: user?.id,
        senderName: user?.fullName,
        createdAt: new Date().toISOString(),
        isRead: false,
      };
      setLocalMessages(prev => [...prev, optimisticMessage]);
    } else {
      // Fallback to REST API
      try {
        await apiService.conversations.sendMessage(selectedConversation, { content });
        refetchMessages();
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    }
  };

  const selectedConv = conversationsData?.find(c => c.id === selectedConversation);

  if (loadingConversations) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages</h1>
          <p className="text-gray-600 flex items-center gap-2">
            {isConnected && (
              <span className="flex items-center gap-1 text-green-600">
                <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                Connected
              </span>
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <Card className="lg:col-span-1 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h2 className="font-semibold text-gray-900">Conversations</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {!conversationsData || conversationsData.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 text-sm">No conversations yet</p>
                  <p className="text-gray-500 text-xs mt-2">
                    Start chatting with sellers by clicking "Contact Seller" on item pages
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {conversationsData.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv.id)}
                      className={`w-full p-4 hover:bg-gray-50 transition-colors text-left ${
                        selectedConversation === conv.id ? 'bg-teal-50 border-l-4 border-teal-600' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-700 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                          {conv.otherUserName?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {conv.otherUserName}
                            </h3>
                            {conv.unreadCount > 0 && (
                              <span className="bg-teal-600 text-white text-xs rounded-full px-2 py-0.5 ml-2">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate mb-1">{conv.itemTitle}</p>
                          {conv.lastMessage && (
                            <p className="text-sm text-gray-600 truncate">
                              {conv.lastMessage.content}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2 overflow-hidden flex flex-col">
            {selectedConversation && selectedConv ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="lg:hidden"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-700 rounded-full flex items-center justify-center text-white font-semibold">
                    {selectedConv.otherUserName?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedConv.otherUserName}</h3>
                    <p className="text-xs text-gray-500">{selectedConv.itemTitle}</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {localMessages.map((msg, index) => {
                    const isOwn = msg.senderId === user?.id;
                    return (
                      <div
                        key={msg.id || index}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            isOwn
                              ? 'bg-teal-600 text-white'
                              : 'bg-white text-gray-900 border border-gray-200'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              isOwn ? 'text-teal-100' : 'text-gray-500'
                            }`}
                          >
                            {formatDate(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
                  <div className="flex gap-2">
                    <Input
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1"
                      autoComplete="off"
                    />
                    <Button type="submit" disabled={!messageInput.trim()}>
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Choose a conversation from the list to start chatting
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
