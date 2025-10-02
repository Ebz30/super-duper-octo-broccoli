'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Item, Category } from '@/lib/supabase'

interface FilterState {
  categories: number[]
  minPrice: number | null
  maxPrice: number | null
  conditions: string[]
  location: string
}

interface UseItemSearchProps {
  initialSearch?: string
  initialFilters?: Partial<FilterState>
  initialSort?: string
}

interface SearchState {
  items: Item[]
  loading: boolean
  error: string | null
  total: number
  page: number
  pages: number
  hasMore: boolean
}

export function useItemSearch({
  initialSearch = '',
  initialFilters = {},
  initialSort = 'newest'
}: UseItemSearchProps = {}) {
  const [search, setSearch] = useState(initialSearch)
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    minPrice: null,
    maxPrice: null,
    conditions: [],
    location: '',
    ...initialFilters,
  })
  const [sort, setSort] = useState(initialSort)
  const [searchState, setSearchState] = useState<SearchState>({
    items: [],
    loading: false,
    error: null,
    total: 0,
    page: 1,
    pages: 0,
    hasMore: false,
  })
  const [categories, setCategories] = useState<Category[]>([])

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories')
        const data = await response.json()
        if (data.categories) {
          setCategories(data.categories)
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      }
    }

    fetchCategories()
  }, [])

  // Search function
  const performSearch = useCallback(async (
    searchQuery: string,
    searchFilters: FilterState,
    searchSort: string,
    page: number = 1,
    append: boolean = false
  ) => {
    setSearchState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const params = new URLSearchParams()
      
      if (searchQuery) params.append('search', searchQuery)
      if (searchFilters.categories.length > 0) {
        params.append('category', searchFilters.categories.join(','))
      }
      if (searchFilters.minPrice !== null) {
        params.append('min_price', searchFilters.minPrice.toString())
      }
      if (searchFilters.maxPrice !== null) {
        params.append('max_price', searchFilters.maxPrice.toString())
      }
      if (searchFilters.conditions.length > 0) {
        params.append('condition', searchFilters.conditions.join(','))
      }
      if (searchFilters.location) {
        params.append('location', searchFilters.location)
      }
      
      params.append('sort', searchSort)
      params.append('page', page.toString())
      params.append('limit', '20')

      const response = await fetch(`/api/items?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Search failed')
      }

      setSearchState(prev => ({
        ...prev,
        items: append ? [...prev.items, ...data.items] : data.items,
        loading: false,
        total: data.total,
        page: data.page,
        pages: data.pages,
        hasMore: data.page < data.pages,
      }))
    } catch (error) {
      setSearchState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Search failed',
      }))
    }
  }, [])

  // Effect to trigger search when parameters change
  useEffect(() => {
    performSearch(search, filters, sort, 1, false)
  }, [search, filters, sort, performSearch])

  // Load more function for pagination
  const loadMore = useCallback(() => {
    if (!searchState.loading && searchState.hasMore) {
      performSearch(search, filters, sort, searchState.page + 1, true)
    }
  }, [search, filters, sort, searchState.loading, searchState.hasMore, searchState.page, performSearch])

  // Reset search
  const resetSearch = useCallback(() => {
    setSearch('')
    setFilters({
      categories: [],
      minPrice: null,
      maxPrice: null,
      conditions: [],
      location: '',
    })
    setSort('newest')
  }, [])

  return {
    // Search parameters
    search,
    setSearch,
    filters,
    setFilters,
    sort,
    setSort,
    
    // Search results
    items: searchState.items,
    loading: searchState.loading,
    error: searchState.error,
    total: searchState.total,
    page: searchState.page,
    pages: searchState.pages,
    hasMore: searchState.hasMore,
    
    // Categories for filters
    categories,
    
    // Actions
    loadMore,
    resetSearch,
    refresh: () => performSearch(search, filters, sort, 1, false),
  }
}