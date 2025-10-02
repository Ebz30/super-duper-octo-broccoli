import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function EditListing() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '600px', margin: '2rem auto', padding: '2rem' }}>
        <h1>Edit Listing</h1>
        <p>Edit functionality for item #{id} would go here.</p>
        <p className="text-sm" style={{ color: 'var(--gray-600)' }}>
          This is a placeholder page. In a full implementation, this would include a form 
          similar to CreateListing but pre-populated with the current item data.
        </p>
        <button 
          className="btn btn-secondary mt-lg"
          onClick={() => navigate(`/items/${id}`)}
        >
          Back to Item
        </button>
      </div>
    </div>
  );
}

export default EditListing;
