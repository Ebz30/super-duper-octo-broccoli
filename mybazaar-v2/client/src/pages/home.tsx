import React from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Search, ShoppingBag, MessageSquare, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import ItemCard from '@/components/item-card';
import apiService from '@/services/api';

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  // Fetch latest items
  const { data: itemsData, isLoading } = useQuery({
    queryKey: ['items', 'home'],
    queryFn: async () => {
      const response = await apiService.items.getAll({ limit: 8, sort: 'newest' });
      return response.data;
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-teal-600 to-teal-700 text-white py-20">
        <div className="container max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Welcome to MyBazaar
          </h1>
          <p className="text-xl md:text-2xl mb-4 text-teal-50">
            The premier student marketplace for Northern Cyprus
          </p>
          <p className="text-lg text-teal-100 mb-8">
            Buy and sell items safely within your student community
          </p>
          
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/browse">
              <Button size="lg" variant="secondary" className="shadow-lg">
                <Search className="h-5 w-5 mr-2" />
                Browse Items
              </Button>
            </Link>
            {isAuthenticated ? (
              <Link href="/sell">
                <Button size="lg" className="bg-white text-teal-600 hover:bg-gray-100 shadow-lg">
                  <ShoppingBag className="h-5 w-5 mr-2" />
                  Sell an Item
                </Button>
              </Link>
            ) : (
              <Link href="/register">
                <Button size="lg" className="bg-white text-teal-600 hover:bg-gray-100 shadow-lg">
                  Get Started
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Easy Listing</h3>
              <p className="text-gray-600">
                List your items in minutes with our simple form
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Direct Messaging</h3>
              <p className="text-gray-600">
                Chat directly with buyers and sellers
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Search</h3>
              <p className="text-gray-600">
                Find exactly what you need with advanced filters
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Items */}
      <section className="py-16">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Latest Items</h2>
              <p className="text-gray-600">Check out the newest listings</p>
            </div>
            <Link href="/browse">
              <Button variant="outline">View All</Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
          ) : itemsData && itemsData.items.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {itemsData.items.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-lg">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No items yet</h3>
              <p className="text-gray-600 mb-6">Be the first to list an item!</p>
              {isAuthenticated && (
                <Link href="/sell">
                  <Button>Create Listing</Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="py-16 bg-teal-600 text-white">
          <div className="container max-w-7xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
            <p className="text-xl text-teal-100 mb-8">
              Join thousands of students buying and selling on MyBazaar
            </p>
            <Link href="/register">
              <Button size="lg" className="bg-white text-teal-600 hover:bg-gray-100">
                Create Your Account
              </Button>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
