'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import ConversationList from '@/components/messaging/ConversationList';
import MessageList from '@/components/messaging/MessageList';
import MessageInput from '@/components/messaging/MessageInput';
import { ArrowLeft, MessageCircle, ShoppingBag } from 'lucide-react';
import { Conversation, Message } from '@/lib/types';
import toast from 'react-hot-toast';

function MessagesContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    loadConversations();
  }, [user, router]);

  useEffect(() => {
    // Check if we should auto-select a conversation from URL params
    const itemId = searchParams.get('item');
    const sellerId = searchParams.get('seller');

    if (itemId && sellerId && conversations.length > 0) {
      const targetConversation = conversations.find(conv => 
        conv.item_id === itemId && conv.seller_id === sellerId
      );
      
      if (targetConversation) {
        setSelectedConversation(targetConversation);
        loadMessages(targetConversation.id);
      } else {
        // Create new conversation
        createConversation(itemId, sellerId);
      }
    }
  }, [searchParams, conversations]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/conversations', {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        setConversations(data.data);
      } else {
        console.error('Failed to load conversations:', data.error);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const createConversation = async (itemId: string, sellerId: string) => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ item_id: itemId, seller_id: sellerId }),
      });

      const data = await response.json();

      if (data.success) {
        setSelectedConversation(data.data);
        setConversations(prev => [data.data, ...prev]);
        loadMessages(data.data.id);
      } else {
        toast.error(data.error || 'Failed to create conversation');
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Failed to create conversation');
    }
  };

  const loadMessages = async (conversationId: string) => {
    setMessagesLoading(true);
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        setMessages(data.data);
        
        // Mark messages as read
        await fetch('/api/messages/mark-read', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ conversation_id: conversationId }),
        });
      } else {
        console.error('Failed to load messages:', data.error);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    loadMessages(conversation.id);
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedConversation) return;

    setSendingMessage(true);
    try {
      const response = await fetch(`/api/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ content }),
      });

      const data = await response.json();

      if (data.success) {
        setMessages(prev => [...prev, data.data]);
        
        // Update conversation in list
        setConversations(prev => 
          prev.map(conv => 
            conv.id === selectedConversation.id 
              ? { ...conv, updated_at: data.data.created_at, last_message: data.data }
              : conv
          )
        );
      } else {
        toast.error(data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.back()}
            className="mr-4 p-2 text-gray-600 hover:text-primary-600 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Messages</h1>
            <p className="text-gray-600">
              Chat with buyers and sellers
            </p>
          </div>
        </div>

        {/* Messages Interface */}
        <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
          <div className="flex h-[600px]">
            {/* Conversation List */}
            <ConversationList
              conversations={conversations}
              selectedConversationId={selectedConversation?.id}
              onSelectConversation={handleSelectConversation}
              loading={loading}
            />

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {/* Item Image */}
                        <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden">
                          {selectedConversation.item?.images && selectedConversation.item.images.length > 0 ? (
                            <img
                              src={selectedConversation.item.images[0]}
                              alt={selectedConversation.item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <ShoppingBag className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            {selectedConversation.buyer_id === user.id 
                              ? selectedConversation.seller?.name 
                              : selectedConversation.buyer?.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {selectedConversation.item?.title}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => router.push(`/items/${selectedConversation.item_id}`)}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors"
                      >
                        View Item
                      </button>
                    </div>
                  </div>

                  {/* Messages */}
                  <MessageList
                    messages={messages}
                    currentUserId={user.id}
                    loading={messagesLoading}
                  />

                  {/* Message Input */}
                  <MessageInput
                    onSendMessage={handleSendMessage}
                    disabled={sendingMessage}
                  />
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Select a conversation</h3>
                    <p className="text-gray-600 mb-6">
                      Choose a conversation from the list to start messaging
                    </p>
                    <button
                      onClick={() => router.push('/browse')}
                      className="btn-primary"
                    >
                      Browse Items
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="spinner w-8 h-8"></div>
          </div>
        </main>
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}