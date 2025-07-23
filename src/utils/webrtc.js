const peers = {};

export function setupWebRTC(ws, stream, userId, setPeers) {
  ws.onmessage = async (event) => {
    const msg = JSON.parse(event.data);

    if (msg.type === 'user-joined') {
      const peerId = msg.from;
      const pc = createPeerConnection(peerId, ws, stream, setPeers);
      peers[peerId] = pc;

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      ws.send(JSON.stringify({
        type: 'offer',
        from: userId,
        target: peerId,
        data: offer,
      }));
    }

    if (msg.type === 'offer') {
      const pc = createPeerConnection(msg.from, ws, stream, setPeers);
      peers[msg.from] = pc;

      await pc.setRemoteDescription(new RTCSessionDescription(msg.data));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      ws.send(JSON.stringify({
        type: 'answer',
        from: userId,
        target: msg.from,
        data: answer,
      }));
    }

    if (msg.type === 'answer') {
      await peers[msg.from].setRemoteDescription(new RTCSessionDescription(msg.data));
    }

    if (msg.type === 'ice') {
      if (peers[msg.from]) {
        await peers[msg.from].addIceCandidate(new RTCIceCandidate(msg.data));
      }
    }

    if (msg.type === 'user-left') {
      delete peers[msg.from];
      setPeers(prev => {
        const copy = { ...prev };
        delete copy[msg.from];
        return copy;
      });
    }
  };
}

function createPeerConnection(peerId, ws, stream, setPeers) {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });

  stream.getTracks().forEach(track => pc.addTrack(track, stream));

  pc.onicecandidate = e => {
    if (e.candidate) {
      ws.send(JSON.stringify({
        type: 'ice',
        from: ws.url.split('/').pop(),
        target: peerId,
        data: e.candidate,
      }));
    }
  };

  pc.ontrack = e => {
    setPeers(prev => ({ ...prev, [peerId]: e.streams[0] }));
  };

  return pc;
}
