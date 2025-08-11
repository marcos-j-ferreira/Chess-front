const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });
let waitingPlayer = null;
const games = new Map(); // gameId -> { player1, player2 }

console.log('WebSocket server started on port 8080');

wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.on('message', (msg) => {
        let data;
        try {
            data = JSON.parse(msg); // Parse incoming message
        } catch (err) {
            console.error('Invalid JSON received:', msg.toString());
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
            return;
        }

        if (!data.type) {
            ws.send(JSON.stringify({ type: 'error', message: 'Missing message type' }));
            return;
        }

        if (data.type === 'join') {
            if (!waitingPlayer) {
                waitingPlayer = ws;
                ws.send(JSON.stringify({ type: 'waiting' }));
                console.log('Player added to waiting queue');
            } else {
                const gameId = Date.now().toString();
                games.set(gameId, { player1: waitingPlayer, player2: ws });
                console.log(`Game ${gameId} created`);

                waitingPlayer.send(JSON.stringify({ type: 'start', color: 'white', gameId }));
                ws.send(JSON.stringify({ type: 'start', color: 'black', gameId }));

                waitingPlayer = null;
            }
        } else if (data.type === 'move') {
            if (!data.gameId) {
                ws.send(JSON.stringify({ type: 'error', message: 'Missing gameId' }));
                return;
            }

            const game = games.get(data.gameId);
            if (!game) {
                ws.send(JSON.stringify({ type: 'error', message: 'Game not found' }));
                return;
            }

            // Forward move to opponent
            const opponent = game.player1 === ws ? game.player2 : game.player1;
            if (opponent && opponent.readyState === WebSocket.OPEN) {
                opponent.send(JSON.stringify(data));
            } else {
                ws.send(JSON.stringify({ type: 'error', message: 'Opponent disconnected' }));
            }
        } else {
            ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        if (waitingPlayer === ws) {
            waitingPlayer = null;
        } else {
            // Find and clean up any active game
            for (const [gameId, game] of games) {
                if (game.player1 === ws || game.player2 === ws) {
                    const opponent = game.player1 === ws ? game.player2 : game.player1;
                    if (opponent && opponent.readyState === WebSocket.OPEN) {
                        opponent.send(JSON.stringify({ type: 'opponent_disconnected' }));
                    }
                    games.delete(gameId);
                    console.log(`Game ${gameId} terminated due to player disconnect`);
                    break;
                }
            }
        }
    });

    ws.on('error', (err) => {
        console.error('WebSocket error:', err);
    });
});

wss.on('error', (err) => {
    console.error('Server error:', err);
});