import { useParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { setupWebRTC } from '../utils/webrtc';
import VideoGrid from '../components/VideoGrid';
import Controls from '../components/Controls';

function Room() {
  const { roomId } = useParams();
  const [peers, setPeers] = useState({});
  const [localStream, setLocalStream] = useState(null);
  const localVideoRef = useRef();
  const wsRef = useRef(null);
  const userId = useRef(crypto.randomUUID());


  const [currentPage, setCurrentPage] = useState(1);
  const videosPerPage = 6;

  const peerEntries = Object.entries(peers);
  const totalPages = Math.ceil(peerEntries.length / videosPerPage);

  const paginatedPeers = Object.fromEntries(
    peerEntries.slice((currentPage - 1) * videosPerPage, currentPage * videosPerPage)
  );

  const allPeers = { [userId.current]: localStream, ...paginatedPeers };



  useEffect(() => {
    const ws = new WebSocket(`wss://mini-gmeet-backend-production.up.railway.app/ws/${roomId}/${userId.current}`);
    wsRef.current = ws;
    
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setupWebRTC(ws, stream, userId.current, setPeers);
      })
      .catch((error) => {
        console.error('Error accessing media devices:', error);
      });

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      Object.values(peers).forEach((pc) => pc.close());
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [roomId]); // Added roomId as dependency

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">

      <h1 className="text-xl font-bold mb-4">Room: {roomId}</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 mb-4">
        <div className="relative">
          <video 
            ref={localVideoRef} 
            autoPlay 
            muted 
            className="w-full rounded shadow"
            style={{ maxHeight: '300px', objectFit: 'cover' }}
          />
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
            You
          </div>
        </div>
        
        <VideoGrid peers={allPeers} userId={userId.current} />
      </div>
      
      {localStream && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
            <Controls
              stream={localStream}
              peers={peers}
              localVideoRef={localVideoRef}
            />
          </div>
        )}


      <div className="flex justify-center items-center gap-4 mb-4">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span className="font-semibold">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Room;