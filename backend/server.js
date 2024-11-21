const WebSocket = require('ws');

// Inicializa o servidor WebSocket na porta 8080
const wss = new WebSocket.Server({ port: 8080 });
const rooms = new Map(); // Map para armazenar Room ID e clientes

wss.on('connection', (socket) => {
  console.log('[WebSocket] Novo cliente conectado');

  let currentRoomId = null;

  socket.on('message', (message) => {
    try {
      const { action, roomId, data } = JSON.parse(message);
      console.log('[WebSocket] Mensagem recebida:', { action, roomId });

      if (action === 'create-room') {
        currentRoomId = roomId;
        rooms.set(roomId, { share: socket, viewers: [] });
        console.log(`[Room] Novo Room criado: ${roomId}`);
      } else if (action === 'join-room') {
        currentRoomId = roomId;

        if (rooms.has(roomId)) {
          rooms.get(roomId).viewers.push(socket);
          console.log(`[Room] Viewer conectado ao Room: ${roomId}`);
        } else {
          console.warn(`[Room] Room não encontrado: ${roomId}`);
          socket.send(JSON.stringify({ error: `Room ${roomId} não encontrado.` }));
        }
      } else if (action === 'signal') {
        const room = rooms.get(roomId);
        if (room) {
          const target = data.target === 'viewer' ? room.viewers : [room.share];
          target.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ data }));
            }
          });
          console.log(`[Signal] Mensagem sinalizada no Room ${roomId}:`, data);
        } else {
          console.warn(`[Signal] Room não encontrado para sinalização: ${roomId}`);
        }
      }
    } catch (err) {
      console.error('[WebSocket] Erro ao processar mensagem:', err);
    }
  });

  socket.on('close', () => {
    if (currentRoomId) {
      const room = rooms.get(currentRoomId);
      if (room) {
        room.viewers = room.viewers.filter((viewer) => viewer !== socket);
        if (room.share === socket) {
          rooms.delete(currentRoomId);
          console.log(`[Room] Room excluído: ${currentRoomId}`);
        }
      }
    }
    console.log('[WebSocket] Cliente desconectado');
  });
});

console.log('[WebSocket] Servidor WebSocket em execução na porta 8080');
