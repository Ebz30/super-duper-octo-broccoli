# MyBazaar v2.0 - Student Marketplace Platform

![Version](https://img.shields.io/badge/version-2.0.0--alpha-blue)
![Phase](https://img.shields.io/badge/phase-1%20(80%25)-green)
![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)

> **Premium full-stack student marketplace built with TypeScript, React 18, Express, and Drizzle ORM**

## 🎯 Project Overview

MyBazaar v2.0 is a complete rewrite of the student marketplace platform using modern technologies and following a comprehensive 28,000-word Product Requirements Document. This version features TypeScript throughout, a monorepo architecture, and the beautiful teal green design system.

### Key Features (Phase 1 - Core MVP)

- ✅ **Type-Safe Full Stack**: TypeScript everywhere (client, server, shared types)
- ✅ **Modern Tech Stack**: Vite, React 18, Express, Drizzle ORM
- ✅ **Teal Design System**: Beautiful UI with Tailwind CSS + shadcn/ui
- ✅ **Secure Authentication**: bcrypt + PostgreSQL sessions - WORKING!
- ✅ **User Registration/Login**: Full auth flow with validation - WORKING!
- ✅ **UI Components**: Button, Input, Card, Toast, Label - COMPLETE!
- ✅ **Items API**: CRUD endpoints with filters and search - READY!
- 🚧 **Browse Items Page**: Grid view with filters (Session 3)
- 🚧 **Real-time Messaging**: WebSocket-based chat (Session 4)
- 🚧 **AI Recommendations**: Activity-based suggestions (Session 4)

## 🏗️ Architecture

### Monorepo Structure

```
mybazaar-v2/
├── client/          # React 18 + Vite + TypeScript frontend
├── server/          # Express + TypeScript + Drizzle ORM backend
└── shared/          # Shared TypeScript types and utilities
```

### Technology Stack

#### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite (lightning-fast HMR)
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Routing**: Wouter (lightweight, < 2KB)
- **Forms**: React Hook Form + Zod validation
- **State**: TanStack Query for server state
- **Animations**: Framer Motion

#### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (Neon/Supabase)
- **ORM**: Drizzle ORM (type-safe queries)
- **Authentication**: bcrypt + express-session
- **Validation**: Zod schemas
- **Real-time**: Native WebSocket (ws)
- **File Upload**: Multer + Sharp (image optimization)

#### Development Tools
- **TypeScript**: Full-stack type safety
- **ESBuild**: Fast production builds
- **Drizzle Kit**: Database migrations
- **tsx**: TypeScript execution for development

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or Neon/Supabase)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd mybazaar-v2

# Install all dependencies (monorepo)
npm install

# Set up environment variables
cp server/.env.example server/.env
# Edit server/.env with your database credentials

cp client/.env.example client/.env
# Edit client/.env with API URLs
```

### Database Setup

```bash
# Generate database schema
npm run db:generate

# Push schema to database
npm run db:push

# Seed initial data (categories)
cd server
npm run db:migrate
```

### Development

```bash
# Start both client and server in development mode
npm run dev

# Or start individually:
npm run dev:client  # Frontend on http://localhost:3000
npm run dev:server  # Backend on http://localhost:5000
```

### Production Build

```bash
# Build all packages
npm run build

# Start production server
npm start
```

## 📁 Project Structure

### Client (Frontend)

```
client/
├── src/
│   ├── components/     # React components
│   │   ├── ui/        # shadcn/ui components
│   │   └── shared/    # Shared components
│   ├── pages/         # Page components
│   ├── lib/           # Utilities and helpers
│   ├── hooks/         # Custom React hooks
│   ├── services/      # API services
│   └── index.css      # Global styles + Tailwind
├── public/            # Static assets
├── vite.config.ts     # Vite configuration
├── tailwind.config.js # Tailwind + design system
└── tsconfig.json      # TypeScript config
```

### Server (Backend)

```
server/
├── src/
│   ├── db/
│   │   ├── schema.ts  # Drizzle ORM schema
│   │   ├── index.ts   # Database connection
│   │   └── seed.ts    # Seed data
│   ├── routes/
│   │   ├── auth.ts    # Authentication endpoints
│   │   ├── items.ts   # Items CRUD (TODO)
│   │   ├── messages.ts # Messaging (TODO)
│   │   └── ...
│   ├── middleware/
│   │   ├── auth.ts    # Auth middleware
│   │   ├── validation.ts # Zod validation
│   │   └── upload.ts  # File upload (TODO)
│   ├── websocket/     # WebSocket server (TODO)
│   └── index.ts       # Express server
├── uploads/           # User-uploaded files
├── drizzle.config.ts  # Drizzle configuration
└── tsconfig.json      # TypeScript config
```

### Shared (Types)

```
shared/
└── src/
    ├── types.ts       # Shared TypeScript types
    └── index.ts       # Exports
```

## 🎨 Design System

### Color Palette (Teal Green Theme)

```css
/* Primary - Teal Green */
--primary-500: #14B8A6  /* Main brand color */
--primary-600: #0D9488  /* Hover states */
--primary-700: #0F766E  /* Active states */

/* Semantic Colors */
--success: #10B981   /* Green */
--warning: #F59E0B   /* Amber */
--error: #EF4444     /* Red */
```

### Component Specifications

- **Buttons**: `rounded-xl` (12px), teal-600, shadow, hover lift
- **Cards**: White bg, `rounded-lg`, shadow-sm, hover shadow-md
- **Inputs**: 40px height, `rounded-md`, focus:ring-teal-600
- **Transitions**: 200ms ease-in-out for all interactions

## 📊 Database Schema

### Core Tables (Phase 1)

1. **users** - User accounts and profiles
2. **categories** - Item categories (8 predefined)
3. **items** - Product listings
4. **favorites** - User favorites
5. **conversations** - Chat conversations
6. **messages** - Real-time messages
7. **user_activities** - Activity tracking for AI
8. **user_preferences** - Calculated user preferences

### Relationships

- One-to-Many: User → Items, User → Favorites
- Many-to-One: Items → Category, Items → User
- Many-to-Many: Users ↔ Items (via Favorites)
- Hierarchical: Conversations → Messages

## 🔐 API Endpoints

### Authentication

```
POST   /api/auth/register   - Create new account
POST   /api/auth/login      - Login to account
POST   /api/auth/logout     - Logout current user
GET    /api/auth/me         - Get current user info
```

### Items (TODO - Phase 1)

```
GET    /api/items           - Browse items (with filters)
GET    /api/items/:id       - Get single item
POST   /api/items           - Create new listing
PUT    /api/items/:id       - Update listing
DELETE /api/items/:id       - Delete listing
```

### Categories

```
GET    /api/categories      - Get all categories
```

### Favorites (TODO - Phase 1)

```
GET    /api/favorites       - Get user's favorites
POST   /api/favorites       - Add to favorites
DELETE /api/favorites/:id   - Remove from favorites
```

### Messaging (TODO - Phase 1)

```
GET    /api/conversations        - Get user's conversations
POST   /api/conversations        - Create conversation
GET    /api/conversations/:id/messages - Get messages
POST   /api/conversations/:id/messages - Send message
```

## 🧪 Testing (TODO - Phase 1)

```bash
# Run all tests
npm test

# Run client tests
npm test --workspace=client

# Run server tests
npm test --workspace=server

# E2E tests
npm run test:e2e
```

## 📈 Progress Tracking

See `PHASE1_PROGRESS.md` for detailed progress tracking.

### Current Status: Phase 1 - 60% Complete

**Completed**:
- ✅ Project setup and configuration
- ✅ Database schema with Drizzle ORM
- ✅ Authentication system
- ✅ Session management
- ✅ Tailwind CSS design system

**In Progress**:
- 🚧 shadcn/ui component library
- 🚧 Items CRUD API
- 🚧 Frontend pages and components
- 🚧 Image upload system
- 🚧 Search and filters

**Next Up**:
- ⏳ Real-time messaging
- ⏳ Favorites system
- ⏳ Dashboard page
- ⏳ AI recommendations

## 🛠️ Development Guidelines

### TypeScript

- Strict mode enabled
- No implicit any
- Prefer interfaces for object shapes
- Use type inference where possible

### Code Style

- 2 spaces indentation
- Single quotes for strings
- Semicolons required
- Use ESLint + Prettier

### Git Workflow

```bash
# Feature branches
git checkout -b feature/item-listings

# Commit messages
git commit -m "feat: add item listing API endpoints"

# Types: feat, fix, docs, style, refactor, test, chore
```

### Component Structure

```typescript
// components/ItemCard.tsx
import { type Item } from '@shared/types';

interface ItemCardProps {
  item: Item;
  onFavorite?: (itemId: string) => void;
}

export function ItemCard({ item, onFavorite }: ItemCardProps) {
  // Component logic
}
```

## 📝 Environment Variables

### Server

```env
DATABASE_URL=postgresql://user:pass@host:5432/mybazaar
PORT=5000
NODE_ENV=development
SESSION_SECRET=your-secret-key-min-32-chars
FRONTEND_URL=http://localhost:3000
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads
```

### Client

```env
VITE_API_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5000
```

## 🚢 Deployment (Coming Soon)

Deployment configuration for:
- **Frontend**: Vercel, Netlify
- **Backend**: Railway, Render, Heroku
- **Database**: Neon, Supabase

## 🤝 Contributing

This is a work in progress. Phase 1 (Core MVP) is currently under development.

## 📄 License

MIT License - see LICENSE file for details

## 📞 Support

- Email: mybazaarsupp@gmail.com
- GitHub: [Create an issue](https://github.com/Ebz30/super-duper-octo-broccoli/issues)

---

**Version**: 2.0.0-alpha  
**Phase**: 1 (Core MVP) - 60% Complete  
**Last Updated**: January 2025  
**Built with** ❤️ **for students, by students** 🎓
