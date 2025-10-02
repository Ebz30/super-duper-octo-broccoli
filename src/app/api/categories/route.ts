import { NextResponse } from 'next/server'
import { ItemService } from '@/lib/items'

export async function GET() {
  try {
    const categories = await ItemService.getCategories()
    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Categories API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}