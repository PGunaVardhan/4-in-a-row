import React from 'react';
import './GameInfo.css';

function GameInfo({ playerNumber, opponent, currentTurn, gameState, winner, message }) {
  const isMyTurn = currentTurn === playerNumber;

  return (
    <div className="game-info">
      <div className="players">
        <div className={`player ${playerNumber === 1 ? 'you' : ''}`}>
          <span className="disc-icon player1-icon"></span>
          <span>You</span>
        </div>
        <span className="vs">VS</span>
        <div className={`player ${playerNumber === 2 ? 'you' : ''}`}>
          <span className="disc-icon player2-icon"></span>
          <span>{opponent}</span>
        </div>
      </div>

      {gameState === 'playing' && (
        <div className={`turn-indicator ${isMyTurn ? 'your-turn' : 'opponent-turn'}`}>
          {isMyTurn ? '🟢 Your Turn' : '⏳ Opponent\'s Turn'}
        </div>
      )}

      {gameState === 'ended' && (
        <div className={`game-result ${winner === playerNumber ? 'win' : winner === 0 ? 'draw' : 'lose'}`}>
          {message}
        </div>
      )}

      {message && gameState !== 'ended' && (
        <div className="message">{message}</div>
      )}
    </div>
  );
}

export default GameInfo;