'use client'

import React, { useState, useEffect } from 'react'
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { Category } from '@/lib/supabase'

interface FilterState {
  categories: number[]
  minPrice: number | null
  maxPrice: number | null
  conditions: string[]
  location: string
}

interface FilterPanelProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  categories: Category[]
  isOpen: boolean
  onToggle: () => void
}

const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Poor']

export default function FilterPanel({ 
  filters, 
  onFiltersChange, 
  categories,
  isOpen,
  onToggle 
}: FilterPanelProps) {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters)
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    price: true,
    condition: true,
    location: true,
  })

  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const handleCategoryChange = (categoryId: number, checked: boolean) => {
    const newCategories = checked
      ? [...localFilters.categories, categoryId]
      : localFilters.categories.filter(id => id !== categoryId)
    
    const newFilters = { ...localFilters, categories: newCategories }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleConditionChange = (condition: string, checked: boolean) => {
    const newConditions = checked
      ? [...localFilters.conditions, condition]
      : localFilters.conditions.filter(c => c !== condition)
    
    const newFilters = { ...localFilters, conditions: newConditions }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handlePriceChange = (field: 'minPrice' | 'maxPrice', value: string) => {
    const numValue = value === '' ? null : Number(value)
    const newFilters = { ...localFilters, [field]: numValue }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleLocationChange = (location: string) => {
    const newFilters = { ...localFilters, location }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const clearFilters = () => {
    const emptyFilters: FilterState = {
      categories: [],
      minPrice: null,
      maxPrice: null,
      conditions: [],
      location: '',
    }
    setLocalFilters(emptyFilters)
    onFiltersChange(emptyFilters)
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const hasActiveFilters = 
    localFilters.categories.length > 0 ||
    localFilters.conditions.length > 0 ||
    localFilters.minPrice !== null ||
    localFilters.maxPrice !== null ||
    localFilters.location !== ''

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        onClick={onToggle}
        className="flex items-center gap-2"
      >
        <Filter className="h-4 w-4" />
        Filters
        {hasActiveFilters && (
          <span className="bg-primary-500 text-white text-xs rounded-full px-2 py-0.5 ml-1">
            {localFilters.categories.length + localFilters.conditions.length + 
             (localFilters.minPrice ? 1 : 0) + (localFilters.maxPrice ? 1 : 0) +
             (localFilters.location ? 1 : 0)}
          </span>
        )}
      </Button>
    )
  }

  return (
    <Card className="w-full lg:w-80 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filters
        </h3>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear all
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onToggle} className="lg:hidden">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-3">
        <button
          onClick={() => toggleSection('categories')}
          className="flex items-center justify-between w-full text-left"
        >
          <h4 className="font-medium">Categories</h4>
          {expandedSections.categories ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        
        {expandedSections.categories && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {categories.map((category) => (
              <label key={category.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localFilters.categories.includes(category.id)}
                  onChange={(e) => handleCategoryChange(category.id, e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm">{category.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Price Range */}
      <div className="space-y-3">
        <button
          onClick={() => toggleSection('price')}
          className="flex items-center justify-between w-full text-left"
        >
          <h4 className="font-medium">Price Range</h4>
          {expandedSections.price ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        
        {expandedSections.price && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Min Price</label>
              <input
                type="number"
                placeholder="0"
                value={localFilters.minPrice || ''}
                onChange={(e) => handlePriceChange('minPrice', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Max Price</label>
              <input
                type="number"
                placeholder="Any"
                value={localFilters.maxPrice || ''}
                onChange={(e) => handlePriceChange('maxPrice', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Condition */}
      <div className="space-y-3">
        <button
          onClick={() => toggleSection('condition')}
          className="flex items-center justify-between w-full text-left"
        >
          <h4 className="font-medium">Condition</h4>
          {expandedSections.condition ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        
        {expandedSections.condition && (
          <div className="space-y-2">
            {CONDITIONS.map((condition) => (
              <label key={condition} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localFilters.conditions.includes(condition)}
                  onChange={(e) => handleConditionChange(condition, e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm">{condition}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Location */}
      <div className="space-y-3">
        <button
          onClick={() => toggleSection('location')}
          className="flex items-center justify-between w-full text-left"
        >
          <h4 className="font-medium">Location</h4>
          {expandedSections.location ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        
        {expandedSections.location && (
          <input
            type="text"
            placeholder="Enter location..."
            value={localFilters.location}
            onChange={(e) => handleLocationChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          />
        )}
      </div>
    </Card>
  )
}