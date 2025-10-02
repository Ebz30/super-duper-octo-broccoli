'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, TrendingUp, Shield, Users, Zap, ArrowRight } from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ItemGrid from '@/components/items/ItemGrid'
import SearchBar from '@/components/search/SearchBar'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useFavorites } from '@/hooks/useFavorites'
import type { Item } from '@/lib/supabase'
import type { AuthUser } from '@/lib/auth'

export default function HomePage() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [trendingItems, setTrendingItems] = useState<Item[]>([])
  const [recommendedItems, setRecommendedItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const { favoriteIds, toggleFavorite } = useFavorites()

  // Load user and items on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Check if user is logged in
        const userResponse = await fetch('/api/auth/me')
        if (userResponse.ok) {
          const userData = await userResponse.json()
          setUser(userData.user)
        }

        // Load trending items
        const trendingResponse = await fetch('/api/recommendations?type=trending&limit=8')
        if (trendingResponse.ok) {
          const trendingData = await trendingResponse.json()
          setTrendingItems(trendingData.items || [])
        }

        // Load personalized recommendations (if user is logged in)
        const recommendedResponse = await fetch('/api/recommendations?type=personalized&limit=8')
        if (recommendedResponse.ok) {
          const recommendedData = await recommendedResponse.json()
          setRecommendedItems(recommendedData.items || [])
        }
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(query.trim())}`
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary-50 to-primary-100 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Welcome to{' '}
                <span className="text-gradient">MyBazaar</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                The premier trusted marketplace for students across Northern Cyprus universities. 
                Buy, sell, and trade with confidence in your student community.
              </p>
              
              {/* Search Bar */}
              <div className="max-w-2xl mx-auto mb-8">
                <SearchBar
                  value={searchQuery}
                  onChange={handleSearch}
                  placeholder="Search for textbooks, electronics, furniture..."
                  className="text-lg"
                />
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/search">
                  <Button size="lg" className="w-full sm:w-auto">
                    <Search className="h-5 w-5 mr-2" />
                    Browse Items
                  </Button>
                </Link>
                <Link href="/sell">
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                    Start Selling
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Why Choose MyBazaar?
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Built specifically for the student community with safety, convenience, and trust in mind.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="text-center">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-6 w-6 text-primary-600" />
                  </div>
                  <CardTitle>Safe & Secure</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Advanced content moderation, user verification, and safety guidelines 
                    to ensure secure transactions within the student community.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Users className="h-6 w-6 text-primary-600" />
                  </div>
                  <CardTitle>Student Community</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Connect with fellow students from universities across Northern Cyprus. 
                    Buy and sell within your trusted academic community.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Zap className="h-6 w-6 text-primary-600" />
                  </div>
                  <CardTitle>Smart Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    AI-powered recommendations help you discover items you need and 
                    connect with buyers interested in what you&apos;re selling.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Trending Items */}
        {trendingItems.length > 0 && (
          <section className="py-16 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    <TrendingUp className="inline h-8 w-8 mr-2 text-primary-600" />
                    Trending Now
                  </h2>
                  <p className="text-gray-600">Popular items in the student community</p>
                </div>
                <Link href="/search?sort=popular">
                  <Button variant="outline">
                    View All
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>

              <ItemGrid
                items={trendingItems}
                loading={loading}
                onFavorite={user ? toggleFavorite : undefined}
                favoriteIds={favoriteIds}
              />
            </div>
          </section>
        )}

        {/* Personalized Recommendations */}
        {user && recommendedItems.length > 0 && (
          <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Recommended for You
                  </h2>
                  <p className="text-gray-600">Items picked just for you based on your interests</p>
                </div>
                <Link href="/search">
                  <Button variant="outline">
                    View All
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>

              <ItemGrid
                items={recommendedItems}
                loading={loading}
                onFavorite={toggleFavorite}
                favoriteIds={favoriteIds}
              />
            </div>
          </section>
        )}

        {/* Call to Action */}
        <section className="py-16 bg-primary-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Start Trading?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Join thousands of students already using MyBazaar to buy and sell safely.
            </p>
            
            {user ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/sell">
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                    List Your First Item
                  </Button>
                </Link>
                <Link href="/search">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto text-white border-white hover:bg-white hover:text-primary-600">
                    Start Shopping
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register">
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                    Sign Up Free
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto text-white border-white hover:bg-white hover:text-primary-600">
                    Sign In
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}