import { NextRequest, NextResponse } from 'next/server'
import { RecommendationService } from '@/lib/recommendations'
import { AuthService } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'personalized'
    const limit = Math.min(Number(searchParams.get('limit')) || 12, 24)

    // For trending recommendations, no auth required
    if (type === 'trending') {
      const items = await RecommendationService.getTrendingItems(limit)
      return NextResponse.json({ items })
    }

    // For personalized recommendations, auth required
    const sessionToken = request.cookies.get('session_token')?.value
    if (!sessionToken) {
      // Return trending items for unauthenticated users
      const items = await RecommendationService.getTrendingItems(limit)
      return NextResponse.json({ items })
    }

    const user = await AuthService.verifySession(sessionToken)
    if (!user) {
      // Return trending items for invalid sessions
      const items = await RecommendationService.getTrendingItems(limit)
      return NextResponse.json({ items })
    }

    // Generate personalized recommendations
    const items = await RecommendationService.generateRecommendations(user.id, limit)
    
    return NextResponse.json({ items })
  } catch (error) {
    console.error('Recommendations API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}