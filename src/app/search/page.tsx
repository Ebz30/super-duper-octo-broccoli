'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Filter } from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import SearchBar from '@/components/search/SearchBar'
import FilterPanel from '@/components/search/FilterPanel'
import SortDropdown from '@/components/search/SortDropdown'
import ItemGrid from '@/components/items/ItemGrid'
import { Button } from '@/components/ui/Button'
import { useItemSearch } from '@/hooks/useItemSearch'
import { useFavorites } from '@/hooks/useFavorites'
import type { AuthUser } from '@/lib/auth'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const {
    search,
    setSearch,
    filters,
    setFilters,
    sort,
    setSort,
    items,
    loading,
    error,
    total,
    hasMore,
    categories,
    loadMore,
  } = useItemSearch({
    initialSearch: initialQuery,
    initialSort: searchParams.get('sort') || 'newest',
  })

  const { favoriteIds, toggleFavorite } = useFavorites()

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
        }
      } catch (error) {
        console.error('Failed to load user:', error)
      }
    }

    loadUser()
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />
      
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {search ? `Search Results for "${search}"` : 'Browse Items'}
            </h1>
            
            {/* Search Bar */}
            <div className="mb-6">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search for items..."
              />
            </div>

            {/* Controls */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex items-center gap-4">
                <FilterPanel
                  filters={filters}
                  onFiltersChange={setFilters}
                  categories={categories}
                  isOpen={isFilterOpen}
                  onToggle={() => setIsFilterOpen(!isFilterOpen)}
                />
                
                {total > 0 && (
                  <p className="text-gray-600">
                    {total.toLocaleString()} {total === 1 ? 'item' : 'items'} found
                  </p>
                )}
              </div>

              <SortDropdown value={sort} onChange={setSort} />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex gap-8">
            {/* Desktop Filter Sidebar */}
            <div className="hidden lg:block w-80 flex-shrink-0">
              <FilterPanel
                filters={filters}
                onFiltersChange={setFilters}
                categories={categories}
                isOpen={true}
                onToggle={() => {}}
              />
            </div>

            {/* Items Grid */}
            <div className="flex-1">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
                  {error}
                </div>
              )}

              <ItemGrid
                items={items}
                loading={loading}
                onFavorite={user ? toggleFavorite : undefined}
                favoriteIds={favoriteIds}
              />

              {/* Load More Button */}
              {hasMore && !loading && (
                <div className="text-center mt-8">
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    className="px-8"
                  >
                    Load More Items
                  </Button>
                </div>
              )}

              {/* No Results */}
              {!loading && items.length === 0 && !error && (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">🔍</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No items found
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Try adjusting your search terms or filters to find what you&apos;re looking for.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearch('')
                        setFilters({
                          categories: [],
                          minPrice: null,
                          maxPrice: null,
                          conditions: [],
                          location: '',
                        })
                      }}
                    >
                      Clear All Filters
                    </Button>
                    {user && (
                      <Button href="/sell">
                        List Your Item
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}