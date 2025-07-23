import { useParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { setupWebRTC } from '../utils/webrtc';
import VideoGrid from '../components/VideoGrid';
import Controls from '../components/Controls';

function Room() {
  const { roomId } = useParams();
  const [peers, setPeers] = useState({});
  const [localStream, setLocalStream] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const localVideoRef = useRef();
  const wsRef = useRef(null);
  const userId = useRef(crypto.randomUUID());

  const [currentPage, setCurrentPage] = useState(1);
  const videosPerPage = 6;

  // Calculate participants including yourself
  const totalParticipants = Object.keys(peers).length + 1;
  const peerEntries = Object.entries(peers);
  const totalPages = Math.ceil(peerEntries.length / videosPerPage);

  const paginatedPeers = Object.fromEntries(
    peerEntries.slice((currentPage - 1) * videosPerPage, currentPage * videosPerPage)
  );

  useEffect(() => {
    const ws = new WebSocket(`wss://mini-gmeet-backend-production.up.railway.app/ws/${roomId}/${userId.current}`);
    wsRef.current = ws;
    
    // WebSocket connection handlers
    ws.onopen = () => {
      setIsConnected(true);
      setConnectionStatus('Connected');
    };

    ws.onclose = () => {
      setIsConnected(false);
      setConnectionStatus('Disconnected');
    };

    ws.onerror = () => {
      setConnectionStatus('Connection Error');
    };

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setupWebRTC(ws, stream, userId.current, setPeers);
        setConnectionStatus('Media Ready');
      })
      .catch((error) => {
        console.error('Error accessing media devices:', error);
        setConnectionStatus('Media Access Error');
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
  }, [roomId]);

  // Update participant count when peers change
  useEffect(() => {
    setParticipantCount(totalParticipants);
  }, [totalParticipants]);

  const copyRoomLink = () => {
    const roomLink = window.location.href;
    navigator.clipboard.writeText(roomLink).then(() => {
      alert('Room link copied to clipboard! Share it with your friends.');
    });
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId).then(() => {
      alert('Room ID copied to clipboard!');
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {/* Header Section */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-blue-400 mb-1">Google Meet Clone</h1>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-300">Room ID: <span className="font-mono text-white">{roomId}</span></span>
              <button 
                onClick={copyRoomId}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs transition-colors"
              >
                Copy ID
              </button>
            </div>
          </div>
          
          <div className="flex flex-col md:items-end gap-2">
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                isConnected ? 'bg-green-600' : 'bg-red-600'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-300' : 'bg-red-300'
                }`}></div>
                <span>{connectionStatus}</span>
              </div>
              
              <div className="bg-blue-600 px-3 py-1 rounded-full text-sm">
                <span className="font-semibold">{participantCount}</span> participant{participantCount !== 1 ? 's' : ''}
              </div>
            </div>
            
            <button 
              onClick={copyRoomLink}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors"
            >
              📋 Share Room Link
            </button>
          </div>
        </div>
      </div>

      {/* Testing Instructions */}
      <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-4 mb-6">
        <h3 className="font-bold text-yellow-200 mb-2">🧪 Testing Instructions for Your Friends:</h3>
        <ol className="text-yellow-100 text-sm space-y-1 list-decimal list-inside">
          <li>Click "Share Room Link" button above and send the link to your friends</li>
          <li>Or share the Room ID: <span className="font-mono bg-yellow-800 px-1 rounded">{roomId}</span></li>
          <li>Each person should join from a different device/browser</li>
          <li>You can test with up to 10+ users simultaneously</li>
          <li>Use pagination buttons below if more than 6 people join</li>
        </ol>
      </div>

      {/* Video Grid Section */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Video Participants</h2>
          {Object.keys(peers).length > videosPerPage && (
            <div className="text-sm text-gray-400">
              Showing {Math.min(videosPerPage, Object.keys(peers).length)} of {Object.keys(peers).length} remote participants
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
          {/* Local Video (You) */}
          <div className="relative group">
            <video 
              ref={localVideoRef} 
              autoPlay 
              muted 
              className="w-full rounded-lg shadow-lg bg-gray-700"
              style={{ maxHeight: '300px', objectFit: 'cover' }}
            />
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white px-3 py-1 rounded-full text-sm font-medium">
              <span className="text-green-400">●</span> You (Host)
            </div>
            <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs">
              Local
            </div>
          </div>
          
          {/* Remote Videos */}
          <VideoGrid peers={paginatedPeers} userId={userId.current} />
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-6 pt-4 border-t border-gray-700">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>
            
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Page</span>
              <span className="font-bold text-white bg-gray-700 px-3 py-1 rounded">
                {currentPage}
              </span>
              <span className="text-gray-400">of {totalPages}</span>
            </div>
            
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Debug Info for Testing */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <h3 className="font-semibold mb-2 text-gray-300">🔧 Debug Info (for testing):</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Your ID:</span>
            <p className="font-mono text-xs text-blue-300 truncate">{userId.current}</p>
          </div>
          <div>
            <span className="text-gray-400">Connected Peers:</span>
            <p className="text-white font-semibold">{Object.keys(peers).length}</p>
          </div>
          <div>
            <span className="text-gray-400">Total Participants:</span>
            <p className="text-white font-semibold">{totalParticipants}</p>
          </div>
          <div>
            <span className="text-gray-400">WebSocket:</span>
            <p className={`font-semibold ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      {localStream && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <Controls
            stream={localStream}
            peers={peers}
            localVideoRef={localVideoRef}
          />
        </div>
      )}
    </div>
  );
}

export default Room;