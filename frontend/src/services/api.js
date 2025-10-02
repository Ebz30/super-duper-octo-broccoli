import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// API service methods
const apiService = {
  // Auth
  auth: {
    register: (data) => api.post('/api/auth/register', data),
    login: (data) => api.post('/api/auth/login', data),
    logout: () => api.post('/api/auth/logout'),
    getMe: () => api.get('/api/auth/me')
  },
  
  // Items
  items: {
    getAll: (params) => api.get('/api/items', { params }),
    getById: (id) => api.get(`/api/items/${id}`),
    create: (formData) => api.post('/api/items', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    update: (id, formData) => api.put(`/api/items/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    delete: (id) => api.delete(`/api/items/${id}`),
    getMyItems: () => api.get('/api/items/user/my-items'),
    share: (id, platform) => api.post(`/api/items/${id}/share`, { platform })
  },
  
  // Favorites
  favorites: {
    getAll: (params) => api.get('/api/favorites', { params }),
    add: (itemId) => api.post('/api/favorites', { item_id: itemId }),
    remove: (itemId) => api.delete(`/api/favorites/${itemId}`),
    check: (itemId) => api.get(`/api/favorites/check/${itemId}`)
  },
  
  // Categories
  categories: {
    getAll: () => api.get('/api/categories'),
    getAllWithCounts: () => api.get('/api/categories/with-counts')
  },
  
  // Conversations
  conversations: {
    getAll: () => api.get('/api/conversations'),
    create: (data) => api.post('/api/conversations', data),
    getMessages: (id, params) => api.get(`/api/conversations/${id}/messages`, { params }),
    markRead: (conversationId) => api.put('/api/conversations/messages/mark-read', { conversation_id: conversationId }),
    getUnreadCount: () => api.get('/api/conversations/unread-count')
  },
  
  // Recommendations
  recommendations: {
    getPersonalized: (limit) => api.get('/api/recommendations', { params: { limit } }),
    getPopular: (limit) => api.get('/api/recommendations/popular', { params: { limit } })
  },
  
  // Reports
  reports: {
    submit: (data) => api.post('/api/reports', data),
    getMyReports: () => api.get('/api/reports/my-reports')
  }
};

export default apiService;
export { API_URL };
