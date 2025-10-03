# 🧪 MyBazaar v2.0 - Testing Guide

## ✅ Ready to Test! (Session 2 Complete)

Your MyBazaar v2.0 code has been pushed to GitHub and is ready for testing!

**Repository**: https://github.com/Ebz30/super-duper-octo-broccoli  
**Branch**: cursor/build-and-deploy-student-marketplace-web-app-ad6a  
**Directory**: `mybazaar-v2/`

## 🚀 Quick Start Testing (5 Minutes)

### 1. Clone and Install

```bash
# Clone the repository (if you haven't)
git clone https://github.com/Ebz30/super-duper-octo-broccoli.git
cd super-duper-octo-broccoli/mybazaar-v2

# Install all dependencies
npm install

# This installs:
# - Root dependencies (concurrently, TypeScript)
# - Client dependencies (React, Vite, Tailwind, ~1400 packages)
# - Server dependencies (Express, Drizzle, ~250 packages)
# - Shared dependencies (Zod)
```

### 2. Configure Environment

**Server configuration:**
```bash
cd server
cp .env.example .env
```

Edit `server/.env` with your database:
```env
DATABASE_URL=postgresql://your-user:your-pass@localhost:5432/mybazaar_v2
SESSION_SECRET=put-result-of-openssl-rand-base64-32-here
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**Client configuration:**
```bash
cd ../client
cp .env.example .env
```

The client `.env` should be:
```env
VITE_API_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5000
```

### 3. Set Up Database

**Using Supabase (Easiest)**:
1. Go to https://supabase.com
2. Create free account and new project
3. Wait ~2 minutes for provisioning
4. Copy connection string from Settings > Database
5. Use in `DATABASE_URL`

**Using Local PostgreSQL**:
```bash
# Create database
createdb mybazaar_v2

# Update .env with:
# DATABASE_URL=postgresql://yourusername:yourpassword@localhost:5432/mybazaar_v2
```

**Push schema to database:**
```bash
cd server
npm run db:push

# You should see: "✅ Schema pushed successfully"
```

**Seed categories:**
```bash
# Still in server directory
npx tsx src/db/seed.ts

# You should see: "✅ Database seeded successfully!"
```

### 4. Start the Application

```bash
# From mybazaar-v2 root directory
npm run dev

# This starts BOTH:
# ✅ Backend server on http://localhost:5000
# ✅ Frontend dev server on http://localhost:3000
```

You should see:
```
[server] 🚀 MyBazaar API v2.0 running on port 5000
[client] ➜  Local:   http://localhost:3000/
```

### 5. Open Browser

Navigate to: **http://localhost:3000**

You should see the beautiful teal-themed home page! 🎨

## 🧪 Test Scenarios

### Test 1: User Registration ✅

1. Click **"Sign Up"** button in top-right
2. Fill in the registration form:
   ```
   Full Name: Your Name
   Email: test@example.com  
   University: Eastern Mediterranean University
   Password: Test123!@#
   Confirm Password: Test123!@#
   ```
3. Watch the **password strength indicator** update as you type!
4. Click **"Sign Up"** button
5. **Expected**: 
   - ✅ Success toast appears: "Account created! Welcome to MyBazaar"
   - ✅ Redirected to home page
   - ✅ Header shows your name in top-right
   - ✅ Navigation changes (now shows Sell, My Listings, etc.)

### Test 2: User Login ✅

1. Click **"Log In"** in header (or click Logout first)
2. Enter credentials:
   ```
   Email: test@example.com
   Password: Test123!@#
   ```
3. Check **"Remember me for 30 days"** checkbox
4. Click **"Log In"** button
5. **Expected**:
   - ✅ Success toast: "Welcome back!"
   - ✅ Redirected to home
   - ✅ Your name appears in header

### Test 3: Session Persistence ✅

1. After logging in, **refresh the page** (F5)
2. **Expected**: Still logged in! Header still shows your name
3. Close browser completely and reopen
4. Go to http://localhost:3000
5. **Expected**: Still logged in (if you checked "Remember me")

### Test 4: Protected Routes ✅

1. Logout by clicking logout button in header
2. Try to navigate to: http://localhost:3000/sell (doesn't exist yet but test redirect)
3. **Expected**: Redirected to login page
4. After login, should go back to intended page

### Test 5: Form Validation ✅

**Test Registration Validation:**
1. Go to /register
2. Try submitting empty form
3. **Expected**: Red error messages appear
4. Enter weak password: `test`
5. **Expected**: 
   - ✅ Password strength shows 0/4 bars
   - ✅ Error: "Password must be at least 8 characters"
6. Enter strong password: `Test123!@#`
7. **Expected**: Password strength shows 4/4 bars (all green!)
8. Enter non-matching confirm password
9. **Expected**: Error: "Passwords don't match"

**Test Login Validation:**
1. Go to /login
2. Enter invalid email: `notanemail`
3. **Expected**: Error: "Invalid email address"
4. Enter wrong password
5. **Expected**: Toast error: "Email or password is incorrect"

### Test 6: UI Components ✅

**Buttons:**
- Hover over any button → Should lift up slightly with shadow
- Click button → Should scale down (0.95)
- Different variants: Primary (teal), Outline, Ghost, Secondary

**Cards:**
- Hover over login/register card → Border turns teal, shadow increases

**Inputs:**
- Click input field → Teal ring appears around border
- Type in field → Smooth transitions

**Toast Notifications:**
- Success toast → Green accent
- Error toast → Red accent
- Auto-dismiss after 3 seconds
- Slides in from top-right

### Test 7: Responsive Design ✅

1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test different screen sizes:
   - **Mobile (375px)**: Hamburger menu appears
   - **Tablet (768px)**: Compressed navigation
   - **Desktop (1024px+)**: Full navigation

**Mobile Menu Test:**
1. Resize to mobile view
2. Click hamburger menu (☰) in top-right
3. **Expected**: Menu slides down with all navigation links
4. Click a link → Menu closes

### Test 8: API Endpoints ✅

**Test with curl or Postman:**

```bash
# Health check
curl http://localhost:5000/health

# Get categories
curl http://localhost:5000/api/categories

# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "apitest@example.com",
    "password": "Test123!@#",
    "fullName": "API Test User",
    "university": "NEU"
  }'

# Browse items (will be empty for now)
curl http://localhost:5000/api/items
```

## 🐛 Known Issues & Expected Behavior

### Not Yet Implemented (Coming in Session 3):
- ❌ **Items don't display** - Browse page not built yet
- ❌ **Can't create listings** - Create form not built yet
- ❌ **No search bar** - SearchBar component coming next
- ❌ **No favorites** - Favorites UI coming next
- ❌ **No messaging** - Chat UI in Session 4

### Expected to Work:
- ✅ Registration
- ✅ Login/Logout
- ✅ Session persistence
- ✅ Toast notifications
- ✅ Navigation
- ✅ Protected routes
- ✅ Form validation
- ✅ Responsive design

## 🎨 Visual Checklist

Open http://localhost:3000 and verify:

**Home Page:**
- [ ] Teal gradient hero section
- [ ] "Welcome to MyBazaar" heading
- [ ] Progress cards showing 80% complete
- [ ] White background (bg-gray-50)

**Header:**
- [ ] Teal "M" logo badge (rounded-lg, shadow)
- [ ] "MyBazaar" text next to logo
- [ ] Navigation links (Browse, Sell, etc.) when logged in
- [ ] User avatar circle (gradient teal) when logged in
- [ ] Login/Sign Up buttons when logged out

**Footer:**
- [ ] Dark background (gray-900)
- [ ] Three columns (MyBazaar, Quick Links, Support)
- [ ] Email and address
- [ ] "Made for students, by students 🎓"

**Login Page:**
- [ ] Centered card layout
- [ ] Teal "M" logo at top
- [ ] Email and Password inputs
- [ ] Remember me checkbox
- [ ] Teal "Log In" button
- [ ] Link to register page

**Register Page:**
- [ ] All form fields present
- [ ] Password strength indicator (4 bars)
- [ ] Bars turn teal as password gets stronger
- [ ] Teal "Sign Up" button
- [ ] Link to login page

## 🎯 Success Criteria

✅ **Session 2 is successful if**:
1. You can register a new account
2. You can login with that account
3. Session persists on page refresh
4. Header shows your name when logged in
5. Toast notifications appear on auth actions
6. All buttons have hover effects
7. Forms validate properly
8. UI matches teal color scheme
9. Responsive on mobile and desktop
10. No console errors

## 🔧 Troubleshooting

### "Cannot GET /" error
**Solution**: Make sure both servers are running (`npm run dev`)

### Database connection error
**Solution**: 
1. Check `DATABASE_URL` in `server/.env`
2. Make sure database exists
3. Try `npm run db:push` again

### "Module not found" errors
**Solution**:
```bash
rm -rf node_modules client/node_modules server/node_modules
npm install
```

### Port already in use
**Solution**:
```bash
# Kill processes on ports
lsof -i :3000
lsof -i :5000
kill -9 <PID>
```

### TypeScript errors in editor
**Solution**: 
- Make sure you have dependencies installed
- Restart TypeScript server in VS Code (Cmd+Shift+P → "TypeScript: Restart TS Server")

## 📸 Screenshots to Verify

When testing, your screens should look like:

**Home Page**:
- Teal gradient hero banner
- Clean white background
- Progress indicator cards (green checkmarks, blue next steps)

**Register Page**:
- Centered white card
- Form fields with labels
- Password strength bars filling in teal
- Teal sign up button

**Header (Logged In)**:
- Teal "M" badge
- Your name next to avatar
- All navigation links visible
- Hamburger menu on mobile

## 🎉 Success Message

If everything works, you should see:
1. ✅ Beautiful teal-themed interface
2. ✅ Smooth animations on hover
3. ✅ Working registration and login
4. ✅ Session persistence
5. ✅ Responsive layout
6. ✅ Professional UI quality

**Congratulations! Session 2 is working perfectly!** 🎊

---

## 📞 Need Help?

If you encounter issues:
1. Check SETUP_GUIDE.md for detailed setup
2. Check console for errors (F12)
3. Verify all .env files are configured
4. Make sure database is running
5. Check that both servers started successfully

## 🚀 Next Session Preview

When you continue with Session 3, we'll add:
- ItemCard component with images
- Browse page with product grid
- Search bar with real-time filtering
- Category filters sidebar
- Create listing form
- And much more!

---

**Status**: Ready for testing ✅  
**Pushed to GitHub**: ✅  
**Session 2**: COMPLETE ✅  
**Phase 1**: 80% ✅
