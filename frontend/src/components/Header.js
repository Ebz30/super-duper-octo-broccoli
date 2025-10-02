import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import './Header.css';

function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const fetchUnreadCount = async () => {
    try {
      const response = await apiService.conversations.getUnreadCount();
      if (response.data.success) {
        setUnreadCount(response.data.total_unread);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          {/* Logo */}
          <Link to="/" className="logo">
            <span className="logo-icon">🛒</span>
            <span className="logo-text">MyBazaar</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="nav-desktop">
            <Link to="/" className="nav-link">Browse</Link>
            
            {isAuthenticated ? (
              <>
                <Link to="/sell" className="nav-link">Sell</Link>
                <Link to="/my-listings" className="nav-link">My Listings</Link>
                <Link to="/favorites" className="nav-link">
                  ❤️ Favorites
                </Link>
                <Link to="/messages" className="nav-link">
                  💬 Messages
                  {unreadCount > 0 && (
                    <span className="badge">{unreadCount}</span>
                  )}
                </Link>
                <div className="user-menu">
                  <button className="user-button">
                    <span className="user-avatar">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                    <span className="user-name">{user?.name}</span>
                  </button>
                  <div className="dropdown">
                    <Link to="/profile" className="dropdown-item">Profile</Link>
                    <button onClick={handleLogout} className="dropdown-item">Logout</button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">Login</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="mobile-menu-btn"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            {showMobileMenu ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile Navigation */}
        {showMobileMenu && (
          <nav className="nav-mobile">
            <Link to="/" className="nav-link-mobile" onClick={() => setShowMobileMenu(false)}>
              Browse
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link to="/sell" className="nav-link-mobile" onClick={() => setShowMobileMenu(false)}>
                  Sell
                </Link>
                <Link to="/my-listings" className="nav-link-mobile" onClick={() => setShowMobileMenu(false)}>
                  My Listings
                </Link>
                <Link to="/favorites" className="nav-link-mobile" onClick={() => setShowMobileMenu(false)}>
                  ❤️ Favorites
                </Link>
                <Link to="/messages" className="nav-link-mobile" onClick={() => setShowMobileMenu(false)}>
                  💬 Messages {unreadCount > 0 && `(${unreadCount})`}
                </Link>
                <Link to="/profile" className="nav-link-mobile" onClick={() => setShowMobileMenu(false)}>
                  Profile
                </Link>
                <button onClick={handleLogout} className="nav-link-mobile" style={{ width: '100%', textAlign: 'left' }}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link-mobile" onClick={() => setShowMobileMenu(false)}>
                  Login
                </Link>
                <Link to="/register" className="nav-link-mobile" onClick={() => setShowMobileMenu(false)}>
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}

export default Header;
