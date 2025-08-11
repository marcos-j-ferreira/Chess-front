/* ======== CONEXÃO COM O SERVIDOR WEBSOCKET ======== */
let socket = new WebSocket("ws://localhost:8080");
let gameId = null;
let myColor = null;

socket.onopen = () => {
    socket.send(JSON.stringify({ type: 'join' }));
};

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'waiting') {
        alert("Aguardando outro jogador...");
    }

    if (data.type === 'start') {
        myColor = data.color; // 'w' ou 'b'
        gameId = data.gameId;
        alert("Jogo começou! Você é " + (myColor === 'w' ? 'Brancas' : 'Pretas'));
        initBoard(); // só inicia o tabuleiro quando ambos conectarem
    }

    if (data.type === 'move') {
        // Movimento vindo do adversário
        applyMove(data.move, true);
    }
};

/* ======== AJUSTE NO onSquareClick PARA BLOQUEAR MOVIMENTOS ======== */
function onSquareClick(x, y) {
    if (gameOver) return;

    // Bloquear jogada se não for minha vez
    if ((whiteToMove && myColor !== 'w') || (!whiteToMove && myColor !== 'b')) {
        return;
    }

    const piece = board[y][x];
    if (selected) {
        if (piece && piece.color === (whiteToMove ? 'w' : 'b')) {
            selectSquare(x, y); return;
        }
        const mv = legalMoves.find(m => m.to.x === x && m.to.y === y);
        if (mv) {
            doMoveOnline(mv);
            return;
        }
        selected = null; legalMoves = []; render();
    } else {
        if (piece && piece.color === (whiteToMove ? 'w' : 'b')) selectSquare(x, y);
    }
}

/* ======== NOVO doMove QUE SINCRONIZA COM O SERVIDOR ======== */
async function doMoveOnline(m) {
    const maybe = applyMove(m, true);

    if (maybe.promotion) {
        const prom = await askPromotion(maybe.promotion.color);
        board[maybe.promotion.y][maybe.promotion.x].type =
            prom === 'q' ? (maybe.promotion.color === 'w' ? 'Q' : 'q') :
            prom === 'r' ? (maybe.promotion.color === 'w' ? 'R' : 'r') :
            prom === 'b' ? (maybe.promotion.color === 'w' ? 'B' : 'b') :
            (maybe.promotion.color === 'w' ? 'N' : 'n');
        history[history.length - 1].notation += '=' + board[maybe.promotion.y][maybe.promotion.x].type.toUpperCase();
        whiteToMove = !whiteToMove;
        updateGameStatus(); updateUI();
    }

    // Enviar jogada para o servidor
    if (gameId) {
        socket.send(JSON.stringify({
            type: 'move',
            gameId,
            move: m
        }));
    }

    updateUI();
}
