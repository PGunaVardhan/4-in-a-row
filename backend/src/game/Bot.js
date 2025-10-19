class Bot {
  constructor() {
    this.player = 2;
    this.opponent = 1;
  }

  getBestMove(board) {
    // 1. Check if bot can win
    const winMove = this.findWinningMove(board, this.player);
    if (winMove !== -1) return winMove;

    // 2. Block opponent's winning move
    const blockMove = this.findWinningMove(board, this.opponent);
    if (blockMove !== -1) return blockMove;

    // 3. Try to create opportunities (center preference and strategic positions)
    const strategicMove = this.findStrategicMove(board);
    if (strategicMove !== -1) return strategicMove;

    // 4. Fallback to random valid move
    const validMoves = this.getValidMoves(board);
    return validMoves[Math.floor(Math.random() * validMoves.length)];
  }

  findWinningMove(board, player) {
    for (let col = 0; col < 7; col++) {
      if (board[0][col] !== 0) continue;
      
      const row = this.getDropRow(board, col);
      if (row === -1) continue;

      // Simulate move
      board[row][col] = player;
      const isWin = this.checkWin(board, row, col, player);
      board[row][col] = 0; // Undo

      if (isWin) return col;
    }
    return -1;
  }

  findStrategicMove(board) {
    const validMoves = this.getValidMoves(board);
    
    // Prefer center columns (3, then 2 and 4, then 1 and 5)
    const centerPreference = [3, 2, 4, 1, 5, 0, 6];
    for (let col of centerPreference) {
      if (validMoves.includes(col)) {
        // Check if this move creates a threat
        const row = this.getDropRow(board, col);
        board[row][col] = this.player;
        const threat = this.countThreats(board, this.player);
        board[row][col] = 0;
        
        if (threat > 0) return col;
      }
    }

    // Return first center available
    for (let col of centerPreference) {
      if (validMoves.includes(col)) return col;
    }

    return validMoves[0];
  }

  countThreats(board, player) {
    let threats = 0;
    
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 7; col++) {
        if (board[row][col] === player) {
          // Check all directions for potential 3-in-a-row
          if (this.hasThreeInDirection(board, row, col, player, 0, 1)) threats++; // Horizontal
          if (this.hasThreeInDirection(board, row, col, player, 1, 0)) threats++; // Vertical
          if (this.hasThreeInDirection(board, row, col, player, 1, 1)) threats++; // Diagonal \
          if (this.hasThreeInDirection(board, row, col, player, 1, -1)) threats++; // Diagonal /
        }
      }
    }
    
    return threats;
  }

  hasThreeInDirection(board, row, col, player, dRow, dCol) {
    let count = 0;
    let empty = 0;
    
    for (let i = -3; i <= 3; i++) {
      const r = row + i * dRow;
      const c = col + i * dCol;
      
      if (r < 0 || r >= 6 || c < 0 || c >= 7) continue;
      
      if (board[r][c] === player) count++;
      else if (board[r][c] === 0) empty++;
      else return false; // Opponent piece blocks
    }
    
    return count === 3 && empty >= 1;
  }

  checkWin(board, row, col, player) {
    // Check horizontal
    let count = 1;
    for (let c = col - 1; c >= 0 && board[row][c] === player; c--) count++;
    for (let c = col + 1; c < 7 && board[row][c] === player; c++) count++;
    if (count >= 4) return true;

    // Check vertical
    count = 1;
    for (let r = row + 1; r < 6 && board[r][col] === player; r++) count++;
    if (count >= 4) return true;

    // Check diagonal \
    count = 1;
    for (let i = 1; row - i >= 0 && col - i >= 0 && board[row - i][col - i] === player; i++) count++;
    for (let i = 1; row + i < 6 && col + i < 7 && board[row + i][col + i] === player; i++) count++;
    if (count >= 4) return true;

    // Check diagonal /
    count = 1;
    for (let i = 1; row + i < 6 && col - i >= 0 && board[row + i][col - i] === player; i++) count++;
    for (let i = 1; row - i >= 0 && col + i < 7 && board[row - i][col + i] === player; i++) count++;
    if (count >= 4) return true;

    return false;
  }

  getDropRow(board, col) {
    for (let row = 5; row >= 0; row--) {
      if (board[row][col] === 0) return row;
    }
    return -1;
  }

  getValidMoves(board) {
    const moves = [];
    for (let col = 0; col < 7; col++) {
      if (board[0][col] === 0) moves.push(col);
    }
    return moves;
  }
}

module.exports = Bot;