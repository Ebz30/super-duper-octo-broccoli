import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session_token')?.value

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const user = await AuthService.verifySession(sessionToken)

    if (!user) {
      const response = NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
      response.cookies.delete('session_token')
      return response
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Me API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}