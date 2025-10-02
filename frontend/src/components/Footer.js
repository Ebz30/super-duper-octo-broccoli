import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="footer-title">MyBazaar</h3>
            <p className="footer-text">
              The premier student marketplace for Northern Cyprus universities.
              Buy and sell safely within your student community.
            </p>
            <div className="footer-contact">
              <p>📧 mybazaarsupp@gmail.com</p>
              <p>📍 Kucuk Kaymakli, Lefkosa</p>
            </div>
          </div>
          
          <div className="footer-section">
            <h4 className="footer-heading">Quick Links</h4>
            <ul className="footer-links">
              <li><Link to="/">Browse Items</Link></li>
              <li><Link to="/sell">Sell an Item</Link></li>
              <li><Link to="/favorites">Favorites</Link></li>
              <li><Link to="/messages">Messages</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4 className="footer-heading">Support</h4>
            <ul className="footer-links">
              <li><a href="https://github.com/Ebz30/super-duper-octo-broccoli" target="_blank" rel="noopener noreferrer">GitHub</a></li>
              <li><a href="mailto:mybazaarsupp@gmail.com">Contact Support</a></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2025 MyBazaar. All rights reserved.</p>
          <p>Made for students, by students 🎓</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
