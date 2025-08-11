socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    // ... (código de 'waiting' e 'start' continua igual) ...

    if (data.type === 'move') {
        // Movimento vindo do adversário
        applyMove(data.move, true); // Primeiro, move o peão

        // AGORA, VERIFICA SE HOUVE PROMOÇÃO
        if (data.promotion) {
            const move = data.move;
            const promChoice = data.promotion; // ex: 'q'
            const pieceColor = board[move.to.y][move.to.x].color;

            // Atualiza a peça no tabuleiro do oponente
            board[move.to.y][move.to.x].type = getPromotionPieceType(promChoice, pieceColor);
            history[history.length - 1].notation += '=' + board[move.to.y][move.to.x].type.toUpperCase();
        }

        // Finaliza o turno (isso já deve estar chamando updateUI)
        finishMove();
    }
};





// Adicione esta função em algum lugar do seu código
function getPromotionPieceType(choice, color) {
    if (color === 'w') {
        return choice.toUpperCase(); // 'q' -> 'Q'
    } else {
        return choice.toLowerCase(); // 'q' -> 'q'
    }
}