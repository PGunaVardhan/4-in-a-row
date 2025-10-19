require('dotenv').config();
const express = require('express');
const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const cors = require('cors');
const GameManager = require('./game/GameManager');
const { getLeaderboard, createUserProfile, supabase } = require('./models/db');

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

const gameManager = new GameManager();
const wsUserMap = new Map(); // ws -> userId

// REST API endpoints
app.get('/', (req, res) => {
  res.json({ status: 'Server running', players: gameManager.getActivePlayersCount() });
});

app.get('/leaderboard', async (req, res) => {
  try {
    const leaderboard = await getLeaderboard();
    res.json(leaderboard);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

app.post('/auth/signup', async (req, res) => {
  try {
    const { email, password, username } = req.body;

    // Sign up with Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) throw error;

    // Create user profile
    await createUserProfile(data.user.id, username);

    res.json({ success: true, user: data.user });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// WebSocket handling
wss.on('connection', (ws) => {
  console.log('New client connected');
  
  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'authenticate':
          wsUserMap.set(ws, message.userId);
          ws.send(JSON.stringify({ type: 'authenticated' }));
          break;

        case 'createRoom':
          const userId = wsUserMap.get(ws);
          if (!userId) {
            ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
            return;
          }
          gameManager.createOrJoinRoom(ws, {
            userId,
            username: message.username
          }, message.roomCode);
          break;

        case 'joinRoom':
          const userIdJoin = wsUserMap.get(ws);
          if (!userIdJoin) {
            ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
            return;
          }
          gameManager.createOrJoinRoom(ws, {
            userId: userIdJoin,
            username: message.username
          }, message.roomCode);
          break;

        case 'playBot':
          const userIdBot = wsUserMap.get(ws);
          if (!userIdBot) {
            ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
            return;
          }
          gameManager.playWithBot(ws, {
            userId: userIdBot,
            username: message.username
          });
          break;
          
        case 'move':
          const userIdMove = wsUserMap.get(ws);
          if (!userIdMove) return;
          gameManager.handleMove(ws, userIdMove, message.column);
          break;
          
        case 'rejoin':
          const userIdRejoin = wsUserMap.get(ws);
          if (!userIdRejoin) return;
          gameManager.rejoinGame(ws, userIdRejoin, message.gameId);
          break;
          
        default:
          ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
      }
    } catch (error) {
      console.error('Message handling error:', error);
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
    }
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
    const userId = wsUserMap.get(ws);
    if (userId) {
      gameManager.handleDisconnect(ws, userId);
      wsUserMap.delete(ws);
    }
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});