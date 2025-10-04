import axios from 'axios';
import type { 
  User, 
  Item, 
  Category, 
  Conversation, 
  Message,
  RegisterFormData,
  LoginFormData,
  PaginatedResponse 
} from '@shared/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API service
export const apiService = {
  // Authentication
  auth: {
    register: (data: RegisterFormData) => 
      api.post<{ success: boolean; user: User }>('/api/auth/register', data),
    
    login: (data: LoginFormData) => 
      api.post<{ success: boolean; user: User }>('/api/auth/login', data),
    
    logout: () => 
      api.post<{ success: boolean }>('/api/auth/logout'),
    
    getMe: () => 
      api.get<{ success: boolean; user: User }>('/api/auth/me'),
  },

  // Items (TODO - will be implemented next)
  items: {
    getAll: (params?: any) => 
      api.get<PaginatedResponse<Item>>('/api/items', { params }),
    
    getById: (id: string) => 
      api.get<{ success: boolean; item: Item }>(`/api/items/${id}`),
    
    create: (formData: FormData) => 
      api.post<{ success: boolean; item: Item }>('/api/items', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    
    update: (id: string, formData: FormData) => 
      api.put<{ success: boolean; item: Item }>(`/api/items/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    
    delete: (id: string) => 
      api.delete<{ success: boolean }>(`/api/items/${id}`),
  },

  // Categories
  categories: {
    getAll: () => 
      api.get<{ success: boolean; categories: Category[] }>('/api/categories'),
  },

  // Favorites (TODO)
  favorites: {
    getAll: () => 
      api.get<PaginatedResponse<Item>>('/api/favorites'),
    
    add: (itemId: string) => 
      api.post<{ success: boolean }>('/api/favorites', { itemId }),
    
    remove: (itemId: string) => 
      api.delete<{ success: boolean }>(`/api/favorites/${itemId}`),
    
    check: (itemId: string) => 
      api.get<{ success: boolean; isFavorited: boolean }>(`/api/favorites/check/${itemId}`),
  },

  // Conversations
  conversations: {
    getAll: () => 
      api.get<{ success: boolean; conversations: any[] }>('/api/conversations'),
    
    create: (itemId: string, sellerId: string) => 
      api.post<{ success: boolean; conversation: any }>('/api/conversations', { 
        itemId, 
        sellerId 
      }),
    
    getMessages: (id: string, params?: any) => 
      api.get<{ success: boolean; messages: Message[]; pagination: any }>(`/api/conversations/${id}/messages`, { params }),
    
    sendMessage: (id: string, data: { content: string }) =>
      api.post<{ success: boolean; message: Message }>(`/api/conversations/${id}/messages`, data),
  },
};

export default apiService;
export { API_URL };
