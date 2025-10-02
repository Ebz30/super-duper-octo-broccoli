import { supabaseAdmin } from './supabase'
import { validateContent } from './profanity'
import type { Item, Category } from './supabase'

export interface CreateItemData {
  title: string
  description: string
  category_id: number
  price: number
  discount_percentage?: number
  condition: 'New' | 'Like New' | 'Good' | 'Fair' | 'Poor'
  location: string
  images: string[]
}

export interface UpdateItemData extends Partial<CreateItemData> {
  is_available?: boolean
}

export interface ItemFilters {
  category?: number[]
  min_price?: number
  max_price?: number
  condition?: string[]
  location?: string
  search?: string
  is_available?: boolean
}

export interface ItemsResponse {
  items: Item[]
  total: number
  page: number
  pages: number
}

export class ItemService {
  // Create new item
  static async createItem(sellerId: string, data: CreateItemData): Promise<{ success: boolean; item?: Item; error?: string }> {
    try {
      // Validate content
      const contentValidation = validateContent({
        title: data.title,
        description: data.description,
      })

      if (!contentValidation.isValid) {
        return { success: false, error: contentValidation.errors[0] }
      }

      // Validate required fields
      if (!data.title || data.title.trim().length < 3) {
        return { success: false, error: 'Title must be at least 3 characters' }
      }

      if (!data.description || data.description.trim().length < 20) {
        return { success: false, error: 'Description must be at least 20 characters' }
      }

      if (data.price <= 0 || data.price > 999999.99) {
        return { success: false, error: 'Price must be between 0.01 and 999,999.99' }
      }

      if (!data.location || data.location.trim().length === 0) {
        return { success: false, error: 'Location is required' }
      }

      if (!data.images || data.images.length === 0) {
        return { success: false, error: 'At least one image is required' }
      }

      // Create item
      const { data: item, error } = await supabaseAdmin
        .from('items')
        .insert({
          seller_id: sellerId,
          title: data.title.trim(),
          description: data.description.trim(),
          category_id: data.category_id,
          price: data.price,
          discount_percentage: data.discount_percentage || 0,
          condition: data.condition,
          location: data.location.trim(),
          images: data.images,
        })
        .select(`
          *,
          seller:users(id, name, university),
          category:categories(id, name, icon)
        `)
        .single()

      if (error) {
        console.error('Create item error:', error)
        return { success: false, error: 'Failed to create item' }
      }

      return { success: true, item }
    } catch (error) {
      console.error('Create item error:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  // Get items with filters and pagination
  static async getItems(
    filters: ItemFilters = {},
    page: number = 1,
    limit: number = 20,
    sort: string = 'newest'
  ): Promise<ItemsResponse> {
    try {
      let query = supabaseAdmin
        .from('items')
        .select(`
          *,
          seller:users(id, name, university),
          category:categories(id, name, icon)
        `, { count: 'exact' })
        .eq('is_deleted', false)

      // Apply filters
      if (filters.is_available !== undefined) {
        query = query.eq('is_available', filters.is_available)
      } else {
        query = query.eq('is_available', true) // Default to available items
      }

      if (filters.category && filters.category.length > 0) {
        query = query.in('category_id', filters.category)
      }

      if (filters.min_price !== undefined) {
        query = query.gte('price', filters.min_price)
      }

      if (filters.max_price !== undefined) {
        query = query.lte('price', filters.max_price)
      }

      if (filters.condition && filters.condition.length > 0) {
        query = query.in('condition', filters.condition)
      }

      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`)
      }

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      // Apply sorting
      switch (sort) {
        case 'price_asc':
          query = query.order('price', { ascending: true })
          break
        case 'price_desc':
          query = query.order('price', { ascending: false })
          break
        case 'popular':
          query = query.order('view_count', { ascending: false })
          break
        case 'newest':
        default:
          query = query.order('created_at', { ascending: false })
          break
      }

      // Apply pagination
      const offset = (page - 1) * limit
      query = query.range(offset, offset + limit - 1)

      const { data: items, error, count } = await query

      if (error) {
        console.error('Get items error:', error)
        return { items: [], total: 0, page, pages: 0 }
      }

      const total = count || 0
      const pages = Math.ceil(total / limit)

      return { items: items || [], total, page, pages }
    } catch (error) {
      console.error('Get items error:', error)
      return { items: [], total: 0, page, pages: 0 }
    }
  }

  // Get single item by ID
  static async getItemById(itemId: string, viewerId?: string): Promise<Item | null> {
    try {
      const { data: item, error } = await supabaseAdmin
        .from('items')
        .select(`
          *,
          seller:users(id, name, university, created_at),
          category:categories(id, name, icon)
        `)
        .eq('id', itemId)
        .eq('is_deleted', false)
        .single()

      if (error || !item) {
        return null
      }

      // Increment view count (but not for the seller)
      if (viewerId && viewerId !== item.seller_id) {
        await supabaseAdmin
          .from('items')
          .update({ view_count: item.view_count + 1 })
          .eq('id', itemId)

        // Track user activity for recommendations
        await this.trackUserActivity(viewerId, itemId, 'view')
      }

      return item
    } catch (error) {
      console.error('Get item error:', error)
      return null
    }
  }

  // Update item
  static async updateItem(
    itemId: string,
    sellerId: string,
    data: UpdateItemData
  ): Promise<{ success: boolean; item?: Item; error?: string }> {
    try {
      // Validate content if provided
      if (data.title || data.description) {
        const contentValidation = validateContent({
          title: data.title,
          description: data.description,
        })

        if (!contentValidation.isValid) {
          return { success: false, error: contentValidation.errors[0] }
        }
      }

      // Validate fields
      if (data.title && data.title.trim().length < 3) {
        return { success: false, error: 'Title must be at least 3 characters' }
      }

      if (data.description && data.description.trim().length < 20) {
        return { success: false, error: 'Description must be at least 20 characters' }
      }

      if (data.price !== undefined && (data.price <= 0 || data.price > 999999.99)) {
        return { success: false, error: 'Price must be between 0.01 and 999,999.99' }
      }

      // Update item
      const { data: item, error } = await supabaseAdmin
        .from('items')
        .update(data)
        .eq('id', itemId)
        .eq('seller_id', sellerId)
        .select(`
          *,
          seller:users(id, name, university),
          category:categories(id, name, icon)
        `)
        .single()

      if (error) {
        console.error('Update item error:', error)
        return { success: false, error: 'Failed to update item' }
      }

      return { success: true, item }
    } catch (error) {
      console.error('Update item error:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  // Delete item (soft delete)
  static async deleteItem(itemId: string, sellerId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabaseAdmin
        .from('items')
        .update({ is_deleted: true, is_available: false })
        .eq('id', itemId)
        .eq('seller_id', sellerId)

      if (error) {
        console.error('Delete item error:', error)
        return { success: false, error: 'Failed to delete item' }
      }

      return { success: true }
    } catch (error) {
      console.error('Delete item error:', error)
      return { success: false, error: 'Internal server error' }
    }
  }

  // Get categories
  static async getCategories(): Promise<Category[]> {
    try {
      const { data: categories, error } = await supabaseAdmin
        .from('categories')
        .select('*')
        .order('name')

      if (error) {
        console.error('Get categories error:', error)
        return []
      }

      return categories || []
    } catch (error) {
      console.error('Get categories error:', error)
      return []
    }
  }

  // Get user's items
  static async getUserItems(userId: string, page: number = 1, limit: number = 20): Promise<ItemsResponse> {
    try {
      const offset = (page - 1) * limit

      const { data: items, error, count } = await supabaseAdmin
        .from('items')
        .select(`
          *,
          category:categories(id, name, icon)
        `, { count: 'exact' })
        .eq('seller_id', userId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('Get user items error:', error)
        return { items: [], total: 0, page, pages: 0 }
      }

      const total = count || 0
      const pages = Math.ceil(total / limit)

      return { items: items || [], total, page, pages }
    } catch (error) {
      console.error('Get user items error:', error)
      return { items: [], total: 0, page, pages: 0 }
    }
  }

  // Track user activity for recommendations
  static async trackUserActivity(
    userId: string,
    itemId: string,
    activityType: 'view' | 'favorite' | 'contact' | 'search' | 'filter',
    metadata?: any
  ): Promise<void> {
    try {
      await supabaseAdmin
        .from('user_activities')
        .insert({
          user_id: userId,
          item_id: itemId,
          activity_type: activityType,
          metadata,
        })
    } catch (error) {
      console.error('Track activity error:', error)
    }
  }

  // Get similar items (for recommendations)
  static async getSimilarItems(itemId: string, limit: number = 6): Promise<Item[]> {
    try {
      // First get the current item to find similar ones
      const { data: currentItem } = await supabaseAdmin
        .from('items')
        .select('category_id, price')
        .eq('id', itemId)
        .single()

      if (!currentItem) return []

      const { data: items, error } = await supabaseAdmin
        .from('items')
        .select(`
          *,
          seller:users(id, name),
          category:categories(id, name, icon)
        `)
        .eq('category_id', currentItem.category_id)
        .eq('is_available', true)
        .eq('is_deleted', false)
        .neq('id', itemId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Get similar items error:', error)
        return []
      }

      return items || []
    } catch (error) {
      console.error('Get similar items error:', error)
      return []
    }
  }
}