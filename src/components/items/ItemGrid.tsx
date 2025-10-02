'use client'

import React from 'react'
import ItemCard from './ItemCard'
import type { Item } from '@/lib/supabase'

interface ItemGridProps {
  items: Item[]
  loading?: boolean
  onFavorite?: (itemId: string) => void
  favoriteIds?: string[]
  showSellerInfo?: boolean
}

export default function ItemGrid({ 
  items, 
  loading = false, 
  onFavorite, 
  favoriteIds = [],
  showSellerInfo = true 
}: ItemGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-200 aspect-square rounded-lg mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📦</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No items found</h3>
        <p className="text-gray-600">Try adjusting your search or filters</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {items.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          onFavorite={onFavorite}
          isFavorited={favoriteIds.includes(item.id)}
          showSellerInfo={showSellerInfo}
        />
      ))}
    </div>
  )
}