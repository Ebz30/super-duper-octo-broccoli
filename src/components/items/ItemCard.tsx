'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Eye, MapPin, Calendar } from 'lucide-react';
import { Item } from '@/lib/types';

interface ItemCardProps {
  item: Item;
  onFavorite?: (itemId: string) => void;
  isFavorited?: boolean;
}

export default function ItemCard({ item, onFavorite, isFavorited }: ItemCardProps) {
  const discountedPrice = item.discount_percentage > 0 
    ? item.price * (1 - item.discount_percentage / 100)
    : item.price;

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
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-soft hover:shadow-medium transition-shadow duration-200 overflow-hidden group">
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden">
        {item.images && item.images.length > 0 ? (
          <Image
            src={item.images[0]}
            alt={item.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <span className="text-gray-400 text-sm">No Image</span>
          </div>
        )}
        
        {/* Discount Badge */}
        {item.discount_percentage > 0 && (
          <div className="absolute top-3 left-3 bg-error text-white px-2 py-1 rounded-lg text-sm font-semibold">
            -{item.discount_percentage}%
          </div>
        )}

        {/* Favorite Button */}
        <button
          onClick={() => onFavorite?.(item.id)}
          className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
        >
          <Heart 
            className={`w-5 h-5 ${
              isFavorited 
                ? 'text-error fill-current' 
                : 'text-gray-600 hover:text-error'
            }`} 
          />
        </button>

        {/* Availability Badge */}
        {!item.is_available && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white text-gray-800 px-4 py-2 rounded-lg font-semibold">
              Sold
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <Link href={`/items/${item.id}`}>
          <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 hover:text-primary-600 transition-colors">
            {item.title}
          </h3>
        </Link>

        {/* Price */}
        <div className="flex items-center space-x-2 mb-3">
          <span className="text-xl font-bold text-gray-800">
            {formatPrice(discountedPrice)}
          </span>
          {item.discount_percentage > 0 && (
            <span className="text-sm text-gray-500 line-through">
              {formatPrice(item.price)}
            </span>
          )}
        </div>

        {/* Condition */}
        <div className="flex items-center justify-between mb-3">
          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
            item.condition === 'New' ? 'bg-green-100 text-green-800' :
            item.condition === 'Like New' ? 'bg-blue-100 text-blue-800' :
            item.condition === 'Good' ? 'bg-yellow-100 text-yellow-800' :
            item.condition === 'Fair' ? 'bg-orange-100 text-orange-800' :
            'bg-red-100 text-red-800'
          }`}>
            {item.condition}
          </span>
          
          {/* View Count */}
          <div className="flex items-center text-gray-500 text-sm">
            <Eye className="w-4 h-4 mr-1" />
            {item.view_count}
          </div>
        </div>

        {/* Location and Date */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center">
            <MapPin className="w-4 h-4 mr-1" />
            <span className="truncate">{item.location}</span>
          </div>
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            <span>{formatDate(item.created_at)}</span>
          </div>
        </div>

        {/* Seller Info */}
        {item.seller && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-primary-600 font-semibold text-sm">
                  {item.seller.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">{item.seller.name}</p>
                {item.seller.university && (
                  <p className="text-xs text-gray-500">{item.seller.university}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}