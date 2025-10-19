const Bot = require('./Bot');

class Game {
  constructor(player1, player2, roomCode = null) {
    this.id = this.generateId();
    this.player1 = player1;
    this.player2 = player2;
    this.board = Array(6).fill(null).map(() => Array(7).fill(0));
    this.currentPlayer = 1;
    this.startTime = Date.now();
    this.roomCode = roomCode;
    
    // Only initialize bot if player2 exists and is a bot
    if (player2 && player2.isBot) {
      this.bot = new Bot();
    }
  }

  generateId() {
    return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  makeMove(column) {
    // Validate column
    if (column < 0 || column > 6) {
      return { valid: false, message: 'Invalid column' };
    }

    // Check if column is full
    if (this.board[0][column] !== 0) {
      return { valid: false, message: 'Column is full' };
    }

    // Drop the disc
    let row = -1;
    for (let r = 5; r >= 0; r--) {
      if (this.board[r][column] === 0) {
        row = r;
        break;
      }
    }

    this.board[row][column] = this.currentPlayer;

    // Check for win
    if (this.checkWin(row, column)) {
      return {
        valid: true,
        gameOver: true,
        winner: this.currentPlayer,
        row,
        column
      };
    }

    // Check for draw
    if (this.isBoardFull()) {
      return {
        valid: true,
        gameOver: true,
        winner: 0,
        row,
        column
      };
    }

    // Switch player
    this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;

    return {
      valid: true,
      gameOver: false,
      row,
      column
    };
  }

  checkWin(row, col) {
    const player = this.board[row][col];
    
    // Check horizontal
    let count = 1;
    // Check left
    for (let c = col - 1; c >= 0 && this.board[row][c] === player; c--) count++;
    // Check right
    for (let c = col + 1; c < 7 && this.board[row][c] === player; c++) count++;
    if (count >= 4) return true;

    // Check vertical
    count = 1;
    // Check down
    for (let r = row + 1; r < 6 && this.board[r][col] === player; r++) count++;
    if (count >= 4) return true;

    // Check diagonal (top-left to bottom-right)
    count = 1;
    for (let i = 1; row - i >= 0 && col - i >= 0 && this.board[row - i][col - i] === player; i++) count++;
    for (let i = 1; row + i < 6 && col + i < 7 && this.board[row + i][col + i] === player; i++) count++;
    if (count >= 4) return true;

    // Check diagonal (bottom-left to top-right)
    count = 1;
    for (let i = 1; row + i < 6 && col - i >= 0 && this.board[row + i][col - i] === player; i++) count++;
    for (let i = 1; row - i >= 0 && col + i < 7 && this.board[row - i][col + i] === player; i++) count++;
    if (count >= 4) return true;

    return false;
  }

  isBoardFull() {
    return this.board[0].every(cell => cell !== 0);
  }

  getValidMoves() {
    const moves = [];
    for (let col = 0; col < 7; col++) {
      if (this.board[0][col] === 0) {
        moves.push(col);
      }
    }
    return moves;
  }
}

module.exports = Game;