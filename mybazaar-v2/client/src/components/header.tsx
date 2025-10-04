import React from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Search, MessageSquare, Heart, Menu, User, LogOut } from 'lucide-react';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 shadow-sm">
      <div className="container max-w-7xl mx-auto px-4 h-16">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center text-white text-xl font-bold shadow-md">
              M
            </div>
            <span className="text-xl font-bold text-gray-900 hidden sm:block">MyBazaar</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/browse" className="text-gray-700 hover:text-teal-600 font-medium transition-colors">
              Browse
            </Link>
            {isAuthenticated && (
              <>
                <Link href="/sell" className="text-gray-700 hover:text-teal-600 font-medium transition-colors">
                  Sell
                </Link>
                <Link href="/my-listings" className="text-gray-700 hover:text-teal-600 font-medium transition-colors">
                  My Listings
                </Link>
                <Link href="/favorites" className="flex items-center gap-1 text-gray-700 hover:text-teal-600 font-medium transition-colors">
                  <Heart className="h-4 w-4" />
                  Favorites
                </Link>
                <Link href="/messages" className="flex items-center gap-1 text-gray-700 hover:text-teal-600 font-medium transition-colors">
                  <MessageSquare className="h-4 w-4" />
                  Messages
                </Link>
              </>
            )}
          </nav>

          {/* User Menu / Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link href="/profile">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                    <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-700 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {user?.fullName?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-800">{user?.fullName}</span>
                  </div>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline" size="sm">Log In</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-6 w-6 text-gray-700" />
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col gap-2">
              <Link href="/browse" className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                Browse
              </Link>
              {isAuthenticated ? (
                <>
                  <Link href="/sell" className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                    Sell
                  </Link>
                  <Link href="/my-listings" className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                    My Listings
                  </Link>
                  <Link href="/favorites" className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                    Favorites
                  </Link>
                  <Link href="/messages" className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                    Messages
                  </Link>
                  <Link href="/profile" className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                    Profile
                  </Link>
                  <button
                    onClick={logout}
                    className="px-4 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                    Log In
                  </Link>
                  <Link href="/register" className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                    Sign Up
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
