'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import ItemCard from '@/components/items/ItemCard';
import { 
  Heart, 
  Share2, 
  MessageCircle, 
  MapPin, 
  Calendar, 
  Eye,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { Item } from '@/lib/types';
import toast from 'react-hot-toast';

export default function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth();
  const router = useRouter();
  const [item, setItem] = useState<Item | null>(null);
  const [similarItems, setSimilarItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [linkCopied, setLinkCopied] = useState(false);
  const [itemId, setItemId] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ id }) => setItemId(id));
  }, [params]);

  useEffect(() => {
    if (itemId) {
      loadItem();
    }
  }, [itemId]);

  useEffect(() => {
    if (user && item) {
      checkFavoriteStatus();
    }
  }, [user, item]);

  const loadItem = async () => {
    if (!itemId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/items/${itemId}`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        setItem(data.data);
        setSimilarItems(data.data.similar_items || []);
      } else {
        console.error('Failed to load item:', data.error);
        router.push('/browse');
      }
    } catch (error) {
      console.error('Error loading item:', error);
      router.push('/browse');
    } finally {
      setLoading(false);
    }
  };

  const checkFavoriteStatus = async () => {
    if (!user || !item) return;

    try {
      const response = await fetch(`/api/favorites/check/${item.id}`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        setIsFavorited(data.data.is_favorited);
      }
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const handleFavorite = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (!item) return;

    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ item_id: item.id }),
      });

      const data = await response.json();
      
      if (data.success) {
        setIsFavorited(!isFavorited);
        toast.success(isFavorited ? 'Removed from favorites' : 'Added to favorites');
      } else {
        toast.error(data.error || 'Failed to update favorites');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorites');
    }
  };

  const handleContactSeller = () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (!item) return;

    // Navigate to messages or create conversation
    router.push(`/messages?item=${item.id}&seller=${item.seller_id}`);
  };

  const handleShare = (platform: string) => {
    if (!item) return;

    const url = `${window.location.origin}/items/${item.id}`;
    const text = `Check out ${item.title} on MyBazaar! Only ${formatPrice(item.price)} CDF`;

    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`);
        break;
      case 'telegram':
        window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`);
        break;
      case 'instagram':
        toast.info('Please screenshot and share to Instagram Stories');
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
        toast.success('Link copied to clipboard!');
        break;
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const nextImage = () => {
    if (item?.images && item.images.length > 1) {
      setCurrentImageIndex((prev) => 
        prev === item.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (item?.images && item.images.length > 1) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? item.images.length - 1 : prev - 1
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-square bg-gray-200 rounded-2xl"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Item Not Found</h1>
            <p className="text-gray-600 mb-6">The item you're looking for doesn't exist or has been removed.</p>
            <button
              onClick={() => router.push('/browse')}
              className="btn-primary"
            >
              Browse Items
            </button>
          </div>
        </div>
      </div>
    );
  }

  const discountedPrice = item.discount_percentage > 0 
    ? item.price * (1 - item.discount_percentage / 100)
    : item.price;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-primary-600 transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Browse
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-white rounded-2xl shadow-soft overflow-hidden">
              {item.images && item.images.length > 0 ? (
                <>
                  <img
                    src={item.images[currentImageIndex]}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Navigation Arrows */}
                  {item.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-colors"
                      >
                        <ChevronRight className="w-5 h-5 text-gray-600" />
                      </button>
                    </>
                  )}

                  {/* Image Counter */}
                  {item.images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                      {currentImageIndex + 1} / {item.images.length}
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-400 text-lg">No Image Available</span>
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {item.images && item.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {item.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                      currentImageIndex === index 
                        ? 'border-primary-500' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${item.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Item Details */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">{item.title}</h1>
                  <div className="flex items-center space-x-4 text-gray-600">
                    <div className="flex items-center">
                      <Eye className="w-4 h-4 mr-1" />
                      <span>{item.view_count} views</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>Listed {formatDate(item.created_at)}</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleFavorite}
                  className={`p-3 rounded-xl transition-colors ${
                    isFavorited 
                      ? 'bg-red-100 text-red-600' 
                      : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600'
                  }`}
                >
                  <Heart className={`w-6 h-6 ${isFavorited ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Price */}
              <div className="flex items-center space-x-4 mb-4">
                <span className="text-4xl font-bold text-gray-800">
                  {formatPrice(discountedPrice)}
                </span>
                {item.discount_percentage > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-xl text-gray-500 line-through">
                      {formatPrice(item.price)}
                    </span>
                    <span className="bg-error text-white px-2 py-1 rounded-lg text-sm font-semibold">
                      -{item.discount_percentage}%
                    </span>
                  </div>
                )}
              </div>

              {/* Condition */}
              <div className="mb-4">
                <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  item.condition === 'New' ? 'bg-green-100 text-green-800' :
                  item.condition === 'Like New' ? 'bg-blue-100 text-blue-800' :
                  item.condition === 'Good' ? 'bg-yellow-100 text-yellow-800' :
                  item.condition === 'Fair' ? 'bg-orange-100 text-orange-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {item.condition} Condition
                </span>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-center text-gray-600">
              <MapPin className="w-5 h-5 mr-2" />
              <span>{item.location}</span>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Description</h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                {item.description}
              </p>
            </div>

            {/* Seller Info */}
            {item.seller && (
              <div className="bg-white rounded-xl shadow-soft p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Seller Information</h3>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-primary-600 font-semibold text-lg">
                      {item.seller.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{item.seller.name}</p>
                    {item.seller.university && (
                      <p className="text-gray-600">{item.seller.university}</p>
                    )}
                    <p className="text-sm text-gray-500">
                      Member since {formatDate(item.seller.created_at || '')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-4">
              <button
                onClick={handleContactSeller}
                disabled={!item.is_available}
                className="w-full bg-primary-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <MessageCircle className="w-5 h-5" />
                <span>{item.is_available ? 'Contact Seller' : 'Item Sold'}</span>
              </button>

              {/* Share Buttons */}
              <div className="flex items-center justify-center space-x-4">
                <span className="text-gray-600 font-medium">Share:</span>
                <button
                  onClick={() => handleShare('whatsapp')}
                  className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                  title="Share on WhatsApp"
                >
                  <ExternalLink className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleShare('telegram')}
                  className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                  title="Share on Telegram"
                >
                  <ExternalLink className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleShare('instagram')}
                  className="p-2 bg-pink-100 text-pink-600 rounded-lg hover:bg-pink-200 transition-colors"
                  title="Share on Instagram"
                >
                  <ExternalLink className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleShare('copy')}
                  className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                  title="Copy Link"
                >
                  {linkCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Items */}
        {similarItems.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-800 mb-8">Similar Items</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {similarItems.map((similarItem) => (
                <ItemCard
                  key={similarItem.id}
                  item={similarItem}
                  onFavorite={handleFavorite}
                  isFavorited={false} // Would need to check each item's favorite status
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}