import React from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, MapPin, Clock, Eye, MessageSquare, Share2, Flag } from 'lucide-react';
import apiService from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatPrice, formatDate } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';

export default function ItemDetail() {
  const [, params] = useRoute('/items/:id');
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedImage, setSelectedImage] = React.useState(0);

  // Fetch item details
  const { data, isLoading, error } = useQuery({
    queryKey: ['item', params?.id],
    queryFn: async () => {
      const response = await apiService.items.getById(params!.id);
      return response.data.item;
    },
    enabled: !!params?.id,
  });

  // Favorite mutation
  const favoriteMutation = useMutation({
    mutationFn: async () => {
      if (!data) return;
      // Check if favorited (would need to implement check endpoint)
      await apiService.favorites.add(data.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item', params?.id] });
      toast({
        variant: 'success',
        title: 'Added to favorites',
        description: 'Item saved to your favorites',
      });
    },
  });

  const handleContactSeller = () => {
    if (!isAuthenticated) {
      toast({
        title: 'Login required',
        description: 'Please login to contact the seller',
      });
      navigate('/login');
      return;
    }

    if (data?.sellerId === user?.id) {
      toast({
        title: 'Cannot message yourself',
        description: "You can't send messages to your own listing",
      });
      return;
    }

    // Navigate to messages
    navigate('/messages');
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: data?.title,
        text: data?.description,
        url: window.location.href,
      });
    } catch {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link copied!',
        description: 'Item link copied to clipboard',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Item not found</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  const finalPrice = data.discountPercentage 
    ? data.price * (1 - data.discountPercentage / 100)
    : data.price;

  const isOwnListing = user?.id === data.sellerId;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container max-w-7xl mx-auto px-4">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          ← Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div>
            <Card className="overflow-hidden">
              <div className="aspect-square bg-gray-100">
                <img
                  src={data.images[selectedImage] || 'https://via.placeholder.com/800'}
                  alt={data.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </Card>

            {/* Thumbnails */}
            {data.images.length > 1 && (
              <div className="grid grid-cols-5 gap-2 mt-4">
                {data.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index ? 'border-teal-600' : 'border-transparent'
                    }`}
                  >
                    <img src={image} alt={`View ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Item Info */}
          <div>
            <Card>
              <CardContent className="p-6">
                {/* Category Badge */}
                <p className="text-sm text-teal-600 font-semibold mb-2">
                  {data.category?.icon} {data.category?.name}
                </p>

                {/* Title */}
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{data.title}</h1>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-bold text-gray-900">
                      {formatPrice(finalPrice, data.currency)}
                    </span>
                    {data.discountPercentage && data.discountPercentage > 0 && (
                      <>
                        <span className="text-xl text-gray-400 line-through">
                          {formatPrice(data.price, data.currency)}
                        </span>
                        <span className="bg-red-500 text-white px-2 py-1 rounded-md text-sm font-semibold">
                          -{data.discountPercentage}% OFF
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Meta Info */}
                <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{data.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{formatDate(data.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Eye className="h-4 w-4" />
                    <span>{data.viewCount} views</span>
                  </div>
                  <div className="capitalize text-gray-700 font-medium">
                    Condition: {data.condition?.replace('_', ' ')}
                  </div>
                </div>

                {/* Action Buttons */}
                {!isOwnListing && (
                  <div className="space-y-3 mb-6">
                    <Button
                      onClick={handleContactSeller}
                      className="w-full"
                      size="lg"
                    >
                      <MessageSquare className="h-5 w-5 mr-2" />
                      Contact Seller
                    </Button>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        onClick={() => favoriteMutation.mutate()}
                        disabled={!isAuthenticated}
                      >
                        <Heart className="h-5 w-5 mr-2" />
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleShare}
                      >
                        <Share2 className="h-5 w-5 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>
                )}

                {isOwnListing && (
                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-teal-800 font-medium">This is your listing</p>
                    <div className="mt-3 space-y-2">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate(`/items/${data.id}/edit`)}
                      >
                        Edit Listing
                      </Button>
                    </div>
                  </div>
                )}

                {/* Description */}
                <div className="border-t border-gray-200 pt-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {data.description}
                  </p>
                </div>

                {/* Seller Info */}
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Seller Information</h2>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-700 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                      {data.seller?.fullName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{data.seller?.fullName}</p>
                      <p className="text-sm text-gray-600">{data.seller?.university}</p>
                      <p className="text-xs text-gray-500">
                        Member since {new Date(data.seller?.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Report */}
                {!isOwnListing && (
                  <div className="border-t border-gray-200 pt-6 mt-6">
                    <button className="text-sm text-gray-500 hover:text-red-600 flex items-center gap-1">
                      <Flag className="h-4 w-4" />
                      Report this listing
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
