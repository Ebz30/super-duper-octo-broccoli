'use client';

import React from 'react';
import { MessageCircle, Clock, Check, CheckCheck } from 'lucide-react';
import { Conversation } from '@/lib/types';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId?: string;
  onSelectConversation: (conversation: Conversation) => void;
  loading?: boolean;
}

export default function ConversationList({ 
  conversations, 
  selectedConversationId, 
  onSelectConversation,
  loading 
}: ConversationListProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="w-full md:w-80 bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="space-y-2 p-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="p-3 border border-gray-200 rounded-lg animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full md:w-80 bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Messages</h2>
      </div>
      
      <div className="space-y-1">
        {conversations.length === 0 ? (
          <div className="p-8 text-center">
            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No conversations yet</p>
            <p className="text-sm text-gray-500 mt-2">
              Start a conversation by contacting a seller
            </p>
          </div>
        ) : (
          conversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => onSelectConversation(conversation)}
              className={`w-full p-3 text-left hover:bg-gray-50 transition-colors ${
                selectedConversationId === conversation.id ? 'bg-primary-50 border-r-2 border-primary-500' : ''
              }`}
            >
              <div className="flex items-start space-x-3">
                {/* Item Image */}
                <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {conversation.item?.images && conversation.item.images.length > 0 ? (
                    <img
                      src={conversation.item.images[0]}
                      alt={conversation.item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400 text-xs">No Image</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Other User Name */}
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {conversation.buyer_id === conversation.buyer?.id 
                        ? conversation.seller?.name 
                        : conversation.buyer?.name}
                    </p>
                    <div className="flex items-center space-x-1">
                      {conversation.unread_count > 0 && (
                        <span className="bg-primary-600 text-white text-xs px-2 py-1 rounded-full">
                          {conversation.unread_count}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {conversation.last_message && formatTime(conversation.last_message.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Item Title */}
                  <p className="text-xs text-gray-600 truncate mb-1">
                    {conversation.item?.title}
                  </p>

                  {/* Last Message */}
                  {conversation.last_message && (
                    <div className="flex items-center space-x-1">
                      <p className="text-sm text-gray-600 truncate flex-1">
                        {conversation.last_message.content}
                      </p>
                      <div className="flex-shrink-0">
                        {conversation.last_message.sender_id === conversation.buyer?.id ? (
                          conversation.last_message.is_read ? (
                            <CheckCheck className="w-4 h-4 text-blue-500" />
                          ) : (
                            <Check className="w-4 h-4 text-gray-400" />
                          )
                        ) : (
                          <Clock className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Item Price */}
                  {conversation.item && (
                    <p className="text-xs font-medium text-primary-600 mt-1">
                      {formatPrice(conversation.item.price)}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}