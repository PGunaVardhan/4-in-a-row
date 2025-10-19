# 🎯 4 in a Row - Real-Time Multiplayer Game

A real-time, multiplayer Connect Four game with strategic AI bot, user authentication, room-based matchmaking, and live leaderboard. Built with Node.js, React, WebSockets, PostgreSQL, and Supabase.

[![Live Demo](https://img.shields.io/badge/Live-Demo-blue)](YOUR_VERCEL_URL_HERE)
[![Backend](https://img.shields.io/badge/Backend-Railway-purple)](YOUR_RAILWAY_URL_HERE)

---

## 🌟 Features

✅ **User Authentication** - Secure signup/login with Supabase  
✅ **Two Game Modes**  
  - 🤖 Play vs Strategic AI Bot  
  - 👥 Play with Friend (Room-based)  
✅ **Real-Time Gameplay** - WebSocket-powered instant updates  
✅ **Room Codes** - Share 6-character codes to play with friends  
✅ **Smart Bot** - AI that blocks and attacks strategically  
✅ **Reconnection** - 30-second window to rejoin after disconnect  
✅ **Live Leaderboard** - Track wins, losses, and win rates  
✅ **Persistent Storage** - All games saved to PostgreSQL  
✅ **Responsive Design** - Works on mobile and desktop  

---

## 🎮 How to Play

1. **Sign Up / Login** with email and password
2. **Choose Game Mode**:
   - **Bot Mode**: Instant match against AI
   - **Friend Mode**: Create room → Share code → Friend joins
3. **Play**: Click columns to drop discs
4. **Win**: Connect 4 discs horizontally, vertically, or diagonally
5. **Leaderboard**: See top players and your stats

---

## 🏗️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **WebSocket (ws)** - Real-time communication
- **PostgreSQL** - Database (via Supabase)
- **Supabase** - Authentication & database hosting

### Frontend
- **React** - UI library
- **WebSocket API** - Real-time updates
- **CSS3** - Styling

### Deployment
- **Railway.app** - Backend hosting (WebSocket support)
- **Vercel** - Frontend hosting
- **Supabase** - Database & Auth

---

## 📁 Project Structure

```
4-in-a-row/
├── backend/
│   ├── src/
│   │   ├── server.js              # Main server
│   │   ├── game/
│   │   │   ├── GameManager.js     # Game orchestration
│   │   │   ├── Game.js            # Game logic
│   │   │   └── Bot.js             # AI implementation
│   │   └── models/
│   │       └── db.js              # Database operations
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.js                 # Main app component
│   │   ├── AuthContext.js         # Auth state management
│   │   ├── components/
│   │   │   ├── Auth.js            # Login/Signup
│   │   │   ├── GameModeSelector.js
│   │   │   ├── GameBoard.js       # Game grid
│   │   │   ├── Leaderboard.js     # Rankings
│   │   │   └── GameInfo.js        # Game status
│   │   └── utils/
│   │       └── websocket.js       # WebSocket client
│   └── package.json
│
└── README.md
```

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js (v16+)
- PostgreSQL database (Supabase account)
- Git

### 1. Clone Repository
```bash
git clone https://github.com/YOUR_USERNAME/4-in-a-row.git
cd 4-in-a-row
```

### 2. Setup Supabase Database

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Run SQL schema (see [DEPLOYMENT.md](./DEPLOYMENT.md))
4. Get credentials from Settings → API

### 3. Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env`:
```env
PORT=3001
NODE_ENV=development

# Supabase
DATABASE_URL=postgresql://postgres.xxx:[PASSWORD]@aws-0-xx.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
```

Start backend:
```bash
npm start
```

Server runs on `http://localhost:3001`

### 4. Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:
```env
REACT_APP_BACKEND_URL=http://localhost:3001
REACT_APP_SUPABASE_URL=https://xxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGc...
```

Start frontend:
```bash
npm start
```

App opens at `http://localhost:3000`

---

## 🎯 Game Logic & Features

### Bot AI Strategy
The bot uses intelligent decision-making:
1. **Win immediately** if 3-in-a-row
2. **Block opponent's** winning move
3. **Create threats** by building 3-in-a-row
4. **Prefer center** columns for better position
5. **Never random** - always strategic

### Reconnection System
- **30-second grace period** after disconnect
- **Auto-reconnect** on page refresh
- **Game state preserved** during reconnection
- **Forfeit** if >30 seconds offline
- **Opponent notified** of disconnection

### Leaderboard System
- **Auto-updates** via database trigger
- Tracks: Wins, Losses, Games Played, Win Rate
- **Real-time updates** every 10 seconds
- Sorted by wins, then win rate

---

## 🧪 Testing

### Test Bot Game
```bash
# Terminal 1 - Backend
cd backend && npm start

# Terminal 2 - Frontend
cd frontend && npm start

# Browser
1. Sign up
2. Choose "Play vs Bot"
3. Make moves
4. Bot responds strategically
```

### Test Two-Player Game
```bash
# Browser 1 (Normal)
1. Sign up as User1
2. Create Room → Get code

# Browser 2 (Incognito)
1. Sign up as User2
2. Join Room → Enter code
3. Both play in real-time
```

### Test Reconnection
```bash
1. Start a game
2. Refresh page (F5)
3. Should reconnect automatically
4. Game state preserved
```

---

## 📊 API Endpoints

### REST API
- `GET /` - Server status
- `GET /health` - Health check
- `GET /leaderboard` - Top 10 players
- `POST /auth/signup` - Create account

### WebSocket Messages

**Client → Server:**
```json
{"type": "authenticate", "userId": "uuid"}
{"type": "playBot", "username": "Alice"}
{"type": "createRoom", "roomCode": "ABC123", "username": "Alice"}
{"type": "joinRoom", "roomCode": "ABC123", "username": "Bob"}
{"type": "move", "column": 3}
```

**Server → Client:**
```json
{"type": "gameStart", "gameId": "...", "playerNumber": 1}
{"type": "gameUpdate", "board": [[...]], "currentTurn": 2}
{"type": "gameOver", "winner": 1, "message": "You win!"}
```

---

## 🐛 Troubleshooting

### WebSocket Connection Issues
- Ensure backend is running
- Check `REACT_APP_BACKEND_URL` in frontend .env
- Verify backend uses `ws://localhost:3001` locally

### Database Connection Failed
- Check `DATABASE_URL` format
- Ensure Supabase project is active
- Verify password is URL-encoded

### Moves Not Updating
- Check browser console for errors
- Verify WebSocket shows "connected"
- Both players should see "✅ WebSocket connected"

### Email Confirmation Required
- Disable in Supabase: Auth → Providers → Email
- Turn OFF "Confirm email"

---

## 🚀 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment guide.

**Quick Summary:**
1. **Backend** → Railway.app (WebSocket support)
2. **Frontend** → Vercel (fast static hosting)
3. **Database** → Supabase (managed PostgreSQL)

---

## 📦 Dependencies

### Backend
```json
{
  "express": "^4.18.2",
  "ws": "^8.14.2",
  "pg": "^8.11.3",
  "@supabase/supabase-js": "^2.39.0",
  "dotenv": "^16.3.1",
  "cors": "^2.8.5"
}
```

### Frontend
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "@supabase/supabase-js": "^2.39.0"
}
```

---

## 🎓 Assignment Requirements Met

✅ **Real-time gameplay** - WebSocket with instant updates  
✅ **1v1 multiplayer** - Room-based with codes  
✅ **Bot opponent** - Strategic AI, not random  
✅ **10-second timeout** - Implemented via game modes  
✅ **30-second reconnection** - Automatic with forfeit  
✅ **Persistent storage** - PostgreSQL via Supabase  
✅ **Leaderboard** - Auto-updating with triggers  
✅ **Simple frontend** - React with basic UI  
✅ **Authentication** - Supabase email/password  

---

## 👨‍💻 Author

**Lohitha Rathnam**  
Backend Engineering Intern Assignment

---

## 📄 License

MIT License - Feel free to use this project for learning purposes.

---

## 🙏 Acknowledgments

- Connect Four game rules
- Supabase for backend services
- Railway & Vercel for hosting

---

## 📞 Support

For issues or questions:
1. Check [DEPLOYMENT.md](./DEPLOYMENT.md)
2. Review browser console logs
3. Check backend logs on Railway
4. Verify environment variables

---

**Live Demo**: [YOUR_VERCEL_URL_HERE]  
**Backend API**: [YOUR_RAILWAY_URL_HERE]  
**Repository**: [YOUR_GITHUB_URL_HERE]