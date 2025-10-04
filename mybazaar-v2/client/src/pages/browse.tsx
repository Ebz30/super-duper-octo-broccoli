import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { SlidersHorizontal } from 'lucide-react';
import apiService from '@/services/api';
import ItemCard from '@/components/item-card';
import SearchBar from '@/components/search-bar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function Browse() {
  const [filters, setFilters] = React.useState({
    search: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    condition: '',
    location: '',
    sort: 'newest' as 'newest' | 'price_asc' | 'price_desc' | 'popular',
  });
  const [showFilters, setShowFilters] = React.useState(false);
  const [page, setPage] = React.useState(1);

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await apiService.categories.getAll();
      return response.data.categories;
    },
  });

  // Fetch items
  const { data, isLoading, error } = useQuery({
    queryKey: ['items', filters, page],
    queryFn: async () => {
      const params = {
        ...filters,
        page,
        limit: 12,
      };
      const response = await apiService.items.getAll(params);
      return response.data;
    },
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      condition: '',
      location: '',
      sort: 'newest',
    });
    setPage(1);
  };

  const hasActiveFilters = Object.values(filters).some(v => v && v !== 'newest');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Items</h1>
          <p className="text-gray-600">Discover amazing items from your student community</p>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                value={filters.search}
                onChange={(value) => handleFilterChange('search', value)}
                placeholder="Search by title or description..."
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="md:w-auto"
            >
              <SlidersHorizontal className="h-5 w-5 mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 bg-teal-600 text-white text-xs rounded-full px-2 py-0.5">
                  Active
                </span>
              )}
            </Button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Category Filter */}
                <div>
                  <Label htmlFor="category" className="mb-2 block">Category</Label>
                  <select
                    id="category"
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-base focus:outline-none focus:ring-2 focus:ring-teal-600"
                  >
                    <option value="">All Categories</option>
                    {categoriesData?.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <Label className="mb-2 block">Price Range</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                      className="w-1/2"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                      className="w-1/2"
                    />
                  </div>
                </div>

                {/* Condition */}
                <div>
                  <Label htmlFor="condition" className="mb-2 block">Condition</Label>
                  <select
                    id="condition"
                    value={filters.condition}
                    onChange={(e) => handleFilterChange('condition', e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-base focus:outline-none focus:ring-2 focus:ring-teal-600"
                  >
                    <option value="">Any Condition</option>
                    <option value="new">New</option>
                    <option value="like_new">Like New</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>

                {/* Sort */}
                <div>
                  <Label htmlFor="sort" className="mb-2 block">Sort By</Label>
                  <select
                    id="sort"
                    value={filters.sort}
                    onChange={(e) => handleFilterChange('sort', e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-base focus:outline-none focus:ring-2 focus:ring-teal-600"
                  >
                    <option value="newest">Newest First</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="popular">Most Popular</option>
                  </select>
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <div className="mt-4 flex justify-end">
                  <Button variant="ghost" onClick={clearFilters}>
                    Clear All Filters
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results Count */}
        {data && (
          <div className="mb-4 text-sm text-gray-600">
            Showing {data.items.length} of {data.pagination.totalCount} items
          </div>
        )}

        {/* Items Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500">Error loading items. Please try again.</p>
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your filters or search terms</p>
            {hasActiveFilters && (
              <Button onClick={clearFilters}>Clear Filters</Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {data.items.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>

            {/* Pagination */}
            {data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                
                <span className="px-4 py-2 text-sm text-gray-600">
                  Page {page} of {data.pagination.totalPages}
                </span>
                
                <Button
                  variant="outline"
                  onClick={() => setPage(p => p + 1)}
                  disabled={!data.pagination.hasMore}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
