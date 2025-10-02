// Type definitions for MyBazaar

export interface User {
  id: string;
  email: string;
  name: string;
  university?: string;
  phone?: string;
  bio?: string;
  profile_picture_url?: string;
  warning_count: number;
  is_banned: boolean;
  ban_reason?: string;
  banned_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  icon: string;
  created_at: string;
}

export interface Item {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  category_id: number;
  price: number;
  discount_percentage: number;
  condition: 'New' | 'Like New' | 'Good' | 'Fair' | 'Poor';
  location: string;
  images: string[];
  is_available: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  // Joined data
  seller?: User;
  category?: Category;
}

export interface Favorite {
  id: string;
  user_id: string;
  item_id: string;
  created_at: string;
  item?: Item;
}

export interface Conversation {
  id: string;
  buyer_id: string;
  seller_id: string;
  item_id: string;
  created_at: string;
  updated_at: string;
  // Joined data
  buyer?: User;
  seller?: User;
  item?: Item;
  last_message?: Message;
  unread_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  // Joined data
  sender?: User;
}

export interface UserActivity {
  id: string;
  user_id: string;
  activity_type: 'view' | 'favorite' | 'contact' | 'search' | 'filter';
  item_id?: string;
  category_id?: number;
  item_price?: number;
  condition?: string;
  search_query?: string;
  filter_params?: any;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  report_type: 'scam' | 'inappropriate_content' | 'fake_listing' | 'spam' | 'safety_concern' | 'other';
  reported_item_id?: string;
  reported_user_id?: string;
  description: string;
  evidence_urls: string[];
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
  admin_notes?: string;
  created_at: string;
  resolved_at?: string;
}

export interface Session {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pages: number;
  has_more: boolean;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  university?: string;
  phone?: string;
}

export interface ItemForm {
  title: string;
  description: string;
  category_id: number;
  price: number;
  discount_percentage?: number;
  condition: 'New' | 'Like New' | 'Good' | 'Fair' | 'Poor';
  location: string;
  images: File[];
}

export interface SearchFilters {
  category?: number[];
  min_price?: number;
  max_price?: number;
  condition?: string[];
  location?: string;
  search?: string;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'popular';
  is_available?: boolean;
  page?: number;
}

export interface ReportForm {
  report_type: 'scam' | 'inappropriate_content' | 'fake_listing' | 'spam' | 'safety_concern' | 'other';
  reported_item_id?: string;
  reported_user_id?: string;
  description: string;
  evidence_urls?: string[];
}

// WebSocket message types
export interface WebSocketMessage {
  type: 'send_message' | 'mark_read' | 'typing' | 'user_online' | 'user_offline';
  conversation_id?: string;
  content?: string;
  sender_id?: string;
}

// Recommendation types
export interface UserPreferences {
  categoryWeights: Record<string, number>;
  priceRangeLow: number;
  priceRangeHigh: number;
  preferredConditions: string[];
}

export interface RecommendationItem extends Item {
  score: number;
  reason: string;
}

// Constants
export const CATEGORIES: Category[] = [
  { id: 1, name: 'Electronics & Gadgets', icon: 'laptop' },
  { id: 2, name: 'Books & Academic Materials', icon: 'book' },
  { id: 3, name: 'Furniture & Home Decor', icon: 'home' },
  { id: 4, name: 'Clothing & Accessories', icon: 'shirt' },
  { id: 5, name: 'Sports & Fitness', icon: 'dumbbell' },
  { id: 6, name: 'Kitchen & Appliances', icon: 'utensils' },
  { id: 7, name: 'Bicycles & Transportation', icon: 'bike' },
  { id: 8, name: 'Other', icon: 'grid' }
];

export const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Poor'] as const;

export const REPORT_TYPES = [
  'scam',
  'inappropriate_content',
  'fake_listing',
  'spam',
  'safety_concern',
  'other'
] as const;

export const SHARE_PLATFORMS = ['whatsapp', 'telegram', 'instagram', 'copy'] as const;