const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Initialize database
async function initDatabase() {
  try {
    await pool.query('SELECT NOW()');
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection error:', error);
  }
}

// Create user profile after signup
async function createUserProfile(userId, username) {
  try {
    await pool.query(
      `INSERT INTO user_profiles (id, username) VALUES ($1, $2)
       ON CONFLICT (id) DO NOTHING`,
      [userId, username]
    );
    console.log('User profile created:', username);
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
}

// Save completed game
async function saveGame(gameData) {
  try {
    const { 
      gameId, 
      player1Id, 
      player2Id, 
      player1Username, 
      player2Username, 
      winnerId, 
      winnerUsername,
      isBot, 
      duration,
      roomCode 
    } = gameData;
    
    await pool.query(
      `INSERT INTO games (id, player1_id, player2_id, player1_username, player2_username, 
                          winner_id, winner_username, is_bot_game, duration, room_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [gameId, player1Id, player2Id, player1Username, player2Username, 
       winnerId, winnerUsername, isBot, duration, roomCode]
    );

    console.log('Game saved:', gameId);
  } catch (error) {
    console.error('Error saving game:', error);
  }
}

// Get leaderboard (trigger auto-updates it)
async function getLeaderboard(limit = 10) {
  try {
    const result = await pool.query(
      `SELECT username, wins, losses, games_played,
              ROUND(CAST(wins AS DECIMAL) / NULLIF(games_played, 0) * 100, 1) as win_rate
       FROM leaderboard
       ORDER BY wins DESC, win_rate DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
}

// Get user stats
async function getUserStats(userId) {
  try {
    const result = await pool.query(
      `SELECT * FROM leaderboard WHERE user_id = $1`,
      [userId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return null;
  }
}

initDatabase();

module.exports = {
  pool,
  supabase,
  createUserProfile,
  saveGame,
  getLeaderboard,
  getUserStats
};