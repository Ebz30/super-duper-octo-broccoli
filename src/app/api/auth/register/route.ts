import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/lib/auth';
import { validateListingContent } from '@/lib/content-moderation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, confirmPassword, name, university, phone } = body;

    // Validate required fields
    if (!email || !password || !confirmPassword || !name) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    // Validate name content
    const nameValidation = validateListingContent(name, name);
    if (!nameValidation.valid) {
      return NextResponse.json(
        { success: false, error: nameValidation.errors[0] },
        { status: 400 }
      );
    }

    // Register user
    const result = await registerUser(email, password, name, university, phone);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Set HTTP-only cookie for session
    const response = NextResponse.json({
      success: true,
      user: result.user,
      message: 'Registration successful',
    });

    response.cookies.set('session_token', result.token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Registration API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}