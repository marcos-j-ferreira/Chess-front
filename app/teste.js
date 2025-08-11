function canMoveWithoutCheck(from, to, color) {
    if (!isValidMove(from, to)) return false;

    const capturedPiece = board[to.row][to.col];
    const movingPiece = board[from.row][from.col];

    // Simula o movimento
    board[to.row][to.col] = movingPiece;
    board[from.row][from.col] = '';

    const stillInCheck = isInCheck(color);

    // Desfaz o movimento
    board[from.row][from.col] = movingPiece;
    board[to.row][to.col] = capturedPiece;

    return !stillInCheck;
}

function isCheckmate() {
    if (!isInCheck(currentTurn)) return false;

    for (let fromRow = 0; fromRow < 8; fromRow++) {
        for (let fromCol = 0; fromCol < 8; fromCol++) {
            const piece = board[fromRow][fromCol];
            if (piece &&
                ((currentTurn === 'white' && piece === piece.toUpperCase()) ||
                 (currentTurn === 'black' && piece === piece.toLowerCase()))) {

                for (let toRow = 0; toRow < 8; toRow++) {
                    for (let toCol = 0; toCol < 8; toCol++) {
                        if (canMoveWithoutCheck({ row: fromRow, col: fromCol }, { row: toRow, col: toCol }, currentTurn)) {
                            return false;
                        }
                    }
                }
            }
        }
    }

    return true;
}







function onSquareClick(x, y) {
    if (gameOver) return;
    if ((whiteToMove && myColor !== 'white') || (!whiteToMove && myColor !== 'black')) return;
    // ... resto da lógica
}
