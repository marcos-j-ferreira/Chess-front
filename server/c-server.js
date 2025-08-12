const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const wss = new WebSocket.Server({ port: 8080 });

let waitingPlayer = null;
let games = {};

wss.on('connection', (ws) => {
    ws.id = uuidv4();
    console.log(`Novo cliente conectado: ${ws.id}`);

    if (!waitingPlayer) {
        waitingPlayer = ws;
        ws.send(JSON.stringify({ type: 'waiting' }));
        console.log(`Jogador ${ws.id} aguardando adversário...`);
    } 
    else {
        const gameId = uuidv4();

        games[gameId] = {
            white: waitingPlayer,
            black: ws
        };

        games[gameId].white.send(JSON.stringify({
            type: 'start',
            color: 'w',
            gameId
        }));

        games[gameId].black.send(JSON.stringify({
            type: 'start',
            color: 'b',
            gameId
        }));

        console.log(`Partida iniciada (${gameId}) -> White: ${waitingPlayer.id}, Black: ${ws.id}`);

        waitingPlayer = null; 
    }

    ws.on('message', (msg) => {
        try {
            const data = JSON.parse(msg);
            if (data.type === 'move') {
                const game = games[data.gameId];
                if (!game) return;

                if (ws === game.white) {
                    game.black.send(JSON.stringify(data));
                } else if (ws === game.black) {
                    game.white.send(JSON.stringify(data));
                }
            }
        } catch (err) {
            console.error("Erro ao processar mensagem:", err);
        }
    });

    ws.on('close', () => {
        console.log(`Cliente ${ws.id} desconectou`);
        if (waitingPlayer === ws) {
            waitingPlayer = null;
        }
    });
});
