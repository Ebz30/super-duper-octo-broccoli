import { NextRequest, NextResponse } from 'next/server'
import { ModerationService } from '@/lib/moderation'
import { AuthService } from '@/lib/auth'

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

    // Check rate limit
    const rateLimit = await ModerationService.checkReportRateLimit(user.id)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: `Too many reports. You can submit ${rateLimit.remainingReports} more reports after ${rateLimit.resetTime.toLocaleTimeString()}`,
        },
        { status: 429 }
      )
    }

    const body = await request.json()
    const {
      report_type,
      reported_item_id,
      reported_user_id,
      description,
      evidence_urls,
    } = body

    // Validate required fields
    if (!report_type || !description) {
      return NextResponse.json(
        { error: 'Report type and description are required' },
        { status: 400 }
      )
    }

    const result = await ModerationService.submitReport(user.id, {
      report_type,
      reported_item_id,
      reported_user_id,
      description,
      evidence_urls,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      reportId: result.reportId,
      message: 'Report submitted successfully. We will review it shortly.',
    })
  } catch (error) {
    console.error('Submit report API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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

    const result = await ModerationService.getUserReports(user.id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      reports: result.reports,
    })
  } catch (error) {
    console.error('Get reports API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}