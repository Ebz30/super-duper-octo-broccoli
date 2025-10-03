// Shared types between client and server

export interface User {
  id: string;
  email: string;
  fullName: string;
  university: string;
  profilePictureUrl?: string | null;
  bio?: string | null;
  phoneNumber?: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date | null;
  isBanned: boolean;
  warningCount: number;
  emailVerified: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  emoji?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
}

export type Condition = 'new' | 'like_new' | 'good' | 'fair' | 'poor';
export type AvailabilityStatus = 'available' | 'pending' | 'sold' | 'removed';

export interface Item {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  categoryId: string;
  price: string;
  currency: string;
  discountPercentage?: number | null;
  condition: Condition;
  images: string[];
  location?: string | null;
  availabilityStatus: AvailabilityStatus;
  viewCount: number;
  favoriteCount: number;
  contactCount: number;
  createdAt: Date;
  updatedAt: Date;
  soldAt?: Date | null;
  isFeatured: boolean;
  // Relations
  seller?: Pick<User, 'id' | 'fullName' | 'university' | 'profilePictureUrl'>;
  category?: Pick<Category, 'id' | 'name' | 'slug' | 'icon' | 'emoji'>;
}

export interface Favorite {
  id: string;
  userId: string;
  itemId: string;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  itemId: string;
  buyerId: string;
  sellerId: string;
  createdAt: Date;
  lastMessageAt: Date;
  buyerUnreadCount: number;
  sellerUnreadCount: number;
  isArchived: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  readAt?: Date | null;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

// Form types
export interface RegisterFormData {
  email: string;
  password: string;
  fullName: string;
  university: string;
}

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface CreateItemFormData {
  title: string;
  description: string;
  categoryId: string;
  price: number;
  discountPercentage?: number;
  condition: Condition;
  location: string;
  images: File[];
}
