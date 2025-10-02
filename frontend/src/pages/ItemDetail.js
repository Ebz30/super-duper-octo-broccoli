import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiService, { API_URL } from '../services/api';
import ItemCard from '../components/ItemCard';
import './ItemDetail.css';

function ItemDetail() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    fetchItem();
  }, [id]);

  const fetchItem = async () => {
    try {
      const response = await apiService.items.getById(id);
      if (response.data.success) {
        setItem(response.data.item);
      }
    } catch (error) {
      console.error('Error fetching item:', error);
      alert('Item not found');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleContactSeller = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      const response = await apiService.conversations.create({
        item_id: item.id,
        seller_id: item.seller_id
      });
      
      if (response.data.success) {
        navigate('/messages');
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      alert('Failed to start conversation');
    }
  };

  const handleShare = async (platform) => {
    const url = window.location.href;
    const text = `Check out ${item.title} on MyBazaar! Only ${item.price} CDF`;
    
    switch(platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`);
        break;
      case 'telegram':
        window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`);
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
        break;
      default:
        break;
    }
    
    await apiService.items.share(item.id, platform);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!item) return null;

  const discountedPrice = item.discount_percentage > 0
    ? item.price * (1 - item.discount_percentage / 100)
    : item.price;

  return (
    <div className="item-detail-page">
      <div className="container">
        <div className="item-detail-layout">
          {/* Images */}
          <div className="item-images-section">
            <div className="main-image">
              <img
                src={`${API_URL}${item.images[selectedImage]}`}
                alt={item.title}
                onError={(e) => e.target.src = 'https://via.placeholder.com/600x600?text=No+Image'}
              />
            </div>
            {item.images.length > 1 && (
              <div className="image-thumbnails">
                {item.images.map((img, index) => (
                  <img
                    key={index}
                    src={`${API_URL}${img}`}
                    alt={`${item.title} ${index + 1}`}
                    className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                    onClick={() => setSelectedImage(index)}
                    onError={(e) => e.target.src = 'https://via.placeholder.com/100x100?text=No+Image'}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="item-info-section">
            <h1 className="item-detail-title">{item.title}</h1>
            
            <div className="item-detail-price">
              {item.discount_percentage > 0 ? (
                <>
                  <span className="price-current">{discountedPrice.toFixed(2)} CDF</span>
                  <span className="price-original">{item.price.toFixed(2)} CDF</span>
                  <span className="price-discount">-{item.discount_percentage}%</span>
                </>
              ) : (
                <span className="price-current">{item.price.toFixed(2)} CDF</span>
              )}
            </div>

            <div className="item-detail-meta">
              <div className="meta-item">
                <strong>Condition:</strong> <span className="condition-badge">{item.condition}</span>
              </div>
              <div className="meta-item">
                <strong>Location:</strong> {item.location}
              </div>
              <div className="meta-item">
                <strong>Category:</strong> {item.category_name}
              </div>
              <div className="meta-item">
                <strong>Status:</strong> 
                <span className={`status-badge ${item.is_available ? 'available' : 'sold'}`}>
                  {item.is_available ? 'Available' : 'Sold'}
                </span>
              </div>
            </div>

            <div className="item-description">
              <h3>Description</h3>
              <p>{item.description}</p>
            </div>

            <div className="seller-info">
              <h3>Seller Information</h3>
              <div className="seller-details">
                <p><strong>Name:</strong> {item.seller_name}</p>
                {item.seller_university && (
                  <p><strong>University:</strong> {item.seller_university}</p>
                )}
                <p><strong>Member since:</strong> {new Date(item.seller_member_since).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="item-actions">
              {isAuthenticated && user?.id === item.seller_id ? (
                <Link to={`/edit/${item.id}`} className="btn btn-primary btn-lg w-full">
                  Edit Listing
                </Link>
              ) : (
                <button 
                  className="btn btn-primary btn-lg w-full"
                  onClick={handleContactSeller}
                  disabled={!item.is_available}
                >
                  {item.is_available ? '💬 Contact Seller' : 'Item Sold'}
                </button>
              )}
            </div>

            {/* Share */}
            <div className="item-share">
              <h4>Share this item:</h4>
              <div className="share-buttons">
                <button className="share-btn" onClick={() => handleShare('whatsapp')}>
                  WhatsApp
                </button>
                <button className="share-btn" onClick={() => handleShare('telegram')}>
                  Telegram
                </button>
                <button className="share-btn" onClick={() => handleShare('copy')}>
                  📋 Copy Link
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Items */}
        {item.similar_items && item.similar_items.length > 0 && (
          <section className="similar-items-section">
            <h2>Similar Items</h2>
            <div className="items-grid">
              {item.similar_items.map(similarItem => (
                <ItemCard key={similarItem.id} item={similarItem} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default ItemDetail;
