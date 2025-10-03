import React from 'react';
import { Link } from 'wouter';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 mt-auto">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <h3 className="text-xl font-bold text-teal-400 mb-4">MyBazaar</h3>
            <p className="text-sm leading-relaxed mb-4">
              The premier student marketplace for Northern Cyprus universities.
              Buy and sell safely within your student community.
            </p>
            <div className="space-y-1 text-sm">
              <p>📧 mybazaarsupp@gmail.com</p>
              <p>📍 Kucuk Kaymakli, Lefkosa</p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-teal-400 transition-colors">
                  Browse Items
                </Link>
              </li>
              <li>
                <Link href="/sell" className="hover:text-teal-400 transition-colors">
                  Sell an Item
                </Link>
              </li>
              <li>
                <Link href="/favorites" className="hover:text-teal-400 transition-colors">
                  Favorites
                </Link>
              </li>
              <li>
                <Link href="/messages" className="hover:text-teal-400 transition-colors">
                  Messages
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://github.com/Ebz30/super-duper-octo-broccoli"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-teal-400 transition-colors"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a href="mailto:mybazaarsupp@gmail.com" className="hover:text-teal-400 transition-colors">
                  Contact Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-sm">
          <p>&copy; 2025 MyBazaar. All rights reserved.</p>
          <p className="mt-1">Made for students, by students 🎓</p>
        </div>
      </div>
    </footer>
  );
}
