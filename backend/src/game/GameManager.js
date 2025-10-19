const Game = require('./Game');
const { saveGame } = require('../models/db');

class GameManager {
  constructor() {
    this.waitingPlayers = [];
    this.activeGames = new Map();
    this.playerGameMap = new Map();
    this.disconnectedPlayers = new Map();
    this.rooms = new Map();
  }

  createOrJoinRoom(ws, userData, roomCode) {
    const { userId, username } = userData;
    
    console.log('📍 CREATE/JOIN ROOM:', { userId, username, roomCode });

    // Update connection if already in game (reconnect case)
    const existingGameId = this.playerGameMap.get(userId);
    if (existingGameId) {
      const game = this.activeGames.get(existingGameId);
      if (game) {
        console.log('🔄 Player reconnected within 30s:', userId);
        
        // Clear disconnection timeout
        if (this.disconnectedPlayers.has(userId)) {
          const disconnectData = this.disconnectedPlayers.get(userId);
          clearTimeout(disconnectData.timeoutId);
          this.disconnectedPlayers.delete(userId);
          console.log('✅ Disconnection timer cancelled');
        }
        
        if (game.player1.userId === userId) {
          game.player1Connection = ws;
          ws.send(JSON.stringify({
            type: 'gameStart',
            gameId: game.id,
            playerNumber: 1,
            opponent: game.player2 ? game.player2.username : 'Waiting...',
            board: game.board,
            currentTurn: game.currentPlayer,
            roomCode: game.roomCode
          }));
        } else if (game.player2 && game.player2.userId === userId) {
          game.player2Connection = ws;
          ws.send(JSON.stringify({
            type: 'gameStart',
            gameId: game.id,
            playerNumber: 2,
            opponent: game.player1.username,
            board: game.board,
            currentTurn: game.currentPlayer,
            roomCode: game.roomCode
          }));
        }
        return;
      }
    }

    if (this.rooms.has(roomCode)) {
      const gameId = this.rooms.get(roomCode);
      const game = this.activeGames.get(gameId);

      if (game && !game.player2) {
        game.player2 = { userId, username, ws };
        game.player2Connection = ws;
        this.playerGameMap.set(userId, gameId);
        this.startGame(game);
      } else {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Room is full or invalid'
        }));
      }
    } else {
      const player1 = { userId, username, ws };
      const game = new Game(player1, null, roomCode);
      
      this.activeGames.set(game.id, game);
      this.rooms.set(roomCode, game.id);
      this.playerGameMap.set(userId, game.id);
      game.player1Connection = ws;

      ws.send(JSON.stringify({
        type: 'roomCreated',
        roomCode,
        gameId: game.id,
        message: 'Room created! Share this code with your friend.'
      }));
      
      console.log('✅ Room created:', roomCode);
    }
  }

  playWithBot(ws, userData) {
    const { userId, username } = userData;
    
    console.log('🤖 PLAY WITH BOT REQUEST:', { userId, username });

    // Update connection if already in game (reconnect case)
    const existingGameId = this.playerGameMap.get(userId);
    if (existingGameId) {
      const game = this.activeGames.get(existingGameId);
      if (game) {
        console.log('🔄 Player reconnected to bot game:', userId);
        
        // Clear disconnection timeout
        if (this.disconnectedPlayers.has(userId)) {
          const disconnectData = this.disconnectedPlayers.get(userId);
          clearTimeout(disconnectData.timeoutId);
          this.disconnectedPlayers.delete(userId);
        }
        
        game.player1Connection = ws;
        ws.send(JSON.stringify({
          type: 'gameStart',
          gameId: game.id,
          playerNumber: 1,
          opponent: 'Bot',
          board: game.board,
          currentTurn: game.currentPlayer,
          isBot: true
        }));
        return;
      }
    }

    const player1 = { userId, username, ws };
    const player2 = { userId: null, username: 'Bot', isBot: true };
    const game = new Game(player1, player2);

    console.log('🤖 Bot game created:', {
      gameId: game.id,
      player1: player1.username,
      player2: player2.username,
      isBot: player2.isBot,
      hasBot: !!game.bot
    });

    this.activeGames.set(game.id, game);
    this.playerGameMap.set(userId, game.id);
    game.player1Connection = ws;

    this.startGame(game);
  }

  startGame(game) {
    const isBot = game.player2 && game.player2.isBot;
    
    console.log('🎮 STARTING GAME:', {
      gameId: game.id,
      player1: game.player1.username,
      player2: game.player2 ? game.player2.username : 'Waiting',
      isBot: isBot,
      hasBot: !!game.bot,
      roomCode: game.roomCode
    });

    this.sendToPlayer(game.player1Connection, {
      type: 'gameStart',
      gameId: game.id,
      playerNumber: 1,
      opponent: game.player2 ? game.player2.username : 'Waiting...',
      board: game.board,
      currentTurn: game.currentPlayer,
      roomCode: game.roomCode,
      isBot: isBot
    });

    if (game.player2 && !game.player2.isBot) {
      this.sendToPlayer(game.player2Connection, {
        type: 'gameStart',
        gameId: game.id,
        playerNumber: 2,
        opponent: game.player1.username,
        board: game.board,
        currentTurn: game.currentPlayer,
        roomCode: game.roomCode,
        isBot: false
      });
    }

    console.log('🎮 Game started:', {
      gameId: game.id,
      player1: game.player1.username,
      player2: game.player2 ? game.player2.username : 'Waiting',
      isBot: isBot,
      roomCode: game.roomCode,
      timestamp: new Date().toISOString()
    });
  }

  handleMove(ws, userId, column) {
    const gameId = this.playerGameMap.get(userId);
    if (!gameId) {
      console.log('⚠️ Move attempt - No game found for user:', userId);
      return;
    }

    const game = this.activeGames.get(gameId);
    if (!game) {
      console.log('⚠️ Move attempt - Game not found:', gameId);
      return;
    }

    const playerNumber = game.player1.userId === userId ? 1 : 2;
    
    console.log('🎯 Move attempt:', {
      gameId: game.id,
      userId,
      playerNumber,
      currentTurn: game.currentPlayer,
      column,
      isBot: game.player2 ? game.player2.isBot : false
    });

    if (game.currentPlayer !== playerNumber) {
      this.sendToPlayer(ws, {
        type: 'error',
        message: 'Not your turn'
      });
      return;
    }

    const result = game.makeMove(column);
    
    if (!result.valid) {
      this.sendToPlayer(ws, {
        type: 'error',
        message: result.message
      });
      return;
    }

    // CRITICAL: Broadcast immediately after valid move
    this.broadcastGameState(game);
    console.log('📡 Broadcasted game state to all players');

    console.log('📊 Move made:', {
      gameId: game.id,
      player: playerNumber === 1 ? game.player1.username : (game.player2 ? game.player2.username : 'Unknown'),
      column,
      timestamp: new Date().toISOString()
    });

    if (result.gameOver) {
      this.endGame(game, result.winner);
      return;
    }

    // Bot's turn
    if (game.player2 && game.player2.isBot && game.currentPlayer === 2) {
      console.log('🤖 Bot turn starting...');
      
      if (!game.bot) {
        console.error('❌ ERROR: Bot game but no bot instance!');
        return;
      }

      setTimeout(() => {
        try {
          const botMove = game.bot.getBestMove(game.board);
          console.log('🤖 Bot chose column:', botMove);
          
          const botResult = game.makeMove(botMove);
          
          if (!botResult.valid) {
            console.error('❌ Bot made invalid move!', botResult);
            return;
          }
          
          this.broadcastGameState(game);
          console.log('📡 Broadcasted bot move to all players');

          console.log('📊 Bot move made:', {
            gameId: game.id,
            player: 'Bot',
            column: botMove,
            timestamp: new Date().toISOString()
          });

          if (botResult.gameOver) {
            this.endGame(game, botResult.winner);
          }
        } catch (error) {
          console.error('❌ Bot move error:', error);
        }
      }, 500);
    }
  }

  async endGame(game, winner) {
    // Prevent duplicate game end
    if (!this.activeGames.has(game.id)) {
      console.log('⚠️ Game already ended:', game.id);
      return;
    }

    const duration = Math.floor((Date.now() - game.startTime) / 1000);
    
    let winnerId = null;
    let winnerUsername = 'draw';
    
    if (winner !== 0) {
      if (winner === 1) {
        winnerId = game.player1.userId;
        winnerUsername = game.player1.username;
      } else if (game.player2 && !game.player2.isBot) {
        winnerId = game.player2.userId;
        winnerUsername = game.player2.username;
      } else {
        winnerUsername = 'Bot';
      }
    }

    const isBot = game.player2 ? game.player2.isBot : false;

    const gameData = {
      gameId: game.id,
      player1Id: game.player1.userId,
      player2Id: isBot ? null : (game.player2 ? game.player2.userId : null),
      player1Username: game.player1.username,
      player2Username: game.player2 ? game.player2.username : 'Unknown',
      winnerId,
      winnerUsername,
      isBot: isBot,
      duration,
      roomCode: game.roomCode
    };

    console.log('💾 Saving game:', gameData);

    // Cleanup BEFORE saving to prevent duplicate
    this.playerGameMap.delete(game.player1.userId);
    if (game.player2 && !game.player2.isBot) {
      this.playerGameMap.delete(game.player2.userId);
    }
    if (game.roomCode) {
      this.rooms.delete(game.roomCode);
    }
    this.activeGames.delete(game.id);

    // Save to database
    await saveGame(gameData);

    // Notify players
    this.sendToPlayer(game.player1Connection, {
      type: 'gameOver',
      winner: winner,
      board: game.board,
      message: winner === 0 ? 'Draw!' : winner === 1 ? 'You win!' : 'You lose!'
    });

    if (game.player2 && !game.player2.isBot) {
      this.sendToPlayer(game.player2Connection, {
        type: 'gameOver',
        winner: winner,
        board: game.board,
        message: winner === 0 ? 'Draw!' : winner === 2 ? 'You win!' : 'You lose!'
      });
    }

    console.log('📊 Game ended:', {
      gameId: game.id,
      ...gameData,
      timestamp: new Date().toISOString()
    });

    console.log('✅ Game ended successfully:', game.id);
  }

  handleDisconnect(ws, userId) {
    if (!userId) return;
    
    const gameId = this.playerGameMap.get(userId);
    if (!gameId) return;
    
    const game = this.activeGames.get(gameId);
    if (!game) return;

    console.log('⚠️ Player disconnected:', userId);
    
    // Set disconnection timer
    if (!this.disconnectedPlayers.has(userId)) {
      this.disconnectedPlayers.set(userId, {
        gameId,
        disconnectedAt: Date.now(),
        timeoutId: setTimeout(() => {
          // Check if still disconnected after 30 seconds
          if (this.disconnectedPlayers.has(userId)) {
            console.log('❌ Player forfeit (30s timeout):', userId);
            const playerNumber = game.player1.userId === userId ? 1 : 2;
            const winner = playerNumber === 1 ? 2 : 1;
            
            // Notify other player
            const otherConnection = playerNumber === 1 ? game.player2Connection : game.player1Connection;
            if (otherConnection && otherConnection.readyState === 1) {
              otherConnection.send(JSON.stringify({
                type: 'opponentDisconnected',
                message: 'Opponent disconnected. You win by forfeit!'
              }));
            }
            
            this.endGame(game, winner);
            this.disconnectedPlayers.delete(userId);
          }
        }, 30000)
      });
    }
  }

  rejoinGame(ws, userId, gameId) {
    if (!this.disconnectedPlayers.has(userId)) {
      this.sendToPlayer(ws, {
        type: 'error',
        message: 'No game to rejoin'
      });
      return;
    }

    const game = this.activeGames.get(gameId);
    if (!game) {
      this.sendToPlayer(ws, {
        type: 'error',
        message: 'Game not found'
      });
      return;
    }

    const playerNumber = game.player1.userId === userId ? 1 : 2;
    if (playerNumber === 1) {
      game.player1Connection = ws;
    } else {
      game.player2Connection = ws;
    }

    this.disconnectedPlayers.delete(userId);

    this.sendToPlayer(ws, {
      type: 'gameRejoined',
      gameId: game.id,
      playerNumber,
      board: game.board,
      currentTurn: game.currentPlayer,
      opponent: playerNumber === 1 ? (game.player2 ? game.player2.username : 'Unknown') : game.player1.username
    });
  }

  broadcastGameState(game) {
    const state = {
      type: 'gameUpdate',
      board: game.board,
      currentTurn: game.currentPlayer
    };

    console.log('📡 Broadcasting state:', {
      gameId: game.id,
      currentTurn: state.currentTurn,
      boardState: game.board[5] // Show bottom row for debugging
    });

    this.sendToPlayer(game.player1Connection, state);
    if (game.player2 && !game.player2.isBot) {
      this.sendToPlayer(game.player2Connection, state);
    }
  }

  sendToPlayer(ws, data) {
    if (ws && ws.readyState === 1) {
      ws.send(JSON.stringify(data));
    } else {
      console.log('⚠️ Cannot send to player, WebSocket not open:', ws?.readyState);
    }
  }

  getActivePlayersCount() {
    return this.playerGameMap.size;
  }
}

module.exports = GameManager;