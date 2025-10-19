import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import Auth from './components/Auth';
import GameModeSelector from './components/GameModeSelector';
import GameBoard from './components/GameBoard';
import Leaderboard from './components/Leaderboard';
import GameInfo from './components/GameInfo';
import { connectWebSocket, sendMessage, closeWebSocket } from './utils/websocket';
import './App.css';

function App() {
  const { user, signOut, loading: authLoading } = useAuth();
  const [gameState, setGameState] = useState('selectMode');
  const [board, setBoard] = useState(Array(6).fill(null).map(() => Array(7).fill(0)));
  const [currentTurn, setCurrentTurn] = useState(1);
  const [playerNumber, setPlayerNumber] = useState(null);
  const [opponent, setOpponent] = useState('');
  const [gameId, setGameId] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [message, setMessage] = useState('');
  const [winner, setWinner] = useState(null);
  const [username, setUsername] = useState('');

  useEffect(() => {
    if (user) {
      const name = user.user_metadata?.username || user.email.split('@')[0];
      setUsername(name);
      
      connectWebSocket((data) => {
        handleWebSocketMessage(data);
      });

      setTimeout(() => {
        sendMessage({ type: 'authenticate', userId: user.id });
      }, 500);
    }

    // Only cleanup on unmount or logout
    return () => {
      if (!user) {
        closeWebSocket();
      }
    };
  }, [user?.id]); // Only re-run if user ID changes

  const handleWebSocketMessage = (data) => {
    console.log('🎮 Frontend received:', data.type);

    switch (data.type) {
      case 'authenticated':
        console.log('✅ WebSocket authenticated');
        break;

      case 'roomCreated':
        setRoomCode(data.roomCode);
        setGameId(data.gameId);
        setGameState('waiting');
        setMessage(`Room created! Share code: ${data.roomCode}`);
        break;

      case 'waiting':
        setGameState('waiting');
        setMessage(data.message);
        break;

      case 'gameStart':
        console.log('🎮 Game starting!');
        setGameState('playing');
        setGameId(data.gameId);
        setPlayerNumber(data.playerNumber);
        setOpponent(data.opponent);
        setBoard(data.board.map(row => [...row])); // Deep copy
        setCurrentTurn(data.currentTurn);
        setRoomCode(data.roomCode || '');
        setMessage('');
        break;

      case 'gameUpdate':
        console.log('🔄 Board updating, turn:', data.currentTurn);
        setBoard(data.board.map(row => [...row])); // Deep copy
        setCurrentTurn(data.currentTurn);
        break;

      case 'gameOver':
        console.log('🏁 Game over!');
        setGameState('ended');
        setBoard(data.board.map(row => [...row])); // Deep copy
        setWinner(data.winner);
        setMessage(data.message);
        break;

      case 'gameRejoined':
        setGameState('playing');
        setGameId(data.gameId);
        setPlayerNumber(data.playerNumber);
        setBoard(data.board.map(row => [...row])); // Deep copy
        setCurrentTurn(data.currentTurn);
        setOpponent(data.opponent);
        setMessage('Reconnected!');
        setTimeout(() => setMessage(''), 3000);
        break;

      case 'opponentDisconnected':
        setMessage(data.message);
        setTimeout(() => {
          setGameState('ended');
          setWinner(playerNumber);
        }, 2000);
        break;

      case 'error':
        console.error('❌ Error:', data.message);
        setMessage(data.message);
        setTimeout(() => setMessage(''), 3000);
        break;

      default:
        break;
    }
  };

  const handleSelectMode = (mode, code = null) => {
    console.log('🎯 Mode selected:', mode, code);
    if (mode === 'bot') {
      sendMessage({ 
        type: 'playBot', 
        username 
      });
    } else if (mode === 'friend') {
      if (code) {
        sendMessage({ 
          type: code.length === 6 && !roomCode ? 'joinRoom' : 'createRoom',
          roomCode: code,
          username
        });
      }
    }
  };

  const handleMove = (column) => {
    if (gameState === 'playing' && currentTurn === playerNumber) {
      console.log('🎯 Making move:', column);
      sendMessage({ type: 'move', column });
    } else {
      console.log('⚠️ Cannot move:', { gameState, currentTurn, playerNumber });
    }
  };

  const handlePlayAgain = () => {
    setGameState('selectMode');
    setBoard(Array(6).fill(null).map(() => Array(7).fill(0)));
    setCurrentTurn(1);
    setPlayerNumber(null);
    setOpponent('');
    setGameId('');
    setRoomCode('');
    setMessage('');
    setWinner(null);
  };

  const handleLogout = async () => {
    await signOut();
    closeWebSocket();
  };

  if (authLoading) {
    return (
      <div className="app">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app">
        <h1>🎯 4 in a Row</h1>
        <Auth />
      </div>
    );
  }

  return (
    <div className="app">
      <div className="app-header">
        <h1>🎯 4 in a Row</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>

      {gameState === 'selectMode' && (
        <GameModeSelector onSelectMode={handleSelectMode} username={username} />
      )}

      {gameState === 'waiting' && (
        <div className="waiting-container">
          <div className="spinner"></div>
          <p>{message}</p>
          {roomCode && (
            <div className="room-code-display">
              <h3>Room Code:</h3>
              <div className="code">{roomCode}</div>
              <p>Share this code with your friend!</p>
            </div>
          )}
          <button onClick={handlePlayAgain} className="cancel-btn">Cancel</button>
        </div>
      )}

      {(gameState === 'playing' || gameState === 'ended') && (
        <div className="game-container">
          <GameInfo
            playerNumber={playerNumber}
            opponent={opponent}
            currentTurn={currentTurn}
            gameState={gameState}
            winner={winner}
            message={message}
          />
          
          <GameBoard
            board={board}
            onColumnClick={handleMove}
            disabled={gameState === 'ended' || currentTurn !== playerNumber}
          />

          {gameState === 'ended' && (
            <button onClick={handlePlayAgain} className="play-again-btn">
              Play Again
            </button>
          )}
        </div>
      )}

      <Leaderboard />
    </div>
  );
}

export default App;