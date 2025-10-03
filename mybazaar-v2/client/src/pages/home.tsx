import React from 'react';
import { useAuth } from '@/contexts/auth-context';

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center py-16 mb-12 bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl">
          <h1 className="text-5xl font-bold text-teal-700 mb-4">
            Welcome to MyBazaar
          </h1>
          <p className="text-xl text-gray-700 mb-2">
            The premier student marketplace for Northern Cyprus universities
          </p>
          <p className="text-lg text-gray-600">
            Buy and sell items safely within your student community
          </p>
        </section>

        {/* Temporary message - will be replaced with items grid */}
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-20 h-20 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🚧</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Phase 1 - Core MVP (80% Complete)
          </h2>
          <p className="text-gray-600 mb-6">
            {isAuthenticated 
              ? `Welcome back, ${user?.fullName}! The items grid and search functionality are coming in the next update.`
              : 'Please log in to see personalized recommendations and create listings.'}
          </p>
          
          <div className="flex gap-4 justify-center flex-wrap">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
              <h3 className="font-semibold text-green-800 mb-2">✅ Completed</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• TypeScript infrastructure</li>
                <li>• Authentication system</li>
                <li>• Design system (Teal)</li>
                <li>• Database schema</li>
                <li>• UI components</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <h3 className="font-semibold text-blue-800 mb-2">🚧 Next Up</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Items API endpoints</li>
                <li>• Browse page with grid</li>
                <li>• Search & filters</li>
                <li>• Create listing form</li>
                <li>• Messaging system</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
