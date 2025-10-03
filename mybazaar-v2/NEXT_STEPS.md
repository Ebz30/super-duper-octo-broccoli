# MyBazaar v2.0 - Next Steps Guide

## 🎯 Current Status: Phase 1 - 60% Complete

You now have a solid foundation for MyBazaar v2.0 with modern TypeScript architecture!

## ✅ What's Been Completed

### Infrastructure (100%)
- ✅ Monorepo structure with workspaces
- ✅ TypeScript configuration (client, server, shared)
- ✅ Vite + React 18 setup
- ✅ Express + TypeScript backend
- ✅ Drizzle ORM with PostgreSQL
- ✅ Tailwind CSS with teal design system
- ✅ Session management
- ✅ Environment configuration

### Backend (40%)
- ✅ Database schema (8 tables)
- ✅ Authentication API (register, login, logout, me)
- ✅ Password hashing with bcrypt
- ✅ Zod validation middleware
- ✅ CORS and security setup
- ✅ Session store with PostgreSQL

### Design System (100%)
- ✅ Teal green color palette (#14B8A6)
- ✅ Tailwind CSS configuration
- ✅ Custom animations
- ✅ Responsive breakpoints
- ✅ Typography system

## 🚀 Next Session Tasks (Priority Order)

### 1. Frontend UI Components (2-3 hours)

Create the shadcn/ui component library:

**High Priority:**
```bash
# Button component
client/src/components/ui/button.tsx

# Input & Label components  
client/src/components/ui/input.tsx
client/src/components/ui/label.tsx

# Card component
client/src/components/ui/card.tsx

# Dialog/Modal component
client/src/components/ui/dialog.tsx

# Toast notification
client/src/components/ui/toast.tsx
```

**Component Specs:**
- Button: rounded-xl, teal-600, hover lift, shadow
- Input: 40px height, focus:ring-teal-600
- Card: white bg, rounded-lg, shadow-sm

### 2. Authentication UI (1-2 hours)

```bash
# Auth pages
client/src/pages/login.tsx
client/src/pages/register.tsx

# Auth context
client/src/contexts/auth-context.tsx

# API service
client/src/services/api.ts

# Protected route wrapper
client/src/components/protected-route.tsx
```

**Features:**
- Login form with email/password
- Register form with validation
- Error handling and toast notifications
- Redirect after login
- Protected route component

### 3. Layout Components (1 hour)

```bash
# Header/Navigation
client/src/components/header.tsx

# Footer
client/src/components/footer.tsx

# Main layout
client/src/components/layout.tsx
```

**Header Features:**
- Logo (teal badge with "M")
- Search bar (centered)
- Navigation links (Browse, Sell, Messages)
- User dropdown menu
- Mobile hamburger menu

### 4. Items API Endpoints (2 hours)

```bash
# Items routes
server/src/routes/items.ts

# Image upload middleware
server/src/middleware/upload.ts

# Items service
server/src/services/items.ts
```

**Endpoints Needed:**
```typescript
GET    /api/items          // Browse with filters
GET    /api/items/:id      // Single item
POST   /api/items          // Create (with images)
PUT    /api/items/:id      // Update
DELETE /api/items/:id      // Delete
GET    /api/categories     // Get categories
```

### 5. Home Page (2 hours)

```bash
# Home page
client/src/pages/home.tsx

# Item card component
client/src/components/item-card.tsx

# Search bar component
client/src/components/search-bar.tsx

# Filter sidebar
client/src/components/filter-sidebar.tsx
```

**Features:**
- Item grid (3-4 columns)
- Search bar with debouncing
- Category filters
- Price range filters
- Pagination
- Loading states

## 📋 Detailed Implementation Checklist

### Session 2: UI Components & Auth

- [ ] Install missing client dependencies
- [ ] Create Button component (shadcn/ui style)
- [ ] Create Input & Label components
- [ ] Create Card component
- [ ] Create Dialog component
- [ ] Create Toast provider
- [ ] Build Login page with form validation
- [ ] Build Register page with password strength
- [ ] Create AuthContext with React Query
- [ ] Create API service with axios
- [ ] Add protected route wrapper
- [ ] Test auth flow end-to-end

### Session 3: Items & Browse

- [ ] Create items API routes
- [ ] Add Multer + Sharp image upload
- [ ] Implement search with Drizzle
- [ ] Add filter queries
- [ ] Create categories endpoint
- [ ] Build ItemCard component
- [ ] Build SearchBar with debounce
- [ ] Build FilterSidebar
- [ ] Create Home page layout
- [ ] Add pagination component
- [ ] Test browsing and filtering

### Session 4: Create Listing & Detail

- [ ] Build CreateListing form
- [ ] Add image preview and upload
- [ ] Implement form validation
- [ ] Create ItemDetail page
- [ ] Add image gallery
- [ ] Add "Contact Seller" button
- [ ] Implement favorites toggle
- [ ] Add social sharing
- [ ] Test listing creation flow

### Session 5: Messaging & Dashboard

- [ ] Set up WebSocket server
- [ ] Create conversations API
- [ ] Create messages API
- [ ] Build conversation list UI
- [ ] Build chat interface
- [ ] Add real-time message delivery
- [ ] Create Dashboard page
- [ ] Add user's listings view
- [ ] Test messaging end-to-end

## 🛠️ Quick Commands

### Install Dependencies

```bash
# From project root
npm install

# Install client deps only
npm install --workspace=client

# Install server deps only
npm install --workspace=server
```

### Database Commands

```bash
# Generate migration
npm run db:generate

# Apply migration
npm run db:push

# Open Drizzle Studio
npm run db:studio

# Seed categories
cd server
tsx src/db/seed.ts
```

### Development

```bash
# Start everything
npm run dev

# Client only (port 3000)
npm run dev:client

# Server only (port 5000)
npm run dev:server

# Type check all
npm run type-check

# Lint all
npm run lint
```

### Testing

```bash
# Test auth endpoint
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "fullName": "Test User",
    "university": "EMU"
  }'
```

## 🎨 Design Reference

### Colors
```css
/* Primary Teal */
--primary-500: #14B8A6
--primary-600: #0D9488  /* Hover */
--primary-700: #0F766E  /* Active */

/* Semantic */
--success: #10B981
--error: #EF4444
--warning: #F59E0B
```

### Component Examples

**Button:**
```tsx
<button className="
  h-10 px-4 rounded-xl 
  bg-teal-600 text-white 
  hover:bg-teal-700 
  shadow-md hover:shadow-lg 
  transition-all duration-200
  hover:-translate-y-0.5
">
  Submit
</button>
```

**Card:**
```tsx
<div className="
  bg-white rounded-lg 
  shadow-sm hover:shadow-md
  border border-gray-200
  hover:border-teal-300
  transition-all duration-200
  hover:-translate-y-1
">
  Content
</div>
```

## 📦 Dependencies to Add (Next Session)

### Client
```bash
npm install --workspace=client \
  @radix-ui/react-dialog \
  @radix-ui/react-toast \
  @radix-ui/react-select \
  @radix-ui/react-checkbox \
  tailwindcss-animate
```

### Server
```bash
npm install --workspace=server \
  multer \
  sharp \
  @types/multer
```

## 🐛 Common Issues & Solutions

### Issue: Database connection error
**Solution**: Check `DATABASE_URL` in `server/.env`

### Issue: CORS error in browser
**Solution**: Verify `FRONTEND_URL` in server `.env` matches client URL

### Issue: TypeScript path errors
**Solution**: Run `npm run type-check` to see actual errors

### Issue: Session not persisting
**Solution**: Check PostgreSQL connection and sessions table

## 📚 Resources

- **Drizzle ORM Docs**: https://orm.drizzle.team/docs/overview
- **shadcn/ui Components**: https://ui.shadcn.com/docs/components
- **Tailwind CSS**: https://tailwindcss.com/docs
- **React Hook Form**: https://react-hook-form.com/
- **TanStack Query**: https://tanstack.com/query/latest

## 💡 Tips

1. **Use Drizzle Studio** to view/edit database visually
2. **Test API endpoints** with curl or Postman before building UI
3. **Follow the PRD** for exact component specifications
4. **Commit frequently** with descriptive messages
5. **Update PHASE1_PROGRESS.md** as you complete tasks

## 🎯 Success Criteria for Phase 1

Phase 1 will be complete when:
- ✅ Users can register and login
- ⏳ Users can browse items with filters
- ⏳ Users can create listings with images
- ⏳ Users can view item details
- ⏳ Users can add items to favorites
- ⏳ Users can send messages
- ⏳ Users can see their dashboard

## 📊 Estimated Time to Complete Phase 1

| Task | Estimated Time | Status |
|------|---------------|--------|
| Setup & Infrastructure | 4 hours | ✅ Done |
| Auth API | 2 hours | ✅ Done |
| UI Components | 3 hours | ⏳ Next |
| Auth UI | 2 hours | ⏳ Next |
| Items API | 2 hours | ⏳ Next |
| Browse/Home Page | 2 hours | ⏳ Next |
| Create Listing | 2 hours | ⏳ Later |
| Item Detail | 1 hour | ⏳ Later |
| Messaging | 3 hours | ⏳ Later |
| Dashboard | 1 hour | ⏳ Later |
| **Total** | **22 hours** | **60% Complete** |

**Remaining: ~8-10 hours**

---

**Ready to continue?** Start with Session 2: UI Components & Auth! 🚀

Say "**Continue with Session 2**" or "**Start with [specific task]**" to proceed.
