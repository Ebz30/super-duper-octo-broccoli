import { NextRequest, NextResponse } from 'next/server'
import { ItemService } from '@/lib/items'
import { AuthService } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse filters
    const filters = {
      category: searchParams.get('category')?.split(',').map(Number).filter(Boolean),
      min_price: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
      max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
      condition: searchParams.get('condition')?.split(',').filter(Boolean),
      location: searchParams.get('location') || undefined,
      search: searchParams.get('search') || undefined,
      is_available: searchParams.get('is_available') !== 'false',
    }

    const page = Number(searchParams.get('page')) || 1
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 50) // Max 50 items per page
    const sort = searchParams.get('sort') || 'newest'

    const result = await ItemService.getItems(filters, page, limit, sort)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Items API error:', error)
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
    const {
      title,
      description,
      category_id,
      price,
      discount_percentage,
      condition,
      location,
      images,
    } = body

    // Validate required fields
    if (!title || !description || !category_id || !price || !condition || !location || !images) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const result = await ItemService.createItem(user.id, {
      title,
      description,
      category_id: Number(category_id),
      price: Number(price),
      discount_percentage: Number(discount_percentage) || 0,
      condition,
      location,
      images,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      item: result.item,
    })
  } catch (error) {
    console.error('Create item API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}