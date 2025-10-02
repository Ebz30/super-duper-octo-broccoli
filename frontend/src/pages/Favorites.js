import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import ItemCard from '../components/ItemCard';

function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const response = await apiService.favorites.getAll();
      if (response.data.success) {
        setFavorites(response.data.favorites.map(fav => fav.item || fav));
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteChange = () => {
    fetchFavorites(); // Refresh list when favorite is removed
  };

  return (
    <div className="container">
      <h1 className="mb-lg">My Favorites</h1>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      ) : favorites.length === 0 ? (
        <div className="card text-center" style={{ padding: '3rem' }}>
          <h3>No favorites yet</h3>
          <p>Items you favorite will appear here</p>
        </div>
      ) : (
        <div className="items-grid">
          {favorites.map(item => (
            <ItemCard 
              key={item.id} 
              item={item} 
              onFavoriteChange={handleFavoriteChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Favorites;
