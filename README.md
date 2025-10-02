# MyBazaar - Student Marketplace

A premium full-stack student marketplace platform designed to facilitate safe, efficient buying and selling among university students in Northern Cyprus.

## Features

### Core Functionality
- **User Authentication**: Secure email/password registration and login with session management
- **Item Management**: Complete CRUD operations for item listings with image upload
- **Advanced Search**: Full-text search with filtering by category, price, condition, and location
- **Real-time Messaging**: Built-in chat system for buyer-seller communication
- **Favorites System**: Save items for later viewing
- **AI Recommendations**: Smart recommendations based on user behavior and preferences

### Safety & Moderation
- **Content Moderation**: Automated profanity detection and content filtering
- **Reporting System**: Comprehensive reporting for inappropriate content, scams, and safety concerns
- **User Verification**: Warning system with automatic bans for repeat offenders
- **Session Management**: Secure session handling with automatic cleanup

### User Experience
- **Responsive Design**: Mobile-first design that works on all devices
- **Modern UI**: Clean, intuitive interface with teal green theme
- **Social Sharing**: Share items on WhatsApp, Telegram, Instagram, and copy links
- **Real-time Updates**: Live notifications and message updates

## Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **React Hook Form** - Form handling with validation
- **Zod** - Schema validation
- **Lucide React** - Icon library
- **React Hot Toast** - Toast notifications
- **Framer Motion** - Animation library

### Backend
- **Supabase** - Database and authentication
- **PostgreSQL** - Primary database
- **Row Level Security** - Database-level security
- **JWT** - Session management
- **bcrypt** - Password hashing

### Database Schema
- **Users** - User accounts and profiles
- **Items** - Product listings
- **Categories** - Item categorization
- **Favorites** - User saved items
- **Conversations** - Chat conversations
- **Messages** - Individual chat messages
- **User Activities** - Behavior tracking for recommendations
- **Reports** - Safety reporting system
- **Sessions** - User session management

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Ebz30/super-duper-octo-broccoli.git
   cd super-duper-octo-broccoli
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   JWT_SECRET=your_jwt_secret
   ```

4. **Set up the database**
   - Create a new Supabase project
   - Run the SQL schema from `src/lib/database.sql`
   - Enable Row Level Security policies

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
mybazaar/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── api/             # API routes
│   │   ├── auth/            # Authentication pages
│   │   ├── browse/          # Item browsing
│   │   ├── dashboard/       # User dashboard
│   │   ├── favorites/       # User favorites
│   │   ├── items/           # Item detail pages
│   │   ├── messages/        # Messaging interface
│   │   └── sell/            # Item creation
│   ├── components/          # Reusable components
│   │   ├── auth/            # Authentication forms
│   │   ├── items/           # Item-related components
│   │   ├── layout/          # Layout components
│   │   ├── messaging/       # Chat components
│   │   └── reporting/       # Reporting components
│   ├── contexts/            # React contexts
│   ├── lib/                 # Utility libraries
│   │   ├── auth.ts          # Authentication logic
│   │   ├── content-moderation.ts # Content filtering
│   │   ├── database.sql     # Database schema
│   │   ├── recommendations.ts # AI recommendations
│   │   ├── supabase.ts      # Supabase client
│   │   └── types.ts         # TypeScript types
│   └── styles/              # Global styles
├── public/                  # Static assets
├── tailwind.config.ts       # Tailwind configuration
└── package.json             # Dependencies and scripts
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Items
- `GET /api/items` - Get items with filtering
- `POST /api/items` - Create new item
- `GET /api/items/[id]` - Get single item
- `PUT /api/items/[id]` - Update item
- `DELETE /api/items/[id]` - Delete item
- `GET /api/items/recommended` - Get recommended items
- `GET /api/items/trending` - Get trending items

### Favorites
- `GET /api/favorites` - Get user favorites
- `POST /api/favorites` - Add to favorites
- `DELETE /api/favorites` - Remove from favorites
- `GET /api/favorites/check/[itemId]` - Check favorite status

### Messaging
- `GET /api/conversations` - Get conversations
- `POST /api/conversations` - Create conversation
- `GET /api/conversations/[id]/messages` - Get messages
- `POST /api/conversations/[id]/messages` - Send message
- `GET /api/conversations/unread-count` - Get unread count
- `PUT /api/messages/mark-read` - Mark messages as read

### Reporting
- `GET /api/reports` - Get user reports
- `POST /api/reports` - Submit report

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Manual Deployment
1. Build the application:
   ```bash
   npm run build
   ```
2. Start the production server:
   ```bash
   npm start
   ```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email mybazaarsupp@gmail.com or create an issue on GitHub.

## Business Information

- **Company**: MyBazaar
- **Address**: Kucuk Kaymakli, Lefkosa
- **Support Email**: mybazaarsupp@gmail.com
- **GitHub Repository**: https://github.com/Ebz30/super-duper-octo-broccoli