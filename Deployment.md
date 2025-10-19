# 🚀 Deployment Guide - 4 in a Row

## Prerequisites
- GitHub account
- Railway.app account (free tier)
- Vercel account (free tier)
- Supabase account (free tier)

---

## 📦 Step 1: Prepare Your Repository

### 1.1 Create .gitignore at root

Create `4-in-a-row/.gitignore`:
```
# Dependencies
node_modules/
*/node_modules/

# Environment files
.env
.env.local
*.env

# Build outputs
build/
dist/
*/build/
*/dist/

# Logs
*.log
npm-debug.log*

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
```

### 1.2 Push to GitHub

```bash
cd 4-in-a-row
git init
git add .
git commit -m "Initial commit: 4-in-a-row game"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/4-in-a-row.git
git push -u origin main
```

---

## 🗄️ Step 2: Setup Supabase Database

### 2.1 Create Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill details:
   - Name: `4-in-a-row`
   - Database Password: (save this!)
   - Region: Choose closest

### 2.2 Run Database Schema
1. Go to **SQL Editor**
2. Click "New Query"
3. Paste and run:

```sql
-- User profiles
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Games
CREATE TABLE games (
  id TEXT PRIMARY KEY,
  player1_id UUID REFERENCES auth.users(id),
  player2_id UUID REFERENCES auth.users(id),
  player1_username VARCHAR(255),
  player2_username VARCHAR(255),
  winner_id UUID REFERENCES auth.users(id),
  winner_username VARCHAR(255),
  is_bot_game BOOLEAN DEFAULT false,
  duration INTEGER,
  room_code TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Leaderboard
CREATE TABLE leaderboard (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(255) NOT NULL,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Auto-update leaderboard trigger
CREATE OR REPLACE FUNCTION update_leaderboard_after_game()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.winner_id IS NOT NULL THEN
    INSERT INTO leaderboard (user_id, username, wins, games_played)
    VALUES (NEW.winner_id, NEW.winner_username, 1, 1)
    ON CONFLICT (user_id) DO UPDATE SET
      wins = leaderboard.wins + 1,
      games_played = leaderboard.games_played + 1,
      updated_at = NOW();
  END IF;
  
  IF NEW.player1_id IS NOT NULL AND NEW.player1_id != NEW.winner_id THEN
    INSERT INTO leaderboard (user_id, username, losses, games_played)
    VALUES (NEW.player1_id, NEW.player1_username, 1, 1)
    ON CONFLICT (user_id) DO UPDATE SET
      losses = leaderboard.losses + 1,
      games_played = leaderboard.games_played + 1,
      updated_at = NOW();
  END IF;
  
  IF NEW.player2_id IS NOT NULL AND NEW.player2_id != NEW.winner_id THEN
    INSERT INTO leaderboard (user_id, username, losses, games_played)
    VALUES (NEW.player2_id, NEW.player2_username, 1, 1)
    ON CONFLICT (user_id) DO UPDATE SET
      losses = leaderboard.losses + 1,
      games_played = leaderboard.games_played + 1,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER game_completed_trigger
AFTER INSERT ON games
FOR EACH ROW
EXECUTE FUNCTION update_leaderboard_after_game();
```

### 2.3 Disable Email Confirmation (for testing)
1. **Authentication** → **Providers**
2. Click **Email**
3. Turn OFF "Confirm email"
4. Save

### 2.4 Get Credentials
1. **Settings** → **API**
   - Copy `Project URL`
   - Copy `anon public key`

2. **Settings** → **Database**
   - Copy **Connection Pooling** URI
   - Format: `postgresql://postgres.xxx:[PASSWORD]@aws-0-xx.pooler.supabase.com:6543/postgres`

---

## 🚂 Step 3: Deploy Backend to Railway

### 3.1 Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub

### 3.2 Deploy Backend
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your `4-in-a-row` repository
4. Railway will detect it's a Node.js app

### 3.3 Configure Root Directory
1. Click on your service
2. Go to **Settings**
3. Set **Root Directory**: `backend`
4. Set **Start Command**: `npm start`

### 3.4 Add Environment Variables
1. Go to **Variables** tab
2. Click **"+ New Variable"**
3. Add these:

```
DATABASE_URL=postgresql://postgres.xxx:[YOUR_PASSWORD]@aws-0-xx.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
NODE_ENV=production
PORT=3001
```

### 3.5 Generate Domain
1. Go to **Settings** → **Networking**
2. Click **"Generate Domain"**
3. Copy the URL (e.g., `https://your-app.up.railway.app`)
4. **Save this URL!** You'll need it for frontend

### 3.6 Deploy
- Railway auto-deploys
- Check **Deployments** tab for logs
- Should see: `Server running on port 3001`

---

## ▲ Step 4: Deploy Frontend to Vercel

### 4.1 Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub

### 4.2 Import Project
1. Click **"Add New..."** → **"Project"**
2. Import your `4-in-a-row` repository
3. Vercel detects it's a React app

### 4.3 Configure Settings
1. **Framework Preset**: Create React App
2. **Root Directory**: `frontend`
3. **Build Command**: `npm run build` (auto-detected)
4. **Output Directory**: `build` (auto-detected)

### 4.4 Add Environment Variables
Click **"Environment Variables"** and add:

```
REACT_APP_BACKEND_URL=https://your-app.up.railway.app
REACT_APP_SUPABASE_URL=https://xxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGc...
```

**⚠️ Important:** Use your Railway URL from Step 3.5!

### 4.5 Deploy
1. Click **"Deploy"**
2. Wait 2-3 minutes
3. Vercel gives you a URL (e.g., `https://4-in-a-row.vercel.app`)

---

## ✅ Step 5: Test Your Deployment

### 5.1 Backend Health Check
Visit: `https://your-backend.up.railway.app/health`

Should see:
```json
{"status":"ok"}
```

### 5.2 Frontend Test
1. Visit your Vercel URL
2. Sign up with email/password
3. Choose "Play vs Bot"
4. Make some moves
5. Check leaderboard appears

### 5.3 Two-Player Test
1. Open your Vercel URL in normal browser
2. Open same URL in incognito
3. Login with different accounts
4. Create room → Share code → Join
5. Play game together!

---

## 🐛 Troubleshooting

### Backend Issues

**"Database connection error"**
- Check DATABASE_URL format
- Ensure password is URL-encoded (replace `@` with `%40`)
- Verify Supabase project is active

**"Cannot find module"**
- Check Railway root directory is set to `backend`
- Verify all dependencies in package.json

**WebSocket not connecting**
- Check Railway domain is HTTPS
- Verify frontend env has correct backend URL

### Frontend Issues

**Blank page**
- Check browser console for errors
- Verify all env variables are set
- Check Vercel build logs

**"Email not confirmed"**
- Disable email confirmation in Supabase (Step 2.3)

**WebSocket connection failed**
- Verify REACT_APP_BACKEND_URL is correct
- Must be Railway URL, not Vercel

**Moves not updating**
- Clear browser cache
- Check both browser consoles for errors
- Verify WebSocket shows "connected"

---

## 📊 Monitoring

### Railway Logs
1. Go to your Railway project
2. Click **Deployments**
3. View real-time logs

### Vercel Logs
1. Go to your Vercel project
2. Click **Deployments** → Latest
3. View **Function Logs**

### Supabase Logs
1. Go to Supabase project
2. Click **Database** → **Logs**
3. Check for errors

---

## 🔄 Updating Your App

### Update Backend
```bash
git add backend/
git commit -m "Update backend"
git push
```
Railway auto-redeploys ✅

### Update Frontend
```bash
git add frontend/
git commit -m "Update frontend"
git push
```
Vercel auto-redeploys ✅

---
