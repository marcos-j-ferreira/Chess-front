/*
  XADREZ EM JAVASCRIPT - SINGLE FILE
  - Estrutura modular (funções claras)
  - Implementa: movimento de todas as peças, xeque/xeque-mate, roque pequeno/grande, en passant, promoção, histórico
  - Validações: não permite movimentos que deixem o próprio rei em xeque
  - Interface simples: clique para selecionar e clicar para mover
*/
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

/* ======== AJUSTE NO onSquareClick PARA BLOQUEAR MOVIMENTOS ======== */
// function onSquareClick(x, y) {
//     if (gameOver) return;

//     // Bloquear jogada se não for minha vez
//     if ((whiteToMove && myColor !== 'w') || (!whiteToMove && myColor !== 'b')) {
//         return;
//     }

//     const piece = board[y][x];
//     if (selected) {
//         if (piece && piece.color === (whiteToMove ? 'w' : 'b')) {
//             selectSquare(x, y); return;
//         }
//         const mv = legalMoves.find(m => m.to.x === x && m.to.y === y);
//         if (mv) {
//             doMoveOnline(mv);
//             return;
//         }
//         selected = null; legalMoves = []; render();
//     } else {
//         if (piece && piece.color === (whiteToMove ? 'w' : 'b')) selectSquare(x, y);
//     }
// }

function getPromotionPieceType(choice, color) {
    if (color === 'w') {
        return choice.toUpperCase(); // 'q' -> 'Q'
    } else {
        return choice.toLowerCase(); // 'q' -> 'q'
    }
}

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
// Peças Unicode
const PIECE_UNICODE = {
    'P': '♙', 'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔',
    'p': '♟', 'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚'
};

// Estado do jogo
let board = [];
let whiteToMove = true;
let selected = null; // {x,y}
let legalMoves = [];
let history = []; // array de moves
let canEnPassant = null; // square coord where en passant capture is possible ({x,y})
let castlingRights = { wK: true, wQ: true, bK: true, bQ: true };
let flipped = false;
let gameOver = false;
let promotionResolve = null; // promise resolver for promotion

// Util helpers
const inside = (x, y) => x >= 0 && x < 8 && y >= 0 && y < 8;
const cloneBoard = (b) => b.map(r => r.map(cell => cell ? { ...cell } : null));

function initBoard() {
    // 8x8 with rows 0..7 (0 is top = black's backrank). We'll render flipped if needed.
    const empty = () => null;
    board = Array.from({ length: 8 }, (_, r) => Array.from({ length: 8 }, (_, c) => null));
    const back = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
    for (let c = 0; c < 8; c++) {
        board[0][c] = { type: back[c], color: 'b', moved: false };
        board[1][c] = { type: 'p', color: 'b', moved: false };
        board[6][c] = { type: 'P', color: 'w', moved: false };
        board[7][c] = { type: back[c].toUpperCase(), color: 'w', moved: false };
    }
    whiteToMove = true; selected = null; legalMoves = []; history = []; canEnPassant = null;
    castlingRights = { wK: true, wQ: true, bK: true, bQ: true }; gameOver = false; updateUI();
}

// Render
function render() {
    const boardEl = document.getElementById('board');
    boardEl.innerHTML = '';
    const rows = [...Array(8).keys()];
    const cols = [...Array(8).keys()];
    const seqY = flipped ? rows : [...rows].reverse();
    const seqX = flipped ? [...cols].reverse() : cols;

    for (let r of seqY) {
        for (let c of seqX) {
            const sq = document.createElement('div'); sq.className = 'square';
            const cell = document.createElement('div'); cell.className = 'cell';
            const isLight = (r + c) % 2 === 0;
            cell.classList.add(isLight ? 'light' : 'dark');
            const piece = board[r][c];
            if (piece) {
                const span = document.createElement('div'); span.className = 'piece'; span.textContent = PIECE_UNICODE[piece.type];
                cell.appendChild(span);
            }
            // highlight selected
            if (selected && selected.x === c && selected.y === r) cell.classList.add('selected');
            // check legal moves
            if (legalMoves.some(m => m.to.x === c && m.to.y === r)) cell.classList.add('legal-move');
            // attach onclick
            cell.addEventListener('click', () => onSquareClick(c, r));
            sq.appendChild(cell);
            boardEl.appendChild(sq);
        }
    }
}

function updateUI() {
    render();
    document.getElementById('turnText').textContent = 'Vez: ' + (whiteToMove ? 'White' : 'Black');

    
    const hist = document.getElementById('history'); hist.innerHTML = '';
    history.forEach((m, i) => {
        const div = document.createElement('div'); div.style.padding = '4px 0';
        div.textContent = (i + 1) + '. ' + m.notation;
        hist.appendChild(div);
    });
    document.getElementById('moveCount').textContent = history.length;
}

// // Click handling
// function onSquareClick(x, y) {
//     if (gameOver) return;
//     const piece = board[y][x];
//     if (selected) {
//         // If clicking piece of same color -> change selection
//         if (piece && piece.color === (whiteToMove ? 'w' : 'b')) {
//             selectSquare(x, y); return;
//         }
//         // else check if clicked in legalMoves
//         const mv = legalMoves.find(m => m.to.x === x && m.to.y === y);
//         if (mv) {
//             doMove(mv);
//             return;
//         }
//         // otherwise clear
//         selected = null; legalMoves = []; render();
//     } else {
//         if (piece && piece.color === (whiteToMove ? 'w' : 'b')) selectSquare(x, y);
//     }
// }

function selectSquare(x, y) {
    selected = { x, y };
    legalMoves = generateLegalMovesFrom(x, y);
    render();
}

// Move generation
function generateLegalMovesFrom(x, y) {
    const piece = board[y][x]; if (!piece) return [];
    let pseudo = generatePseudoMoves(x, y, piece);
    // For each pseudo move, simulate and check king safety
    const legal = [];
    for (const m of pseudo) {
        const savedBoard = cloneBoard(board);
        const savedEn = canEnPassant; const savedCast = { ...castlingRights };
        applyMove(m, false);
        if (!isKingInCheck(piece.color)) {
            legal.push(m);
        }
        board = savedBoard; canEnPassant = savedEn; castlingRights = savedCast;
    }
    return legal;
}

function generatePseudoMoves(x, y, piece) {
    const moves = [];
    const dir = piece.color === 'w' ? -1 : 1;
    const enemy = piece.color === 'w' ? 'b' : 'w';
    const addMove = (tx, ty, opts = {}) => { if (inside(tx, ty)) moves.push({ from: { x, y }, to: { x: tx, y: ty }, piece: { ...piece }, capture: board[ty][tx] ? { ...board[ty][tx] } : null, ...opts }); };

    switch (piece.type.toLowerCase()) {
        case 'p': {
            // forward
            const fy = y + dir;
            if (inside(x, fy) && !board[fy][x]) {
                addMove(x, fy);
                // two squares
                const sy = y + dir * 2;
                if ((piece.color === 'w' && y === 6) || (piece.color === 'b' && y === 1)) {
                    if (inside(x, sy) && !board[sy][x]) addMove(x, sy, { double: true });
                }
            }
            // captures
            for (const dx of [-1, 1]) {
                const tx = x + dx, ty = y + dir;
                if (inside(tx, ty) && board[ty][tx] && board[ty][tx].color === enemy) addMove(tx, ty, { capture: true });
                // en passant
                if (canEnPassant && canEnPassant.x === tx && canEnPassant.y === y) {
                    // capture the pawn that moved two squares and sits at (tx, y)
                    addMove(tx, y + dir, { enPassant: true, capture: { ...board[y][tx] } });
                }
            }
            break;
        }
        case 'n': {
            const del = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];
            for (const [dx, dy] of del) { const tx = x + dx, ty = y + dy; if (inside(tx, ty) && (!board[ty][tx] || board[ty][tx].color !== piece.color)) addMove(tx, ty); }
            break;
        }
        case 'b': {
            for (const [dx, dy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
                let tx = x + dx, ty = y + dy; while (inside(tx, ty)) {
                    if (!board[ty][tx]) { addMove(tx, ty); } else { if (board[ty][tx].color !== piece.color) addMove(tx, ty); break; }
                    tx += dx; ty += dy;
                }
            }
            break;
        }
        case 'r': {
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                let tx = x + dx, ty = y + dy; while (inside(tx, ty)) {
                    if (!board[ty][tx]) { addMove(tx, ty); } else { if (board[ty][tx].color !== piece.color) addMove(tx, ty); break; }
                    tx += dx; ty += dy;
                }
            }
            break;
        }
        case 'q': {
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
                let tx = x + dx, ty = y + dy; while (inside(tx, ty)) {
                    if (!board[ty][tx]) { addMove(tx, ty); } else { if (board[ty][tx].color !== piece.color) addMove(tx, ty); break; }
                    tx += dx; ty += dy;
                }
            }
            break;
        }
        case 'k': {
            for (const dx of [-1, 0, 1]) for (const dy of [-1, 0, 1]) { if (dx || dy) { const tx = x + dx, ty = y + dy; if (inside(tx, ty) && (!board[ty][tx] || board[ty][tx].color !== piece.color)) addMove(tx, ty); } }
            // castling
            if (piece.moved === false || piece.moved === undefined) {
                if (piece.color === 'w') {
                    // king at e1 (x=4,y=7)
                    if (castlingRights.wK) {
                        if (!board[7][5] && !board[7][6] && !isSquareAttacked(4, 7, 'b') && !isSquareAttacked(5, 7, 'b') && !isSquareAttacked(6, 7, 'b')) addMove(6, 7, { castle: 'K' });
                    }
                    if (castlingRights.wQ) {
                        if (!board[7][1] && !board[7][2] && !board[7][3] && !isSquareAttacked(4, 7, 'b') && !isSquareAttacked(3, 7, 'b') && !isSquareAttacked(2, 7, 'b')) addMove(2, 7, { castle: 'Q' });
                    }
                } else {
                    if (castlingRights.bK) { if (!board[0][5] && !board[0][6] && !isSquareAttacked(4, 0, 'w') && !isSquareAttacked(5, 0, 'w') && !isSquareAttacked(6, 0, 'w')) addMove(6, 0, { castle: 'K' }); }
                    if (castlingRights.bQ) { if (!board[0][1] && !board[0][2] && !board[0][3] && !isSquareAttacked(4, 0, 'w') && !isSquareAttacked(3, 0, 'w') && !isSquareAttacked(2, 0, 'w')) addMove(2, 0, { castle: 'Q' }); }
                }
            }
            break;
        }
    }
    return moves;
}

// Check if square attacked by color
function isSquareAttacked(x, y, byColor) {
    // scan all enemy pieces and see if they can attack (pseudo) — simpler: generate pseudomoves for enemy and see if any target (x,y)
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
        const p = board[r][c]; if (!p || p.color !== byColor) continue;
        const pse = generatePseudoMoves(c, r, p);
        for (const mv of pse) if (mv.to.x === x && mv.to.y === y) return true;
    }
    return false;
}

function findKing(color) {
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { const p = board[r][c]; if (p && (p.type === 'K' && color === 'w' || p.type === 'k' && color === 'b')) return { x: c, y: r }; }
    return null;
}

function isKingInCheck(color) {
    const k = findKing(color); if (!k) return true; // king missing => treat as check
    const enemy = color === 'w' ? 'b' : 'w';
    return isSquareAttacked(k.x, k.y, enemy);
}

// Apply move to board (no legality checks here)
function applyMove(m, record = true) {
    const fx = m.from.x, fy = m.from.y, tx = m.to.x, ty = m.to.y;
    const piece = board[fy][fx];
    // en passant capture removal
    if (m.enPassant) {
        // captured pawn is at tx, fy
        board[fy][tx] = null;
    }
    // castle handling
    if (m.castle) {
        if (m.castle === 'K') {
            // move king
            board[ty][tx] = { ...piece, moved: true }; board[fy][fx] = null;
            // move rook
            if (piece.color === 'w') { board[7][7] = null; board[7][5] = { type: 'R', color: 'w', moved: true }; }
            else { board[0][7] = null; board[0][5] = { type: 'r', color: 'b', moved: true }; }
        } else {
            board[ty][tx] = { ...piece, moved: true }; board[fy][fx] = null;
            if (piece.color === 'w') { board[7][0] = null; board[7][3] = { type: 'R', color: 'w', moved: true }; }
            else { board[0][0] = null; board[0][3] = { type: 'r', color: 'b', moved: true }; }
        }
    } else {
        board[ty][tx] = { ...piece, moved: true }; board[fy][fx] = null;
    }
    // set en passant square
    if (m.double) { canEnPassant = { x: tx, y: fy }; } else { canEnPassant = null; }
    // if capture present and not enpassant handled, it's overwritten already
    // update castling rights
    if (piece.type === 'K') { castlingRights.wK = false; castlingRights.wQ = false; }
    if (piece.type === 'k') { castlingRights.bK = false; castlingRights.bQ = false; }
    if (piece.type === 'R') {
        if (fy === 7 && fx === 0) castlingRights.wQ = false;
        if (fy === 7 && fx === 7) castlingRights.wK = false;
    }
    if (piece.type === 'r') {
        if (fy === 0 && fx === 0) castlingRights.bQ = false;
        if (fy === 0 && fx === 7) castlingRights.bK = false;
    }
    // promotion
    if ((board[ty][tx] && board[ty][tx].type.toLowerCase() === 'p') && (ty === 0 || ty === 7)) {
        // need promotion choice
        return { promotion: { x: tx, y: ty, color: board[ty][tx].color } };
    }
    if (record) {
        history.push({ from: { x: fx, y: fy }, to: { x: tx, y: ty }, notation: moveToNotation(m) });
       // whiteToMove = !whiteToMove;
        //updateGameStatus();
        //updateUI();
    }
    return {};
}

// async function doMove(m) {
//     const maybe = applyMove(m, true);
//     if (maybe.promotion) {
//         // show modal and wait choice
//         const prom = await askPromotion(maybe.promotion.color);
//         // set piece
//         board[maybe.promotion.y][maybe.promotion.x].type = prom === 'q' ? (maybe.promotion.color === 'w' ? 'Q' : 'q') : (prom === 'r' ? (maybe.promotion.color === 'w' ? 'R' : 'r') : (prom === 'b' ? (maybe.promotion.color === 'w' ? 'B' : 'b') : (maybe.promotion.color === 'w' ? 'N' : 'n')));
//         history[history.length - 1].notation += '=' + board[maybe.promotion.y][maybe.promotion.x].type.toUpperCase();
//         whiteToMove = !whiteToMove;
//         updateGameStatus(); updateUI();
//         return;
//     }
//     updateUI();
// }

async function doMoveOnline(m) {
    const maybe = applyMove(m, true);
    let promotionChoice = null; // Variável para guardar a escolha

    if (maybe.promotion) {
        // Guarda a escolha do jogador (ex: 'q', 'r', 'b', 'n')
        promotionChoice = await askPromotion(maybe.promotion.color);

        // Atualiza o SEU tabuleiro local
        board[maybe.promotion.y][maybe.promotion.x].type = getPromotionPieceType(promotionChoice, maybe.promotion.color);
        history[history.length - 1].notation += '=' + board[maybe.promotion.y][maybe.promotion.x].type.toUpperCase();
    }

    // Envia a jogada E a escolha da promoção para o servidor
    if (gameId) {
        socket.send(JSON.stringify({
            type: 'move',
            gameId,
            move: m,
            promotion: promotionChoice // <-- A INFORMAÇÃO EXTRA!
        }));
    }

    finishMove();
}

// async function doMoveOnline(m) {
//     // Passo 1: Aplica o movimento no tabuleiro virtual, sem trocar o turno.
//     // A função `applyMove` nos avisa se uma promoção é necessária.
//     const maybe = applyMove(m, true);

//     // Passo 2: Verifica se há uma promoção.
//     if (maybe.promotion) {
//         // Pausa o jogo (await) e espera o jogador escolher a peça.
//         const prom = await askPromotion(maybe.promotion.color);

//         // Atualiza a peça no tabuleiro com a escolha do jogador.
//         board[maybe.promotion.y][maybe.promotion.x].type =
//             prom === 'q' ? (maybe.promotion.color === 'w' ? 'Q' : 'q') :
//             prom === 'r' ? (maybe.promotion.color === 'w' ? 'R' : 'r') :
//             prom === 'b' ? (maybe.promotion.color === 'w' ? 'B' : 'b') :
//             (maybe.promotion.color === 'w' ? 'N' : 'n');
        
//         // Atualiza a notação da jogada no histórico.
//         history[history.length - 1].notation += '=' + board[maybe.promotion.y][maybe.promotion.x].type.toUpperCase();
//     }

//     // Passo 3: Envia a jogada (já completa) para o servidor.
//     if (gameId) {
//         socket.send(JSON.stringify({
//             type: 'move',
//             gameId,
//             move: m
//         }));
//     }

//     // Passo 4: AGORA SIM! Com a jogada totalmente concluída, finalizamos o turno.
//     finishMove();
// }

// async function doMoveOnline(m) {
//     const maybe = applyMove(m, true);

//     if (maybe.promotion) {
//         const prom = await askPromotion(maybe.promotion.color);
//         board[maybe.promotion.y][maybe.promotion.x].type =
//             prom === 'q' ? (maybe.promotion.color === 'w' ? 'Q' : 'q') :
//             prom === 'r' ? (maybe.promotion.color === 'w' ? 'R' : 'r') :
//             prom === 'b' ? (maybe.promotion.color === 'w' ? 'B' : 'b') :
//             (maybe.promotion.color === 'w' ? 'N' : 'n');
//         history[history.length - 1].notation += '=' + board[maybe.promotion.y][maybe.promotion.x].type.toUpperCase();
//         whiteToMove = !whiteToMove;
//         updateGameStatus(); updateUI();
//     }

//     // Enviar jogada para o servidor
//     if (gameId) {
//         socket.send(JSON.stringify({
//             type: 'move',
//             gameId,
//             move: m
//         }));
//     }

//     finishMove();

//     //whiteToMove = !whiteToMove; // <-- ADICIONE A TROCA DE TURNO AQUI
//    // updateGameStatus(); // <-- Atualize o status após a troca
//    // updateUI();

//     //updateUI();
// }

function askPromotion(color) {
    return new Promise((res) => {
        const modal = document.getElementById('promo'); modal.style.display = 'flex';
        modal.querySelectorAll('button[data-piece]').forEach(btn => btn.onclick = () => { const p = btn.dataset.piece; modal.style.display = 'none'; res(p); });
    });
}

// Notation (very basic SAN-ish)
function moveToNotation(m) {
    const p = m.piece; const from = String.fromCharCode(97 + m.from.x) + (8 - m.from.y);
    const to = String.fromCharCode(97 + m.to.x) + (8 - m.to.y);
    let n = '';
    if (p.type.toLowerCase() === 'p') {
        if (m.capture || m.enPassant) n = from[0] + 'x' + to; else n = to;
    } else {
        const letter = p.type.toUpperCase(); n = letter + (m.capture ? 'x' : '') + to;
    }
    if (m.castle) n = m.castle === 'K' ? 'O-O' : 'O-O-O';
    return n;
}

// After move, check statuses
function updateGameStatus() {
    // check for checkmate/stalemate
    const side = whiteToMove ? 'w' : 'b';
    const anyLegal = anyLegalMoves(side);
    const inCheck = isKingInCheck(side);
    const msgEl = document.getElementById('gameMsg');
    if (!anyLegal && inCheck) {
        msgEl.style.display = 'block'; msgEl.textContent = (side === 'w' ? 'White' : 'Black') + ' está em xeque-mate. ' + (side === 'w' ? 'White perde.' : 'Black perde.'); gameOver = true;
    } else if (!anyLegal && !inCheck) {
        msgEl.style.display = 'block'; msgEl.textContent = 'Empate por stalemate.'; gameOver = true;
    } else if (inCheck) {
        msgEl.style.display = 'block'; msgEl.textContent = (side === 'w' ? 'White' : 'Black') + ' está em xeque.';
        // also restrict moves — our move generation already enforces it
    } else {
        msgEl.style.display = 'none'; msgEl.textContent = '';
    }
}

function anyLegalMoves(color) {
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
        const p = board[r][c]; if (!p || p.color !== color) continue;
        const moves = generateLegalMovesFrom(c, r);
        if (moves.length > 0) return true;
    }
    return false;
}

// Public doMove wrapper for applying moves without checks (used in search)
function applyMoveNoRecord(m) { return applyMove(m, false); }

// do not allow king capture by direct capture — our legality filters ensure king cannot be left in check, and moves that capture king aren't allowed because king moves are validated.

// Controls

document.getElementById('btnRestart').addEventListener('click', () => { initBoard(); document.getElementById('gameMsg').style.display = 'none'; });
document.getElementById('btnFlip').addEventListener('click', () => { flipped = !flipped; render(); });


// Adicione esta função ao seu código
function finishMove() {
    // 1. Troca o turno
    whiteToMove = !whiteToMove;

    // 2. Verifica o estado do jogo (xeque, xeque-mate, etc.)
    updateGameStatus();

    // 3. Atualiza a interface do usuário
    updateUI();
}

initBoard();


