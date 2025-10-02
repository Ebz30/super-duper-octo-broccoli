// AI-powered recommendation engine for MyBazaar

import { supabaseAdmin } from './supabase';
import { UserPreferences, RecommendationItem } from './types';

// Calculate user preferences based on activity
export async function calculateUserPreferences(userId: string): Promise<UserPreferences> {
  try {
    // Get last 100 user activities
    const { data: activities } = await supabaseAdmin
      .from('user_activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!activities || activities.length === 0) {
      return {
        categoryWeights: {},
        priceRangeLow: 0,
        priceRangeHigh: 100000,
        preferredConditions: [],
      };
    }

    // Calculate category weights
    const categoryWeights: Record<string, number> = {};
    activities.forEach(activity => {
      const weight = {
        'view': 1,
        'favorite': 3,
        'contact': 5,
        'search': 2,
        'filter': 1,
      }[activity.activity_type] || 1;

      if (activity.category_id) {
        categoryWeights[activity.category_id] = 
          (categoryWeights[activity.category_id] || 0) + weight;
      }
    });

    // Calculate price range preference (25th to 75th percentile)
    const prices = activities
      .filter(a => a.item_price)
      .map(a => a.item_price!)
      .sort((a, b) => a - b);

    let priceRangeLow = 0;
    let priceRangeHigh = 100000;

    if (prices.length > 0) {
      priceRangeLow = prices[Math.floor(prices.length * 0.25)] || 0;
      priceRangeHigh = prices[Math.floor(prices.length * 0.75)] || 100000;
    }

    // Preferred conditions (most interacted with)
    const conditionCounts: Record<string, number> = {};
    activities.forEach(a => {
      if (a.condition) {
        conditionCounts[a.condition] = (conditionCounts[a.condition] || 0) + 1;
      }
    });

    const preferredConditions = Object.keys(conditionCounts)
      .sort((a, b) => conditionCounts[b] - conditionCounts[a])
      .slice(0, 3);

    return {
      categoryWeights,
      priceRangeLow,
      priceRangeHigh,
      preferredConditions,
    };
  } catch (error) {
    console.error('Error calculating user preferences:', error);
    return {
      categoryWeights: {},
      priceRangeLow: 0,
      priceRangeHigh: 100000,
      preferredConditions: [],
    };
  }
}

// Generate recommendations for a user
export async function generateRecommendations(
  userId: string, 
  limit: number = 12
): Promise<RecommendationItem[]> {
  try {
    const preferences = await calculateUserPreferences(userId);

    // Get user's favorites and viewed items to exclude
    const { data: favorites } = await supabaseAdmin
      .from('favorites')
      .select('item_id')
      .eq('user_id', userId);

    const { data: viewedItems } = await supabaseAdmin
      .from('user_activities')
      .select('item_id')
      .eq('user_id', userId)
      .eq('activity_type', 'view');

    const excludeIds = [
      ...(favorites?.map(f => f.item_id) || []),
      ...(viewedItems?.map(v => v.item_id) || []),
    ];

    // Get top categories by weight
    const topCategories = Object.entries(preferences.categoryWeights)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([categoryId]) => parseInt(categoryId));

    // Build recommendation query
    let query = supabaseAdmin
      .from('items')
      .select(`
        *,
        seller:users(id, name, university),
        category:categories(id, name, icon)
      `)
      .eq('is_available', true)
      .eq('deleted_at', null)
      .neq('seller_id', userId);

    // Exclude already interacted items
    if (excludeIds.length > 0) {
      query = query.not('id', 'in', `(${excludeIds.join(',')})`);
    }

    // Apply category preference
    if (topCategories.length > 0) {
      query = query.in('category_id', topCategories);
    }

    // Apply price range
    if (preferences.priceRangeLow > 0) {
      query = query.gte('price', preferences.priceRangeLow);
    }
    if (preferences.priceRangeHigh < 100000) {
      query = query.lte('price', preferences.priceRangeHigh);
    }

    // Apply condition preference
    if (preferences.preferredConditions.length > 0) {
      query = query.in('condition', preferences.preferredConditions);
    }

    const { data: recommendations, error } = await query
      .order('view_count', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    // Calculate recommendation scores
    const scoredRecommendations = recommendations?.map(item => {
      let score = 0;
      let reason = '';

      // Category score
      if (topCategories.includes(item.category_id)) {
        const categoryIndex = topCategories.indexOf(item.category_id);
        score += (3 - categoryIndex) * 20; // Higher score for top categories
        reason += `Popular in ${item.category?.name}`;
      }

      // Price score
      if (item.price >= preferences.priceRangeLow && item.price <= preferences.priceRangeHigh) {
        score += 15;
        reason += reason ? ', Good price range' : 'Good price range';
      }

      // Condition score
      if (preferences.preferredConditions.includes(item.condition)) {
        score += 10;
        reason += reason ? ', Preferred condition' : 'Preferred condition';
      }

      // View count score
      score += Math.min(item.view_count * 0.1, 10);

      // Recency score
      const daysSinceCreated = (Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24);
      score += Math.max(0, 10 - daysSinceCreated * 0.5);

      return {
        ...item,
        score: Math.round(score),
        reason: reason || 'Recommended for you',
      };
    }) || [];

    // Sort by score
    return scoredRecommendations.sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return [];
  }
}

// Track user activity for recommendations
export async function trackActivity(
  userId: string,
  activityType: 'view' | 'favorite' | 'contact' | 'search' | 'filter',
  itemId?: string,
  additionalData?: {
    category_id?: number;
    item_price?: number;
    condition?: string;
    search_query?: string;
    filter_params?: any;
  }
): Promise<void> {
  try {
    await supabaseAdmin
      .from('user_activities')
      .insert({
        user_id: userId,
        activity_type: activityType,
        item_id: itemId,
        category_id: additionalData?.category_id,
        item_price: additionalData?.item_price,
        condition: additionalData?.condition,
        search_query: additionalData?.search_query,
        filter_params: additionalData?.filter_params,
      });
  } catch (error) {
    console.error('Error tracking activity:', error);
  }
}

// Get trending items (most viewed in last 7 days)
export async function getTrendingItems(limit: number = 8): Promise<any[]> {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: trendingItems, error } = await supabaseAdmin
      .from('items')
      .select(`
        *,
        seller:users(id, name, university),
        category:categories(id, name, icon)
      `)
      .eq('is_available', true)
      .eq('deleted_at', null)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('view_count', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return trendingItems || [];
  } catch (error) {
    console.error('Error getting trending items:', error);
    return [];
  }
}

// Get popular categories (most items in each category)
export async function getPopularCategories(limit: number = 6): Promise<any[]> {
  try {
    const { data: categories, error } = await supabaseAdmin
      .from('categories')
      .select(`
        *,
        items!inner(count)
      `)
      .eq('items.is_available', true)
      .eq('items.deleted_at', null)
      .order('items.count', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return categories || [];
  } catch (error) {
    console.error('Error getting popular categories:', error);
    return [];
  }
}