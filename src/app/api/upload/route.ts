import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth'
import { UploadService } from '@/lib/upload'

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

    // Parse form data
    const formData = await request.formData()
    const files = formData.getAll('images') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    // Upload images
    const result = await UploadService.uploadImages(files, user.id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.errors[0] || 'Upload failed' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      urls: result.urls,
      errors: result.errors,
    })
  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}