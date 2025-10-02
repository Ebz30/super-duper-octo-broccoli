import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../services/api';
import ItemCard from '../components/ItemCard';

function MyListings() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyItems();
  }, []);

  const fetchMyItems = async () => {
    try {
      const response = await apiService.items.getMyItems();
      if (response.data.success) {
        setItems(response.data.items);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="flex justify-between items-center mb-lg">
        <h1>My Listings</h1>
        <Link to="/sell" className="btn btn-primary">
          + Create New Listing
        </Link>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="card text-center" style={{ padding: '3rem' }}>
          <h3>No listings yet</h3>
          <p>Start selling by creating your first listing!</p>
          <Link to="/sell" className="btn btn-primary mt-md">
            Create Listing
          </Link>
        </div>
      ) : (
        <div className="items-grid">
          {items.map(item => (
            <ItemCard key={item.id} item={item} showFavorite={false} />
          ))}
        </div>
      )}
    </div>
  );
}

export default MyListings;
