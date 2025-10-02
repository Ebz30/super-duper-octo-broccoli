'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import ItemGrid from '@/components/items/ItemGrid';
import { Heart, ShoppingBag, ArrowLeft } from 'lucide-react';
import { Item } from '@/lib/types';

export default function FavoritesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [favorites, setFavorites] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
    has_more: false,
  });

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    
    loadFavorites();
  }, [user, router]);

  const loadFavorites = async (page: number = 1) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/favorites?page=${page}&limit=20`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        // Extract items from favorites data
        const items = data.data.map((fav: any) => fav.item).filter(Boolean);
        setFavorites(items);
        setPagination(data.pagination);
      } else {
        console.error('Failed to load favorites:', data.error);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = async (itemId: string) => {
    try {
      const response = await fetch(`/api/favorites?item_id=${itemId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();
      
      if (data.success) {
        // Remove from local state
        setFavorites(favorites.filter(item => item.id !== itemId));
        setPagination(prev => ({
          ...prev,
          total: prev.total - 1,
        }));
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const handlePageChange = (newPage: number) => {
    loadFavorites(newPage);
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
            <h1 className="text-3xl font-bold text-gray-800 mb-2">My Favorites</h1>
            <p className="text-gray-600">
              Items you've saved for later
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-2xl shadow-soft p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Favorites</p>
                <p className="text-2xl font-bold text-gray-800">{pagination.total}</p>
              </div>
            </div>
            
            {favorites.length > 0 && (
              <button
                onClick={() => router.push('/browse')}
                className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-xl hover:bg-primary-700 transition-colors"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Browse More</span>
              </button>
            )}
          </div>
        </div>

        {/* Favorites Grid */}
        {loading ? (
          <ItemGrid items={[]} loading={true} />
        ) : favorites.length > 0 ? (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                {pagination.total} Favorite Items
              </h2>
            </div>
            
            <ItemGrid 
              items={favorites} 
              onFavorite={handleFavorite}
              favorites={favorites.map(item => item.id)}
            />

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex items-center space-x-2">
                  <button
                    disabled={pagination.page === 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          pagination.page === page
                            ? 'bg-primary-600 text-white'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  
                  <button
                    disabled={!pagination.has_more}
                    onClick={() => handlePageChange(pagination.page + 1)}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-2xl shadow-soft p-12 text-center">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-12 h-12 text-red-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">No Favorites Yet</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Start exploring items and add them to your favorites to see them here. 
              You can save items you're interested in for later.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/browse')}
                className="btn-primary"
              >
                Browse Items
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="btn-outline"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}