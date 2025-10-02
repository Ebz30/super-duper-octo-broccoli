import { NextRequest, NextResponse } from 'next/server'
import { MessagingService } from '@/lib/messaging'
import { AuthService } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Get user from session
    const sessionToken = request.cookies.get('session_token')?.value
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = await AuthService.verifySession(sessionToken)
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get('page')) || 1
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 50)

    const result = await MessagingService.getUserConversations(user.id, page, limit)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Conversations API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user from session
    const sessionToken = request.cookies.get('session_token')?.value
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = await AuthService.verifySession(sessionToken)
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { item_id, seller_id } = body

    if (!item_id || !seller_id) {
      return NextResponse.json(
        { error: 'Item ID and seller ID are required' },
        { status: 400 }
      )
    }

    const result = await MessagingService.createConversation(user.id, {
      item_id,
      seller_id,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      conversation: result.conversation,
    })
  } catch (error) {
    console.error('Create conversation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}