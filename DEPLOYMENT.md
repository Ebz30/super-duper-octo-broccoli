# MyBazaar Deployment Guide

This guide provides detailed instructions for deploying MyBazaar to production.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Environment Configuration](#environment-configuration)
6. [Post-Deployment](#post-deployment)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:
- A Supabase account (or PostgreSQL database)
- A hosting platform account (Heroku, Railway, Render, etc.)
- Node.js v18+ installed locally
- Git installed

## Database Setup

### Using Supabase (Recommended)

1. **Create Supabase Project**
   - Go to https://supabase.com
   - Click "New Project"
   - Choose organization and project name
   - Set a strong database password
   - Select a region close to your users
   - Wait for project to be provisioned (~2 minutes)

2. **Run Database Schema**
   - Navigate to SQL Editor in Supabase dashboard
   - Create a new query
   - Copy entire contents of `database-schema.sql`
   - Run the query
   - Verify tables were created (check Table Editor)

3. **Get Connection Details**
   - Go to Project Settings > API
   - Copy these values:
     - Project URL → `SUPABASE_URL`
     - anon/public key → `SUPABASE_ANON_KEY`
   - Go to Project Settings > Database
   - Copy connection string → `DATABASE_URL`
   - Get service_role key from API settings → `SUPABASE_SERVICE_KEY`

### Using Self-Hosted PostgreSQL

1. **Create Database**
   ```bash
   createdb mybazaar
   ```

2. **Run Schema**
   ```bash
   psql -d mybazaar -f database-schema.sql
   ```

3. **Get Connection String**
   ```
   postgresql://username:password@host:5432/mybazaar
   ```

## Backend Deployment

### Option 1: Heroku

1. **Install Heroku CLI**
   ```bash
   curl https://cli-assets.heroku.com/install.sh | sh
   ```

2. **Login and Create App**
   ```bash
   heroku login
   cd backend
   heroku create mybazaar-api
   ```

3. **Set Environment Variables**
   ```bash
   heroku config:set SUPABASE_URL="your-url"
   heroku config:set SUPABASE_ANON_KEY="your-key"
   heroku config:set SUPABASE_SERVICE_KEY="your-service-key"
   heroku config:set DATABASE_URL="your-db-url"
   heroku config:set SESSION_SECRET="generate-random-32-char-string"
   heroku config:set NODE_ENV="production"
   heroku config:set FRONTEND_URL="https://your-frontend.vercel.app"
   heroku config:set WS_PORT=5001
   ```

4. **Deploy**
   ```bash
   git init
   git add .
   git commit -m "Initial backend deployment"
   git push heroku main
   ```

5. **View Logs**
   ```bash
   heroku logs --tail
   ```

### Option 2: Railway

1. **Create Account**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Deploy from GitHub**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Select `backend` directory
   - Railway will auto-detect Node.js

3. **Add PostgreSQL**
   - Click "New" → "Database" → "PostgreSQL"
   - Copy DATABASE_URL from variables

4. **Set Environment Variables**
   - Go to project → Variables
   - Add all required variables

5. **Deploy**
   - Railway deploys automatically on push
   - Get your deployment URL

### Option 3: Render

1. **Create Account**
   - Go to https://render.com
   - Sign up with GitHub

2. **Create Web Service**
   - Dashboard → New → Web Service
   - Connect GitHub repository
   - Name: mybazaar-api
   - Environment: Node
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`

3. **Add PostgreSQL**
   - Dashboard → New → PostgreSQL
   - Copy Internal Database URL

4. **Set Environment Variables**
   - Go to web service → Environment
   - Add all variables

5. **Deploy**
   - Render deploys automatically

## Frontend Deployment

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   cd frontend
   vercel
   ```

3. **Set Environment Variables**
   - Vercel Dashboard → Project → Settings → Environment Variables
   - Add:
     ```
     REACT_APP_API_URL=https://your-backend-url.herokuapp.com
     REACT_APP_WS_URL=wss://your-backend-url.herokuapp.com
     REACT_APP_SUPABASE_URL=your-supabase-url
     REACT_APP_SUPABASE_ANON_KEY=your-anon-key
     ```

4. **Redeploy**
   ```bash
   vercel --prod
   ```

### Option 2: Netlify

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Build**
   ```bash
   cd frontend
   npm run build
   ```

3. **Deploy**
   ```bash
   netlify deploy --prod
   ```

4. **Set Environment Variables**
   - Netlify Dashboard → Site → Site settings → Build & deploy → Environment
   - Add all REACT_APP_* variables

### Option 3: Manual (Any Static Host)

1. **Build**
   ```bash
   cd frontend
   npm run build
   ```

2. **Upload**
   - Upload contents of `build/` folder to your host
   - Ensure proper routing (rewrites to index.html)

## Environment Configuration

### Backend .env (Production)
```env
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Database
DATABASE_URL=postgresql://postgres:password@host:5432/postgres

# Server
PORT=5000
WS_PORT=5001
NODE_ENV=production

# Session
SESSION_SECRET=use-openssl-rand-base64-32-to-generate

# Frontend
FRONTEND_URL=https://yourdomain.com

# Email (Optional - for future features)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=mybazaarsupp@gmail.com
SMTP_PASS=your-app-password
```

### Frontend .env (Production)
```env
REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_API_URL=https://your-api-domain.com
REACT_APP_WS_URL=wss://your-api-domain.com
```

### Generate Secure SESSION_SECRET
```bash
openssl rand -base64 32
```

## Post-Deployment

### 1. Verify Deployment

**Backend Health Check:**
```bash
curl https://your-api-domain.com/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-03T12:00:00.000Z",
  "service": "MyBazaar API"
}
```

**Frontend Check:**
- Visit your frontend URL
- Open browser console
- Check for any errors

### 2. Test Core Features

1. Register a new account
2. Login
3. Create a test listing
4. Search for items
5. Add to favorites
6. Send a message
7. Check WebSocket connection (Messages page)

### 3. Monitor Logs

**Heroku:**
```bash
heroku logs --tail -a mybazaar-api
```

**Railway:**
- Dashboard → Deployments → Logs

**Render:**
- Dashboard → Logs

### 4. Set Up Custom Domain (Optional)

**Backend (Heroku):**
```bash
heroku domains:add api.yourdomain.com
```

**Frontend (Vercel):**
- Settings → Domains → Add
- Follow DNS configuration instructions

### 5. Enable HTTPS

Most platforms (Heroku, Vercel, Netlify) provide free SSL automatically.

For WebSocket over SSL, ensure:
- Use `wss://` instead of `ws://`
- Backend supports SSL (most platforms auto-configure)

### 6. Set Up Monitoring

**Option 1: Built-in Platform Monitoring**
- Heroku Metrics
- Vercel Analytics
- Railway Metrics

**Option 2: External Services**
- UptimeRobot (uptime monitoring)
- Sentry (error tracking)
- LogRocket (session replay)

## Troubleshooting

### Common Issues

#### 1. CORS Errors
**Symptom:** Frontend can't connect to backend

**Solution:**
- Verify `FRONTEND_URL` in backend .env matches your frontend domain
- Check CORS configuration in `backend/src/server.js`
- Ensure no trailing slashes in URLs

#### 2. WebSocket Connection Failed
**Symptom:** Messages don't work, "Offline" status

**Solution:**
- Verify `REACT_APP_WS_URL` uses `wss://` for HTTPS sites
- Check WebSocket port is accessible
- Some hosts (like Heroku) require special WebSocket configuration
- Verify firewall rules allow WebSocket connections

#### 3. Database Connection Failed
**Symptom:** 500 errors on all API calls

**Solution:**
- Verify `DATABASE_URL` is correct
- Check database is running and accessible
- Ensure IP is whitelisted (if using cloud database)
- Test connection with `psql $DATABASE_URL`

#### 4. Images Not Loading
**Symptom:** Broken image icons

**Solution:**
- Verify backend `uploads/` directory exists
- Check file permissions
- Ensure correct image URLs in frontend
- Verify Multer configuration in backend

#### 5. Session Expired Immediately
**Symptom:** User logged out after page refresh

**Solution:**
- Verify `SESSION_SECRET` is set
- Check cookie settings in `backend/src/server.js`
- Ensure `secure: true` only in production
- Verify `sameSite` cookie settings

#### 6. Build Failures

**Frontend:**
```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Backend:**
```bash
# Check Node version
node --version  # Should be v18+

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Performance Optimization

1. **Enable Compression**
   ```javascript
   // backend/src/server.js
   const compression = require('compression');
   app.use(compression());
   ```

2. **Add CDN for Images**
   - Use Cloudinary or AWS S3 for image hosting
   - Reduces server load

3. **Database Indexing**
   - Schema already includes necessary indexes
   - Monitor slow queries with PostgreSQL logs

4. **Caching**
   - Add Redis for session storage (optional)
   - Cache category list
   - Cache popular items

### Scaling

**Horizontal Scaling:**
- Add more backend instances
- Use Redis for session storage (shared across instances)
- Use load balancer

**Database Scaling:**
- Upgrade Supabase plan
- Add read replicas
- Implement connection pooling

**WebSocket Scaling:**
- Use Socket.io with Redis adapter
- Implement sticky sessions on load balancer

## Security Checklist

- [ ] Change all default passwords
- [ ] Use strong SESSION_SECRET (32+ random characters)
- [ ] Enable HTTPS (SSL certificates)
- [ ] Set secure cookie flags in production
- [ ] Enable rate limiting
- [ ] Keep dependencies updated (`npm audit`)
- [ ] Set up database backups
- [ ] Configure CORS properly
- [ ] Sanitize user inputs
- [ ] Enable SQL injection protection (already using parameterized queries)
- [ ] Monitor error logs regularly

## Backup Strategy

### Database Backups

**Supabase:**
- Automatic daily backups (included in free tier)
- Manual backups via dashboard
- Point-in-time recovery (paid plans)

**Self-Hosted:**
```bash
# Daily backup cron job
0 2 * * * pg_dump mybazaar > /backups/mybazaar-$(date +\%Y\%m\%d).sql
```

### Code Backups
- Repository is backed up on GitHub
- Tag releases: `git tag v1.0.0 && git push --tags`

## Maintenance

### Regular Tasks
- [ ] Monitor error logs weekly
- [ ] Review user reports
- [ ] Update dependencies monthly
- [ ] Check database size
- [ ] Review and ban inappropriate content
- [ ] Backup database before major updates

### Update Deployment

1. **Backend:**
   ```bash
   git add .
   git commit -m "Update backend"
   git push heroku main
   ```

2. **Frontend:**
   ```bash
   npm run build
   vercel --prod
   ```

## Support

For deployment issues:
- Email: mybazaarsupp@gmail.com
- GitHub Issues: https://github.com/Ebz30/super-duper-octo-broccoli/issues

---

Last updated: October 3, 2025
