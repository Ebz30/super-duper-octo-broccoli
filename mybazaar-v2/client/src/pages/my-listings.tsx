import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import apiService from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatPrice, formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';

export default function MyListings() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch user's listings
  const { data, isLoading } = useQuery({
    queryKey: ['items', 'my-listings'],
    queryFn: async () => {
      const response = await apiService.items.getAll({ 
        sellerId: user?.id,
        limit: 100 
      });
      return response.data;
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      await apiService.items.delete(itemId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      toast({
        variant: 'success',
        title: 'Listing deleted',
        description: 'Your item has been removed',
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not delete listing',
      });
    },
  });

  const handleDelete = (itemId: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteMutation.mutate(itemId);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Listings</h1>
            <p className="text-gray-600">
              {data?.items?.length || 0} active listings
            </p>
          </div>
          <Link href="/sell">
            <Button size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Create New Listing
            </Button>
          </Link>
        </div>

        {/* Listings */}
        {!data?.items || data.items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg shadow-sm">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No listings yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start selling by creating your first listing
            </p>
            <Link href="/sell">
              <Button>
                <Plus className="h-5 w-5 mr-2" />
                Create Listing
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {data.items.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    {/* Image */}
                    <div className="md:w-48 h-48 bg-gray-100 flex-shrink-0">
                      <img
                        src={item.images[0] || 'https://via.placeholder.com/200'}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {item.title}
                          </h3>
                          <p className="text-gray-600 line-clamp-2 mb-3">
                            {item.description}
                          </p>
                          
                          <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              <span>{item.viewCount} views</span>
                            </div>
                            <span>•</span>
                            <span>{formatDate(item.createdAt)}</span>
                            <span>•</span>
                            <span className="capitalize">
                              {item.condition?.replace('_', ' ')}
                            </span>
                          </div>

                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-gray-900">
                              {formatPrice(
                                item.discountPercentage 
                                  ? item.price * (1 - item.discountPercentage / 100)
                                  : item.price,
                                item.currency
                              )}
                            </span>
                            {item.discountPercentage && item.discountPercentage > 0 && (
                              <span className="text-sm text-gray-400 line-through">
                                {formatPrice(item.price, item.currency)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 ml-4">
                          <Link href={`/items/${item.id}`}>
                            <Button size="sm" variant="outline" className="w-full">
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </Link>
                          <Link href={`/items/${item.id}/edit`}>
                            <Button size="sm" variant="outline" className="w-full">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(item.id, item.title)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
