import React, { useState } from 'react';
import './GameModeSelector.css';

function GameModeSelector({ onSelectMode, username }) {
  const [showRoomInput, setShowRoomInput] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateRoom = () => {
    const code = generateRoomCode();
    onSelectMode('friend', code);
  };

  const handleJoinRoom = () => {
    if (roomCode.trim().length >= 6) {
      onSelectMode('friend', roomCode.trim().toUpperCase());
    }
  };

  return (
    <div className="mode-selector">
      <h2>Choose Game Mode</h2>
      <p className="welcome-text">Welcome, {username}!</p>
      
      <div className="mode-buttons">
        <button className="mode-btn bot-btn" onClick={() => onSelectMode('bot')}>
          <span className="icon">🤖</span>
          <h3>Play vs Bot</h3>
          <p>Practice against AI</p>
        </button>
        
        <button className="mode-btn friend-btn" onClick={() => setShowRoomInput(!showRoomInput)}>
          <span className="icon">👥</span>
          <h3>Play with Friend</h3>
          <p>Create or join room</p>
        </button>
      </div>

      {showRoomInput && (
        <div className="room-section">
          <div className="room-tabs">
            <button 
              className={!isJoining ? 'active' : ''} 
              onClick={() => setIsJoining(false)}
            >
              Create Room
            </button>
            <button 
              className={isJoining ? 'active' : ''} 
              onClick={() => setIsJoining(true)}
            >
              Join Room
            </button>
          </div>

          {isJoining ? (
            <div className="room-input-group">
              <input
                type="text"
                placeholder="Enter Room Code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={6}
              />
              <button onClick={handleJoinRoom}>Join</button>
            </div>
          ) : (
            <div className="room-create">
              <p>Click below to create a room and get a code to share</p>
              <button onClick={handleCreateRoom}>Generate Room Code</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GameModeSelector;