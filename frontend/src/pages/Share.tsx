import React, { useEffect, useState } from 'react';

const Share: React.FC = () => {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [signalingSocket, setSignalingSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080');

    socket.onopen = () => {
      console.log('Conexão WebSocket estabelecida.');

      const generatedRoomId = Math.random().toString(36).substr(2, 9);
      setRoomId(generatedRoomId);

      // Salva o Room ID no Local Storage
      localStorage.setItem('roomId', generatedRoomId);

      socket.send(
        JSON.stringify({
          action: 'create-room',
          roomId: generatedRoomId,
        })
      );
      console.log('Room ID gerado e enviado:', generatedRoomId);
    };

    socket.onerror = (error) => console.error('Erro no WebSocket:', error);

    socket.onclose = () => console.warn('Conexão WebSocket fechada.');

    setSignalingSocket(socket);

    return () => socket.close();
  }, []);

  const startSharing = async () => {
    if (!signalingSocket || signalingSocket.readyState !== WebSocket.OPEN) {
      console.error('WebSocket não está conectado.');
      return;
    }

    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    });

    const peerConnection = new RTCPeerConnection({
      iceServers: [
        {
          urls: "turn:relay1.expressturn.com:3478",
          username: "efT60GWQXKAOLJTIHH",
          credential: "179yTrYoulgCq9ee",
        },
      ],
    });

    stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        signalingSocket.send(
          JSON.stringify({
            action: 'signal',
            roomId,
            data: { candidate: event.candidate, target: 'viewer' },
          })
        );
      }
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    signalingSocket.send(
      JSON.stringify({
        action: 'signal',
        roomId,
        data: { sdp: offer, target: 'viewer' },
      })
    );
    console.log('Oferta SDP enviada.');
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8 text-center">
          <div className="card shadow border-0">
            <div className="card-body">
              <h2 className="mb-4 text-primary">Compartilhe sua Tela</h2>
              <button className="btn btn-primary btn-lg" onClick={startSharing}>
                Iniciar Compartilhamento
              </button>
              {roomId && (
                <div className="alert alert-info mt-4">
                  <strong>Transmissão Ativa:</strong>
                  <p>Os espectadores podem acessar automaticamente.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Share;
