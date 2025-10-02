import React from 'react';
import { useAuth } from '../context/AuthContext';

function Profile() {
  const { user } = useAuth();

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '600px', margin: '2rem auto', padding: '2rem' }}>
        <h1>My Profile</h1>
        
        <div style={{ marginTop: '2rem' }}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <p style={{ padding: '0.625rem 0', fontSize: 'var(--text-lg)' }}>
              {user?.name}
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <p style={{ padding: '0.625rem 0', fontSize: 'var(--text-lg)' }}>
              {user?.email}
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">University</label>
            <p style={{ padding: '0.625rem 0', fontSize: 'var(--text-lg)', color: 'var(--gray-500)' }}>
              {user?.university || 'Not set'}
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Member Since</label>
            <p style={{ padding: '0.625rem 0', fontSize: 'var(--text-lg)' }}>
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
            </p>
          </div>
        </div>

        <div className="mt-xl" style={{ paddingTop: '1.5rem', borderTop: '1px solid var(--gray-200)' }}>
          <p className="text-sm" style={{ color: 'var(--gray-600)' }}>
            Profile editing functionality would be implemented here in a full version.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Profile;
