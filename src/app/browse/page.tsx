'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import SearchFilters from '@/components/items/SearchFilters';
import ItemGrid from '@/components/items/ItemGrid';
import { Item } from '@/lib/types';

export default function BrowsePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
    has_more: false,
  });

  // Load initial items
  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async (filters: any = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category.join(','));
      if (filters.min_price) params.append('min_price', filters.min_price.toString());
      if (filters.max_price) params.append('max_price', filters.max_price.toString());
      if (filters.condition) params.append('condition', filters.condition.join(','));
      if (filters.location) params.append('location', filters.location);
      if (filters.sort) params.append('sort', filters.sort);
      if (filters.is_available !== undefined) params.append('is_available', filters.is_available.toString());
      
      params.append('page', '1');
      params.append('limit', '20');

      const response = await fetch(`/api/items?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setItems(data.data);
        setPagination(data.pagination);
      } else {
        console.error('Failed to load items:', data.error);
      }
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (filters: any) => {
    loadItems(filters);
  };

  const handleFavorite = async (itemId: string) => {
    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ item_id: itemId }),
      });

      const data = await response.json();
      
      if (data.success) {
        if (favorites.includes(itemId)) {
          setFavorites(favorites.filter(id => id !== itemId));
        } else {
          setFavorites([...favorites, itemId]);
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Browse Items</h1>
          <p className="text-gray-600">
            Discover amazing items from students across Northern Cyprus universities
          </p>
        </div>

        {/* Search and Filters */}
        <SearchFilters onSearch={handleSearch} loading={loading} />

        {/* Results */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              {loading ? 'Loading...' : `${pagination.total} items found`}
            </h2>
            
            {!loading && items.length > 0 && (
              <div className="text-sm text-gray-500">
                Page {pagination.page} of {pagination.pages}
              </div>
            )}
          </div>

          <ItemGrid 
            items={items} 
            loading={loading}
            onFavorite={handleFavorite}
            favorites={favorites}
          />
        </div>

        {/* Pagination */}
        {!loading && pagination.pages > 1 && (
          <div className="flex justify-center">
            <div className="flex items-center space-x-2">
              <button
                disabled={pagination.page === 1}
                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
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
                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}