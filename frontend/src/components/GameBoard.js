import React from 'react';
import './GameBoard.css';

function GameBoard({ board, onColumnClick, disabled }) {
  return (
    <div className="game-board">
      {board.map((row, rowIndex) => (
        <div key={rowIndex} className="board-row">
          {row.map((cell, colIndex) => (
            <div
              key={colIndex}
              className={`cell ${disabled ? 'disabled' : 'clickable'}`}
              onClick={() => !disabled && onColumnClick(colIndex)}
            >
              <div className={`disc ${cell === 1 ? 'player1' : cell === 2 ? 'player2' : ''}`}>
                {cell !== 0 && <div className="disc-inner"></div>}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default GameBoard;