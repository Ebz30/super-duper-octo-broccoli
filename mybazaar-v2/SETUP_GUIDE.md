# MyBazaar v2.0 - Complete Setup Guide

## 🚀 Quick Setup (10 Minutes)

### Step 1: Install Dependencies

```bash
cd mybazaar-v2

# Install all packages (monorepo)
npm install

# This will install:
# - Root dependencies
# - Client dependencies (React, Vite, Tailwind, etc.)
# - Server dependencies (Express, Drizzle, etc.)
# - Shared dependencies
```

### Step 2: Set Up Database

**Option A: Using Supabase (Recommended)**

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project (takes ~2 minutes)
3. Go to Project Settings > Database
4. Copy the "Connection string" (URI format)
5. Replace `[YOUR-PASSWORD]` with your actual database password

**Option B: Local PostgreSQL**

```bash
# Create database
createdb mybazaar_v2

# Your DATABASE_URL will be:
# postgresql://yourusername:yourpassword@localhost:5432/mybazaar_v2
```

### Step 3: Configure Environment Variables

**Server:**
```bash
cd server
cp .env.example .env
```

Edit `server/.env`:
```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
PORT=5000
NODE_ENV=development
SESSION_SECRET=generate-with-openssl-rand-base64-32
FRONTEND_URL=http://localhost:3000
```

Generate SESSION_SECRET:
```bash
openssl rand -base64 32
```

**Client:**
```bash
cd ../client
cp .env.example .env
```

Edit `client/.env`:
```env
VITE_API_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5000
```

### Step 4: Set Up Database Schema

```bash
# From mybazaar-v2 root directory

# Push schema to database
npm run db:push

# Seed categories
cd server
npm run db:migrate
```

### Step 5: Start Development Servers

**Option A: Both servers at once (Recommended)**
```bash
# From mybazaar-v2 root
npm run dev
```

**Option B: Separate terminals**
```bash
# Terminal 1 - Server (port 5000)
npm run dev:server

# Terminal 2 - Client (port 3000)
npm run dev:client
```

### Step 6: Test the Application

1. Open browser to http://localhost:3000
2. Click "Sign Up" to create an account
3. Fill in the registration form
4. You should be logged in automatically!

## ✅ Success Checklist

- [ ] Dependencies installed without errors
- [ ] Database created (Supabase or local)
- [ ] `.env` files configured in both client and server
- [ ] `npm run db:push` completed successfully
- [ ] Categories seeded successfully
- [ ] Server running on http://localhost:5000
- [ ] Client running on http://localhost:3000
- [ ] Can access http://localhost:3000 in browser
- [ ] Can register a new account
- [ ] Can login with created account
- [ ] See welcome message with your name

## 🧪 Testing Endpoints

### Test Backend API

```bash
# Health check
curl http://localhost:5000/health

# Should return:
# {"status":"ok","timestamp":"...","service":"MyBazaar API v2.0"}

# Get categories
curl http://localhost:5000/api/categories

# Should return list of 8 categories
```

### Test Authentication

```bash
# Register a user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "fullName": "Test User",
    "university": "EMU"
  }'

# Should return success with user data
```

## 🐛 Troubleshooting

### Issue: "Cannot find module" errors

**Solution:**
```bash
# Clean install
rm -rf node_modules client/node_modules server/node_modules shared/node_modules
npm install
```

### Issue: Database connection failed

**Solution:**
- Check `DATABASE_URL` in `server/.env`
- Make sure database exists
- Verify credentials are correct
- Check Supabase project is not paused

### Issue: "Session table not found"

**Solution:**
```bash
# The session table is created automatically on first run
# Just restart the server
npm run dev:server
```

### Issue: Port 3000 or 5000 already in use

**Solution:**
```bash
# Find process using port
lsof -i :3000
lsof -i :5000

# Kill process
kill -9 <PID>

# Or change ports in .env files
```

### Issue: TypeScript errors

**Solution:**
```bash
# Check for type errors
npm run type-check

# Make sure all dependencies are installed
npm install
```

## 📁 What's Included in This Build

### ✅ Backend (70% Complete)
- Express server with TypeScript
- Drizzle ORM with PostgreSQL
- Authentication API (register, login, logout)
- Items API (CRUD operations)
- Categories API
- Session management
- Password security (bcrypt)
- Validation (Zod schemas)

### ✅ Frontend (60% Complete)
- React 18 with TypeScript
- Vite for fast development
- Tailwind CSS with teal design system
- shadcn/ui components (Button, Input, Card, Toast, Label)
- Login and Register pages
- Header with navigation
- Footer
- Auth context with React Query
- Protected routes

### ✅ Design System (100% Complete)
- Teal green color palette (#14B8A6)
- Typography system
- Component styling
- Animations and transitions
- Responsive breakpoints

## 🎯 Current Phase: Session 2 Complete (80% of Phase 1)

**What Works:**
- ✅ User registration
- ✅ User login/logout
- ✅ Session persistence
- ✅ Protected routes
- ✅ Beautiful UI with teal theme
- ✅ Responsive design
- ✅ Toast notifications
- ✅ Form validation

**Coming Next (Session 3):**
- 🚧 Browse items page with grid
- 🚧 Item cards with images
- 🚧 Search bar with filters
- 🚧 Create listing form
- 🚧 Image upload
- 🚧 Item detail page

## 📝 Next Session Tasks

When you're ready to continue:

1. **Browse Items Page** - Display items in grid with filters
2. **Item Card Component** - Product cards with images and favorites
3. **Search & Filter** - Advanced filtering system
4. **Create Listing** - Form with image upload
5. **Item Detail** - Full item view with gallery

## 💡 Development Tips

1. **Hot Module Replacement (HMR)** - Changes appear instantly in browser
2. **Type Safety** - TypeScript catches errors before runtime
3. **React Query DevTools** - Add for debugging API calls
4. **Drizzle Studio** - Visual database browser (`npm run db:studio`)

## 🌐 URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health**: http://localhost:5000/health
- **API Root**: http://localhost:5000/ (shows available endpoints)

## 📊 Progress

```
██████████████████░░ 80% Phase 1 Complete

✅ Setup & Infrastructure
✅ Database & ORM
✅ Authentication System
✅ UI Components
✅ Auth Pages
🚧 Items Management (Next)
🚧 Messaging System (Later)
```

---

**Ready to test?** Just run `npm run dev` and open http://localhost:3000! 🎉
