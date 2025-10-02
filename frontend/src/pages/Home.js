import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import ItemCard from '../components/ItemCard';
import SearchBar from '../components/SearchBar';
import './Home.css';

function Home() {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchParams, setSearchParams] = useState({});

  useEffect(() => {
    fetchCategories();
    fetchItems();
    if (isAuthenticated) {
      fetchRecommendations();
    }
  }, [isAuthenticated]);

  const fetchCategories = async () => {
    try {
      const response = await apiService.categories.getAll();
      if (response.data.success) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchItems = async (page = 1, params = {}) => {
    setLoading(true);
    try {
      const response = await apiService.items.getAll({
        page,
        ...params
      });
      
      if (response.data.success) {
        setItems(response.data.items);
        setCurrentPage(response.data.pagination.page);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await apiService.recommendations.getPersonalized(12);
      if (response.data.success) {
        setRecommendations(response.data.recommendations);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const handleSearch = (searchTerm, filters) => {
    const params = {
      search: searchTerm || undefined,
      category: filters.category || undefined,
      min_price: filters.min_price || undefined,
      max_price: filters.max_price || undefined,
      condition: filters.condition || undefined,
      location: filters.location || undefined,
      sort: filters.sort || 'newest'
    };
    
    setSearchParams(params);
    fetchItems(1, params);
  };

  const handleFilterChange = (filters) => {
    // Update search params without triggering immediate search
    // Search will be triggered when user clicks "Apply Filters"
  };

  const handlePageChange = (page) => {
    fetchItems(page, searchParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="home-page">
      <div className="container">
        {/* Hero Section */}
        <section className="hero">
          <h1 className="hero-title">Welcome to MyBazaar</h1>
          <p className="hero-subtitle">
            The premier student marketplace for Northern Cyprus universities
          </p>
          <p className="hero-description">
            Buy and sell items safely within your student community
          </p>
        </section>

        {/* Search Bar */}
        <SearchBar
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          categories={categories}
        />

        {/* Recommendations Section (Authenticated Users Only) */}
        {isAuthenticated && recommendations.length > 0 && (
          <section className="recommendations-section">
            <h2 className="section-title">Recommended For You</h2>
            <div className="items-grid">
              {recommendations.map(item => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        )}

        {/* All Items Section */}
        <section className="items-section">
          <h2 className="section-title">
            {searchParams.search ? 'Search Results' : 'All Items'}
          </h2>
          
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading items...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <p className="empty-message">No items found</p>
              <p className="empty-description">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <>
              <div className="items-grid">
                {items.map(item => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="btn btn-secondary"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    ← Previous
                  </button>
                  
                  <div className="page-numbers">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    className="btn btn-secondary"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default Home;
