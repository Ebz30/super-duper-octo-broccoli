import { supabaseAdmin } from './supabase'
import { ItemService } from './items'
import type { Favorite, Item } from './supabase'

export interface FavoritesResponse {
  favorites: (Favorite & { item: Item })[]
  total: number
  page: number
  pages: number
}

export class FavoriteService {
  // Add item to favorites
  static async addFavorite(userId: string, itemId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if item exists and is available
      const item = await ItemService.getItemById(itemId)
      if (!item) {
        return { success: false, error: 'Item not found' }
      }

      if (item.seller_id === userId) {
        return { success: false, error: 'Cannot favorite your own item' }
      }

      // Insert favorite (will fail if already exists due to unique constraint)
      const { error } = await supabaseAdmin
        .from('favorites')
        .insert({
          user_id: userId,
          item_id: itemId,
        })

      if (error) {
        // Check if it's a unique constraint violation (already favorited)
        if (error.code === '23505') {
          return { success: true } // Already favorited, treat as success
        }
        console.error('Add favorite error:', error)
        return { success: false, error: 'Failed to add favorite' }
      }

      // Track activity for recommendations
      await ItemService.trackUserActivity(userId, itemId, 'favorite')

      return { success: true }
    } catch (error) {
      console.error('Add favorite error:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  // Remove item from favorites
  static async removeFavorite(userId: string, itemId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabaseAdmin
        .from('favorites')
        .delete()
        .match({ user_id: userId, item_id: itemId })

      if (error) {
        console.error('Remove favorite error:', error)
        return { success: false, error: 'Failed to remove favorite' }
      }

      return { success: true }
    } catch (error) {
      console.error('Remove favorite error:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  // Get user's favorites with pagination
  static async getUserFavorites(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<FavoritesResponse> {
    try {
      const offset = (page - 1) * limit

      const { data: favorites, error, count } = await supabaseAdmin
        .from('favorites')
        .select(`
          id,
          created_at,
          item:items (
            id,
            title,
            price,
            discount_percentage,
            images,
            condition,
            location,
            is_available,
            view_count,
            created_at,
            seller:users (
              id,
              name,
              university
            ),
            category:categories (
              id,
              name,
              icon
            )
          )
        `, { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('Get favorites error:', error)
        return { favorites: [], total: 0, page, pages: 0 }
      }

      // Filter out favorites where item is null (deleted items)
      const validFavorites = (favorites || []).filter(fav => fav.item !== null)

      const total = count || 0
      const pages = Math.ceil(total / limit)

      return { favorites: validFavorites, total, page, pages }
    } catch (error) {
      console.error('Get favorites error:', error)
      return { favorites: [], total: 0, page, pages: 0 }
    }
  }

  // Check if item is favorited by user
  static async isFavorited(userId: string, itemId: string): Promise<boolean> {
    try {
      const { data, error } = await supabaseAdmin
        .from('favorites')
        .select('id')
        .match({ user_id: userId, item_id: itemId })
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Check favorite error:', error)
        return false
      }

      return !!data
    } catch (error) {
      console.error('Check favorite error:', error)
      return false
    }
  }

  // Get user's favorited item IDs (for UI state)
  static async getUserFavoriteIds(userId: string): Promise<string[]> {
    try {
      const { data: favorites, error } = await supabaseAdmin
        .from('favorites')
        .select('item_id')
        .eq('user_id', userId)

      if (error) {
        console.error('Get favorite IDs error:', error)
        return []
      }

      return (favorites || []).map(fav => fav.item_id)
    } catch (error) {
      console.error('Get favorite IDs error:', error)
      return []
    }
  }

  // Toggle favorite status
  static async toggleFavorite(userId: string, itemId: string): Promise<{
    success: boolean
    isFavorited: boolean
    error?: string
  }> {
    try {
      const isCurrentlyFavorited = await this.isFavorited(userId, itemId)

      if (isCurrentlyFavorited) {
        const result = await this.removeFavorite(userId, itemId)
        return {
          success: result.success,
          isFavorited: false,
          error: result.error,
        }
      } else {
        const result = await this.addFavorite(userId, itemId)
        return {
          success: result.success,
          isFavorited: true,
          error: result.error,
        }
      }
    } catch (error) {
      console.error('Toggle favorite error:', error)
      return {
        success: false,
        isFavorited: false,
        error: 'Internal server error',
      }
    }
  }

  // Get favorite count for an item (for analytics)
  static async getFavoriteCount(itemId: string): Promise<number> {
    try {
      const { count, error } = await supabaseAdmin
        .from('favorites')
        .select('*', { count: 'exact', head: true })
        .eq('item_id', itemId)

      if (error) {
        console.error('Get favorite count error:', error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error('Get favorite count error:', error)
      return 0
    }
  }

  // Get most favorited items (for trending/popular section)
  static async getMostFavoritedItems(limit: number = 12): Promise<Item[]> {
    try {
      const { data: favoriteCounts, error } = await supabaseAdmin
        .from('favorites')
        .select(`
          item_id,
          item:items (
            id,
            title,
            price,
            discount_percentage,
            images,
            condition,
            location,
            is_available,
            view_count,
            created_at,
            seller:users (
              id,
              name,
              university
            ),
            category:categories (
              id,
              name,
              icon
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit * 3) // Get more to account for duplicates and filtering

      if (error) {
        console.error('Get most favorited items error:', error)
        return []
      }

      // Count favorites per item and sort
      const itemCounts = new Map<string, { item: Item; count: number }>()
      
      favoriteCounts?.forEach(fav => {
        if (fav.item && fav.item.is_available) {
          const existing = itemCounts.get(fav.item_id)
          if (existing) {
            existing.count++
          } else {
            itemCounts.set(fav.item_id, { item: fav.item, count: 1 })
          }
        }
      })

      // Sort by favorite count and return top items
      return Array.from(itemCounts.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)
        .map(entry => entry.item)
    } catch (error) {
      console.error('Get most favorited items error:', error)
      return []
    }
  }
}