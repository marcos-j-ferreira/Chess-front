const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const { Chess } = require('chess.js');
const stockfish = require('stockfish');

const wss = new WebSocket.Server({ port: 8080 });

let waitingPlayer = null;
let games = {};

const BOT_WAIT_TIME = 10000; // 10 segundos para simplificar o teste
const BOT_DIFFICULTY = 10;   // Dificuldade 10 para respostas mais rápidas

console.log('Servidor minimalista com bot rodando na porta 8080...');

wss.on('connection', (ws) => {
    ws.id = uuidv4();
    console.log(`Novo cliente conectado: ${ws.id}`);

    if (!waitingPlayer) {
        // Coloca o jogador na espera e inicia o timer
        waitingPlayer = {
            ws: ws,
            timeout: setTimeout(() => {
                if (waitingPlayer && waitingPlayer.ws === ws) {
                    console.log(`Jogador ${ws.id} vai jogar com o bot.`);
                    startBotGame(ws); // O timer acabou, inicia jogo com bot
                    waitingPlayer = null;
                }
            }, BOT_WAIT_TIME)
        };
        // A mensagem de 'waiting' é opcional, mas boa para o debug no cliente
        ws.send(JSON.stringify({ type: 'waiting' }));
    } else {
        // Encontrou um oponente humano antes do timer acabar
        clearTimeout(waitingPlayer.timeout); // Cancela o timer!
        startHumanGame(waitingPlayer.ws, ws);
        waitingPlayer = null;
    }

    ws.on('message', (msg) => {
        try {
            const data = JSON.parse(msg);
            const game = games[data.gameId];
            if (!game) return;

            if (data.type === 'move') {
                // O servidor sempre valida o movimento
                const moveResult = game.chess.move(data.move, { sloppy: true });
                if (!moveResult) return; // Ignora movimento ilegal

                // Se o oponente for o BOT, o servidor precisa responder
                if (game.isBotGame) {
                    if (!game.chess.isGameOver()) {
                        getBotMove(game.id);
                    }
                } else {
                    // Se for um jogo humano, apenas retransmite o movimento
                    const opponent = (ws === game.white) ? game.black : game.white;
                    opponent.send(JSON.stringify({ type: 'move', move: data.move }));
                }
            }
        } catch (err) {
            console.error("Erro:", err);
        }
    });

    ws.on('close', () => {
        console.log(`Cliente ${ws.id} desconectou`);
        if (waitingPlayer && waitingPlayer.ws === ws) {
            clearTimeout(waitingPlayer.timeout);
            waitingPlayer = null;
        }
    });
});

function startHumanGame(player1, player2) {
    const gameId = uuidv4();
    games[gameId] = {
        id: gameId,
        chess: new Chess(),
        white: player1,
        black: player2,
        isBotGame: false
    };
    player1.send(JSON.stringify({ type: 'start', color: 'w', gameId }));
    player2.send(JSON.stringify({ type: 'start', color: 'b', gameId }));
    console.log(`Partida HUMANA iniciada: ${gameId}`);
}

// Inicia um jogo onde o jogador das PRETAS é o SERVIDOR
function startBotGame(player) {
    const gameId = uuidv4();
    games[gameId] = {
        id: gameId,
        chess: new Chess(),
        white: player, // O jogador humano é sempre as brancas
        black: 'BOT',   // O oponente é conceitual
        isBotGame: true
    };
    // Envia a mesma mensagem de start. O cliente não sabe a diferença.
    player.send(JSON.stringify({ type: 'start', color: 'w', gameId }));
    console.log(`Partida com BOT iniciada: ${gameId}`);
}

// Pega o movimento do bot e envia para o jogador humano
function getBotMove(gameId) {
    const game = games[gameId];
    if (!game || game.chess.isGameOver()) return;

    const engine = stockfish();
    engine.onmessage = (msg) => {
        if (typeof msg === 'string' && msg.includes('bestmove')) {
            const bestMove = msg.split(' ')[1];
            game.chess.move(bestMove, { sloppy: true }); // Aplica o movimento no jogo do servidor

            // Envia o movimento do bot para o jogador humano
            game.white.send(JSON.stringify({ type: 'move', move: { from: bestMove.substring(0,2), to: bestMove.substring(2,4), promotion: bestMove.substring(4,5) || undefined } }));
            engine.quit();
        }
    };
    engine.postMessage(`position fen ${game.chess.fen()}`);
    engine.postMessage(`go depth ${BOT_DIFFICULTY}`);
}