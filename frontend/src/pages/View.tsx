import React, { useEffect, useRef } from 'react';

const View: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const storedRoomId = localStorage.getItem('roomId');
    if (!storedRoomId) {
      console.error('Room ID não encontrado no Local Storage!');
      return;
    }

    const signalingSocket = new WebSocket('ws://localhost:8080');

    signalingSocket.onopen = () => {
      console.log('Conexão WebSocket estabelecida.');
      signalingSocket.send(
        JSON.stringify({
          action: 'join-room',
          roomId: storedRoomId,
        })
      );
    };

    signalingSocket.onmessage = async (event) => {
      const message = JSON.parse(event.data);

      if (message.data.sdp) {
        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: ["stun:sp-turn1.xirsys.com"] },
            {
              username: "qNJj07S_yONn9sLbHrLD_fpjpjWiIwqHt6w2mm32gljSj4cdY9b9zmYg95YorzQSAAAAAGc2m7hIaWdvcg==",
              credential: "23a979ca-a2ec-11ef-83b7-0242ac120004",
              urls: [
                "turn:sp-turn1.xirsys.com:80?transport=udp",
                "turn:sp-turn1.xirsys.com:3478?transport=udp",
                "turn:sp-turn1.xirsys.com:80?transport=tcp",
                "turn:sp-turn1.xirsys.com:3478?transport=tcp",
                "turns:sp-turn1.xirsys.com:443?transport=tcp",
                "turns:sp-turn1.xirsys.com:5349?transport=tcp",
              ],
            },
          ],
        });

        pc.ontrack = (event) => {
          if (videoRef.current) {
            videoRef.current.srcObject = event.streams[0];
          }
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            signalingSocket.send(
              JSON.stringify({
                action: 'signal',
                roomId: storedRoomId,
                data: { candidate: event.candidate, target: 'share' },
              })
            );
          }
        };

        await pc.setRemoteDescription(new RTCSessionDescription(message.data.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        signalingSocket.send(
          JSON.stringify({
            action: 'signal',
            roomId: storedRoomId,
            data: { sdp: answer, target: 'share' },
          })
        );
      }
    };

    return () => signalingSocket.close();
  }, []);

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8 text-center">
          <div className="card shadow border-0">
            <div className="card-body">
              <h2 className="mb-4 text-success">Assistindo à Transmissão</h2>
              <div className="video-container border rounded p-2 bg-dark">
                <video
                  ref={videoRef}
                  controls
                  className="w-100 border"
                  style={{ maxHeight: '400px' }}
                ></video>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default View;
