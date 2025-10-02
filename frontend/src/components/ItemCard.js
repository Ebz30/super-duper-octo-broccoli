import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiService, { API_URL } from '../services/api';
import './ItemCard.css';

function ItemCard({ item, showFavorite = true, onFavoriteChange }) {
  const { isAuthenticated } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  // Calculate discounted price
  const discountedPrice = item.discount_percentage > 0
    ? item.price * (1 - item.discount_percentage / 100)
    : item.price;

  const handleFavoriteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      alert('Please login to add favorites');
      return;
    }

    setLoading(true);
    try {
      if (isFavorited) {
        await apiService.favorites.remove(item.id);
        setIsFavorited(false);
      } else {
        await apiService.favorites.add(item.id);
        setIsFavorited(true);
      }
      
      if (onFavoriteChange) {
        onFavoriteChange();
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('Failed to update favorites');
    } finally {
      setLoading(false);
    }
  };

  // Get image URL
  const imageUrl = item.image || item.images?.[0] || '/placeholder-image.png';
  const fullImageUrl = imageUrl.startsWith('http') 
    ? imageUrl 
    : `${API_URL}${imageUrl}`;

  return (
    <Link to={`/items/${item.id}`} className="item-card">
      <div className="item-image-wrapper">
        <img 
          src={fullImageUrl} 
          alt={item.title}
          className="item-image"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/400x400?text=No+Image';
          }}
        />
        {item.discount_percentage > 0 && (
          <div className="item-badge">-{item.discount_percentage}%</div>
        )}
        {!item.is_available && (
          <div className="item-badge sold">SOLD</div>
        )}
        {showFavorite && isAuthenticated && (
          <button
            className={`favorite-btn ${isFavorited ? 'favorited' : ''}`}
            onClick={handleFavoriteClick}
            disabled={loading}
          >
            {isFavorited ? '❤️' : '🤍'}
          </button>
        )}
      </div>
      
      <div className="item-details">
        <h3 className="item-title">{item.title}</h3>
        <div className="item-meta">
          <span className="item-condition">{item.condition}</span>
          {item.location && (
            <>
              <span className="meta-separator">•</span>
              <span className="item-location">📍 {item.location}</span>
            </>
          )}
        </div>
        <div className="item-price-wrapper">
          {item.discount_percentage > 0 ? (
            <>
              <span className="item-price">{discountedPrice.toFixed(2)} CDF</span>
              <span className="item-price-original">{item.price.toFixed(2)} CDF</span>
            </>
          ) : (
            <span className="item-price">{item.price.toFixed(2)} CDF</span>
          )}
        </div>
        {item.seller_name && (
          <div className="item-seller">
            <span className="seller-label">Seller:</span>
            <span className="seller-name">{item.seller_name}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

export default ItemCard;
