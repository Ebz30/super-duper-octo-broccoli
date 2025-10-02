'use client'

import { useState, useEffect, useCallback } from 'react'

export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Load user's favorite IDs on mount
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const response = await fetch('/api/favorites')
        if (response.ok) {
          const data = await response.json()
          const ids = data.favorites?.map((fav: any) => fav.item.id) || []
          setFavoriteIds(ids)
        }
      } catch (error) {
        console.error('Failed to load favorites:', error)
      } finally {
        setLoading(false)
      }
    }

    loadFavorites()
  }, [])

  // Toggle favorite status
  const toggleFavorite = useCallback(async (itemId: string) => {
    const isCurrentlyFavorited = favoriteIds.includes(itemId)
    
    // Optimistic update
    setFavoriteIds(prev => 
      isCurrentlyFavorited 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )

    try {
      const response = await fetch(`/api/favorites/${itemId}`, {
        method: 'POST',
      })

      if (!response.ok) {
        // Revert optimistic update on error
        setFavoriteIds(prev => 
          isCurrentlyFavorited 
            ? [...prev, itemId]
            : prev.filter(id => id !== itemId)
        )
        
        const data = await response.json()
        throw new Error(data.error || 'Failed to toggle favorite')
      }

      const data = await response.json()
      
      // Update with server response (in case of discrepancy)
      setFavoriteIds(prev => 
        data.isFavorited 
          ? prev.includes(itemId) ? prev : [...prev, itemId]
          : prev.filter(id => id !== itemId)
      )
    } catch (error) {
      console.error('Toggle favorite error:', error)
      // Error is already handled by optimistic update revert above
    }
  }, [favoriteIds])

  // Check if item is favorited
  const isFavorited = useCallback((itemId: string) => {
    return favoriteIds.includes(itemId)
  }, [favoriteIds])

  return {
    favoriteIds,
    loading,
    toggleFavorite,
    isFavorited,
  }
}