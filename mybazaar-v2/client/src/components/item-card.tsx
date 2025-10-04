import React from 'react';
import { Link } from 'wouter';
import { Heart, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatPrice, formatDate } from '@/lib/utils';
import type { Item } from '@shared/types';
import { useAuth } from '@/contexts/auth-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface ItemCardProps {
  item: Item & {
    sellerName?: string;
    categoryName?: string;
    isFavorited?: boolean;
  };
}

export default function ItemCard({ item }: ItemCardProps) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isFavorited, setIsFavorited] = React.useState(item.isFavorited || false);

  // Favorite mutation
  const favoriteMutation = useMutation({
    mutationFn: async (favorited: boolean) => {
      if (favorited) {
        await apiService.favorites.remove(item.id);
      } else {
        await apiService.favorites.add(item.id);
      }
    },
    onSuccess: (_, favorited) => {
      setIsFavorited(!favorited);
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      
      toast({
        title: !favorited ? 'Added to favorites' : 'Removed from favorites',
        description: !favorited ? `${item.title} saved to your favorites` : undefined,
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not update favorites',
      });
    },
  });

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast({
        title: 'Login required',
        description: 'Please login to save favorites',
      });
      return;
    }

    favoriteMutation.mutate(isFavorited);
  };

  // Calculate final price if discount exists
  const finalPrice = item.discountPercentage 
    ? item.price * (1 - item.discountPercentage / 100)
    : item.price;

  const firstImage = item.images?.[0] || 'https://via.placeholder.com/400x400?text=No+Image';

  return (
    <Link href={`/items/${item.id}`}>
      <Card className="group cursor-pointer overflow-hidden h-full flex flex-col">
        {/* Image Section */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <img
            src={firstImage}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
          />
          
          {/* Favorite Button */}
          <button
            onClick={handleFavoriteClick}
            className={`absolute top-2 right-2 p-2 rounded-full transition-all duration-200 ${
              isFavorited 
                ? 'bg-red-500 text-white shadow-lg' 
                : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-500'
            }`}
            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`h-5 w-5 ${isFavorited ? 'fill-current' : ''}`} />
          </button>

          {/* Discount Badge */}
          {item.discountPercentage && item.discountPercentage > 0 && (
            <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-sm font-semibold">
              -{item.discountPercentage}%
            </div>
          )}

          {/* Condition Badge */}
          <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium capitalize">
            {item.condition?.replace('_', ' ')}
          </div>
        </div>

        {/* Content Section */}
        <CardContent className="flex-1 flex flex-col p-4">
          {/* Category */}
          {item.categoryName && (
            <p className="text-xs text-teal-600 font-semibold mb-1">
              {item.categoryName}
            </p>
          )}

          {/* Title */}
          <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-teal-600 transition-colors">
            {item.title}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
            <MapPin className="h-4 w-4" />
            <span>{item.location}</span>
          </div>

          {/* Price Section */}
          <div className="mt-auto">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">
                {formatPrice(finalPrice, item.currency)}
              </span>
              {item.discountPercentage && item.discountPercentage > 0 && (
                <span className="text-sm text-gray-400 line-through">
                  {formatPrice(item.price, item.currency)}
                </span>
              )}
            </div>

            {/* Seller & Date */}
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <span className="truncate">{item.sellerName || 'Unknown Seller'}</span>
              <span>{formatDate(item.createdAt)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
