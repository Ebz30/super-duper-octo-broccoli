# MyBazaar - Student Marketplace

The premier trusted marketplace for students across Northern Cyprus universities, providing a safe, efficient, and community-focused platform that simplifies student life through seamless buying and selling experiences.

## 🎯 Features

### Core Functionality
- **User Authentication**: Secure registration, login, and session management
- **Item Listings**: Full CRUD operations with image upload and management
- **Advanced Search**: Multi-filter search with real-time suggestions
- **AI Recommendations**: Personalized item recommendations based on user behavior
- **Favorites System**: Save and manage favorite items
- **Real-time Messaging**: Direct communication between buyers and sellers
- **Content Moderation**: Automated profanity filtering and user reporting system

### Safety & Security
- **Content Validation**: Multi-language profanity detection
- **User Reporting**: Comprehensive reporting system for inappropriate content
- **Account Protection**: Warning system and automatic banning for violations
- **Session Security**: JWT-based authentication with secure session management

### User Experience
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Modern UI**: Clean, intuitive interface with teal green theme
- **Image Optimization**: Automatic image processing and WebP conversion
- **Social Sharing**: Share listings on WhatsApp, Telegram, and more

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icons

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Supabase** - PostgreSQL database with real-time capabilities
- **Sharp** - High-performance image processing
- **bcryptjs** - Password hashing
- **JWT** - Authentication tokens

### Database
- **PostgreSQL** - Primary database via Supabase
- **Row Level Security** - Database-level access control
- **Full-text Search** - Advanced search capabilities
- **Automated Functions** - Database triggers and functions

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Git

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
   
   Update `.env.local` with your configuration:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
   
   # JWT Secret
   JWT_SECRET=your_jwt_secret_here_change_in_production
   
   # App Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NODE_ENV=development
   ```

4. **Set up the database**
   - Create a new Supabase project
   - Run the SQL schema from `database/schema.sql` in the Supabase SQL editor
   - Set up storage bucket for images (name: `item-images`)

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── login/             # Authentication pages
│   ├── register/
│   └── search/            # Search and browse pages
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── items/            # Item-related components
│   ├── layout/           # Layout components
│   ├── search/           # Search and filter components
│   └── ui/               # Reusable UI components
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
│   ├── auth.ts           # Authentication service
│   ├── items.ts          # Item management service
│   ├── favorites.ts      # Favorites service
│   ├── messaging.ts      # Messaging service
│   ├── recommendations.ts # AI recommendation engine
│   ├── moderation.ts     # Content moderation
│   ├── profanity.ts      # Profanity filtering
│   ├── supabase.ts       # Database client
│   └── utils.ts          # Utility functions
└── middleware.ts         # Next.js middleware for auth
```

## 🔧 Configuration

### Database Schema
The complete database schema is available in `database/schema.sql`. Key tables include:
- `users` - User accounts and profiles
- `items` - Item listings with full-text search
- `categories` - Predefined item categories
- `favorites` - User favorite items
- `conversations` - Messaging conversations
- `messages` - Individual messages
- `reports` - User reports and moderation
- `user_activities` - Activity tracking for recommendations

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side only)
- `JWT_SECRET` - Secret for JWT token signing
- `NEXT_PUBLIC_APP_URL` - Your app's public URL

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

### Manual Deployment
1. Build the application:
   ```bash
   npm run build
   ```
2. Start the production server:
   ```bash
   npm start
   ```

## 📊 Key Features Implementation

### AI-Powered Recommendations
- User activity tracking (views, favorites, searches)
- Preference calculation based on interaction history
- Category and price range analysis
- Real-time recommendation generation

### Content Moderation
- Multi-language profanity detection
- Automated content validation
- User warning and banning system
- Community reporting features

### Search & Filtering
- Full-text search across titles and descriptions
- Multi-category filtering
- Price range filtering
- Condition and location filters
- Real-time search suggestions

### Image Management
- Automatic image optimization with Sharp
- WebP conversion for better performance
- Thumbnail generation
- Supabase Storage integration

## 🔒 Security Features

- **Authentication**: Secure JWT-based authentication
- **Authorization**: Role-based access control
- **Input Validation**: Comprehensive input sanitization
- **Rate Limiting**: API rate limiting for reports and uploads
- **Content Moderation**: Automated and manual content review
- **Session Management**: Secure session handling with expiration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📧 Support

For support and questions, contact: mybazaarsupp@gmail.com

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🏢 Business Information

**MyBazaar**  
Kucuk Kaymakli, Lefkosa  
Northern Cyprus  

**Support Email**: mybazaarsupp@gmail.com  
**GitHub Repository**: https://github.com/Ebz30/super-duper-octo-broccoli

---

Made with ❤️ for the student community in Northern Cyprus 🎓