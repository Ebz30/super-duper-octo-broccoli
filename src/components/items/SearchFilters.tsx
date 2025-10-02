'use client';

import React, { useState } from 'react';
import { Search, Filter, X, SlidersHorizontal } from 'lucide-react';
import { CATEGORIES, CONDITIONS } from '@/lib/types';

interface SearchFiltersProps {
  onSearch: (filters: {
    search?: string;
    category?: number[];
    min_price?: number;
    max_price?: number;
    condition?: string[];
    location?: string;
    sort?: string;
    is_available?: boolean;
  }) => void;
  loading?: boolean;
}

export default function SearchFilters({ onSearch, loading }: SearchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    category: [] as number[],
    min_price: '',
    max_price: '',
    condition: [] as string[],
    location: '',
    sort: 'newest',
    is_available: true,
  });

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const handleCategoryToggle = (categoryId: number) => {
    const newCategories = filters.category.includes(categoryId)
      ? filters.category.filter(id => id !== categoryId)
      : [...filters.category, categoryId];
    handleFilterChange('category', newCategories);
  };

  const handleConditionToggle = (condition: string) => {
    const newConditions = filters.condition.includes(condition)
      ? filters.condition.filter(c => c !== condition)
      : [...filters.condition, condition];
    handleFilterChange('condition', newConditions);
  };

  const handleSearch = () => {
    const searchFilters = {
      search: filters.search || undefined,
      category: filters.category.length > 0 ? filters.category : undefined,
      min_price: filters.min_price ? parseFloat(filters.min_price) : undefined,
      max_price: filters.max_price ? parseFloat(filters.max_price) : undefined,
      condition: filters.condition.length > 0 ? filters.condition : undefined,
      location: filters.location || undefined,
      sort: filters.sort,
      is_available: filters.is_available,
    };
    onSearch(searchFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      category: [],
      min_price: '',
      max_price: '',
      condition: [],
      location: '',
      sort: 'newest',
      is_available: true,
    };
    setFilters(clearedFilters);
    onSearch({
      sort: 'newest',
      is_available: true,
    });
  };

  const hasActiveFilters = filters.category.length > 0 || 
    filters.min_price || filters.max_price || 
    filters.condition.length > 0 || filters.location || 
    filters.search;

  return (
    <div className="bg-white rounded-2xl shadow-soft p-6 mb-8">
      {/* Search Bar */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search for items..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-primary-600 text-white px-6 py-3 rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors"
        >
          <SlidersHorizontal className="w-5 h-5" />
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="bg-primary-600 text-white text-xs px-2 py-1 rounded-full">
              Active
            </span>
          )}
        </button>
        
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="space-y-6 border-t border-gray-100 pt-6">
          {/* Categories */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Categories</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryToggle(category.id)}
                  className={`p-3 rounded-xl text-sm font-medium transition-colors ${
                    filters.category.includes(category.id)
                      ? 'bg-primary-100 text-primary-700 border-2 border-primary-200'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Price Range (CDF)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Min Price</label>
                <input
                  type="number"
                  placeholder="0"
                  value={filters.min_price}
                  onChange={(e) => handleFilterChange('min_price', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Max Price</label>
                <input
                  type="number"
                  placeholder="100000"
                  value={filters.max_price}
                  onChange={(e) => handleFilterChange('max_price', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Condition */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Condition</h3>
            <div className="flex flex-wrap gap-2">
              {CONDITIONS.map((condition) => (
                <button
                  key={condition}
                  onClick={() => handleConditionToggle(condition)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filters.condition.includes(condition)
                      ? 'bg-primary-100 text-primary-700 border-2 border-primary-200'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  {condition}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Location</h3>
            <input
              type="text"
              placeholder="Enter location..."
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Sort */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Sort By</h3>
            <select
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>

          {/* Availability */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="available"
              checked={filters.is_available}
              onChange={(e) => handleFilterChange('is_available', e.target.checked)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="available" className="ml-2 text-sm text-gray-700">
              Show only available items
            </label>
          </div>
        </div>
      )}
    </div>
  );
}