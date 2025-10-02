import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import './CreateListing.css';

function CreateListing() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    price: '',
    discount_percentage: '',
    condition: 'Good',
    location: '',
    images: []
  });

  useEffect(() => {
    fetchCategories();
  }, []);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 10) {
      setError('Maximum 10 images allowed');
      return;
    }
    setFormData(prev => ({ ...prev, images: files }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!formData.images || formData.images.length === 0) {
      setError('At least one image is required');
      setLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category_id', formData.category_id);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('discount_percentage', formData.discount_percentage || 0);
      formDataToSend.append('condition', formData.condition);
      formDataToSend.append('location', formData.location);
      
      formData.images.forEach((image) => {
        formDataToSend.append('images', image);
      });

      const response = await apiService.items.create(formDataToSend);
      
      if (response.data.success) {
        alert('Item listed successfully!');
        navigate('/my-listings');
      }
    } catch (error) {
      console.error('Error creating listing:', error);
      setError(error.response?.data?.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-listing-page">
      <div className="container">
        <div className="create-listing-card">
          <h1>Create New Listing</h1>
          <p className="subtitle">Sell your item to the student community</p>

          {error && (
            <div className="alert alert-error">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="listing-form">
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input
                type="text"
                name="title"
                className="form-input"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="e.g., iPhone 13 Pro Max 256GB"
                minLength="3"
                maxLength="200"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea
                name="description"
                className="form-textarea"
                value={formData.description}
                onChange={handleChange}
                required
                placeholder="Describe your item in detail..."
                minLength="20"
                maxLength="2000"
                rows="6"
              />
              <small className="form-help">{formData.description.length}/2000 characters</small>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select
                  name="category_id"
                  className="form-select"
                  value={formData.category_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Condition *</label>
                <select
                  name="condition"
                  className="form-select"
                  value={formData.condition}
                  onChange={handleChange}
                  required
                >
                  <option value="New">New</option>
                  <option value="Like New">Like New</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Price (CDF) *</label>
                <input
                  type="number"
                  name="price"
                  className="form-input"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  min="0"
                  max="999999.99"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Discount % (optional)</label>
                <input
                  type="number"
                  name="discount_percentage"
                  className="form-input"
                  value={formData.discount_percentage}
                  onChange={handleChange}
                  min="0"
                  max="90"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Location *</label>
              <input
                type="text"
                name="location"
                className="form-input"
                value={formData.location}
                onChange={handleChange}
                required
                maxLength="100"
                placeholder="e.g., Near EMU Campus"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Images * (Max 10)</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleImageChange}
                className="form-input"
                required
              />
              <small className="form-help">
                {formData.images.length > 0 
                  ? `${formData.images.length} image(s) selected` 
                  : 'JPEG, PNG, or WebP (max 5MB each)'}
              </small>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/')}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Listing'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateListing;
