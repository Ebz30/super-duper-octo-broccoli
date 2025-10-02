import { supabaseAdmin } from './supabase'
import type { Item } from './supabase'

interface UserPreferences {
  categoryWeights: Record<number, number>
  priceRangeLow: number
  priceRangeHigh: number
  preferredConditions: string[]
  avgInteractionPrice: number
}

export class RecommendationService {
  // Calculate user preferences based on activity history
  static async calculateUserPreferences(userId: string): Promise<UserPreferences> {
    try {
      // Get last 100 user activities (within last 30 days for relevance)
      const { data: activities, error } = await supabaseAdmin
        .from('user_activities')
        .select(`
          activity_type,
          created_at,
          item:items (
            id,
            category_id,
            price,
            condition
          )
        `)
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(100)

      if (error || !activities) {
        // Return default preferences for new users
        return {
          categoryWeights: {},
          priceRangeLow: 0,
          priceRangeHigh: 1000,
          preferredConditions: ['New', 'Like New', 'Good'],
          avgInteractionPrice: 100,
        }
      }

      // Calculate category weights based on interaction types
      const categoryWeights: Record<number, number> = {}
      const prices: number[] = []
      const conditionCounts: Record<string, number> = {}

      activities.forEach(activity => {
        if (!activity.item) return

        const item = activity.item as any
        const weight = this.getActivityWeight(activity.activity_type)
        
        // Category preferences
        if (item.category_id) {
          categoryWeights[item.category_id] = (categoryWeights[item.category_id] || 0) + weight
        }

        // Price preferences
        if (item.price) {
          prices.push(item.price)
        }

        // Condition preferences
        if (item.condition) {
          conditionCounts[item.condition] = (conditionCounts[item.condition] || 0) + weight
        }
      })

      // Calculate price range (25th to 75th percentile)
      prices.sort((a, b) => a - b)
      const priceRangeLow = prices.length > 0 ? prices[Math.floor(prices.length * 0.25)] || 0 : 0
      const priceRangeHigh = prices.length > 0 ? prices[Math.floor(prices.length * 0.75)] || 1000 : 1000
      const avgInteractionPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 100

      // Get top 3 preferred conditions
      const preferredConditions = Object.entries(conditionCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([condition]) => condition)

      return {
        categoryWeights,
        priceRangeLow: Math.max(0, priceRangeLow),
        priceRangeHigh: Math.min(999999, priceRangeHigh),
        preferredConditions: preferredConditions.length > 0 ? preferredConditions : ['New', 'Like New', 'Good'],
        avgInteractionPrice,
      }
    } catch (error) {
      console.error('Calculate preferences error:', error)
      return {
        categoryWeights: {},
        priceRangeLow: 0,
        priceRangeHigh: 1000,
        preferredConditions: ['New', 'Like New', 'Good'],
        avgInteractionPrice: 100,
      }
    }
  }

  // Get activity weight for recommendation scoring
  private static getActivityWeight(activityType: string): number {
    const weights = {
      'view': 1,
      'favorite': 3,
      'contact': 5,
      'search': 2,
      'filter': 1,
    }
    return weights[activityType as keyof typeof weights] || 1
  }

  // Generate personalized recommendations for user
  static async generateRecommendations(userId: string, limit: number = 12): Promise<Item[]> {
    try {
      const preferences = await this.calculateUserPreferences(userId)
      
      // Get user's viewed and favorited items to exclude
      const [viewedItems, favoritedItems] = await Promise.all([
        this.getUserViewedItems(userId),
        this.getUserFavoritedItems(userId),
      ])

      const excludeIds = [...new Set([...viewedItems, ...favoritedItems])]

      // Get top categories by weight
      const topCategories = Object.entries(preferences.categoryWeights)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([categoryId]) => Number(categoryId))

      // Build recommendation query
      let query = supabaseAdmin
        .from('items')
        .select(`
          *,
          seller:users(id, name, university),
          category:categories(id, name, icon)
        `)
        .eq('is_available', true)
        .eq('is_deleted', false)
        .neq('seller_id', userId)

      // Exclude already seen items
      if (excludeIds.length > 0) {
        query = query.not('id', 'in', `(${excludeIds.join(',')})`)
      }

      // Get more items than needed for scoring
      query = query.limit(limit * 3)

      const { data: items, error } = await query

      if (error || !items) {
        console.error('Get recommendations error:', error)
        return this.getFallbackRecommendations(userId, limit)
      }

      // Score and sort items
      const scoredItems = items.map(item => ({
        ...item,
        score: this.calculateItemScore(item, preferences, topCategories),
      }))

      // Sort by score and return top items
      return scoredItems
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(({ score, ...item }) => item)
    } catch (error) {
      console.error('Generate recommendations error:', error)
      return this.getFallbackRecommendations(userId, limit)
    }
  }

  // Calculate recommendation score for an item
  private static calculateItemScore(
    item: any,
    preferences: UserPreferences,
    topCategories: number[]
  ): number {
    let score = 0

    // Category score (highest weight)
    if (topCategories.includes(item.category_id)) {
      const categoryWeight = preferences.categoryWeights[item.category_id] || 0
      score += Math.min(categoryWeight * 10, 100) // Cap at 100 points
    } else if (preferences.categoryWeights[item.category_id]) {
      score += preferences.categoryWeights[item.category_id] * 5
    }

    // Price score
    const { priceRangeLow, priceRangeHigh, avgInteractionPrice } = preferences
    if (item.price >= priceRangeLow && item.price <= priceRangeHigh) {
      score += 50 // In preferred price range
    } else {
      // Penalty for being outside range, but less penalty if closer to avg
      const distanceFromAvg = Math.abs(item.price - avgInteractionPrice)
      const maxDistance = Math.max(avgInteractionPrice, 1000 - avgInteractionPrice)
      const proximityScore = Math.max(0, 25 - (distanceFromAvg / maxDistance) * 25)
      score += proximityScore
    }

    // Condition score
    if (preferences.preferredConditions.includes(item.condition)) {
      const conditionIndex = preferences.preferredConditions.indexOf(item.condition)
      score += Math.max(20 - conditionIndex * 5, 5) // First choice gets 20, second gets 15, etc.
    }

    // Popularity score (view count)
    score += Math.min(item.view_count * 0.1, 10) // Cap at 10 points

    // Recency score (newer items get slight boost)
    const daysSinceCreated = (Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceCreated <= 7) {
      score += 5 // Boost for items created in last week
    }

    // Discount score
    if (item.discount_percentage > 0) {
      score += Math.min(item.discount_percentage * 0.2, 10) // Up to 10 points for discounts
    }

    return score
  }

  // Get fallback recommendations (popular/recent items) for new users or errors
  static async getFallbackRecommendations(userId: string, limit: number = 12): Promise<Item[]> {
    try {
      const { data: items, error } = await supabaseAdmin
        .from('items')
        .select(`
          *,
          seller:users(id, name, university),
          category:categories(id, name, icon)
        `)
        .eq('is_available', true)
        .eq('is_deleted', false)
        .neq('seller_id', userId)
        .order('view_count', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Fallback recommendations error:', error)
        return []
      }

      return items || []
    } catch (error) {
      console.error('Fallback recommendations error:', error)
      return []
    }
  }

  // Get user's viewed item IDs
  private static async getUserViewedItems(userId: string): Promise<string[]> {
    try {
      const { data: activities, error } = await supabaseAdmin
        .from('user_activities')
        .select('item_id')
        .eq('user_id', userId)
        .eq('activity_type', 'view')
        .limit(100)

      if (error) return []
      return (activities || []).map(a => a.item_id)
    } catch (error) {
      return []
    }
  }

  // Get user's favorited item IDs
  private static async getUserFavoritedItems(userId: string): Promise<string[]> {
    try {
      const { data: favorites, error } = await supabaseAdmin
        .from('favorites')
        .select('item_id')
        .eq('user_id', userId)

      if (error) return []
      return (favorites || []).map(f => f.item_id)
    } catch (error) {
      return []
    }
  }

  // Get trending items (most favorited/viewed recently)
  static async getTrendingItems(limit: number = 12): Promise<Item[]> {
    try {
      // Get items with most activity in the last 7 days
      const { data: activities, error } = await supabaseAdmin
        .from('user_activities')
        .select(`
          item_id,
          activity_type,
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
            seller:users (id, name, university),
            category:categories (id, name, icon)
          )
        `)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })

      if (error || !activities) {
        // Fallback to most viewed items
        return this.getMostViewedItems(limit)
      }

      // Count activity per item with weights
      const itemScores = new Map<string, { item: any; score: number }>()

      activities.forEach(activity => {
        if (!activity.item || !activity.item.is_available) return

        const weight = this.getActivityWeight(activity.activity_type)
        const existing = itemScores.get(activity.item_id)
        
        if (existing) {
          existing.score += weight
        } else {
          itemScores.set(activity.item_id, {
            item: activity.item,
            score: weight,
          })
        }
      })

      // Sort by score and return top items
      return Array.from(itemScores.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(entry => entry.item)
    } catch (error) {
      console.error('Get trending items error:', error)
      return this.getMostViewedItems(limit)
    }
  }

  // Get most viewed items (fallback for trending)
  private static async getMostViewedItems(limit: number = 12): Promise<Item[]> {
    try {
      const { data: items, error } = await supabaseAdmin
        .from('items')
        .select(`
          *,
          seller:users(id, name, university),
          category:categories(id, name, icon)
        `)
        .eq('is_available', true)
        .eq('is_deleted', false)
        .order('view_count', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Get most viewed items error:', error)
        return []
      }

      return items || []
    } catch (error) {
      console.error('Get most viewed items error:', error)
      return []
    }
  }
}