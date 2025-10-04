import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import apiService from '@/services/api';
import ItemCard from '@/components/item-card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

export default function Favorites() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const response = await apiService.favorites.getAll();
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">Error loading favorites</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="h-8 w-8 text-teal-600" />
            <h1 className="text-3xl font-bold text-gray-900">My Favorites</h1>
          </div>
          <p className="text-gray-600">
            {data?.items?.length || 0} saved items
          </p>
        </div>

        {/* Items Grid */}
        {!data?.items || data.items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg shadow-sm">
            <Heart className="h-20 w-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No favorites yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start browsing and save items you like
            </p>
            <Link href="/browse">
              <Button>Browse Items</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data.items.map((item) => (
              <ItemCard key={item.id} item={{ ...item, isFavorited: true }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
