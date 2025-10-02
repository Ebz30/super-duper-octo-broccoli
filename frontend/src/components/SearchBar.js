import React, { useState } from 'react';
import './SearchBar.css';

function SearchBar({ onSearch, onFilterChange, categories = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    min_price: '',
    max_price: '',
    condition: '',
    location: '',
    sort: 'newest'
  });

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(searchTerm, filters);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  const clearFilters = () => {
    const clearedFilters = {
      category: '',
      min_price: '',
      max_price: '',
      condition: '',
      location: '',
      sort: 'newest'
    };
    setFilters(clearedFilters);
    if (onFilterChange) {
      onFilterChange(clearedFilters);
    }
  };

  return (
    <div className="search-bar-wrapper">
      <form onSubmit={handleSearch} className="search-bar">
        <input
          type="text"
          placeholder="Search for items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <button type="submit" className="search-btn">
          🔍 Search
        </button>
        <button
          type="button"
          className="filter-toggle-btn"
          onClick={() => setShowFilters(!showFilters)}
        >
          🔧 Filters
        </button>
      </form>

      {showFilters && (
        <div className="filters-panel">
          <div className="filters-grid">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Condition</label>
              <select
                className="form-select"
                value={filters.condition}
                onChange={(e) => handleFilterChange('condition', e.target.value)}
              >
                <option value="">Any Condition</option>
                <option value="New">New</option>
                <option value="Like New">Like New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Min Price (CDF)</label>
              <input
                type="number"
                className="form-input"
                placeholder="0"
                value={filters.min_price}
                onChange={(e) => handleFilterChange('min_price', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Max Price (CDF)</label>
              <input
                type="number"
                className="form-input"
                placeholder="No limit"
                value={filters.max_price}
                onChange={(e) => handleFilterChange('max_price', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Location</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter location"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Sort By</label>
              <select
                className="form-select"
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>

          <div className="filters-actions">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleSearch}
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchBar;
