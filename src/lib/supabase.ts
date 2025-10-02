import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client for browser usage
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client for server-side operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Database types
export interface User {
  id: string
  email: string
  name: string
  university?: string
  phone?: string
  bio?: string
  profile_picture?: string
  warning_count: number
  is_banned: boolean
  ban_reason?: string
  banned_at?: string
  created_at: string
  updated_at: string
}

export interface Category {
  id: number
  name: string
  icon: string
  created_at: string
}

export interface Item {
  id: string
  seller_id: string
  title: string
  description: string
  category_id: number
  price: number
  discount_percentage: number
  condition: 'New' | 'Like New' | 'Good' | 'Fair' | 'Poor'
  location: string
  images: string[]
  is_available: boolean
  view_count: number
  is_deleted: boolean
  created_at: string
  updated_at: string
  seller?: User
  category?: Category
}

export interface Favorite {
  id: string
  user_id: string
  item_id: string
  created_at: string
  item?: Item
}

export interface UserActivity {
  id: string
  user_id: string
  item_id: string
  activity_type: 'view' | 'favorite' | 'contact' | 'search' | 'filter'
  metadata?: any
  created_at: string
}

export interface Conversation {
  id: string
  item_id: string
  buyer_id: string
  seller_id: string
  created_at: string
  updated_at: string
  item?: Item
  buyer?: User
  seller?: User
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
  sender?: User
}

export interface Report {
  id: string
  reporter_id: string
  reported_user_id?: string
  reported_item_id?: string
  report_type: 'scam' | 'inappropriate_content' | 'fake_listing' | 'spam' | 'safety_concern' | 'other'
  description: string
  evidence_urls?: string[]
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed'
  admin_notes?: string
  created_at: string
  resolved_at?: string
}

export interface UserSession {
  id: string
  user_id: string
  session_token: string
  expires_at: string
  created_at: string
}