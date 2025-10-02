'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, MapPin, Eye } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatPrice, formatDate, calculateDiscountedPrice, getImageUrl } from '@/lib/utils'
import type { Item } from '@/lib/supabase'

interface ItemCardProps {
  item: Item
  onFavorite?: (itemId: string) => void
  isFavorited?: boolean
  showSellerInfo?: boolean
}

export default function ItemCard({ 
  item, 
  onFavorite, 
  isFavorited = false, 
  showSellerInfo = true 
}: ItemCardProps) {
  const discountedPrice = item.discount_percentage > 0 
    ? calculateDiscountedPrice(item.price, item.discount_percentage)
    : item.price

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onFavorite?.(item.id)
  }

  return (
    <Card hover className="group relative overflow-hidden">
      <Link href={`/items/${item.id}`}>
        {/* Image */}
        <div className="relative aspect-square overflow-hidden rounded-lg mb-4">
          <Image
            src={getImageUrl(item.images[0])}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          
          {/* Favorite button */}
          {onFavorite && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 p-2 bg-white/80 hover:bg-white"
              onClick={handleFavoriteClick}
            >
              <Heart
                className={`h-4 w-4 ${
                  isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-600'
                }`}
              />
            </Button>
          )}

          {/* Discount badge */}
          {item.discount_percentage > 0 && (
            <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-medium">
              -{item.discount_percentage}%
            </div>
          )}

          {/* Condition badge */}
          <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded-md text-xs">
            {item.condition}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors">
            {item.title}
          </h3>

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-primary-600">
              {formatPrice(discountedPrice)}
            </span>
            {item.discount_percentage > 0 && (
              <span className="text-sm text-gray-500 line-through">
                {formatPrice(item.price)}
              </span>
            )}
          </div>

          {/* Location */}
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <MapPin className="h-4 w-4" />
            <span>{item.location}</span>
          </div>

          {/* Seller info */}
          {showSellerInfo && item.seller && (
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>by {item.seller.name}</span>
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>{item.view_count}</span>
              </div>
            </div>
          )}

          {/* Date */}
          <div className="text-xs text-gray-400">
            {formatDate(item.created_at)}
          </div>
        </div>
      </Link>
    </Card>
  )
}