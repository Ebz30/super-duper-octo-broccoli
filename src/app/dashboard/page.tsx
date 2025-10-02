'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import ItemGrid from '@/components/items/ItemGrid';
import { 
  Plus, 
  ShoppingBag, 
  Heart, 
  MessageCircle, 
  TrendingUp,
  Users,
  Eye,
  DollarSign
} from 'lucide-react';
import { Item } from '@/lib/types';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [recommendedItems, setRecommendedItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalItems: 0,
    totalViews: 0,
    totalMessages: 0,
    totalFavorites: 0,
  });

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    
    loadDashboardData();
  }, [user, router]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load user's items
      const itemsResponse = await fetch('/api/items?seller_id=' + user?.id, {
        credentials: 'include',
      });
      const itemsData = await itemsResponse.json();
      
      if (itemsData.success) {
        setMyItems(itemsData.data.slice(0, 6)); // Show only first 6
      }

      // Load recommended items
      const recommendedResponse = await fetch('/api/items/recommended', {
        credentials: 'include',
      });
      const recommendedData = await recommendedResponse.json();
      
      if (recommendedData.success) {
        setRecommendedItems(recommendedData.data);
      }

      // Calculate stats
      if (itemsData.success) {
        const totalViews = itemsData.data.reduce((sum: number, item: Item) => sum + item.view_count, 0);
        setStats({
          totalItems: itemsData.data.length,
          totalViews,
          totalMessages: 0, // Would come from messages API
          totalFavorites: 0, // Would come from favorites API
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = async (itemId: string) => {
    // Implement favorite functionality
    console.log('Toggle favorite:', itemId);
  };

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome back, {user.name}!
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your MyBazaar account
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalItems}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-soft p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalViews}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-soft p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Messages</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalMessages}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-soft p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Favorites</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalFavorites}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-soft p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/sell')}
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <Plus className="w-5 h-5 text-primary-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-800">Sell Item</p>
                <p className="text-sm text-gray-600">List a new item</p>
              </div>
            </button>

            <button
              onClick={() => router.push('/browse')}
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-800">Browse Items</p>
                <p className="text-sm text-gray-600">Find items to buy</p>
              </div>
            </button>

            <button
              onClick={() => router.push('/messages')}
              className="flex items-center space-x-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-800">Messages</p>
                <p className="text-sm text-gray-600">View conversations</p>
              </div>
            </button>
          </div>
        </div>

        {/* My Items */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">My Items</h2>
            <button
              onClick={() => router.push('/my-listings')}
              className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              View All
            </button>
          </div>
          
          {loading ? (
            <ItemGrid items={[]} loading={true} />
          ) : myItems.length > 0 ? (
            <ItemGrid items={myItems} onFavorite={handleFavorite} />
          ) : (
            <div className="bg-white rounded-2xl shadow-soft p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No items yet</h3>
              <p className="text-gray-600 mb-6">Start selling by listing your first item</p>
              <button
                onClick={() => router.push('/sell')}
                className="btn-primary"
              >
                List Your First Item
              </button>
            </div>
          )}
        </div>

        {/* Recommended Items */}
        {recommendedItems.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Recommended For You</h2>
              <button
                onClick={() => router.push('/browse')}
                className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                Browse All
              </button>
            </div>
            
            <ItemGrid items={recommendedItems} onFavorite={handleFavorite} />
          </div>
        )}
      </main>
    </div>
  );
}