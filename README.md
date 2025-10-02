# MyBazaar - Student Marketplace Platform

![MyBazaar Logo](https://img.shields.io/badge/MyBazaar-Student%20Marketplace-14b8a6?style=for-the-badge)
![Version](https://img.shields.io/badge/version-1.0.0-blue?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

## 🎓 Overview

MyBazaar is a premium full-stack student marketplace platform designed specifically for university students in Northern Cyprus. The platform enables safe, efficient buying and selling within the student community, featuring real-time messaging, AI-powered recommendations, content moderation, and comprehensive safety features.

**GitHub Repository:** https://github.com/Ebz30/super-duper-octo-broccoli  
**Support Email:** mybazaarsupp@gmail.com  
**Business Address:** Kucuk Kaymakli, Lefkosa, Northern Cyprus

## ✨ Key Features

### Core Functionality
- 🔐 **Secure Authentication** - Email-based registration with bcrypt password hashing
- 📝 **Item Listings** - Full CRUD operations for buying/selling items
- 🔍 **Advanced Search** - Full-text search with PostgreSQL ts_vector
- 🎯 **Smart Filters** - Category, price range, condition, location filtering
- 💬 **Real-time Messaging** - WebSocket-powered instant communication
- ❤️ **Favorites System** - Save and track items of interest
- 🤖 **AI Recommendations** - Personalized item suggestions based on user behavior
- 🔗 **Social Sharing** - Share listings via WhatsApp, Telegram, Instagram
- 🛡️ **Content Moderation** - Multi-language profanity filtering
- 🚨 **Reporting System** - Report fraudulent or inappropriate content

### Safety & Moderation
- Multi-language profanity detection (English, Turkish, Arabic)
- Automated warning system (3 warnings = account ban)
- User reporting with admin review workflow
- Session-based authentication with 7-day expiry
- Rate limiting (100 requests/minute, 5 login attempts/15 min)

### Technical Highlights
- Responsive design (mobile, tablet, desktop)
- Real-time WebSocket connections
- Image upload with automatic optimization (WebP conversion)
- PostgreSQL full-text search
- Activity tracking for recommendation engine
- Pagination for all list views (20 items/page)

## 🛠️ Technology Stack

### Backend
- **Runtime:** Node.js v18+
- **Framework:** Express.js 4.x
- **Database:** PostgreSQL 14+ (or Supabase)
- **Authentication:** bcrypt + express-session
- **Real-time:** WebSocket (ws library)
- **File Upload:** Multer + Sharp (image processing)
- **Session Store:** connect-pg-simple

### Frontend
- **Framework:** React 18.x
- **Routing:** React Router 6.x
- **HTTP Client:** Axios
- **Styling:** Custom CSS (Teal Green theme)
- **State Management:** Context API

### Database
- **Primary:** PostgreSQL with full-text search
- **Optional:** Supabase (managed PostgreSQL)

## 📦 Installation

### Prerequisites
- Node.js v18 or higher
- PostgreSQL 14+ (or Supabase account)
- npm or yarn package manager

### 1. Clone the Repository
```bash
git clone https://github.com/Ebz30/super-duper-octo-broccoli.git
cd super-duper-octo-broccoli
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your configuration
# Required variables:
# - SUPABASE_URL (your Supabase project URL)
# - SUPABASE_ANON_KEY (your Supabase anonymous key)
# - SUPABASE_SERVICE_KEY (your Supabase service role key)
# - DATABASE_URL (PostgreSQL connection string)
# - SESSION_SECRET (random secret for sessions)
# - PORT (default: 5000)
# - WS_PORT (default: 5001)
# - FRONTEND_URL (default: http://localhost:3000)
```

### 3. Database Setup

#### Option A: Using Supabase (Recommended for quick start)
1. Create a Supabase account at https://supabase.com
2. Create a new project
3. Run the SQL from `database-schema.sql` in the Supabase SQL Editor
4. Copy your project URL and keys to `.env`

#### Option B: Local PostgreSQL
```bash
# Create database
createdb mybazaar

# Run schema
psql -d mybazaar -f ../database-schema.sql

# Update DATABASE_URL in .env
# Example: DATABASE_URL=postgresql://user:password@localhost:5432/mybazaar
```

### 4. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your configuration
# Required variables:
# - REACT_APP_SUPABASE_URL (your Supabase URL)
# - REACT_APP_SUPABASE_ANON_KEY (your Supabase anon key)
# - REACT_APP_API_URL (default: http://localhost:5000)
# - REACT_APP_WS_URL (default: ws://localhost:5001)
```

### 5. Run the Application

#### Development Mode

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- WebSocket: ws://localhost:5001

## 🚀 Deployment

### Backend Deployment (Heroku, Railway, Render)

1. Set environment variables on your hosting platform
2. Ensure PostgreSQL database is provisioned
3. Run database migration:
   ```bash
   psql $DATABASE_URL -f database-schema.sql
   ```
4. Deploy backend:
   ```bash
   npm start
   ```

### Frontend Deployment (Vercel, Netlify)

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Deploy the `build` folder to your hosting platform

3. Set environment variables:
   - `REACT_APP_API_URL`: Your backend URL
   - `REACT_APP_WS_URL`: Your WebSocket URL
   - `REACT_APP_SUPABASE_URL`: Your Supabase URL
   - `REACT_APP_SUPABASE_ANON_KEY`: Your Supabase key

### Environment Variables Summary

**Backend (.env)**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
DATABASE_URL=postgresql://user:pass@host:5432/mybazaar
SESSION_SECRET=your-random-secret-min-32-chars
PORT=5000
WS_PORT=5001
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
```

**Frontend (.env)**
```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_API_URL=https://your-backend-domain.com
REACT_APP_WS_URL=wss://your-backend-domain.com
```

## 📖 API Documentation

### Authentication Endpoints

#### POST /api/auth/register
Register a new user account.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account created successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "created_at": "2025-10-03T12:00:00Z"
  }
}
```

#### POST /api/auth/login
Login to existing account.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!",
  "rememberMe": false
}
```

#### POST /api/auth/logout
Logout current user.

#### GET /api/auth/me
Get current user information.

### Items Endpoints

#### GET /api/items
Get all items with optional filtering.

**Query Parameters:**
- `search` - Search term
- `category` - Category ID
- `min_price` - Minimum price
- `max_price` - Maximum price
- `condition` - Item condition
- `location` - Location filter
- `sort` - Sort order (newest, price_asc, price_desc, popular)
- `page` - Page number (default: 1)

#### GET /api/items/:id
Get single item details.

#### POST /api/items
Create new item listing (requires authentication).

**Request:** multipart/form-data
- `title` - Item title (3-200 chars)
- `description` - Item description (20-2000 chars)
- `category_id` - Category ID
- `price` - Price (0-999,999.99)
- `discount_percentage` - Discount % (0-90, optional)
- `condition` - New, Like New, Good, Fair, or Poor
- `location` - Location (max 100 chars)
- `images` - Image files (1-10, max 5MB each)

#### PUT /api/items/:id
Update item listing (requires authentication, owner only).

#### DELETE /api/items/:id
Delete item listing (soft delete, requires authentication, owner only).

### Favorites Endpoints

#### GET /api/favorites
Get user's favorite items (requires authentication).

#### POST /api/favorites
Add item to favorites (requires authentication).

**Request:**
```json
{
  "item_id": 123
}
```

#### DELETE /api/favorites/:itemId
Remove item from favorites (requires authentication).

### Conversations & Messaging

#### GET /api/conversations
Get user's conversations (requires authentication).

#### POST /api/conversations
Create new conversation (requires authentication).

**Request:**
```json
{
  "item_id": 123,
  "seller_id": 456
}
```

#### GET /api/conversations/:id/messages
Get messages in conversation (requires authentication).

#### PUT /api/conversations/messages/mark-read
Mark messages as read (requires authentication).

### WebSocket Messages

Connect to WebSocket with user ID:
```javascript
const ws = new WebSocket('ws://localhost:5001?userId=123');
```

**Send Message:**
```json
{
  "type": "send_message",
  "conversation_id": 1,
  "content": "Hello!"
}
```

**Receive Message:**
```json
{
  "type": "new_message",
  "message": {
    "id": 123,
    "conversation_id": 1,
    "sender_id": 2,
    "sender_name": "Jane Doe",
    "content": "Hi there!",
    "created_at": "2025-10-03T12:00:00Z"
  }
}
```

### Recommendations

#### GET /api/recommendations
Get personalized recommendations (requires authentication).

**Query Parameters:**
- `limit` - Number of items (default: 12)

#### GET /api/recommendations/popular
Get popular items (public).

### Reports

#### POST /api/reports
Submit a report (requires authentication).

**Request:**
```json
{
  "report_type": "scam",
  "reported_item_id": 123,
  "description": "This item appears to be fraudulent"
}
```

### Categories

#### GET /api/categories
Get all categories.

#### GET /api/categories/with-counts
Get categories with item counts.

## 🎨 Design System

### Color Palette (Teal Green Theme)

**Primary Colors:**
- Primary 500: `#14b8a6` (Main brand color)
- Primary 600: `#0d9488` (Hover states)
- Primary 700: `#0f766e` (Pressed states)

**Semantic Colors:**
- Success: `#10b981`
- Warning: `#f59e0b`
- Error: `#ef4444`
- Info: `#14b8a6`

### Typography
- **Primary Font:** Inter, system-ui
- **Font Sizes:** 12px - 48px (responsive)
- **Font Weights:** 300, 400, 500, 600, 700

## 🔒 Security Features

1. **Password Security**
   - Bcrypt hashing with 10 salt rounds
   - Minimum 8 characters
   - Requires uppercase, number, and special character

2. **Session Management**
   - PostgreSQL session store
   - 7-day default expiry (30 days with "Remember Me")
   - Automatic cleanup of expired sessions

3. **Rate Limiting**
   - 100 requests per minute per IP/user
   - 5 login attempts per 15 minutes
   - 30-minute account lockout after 5 failed attempts

4. **Content Moderation**
   - Multi-language profanity filtering
   - Automatic warning system
   - 3-strike ban policy

5. **Data Validation**
   - Server-side input validation
   - SQL injection prevention (parameterized queries)
   - File upload validation (type, size)

## 📊 Database Schema

Key tables:
- `users` - User accounts
- `items` - Item listings
- `categories` - Item categories
- `favorites` - User favorites
- `conversations` - Chat conversations
- `messages` - Chat messages
- `user_activities` - Activity tracking for recommendations
- `reports` - User reports
- `sessions` - Session storage

See `database-schema.sql` for complete schema.

## 🧪 Testing

### Manual Testing Checklist

- [ ] User registration and login
- [ ] Create, edit, delete item listing
- [ ] Search and filter items
- [ ] Add/remove favorites
- [ ] Send messages via WebSocket
- [ ] View personalized recommendations
- [ ] Share items on social media
- [ ] Submit reports
- [ ] Content moderation (try profanity)

### Running Tests

```bash
# Backend tests (if implemented)
cd backend
npm test

# Frontend tests (if implemented)
cd frontend
npm test
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👥 Authors

- Initial Development - [Your Name]
- For support: mybazaarsupp@gmail.com

## 🙏 Acknowledgments

- Northern Cyprus university student communities
- Open source libraries and frameworks used in this project
- Supabase for managed PostgreSQL database

## 📞 Support

For support, email mybazaarsupp@gmail.com or create an issue on GitHub.

## 🗺️ Roadmap

### Version 1.1 (Future)
- [ ] Mobile app (React Native)
- [ ] Payment integration
- [ ] Email notifications
- [ ] Advanced analytics dashboard
- [ ] User verification system
- [ ] In-app image filters
- [ ] Multi-currency support
- [ ] Arabic and Turkish language support

### Version 2.0 (Future)
- [ ] AI-based image content moderation
- [ ] Price prediction using ML
- [ ] Delivery tracking
- [ ] Seller ratings and reviews
- [ ] Video uploads for listings
- [ ] Advanced fraud detection

---

Made with ❤️ for students, by students 🎓
