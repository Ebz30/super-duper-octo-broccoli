# MyBazaar Quick Start Guide

Get MyBazaar running in 10 minutes! ⚡

## Prerequisites

- Node.js v18+ ([Download](https://nodejs.org/))
- A Supabase account ([Sign up free](https://supabase.com))

## Step 1: Clone & Install (2 minutes)

```bash
# Clone the repository
git clone https://github.com/Ebz30/super-duper-octo-broccoli.git
cd super-duper-octo-broccoli

# Run the setup script
./setup.sh
```

Or manually:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
cd ..
```

## Step 2: Database Setup (3 minutes)

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Name it "mybazaar" (or anything you like)
   - Set a strong password
   - Wait ~2 minutes for provisioning

2. **Run Database Schema**
   - In Supabase dashboard, go to SQL Editor
   - Click "New Query"
   - Copy ALL contents from `database-schema.sql`
   - Paste and click "Run"
   - You should see "Success" message

3. **Get Your Credentials**
   - Go to Project Settings > API
   - Copy these values:
     - **Project URL** (starts with https://...)
     - **anon/public key** (long string starting with eyJ...)
     - **service_role key** (another long string)
   - Go to Project Settings > Database
   - Copy **Connection string** (URI format)

## Step 3: Configure Environment (2 minutes)

**Backend configuration:**

Edit `backend/.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-role-key-here
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@...
SESSION_SECRET=any-random-string-at-least-32-characters-long
PORT=5000
WS_PORT=5001
FRONTEND_URL=http://localhost:3000
```

**Frontend configuration:**

Edit `frontend/.env`:
```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
REACT_APP_API_URL=http://localhost:5000
REACT_APP_WS_URL=ws://localhost:5001
```

**Generate secure SESSION_SECRET:**
```bash
openssl rand -base64 32
```

## Step 4: Start the App (1 minute)

Open **two terminals**:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

You should see:
```
🚀 MyBazaar API server running on port 5000
WebSocket server running on port 5001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

Browser will open automatically at http://localhost:3000

## Step 5: Test It! (2 minutes)

1. **Register an account**
   - Click "Sign Up" in the top right
   - Fill in your details
   - Password must have: 8+ chars, uppercase, number, special char
   - Click "Sign Up"

2. **Create a test listing**
   - Click "Sell" in the navigation
   - Fill in the form (all fields required)
   - Upload 1-10 images
   - Click "Create Listing"

3. **Test features**
   - ✅ Search for items
   - ✅ Filter by category, price, etc.
   - ✅ Add items to favorites (heart icon)
   - ✅ Click an item to view details
   - ✅ Contact seller (opens Messages)
   - ✅ Send a message (real-time!)

## Troubleshooting

### "Database connection failed"
- Check your `DATABASE_URL` is correct
- Make sure database password doesn't have special chars that need URL encoding
- Verify your IP is allowed in Supabase (Settings > Database > Connection Pooling)

### "Session store creation failed"
- Verify `database-schema.sql` was run completely
- Check `sessions` table exists in Supabase Table Editor

### "Cannot connect to WebSocket"
- Make sure backend is running on port 5001
- Check `REACT_APP_WS_URL` is `ws://localhost:5001` (not `wss://`)

### "Images not uploading"
- Check `backend/uploads/` directory exists
- Verify file size is under 5MB
- Ensure file type is JPEG, PNG, or WebP

### Port already in use
```bash
# Find what's using the port
lsof -i :5000  # or :3000 or :5001

# Kill the process
kill -9 <PID>
```

## What's Running?

- **Frontend:** http://localhost:3000
  - React app with hot reload
  - Auto-opens in your browser

- **Backend API:** http://localhost:5000
  - REST API endpoints
  - Test: `curl http://localhost:5000/health`

- **WebSocket:** ws://localhost:5001
  - Real-time messaging
  - Auto-connects when you log in

## Next Steps

### For Development
- Read `README.md` for full documentation
- Check `CONTRIBUTING.md` for code guidelines
- Browse the code in `backend/src/` and `frontend/src/`

### For Production
- Read `DEPLOYMENT.md` for deployment guide
- Deploy backend to Heroku/Railway/Render
- Deploy frontend to Vercel/Netlify
- Set environment variables on hosting platforms

### Add Features
- Implement user profile editing
- Add email notifications
- Create admin dashboard
- Add Arabic/Turkish translations
- Build mobile app (React Native)

## Quick Commands

```bash
# Backend
cd backend
npm run dev          # Start development server
npm start            # Start production server
npm test             # Run tests (if implemented)

# Frontend
cd frontend
npm start            # Start development server
npm run build        # Build for production
npm test             # Run tests

# Database
psql $DATABASE_URL   # Connect to database
# Then run: \dt      # List all tables
```

## Directory Structure

```
mybazaar/
├── backend/               # Node.js/Express backend
│   ├── src/
│   │   ├── routes/       # API endpoints
│   │   ├── middleware/   # Auth, validation, etc.
│   │   ├── websocket/    # WebSocket server
│   │   └── server.js     # Main server file
│   ├── uploads/          # User uploaded images
│   └── package.json
│
├── frontend/             # React frontend
│   ├── public/          # Static files
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React Context (state)
│   │   └── services/    # API calls
│   └── package.json
│
├── database-schema.sql   # PostgreSQL schema
├── README.md            # Full documentation
├── DEPLOYMENT.md        # Production deployment guide
└── setup.sh             # Automated setup script
```

## Support

- **Email:** mybazaarsupp@gmail.com
- **GitHub Issues:** [Create an issue](https://github.com/Ebz30/super-duper-octo-broccoli/issues)
- **Documentation:** See README.md

## Success Checklist

- [ ] Database schema created in Supabase
- [ ] Backend .env configured with credentials
- [ ] Frontend .env configured with API URLs
- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] WebSocket running on port 5001
- [ ] Can register and login
- [ ] Can create a listing with images
- [ ] Can search and filter items
- [ ] Can send messages in real-time
- [ ] Can add items to favorites

If all boxes are checked, congratulations! 🎉 MyBazaar is running successfully!

---

Made with ❤️ for students, by students 🎓

**Happy selling and buying!** 🛒
