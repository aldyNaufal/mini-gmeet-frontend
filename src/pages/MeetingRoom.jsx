import { useParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { Room, RoomEvent, Track, RemoteTrack, RemoteParticipant, LocalParticipant } from 'livekit-client';

// Configuration - Update with your backend URL
const BACKEND_URL = 'https://mini-gmeet-backend-production.up.railway.app';

function RoomComponent() {
  const { roomId } = useParams();
  const [participants, setParticipants] = useState(new Map());
  const [localStream, setLocalStream] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [room, setRoom] = useState(null);
  const [localParticipant, setLocalParticipant] = useState(null);
  
  const localVideoRef = useRef();
  const roomRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const videosPerPage = 6;

  // Get participant name (you might want to get this from props or user input)
  const participantName = useRef(`User_${Math.random().toString(36).substr(2, 9)}`);

  // Calculate participants
  const remoteParticipants = Array.from(participants.values()).filter(p => p !== localParticipant);
  const totalParticipants = participants.size;
  const totalPages = Math.ceil(remoteParticipants.length / videosPerPage);
  const paginatedParticipants = remoteParticipants.slice(
    (currentPage - 1) * videosPerPage, 
    currentPage * videosPerPage
  );

  // Function to get LiveKit token from your backend
  const getToken = async (roomName, participantName) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/livekit/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomName,
          participantName,
          metadata: JSON.stringify({ joinedAt: Date.now() })
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting token:', error);
      throw error;
    }
  };

  useEffect(() => {
    let roomInstance = null;

    const connectToRoom = async () => {
      try {
        setConnectionStatus('Getting token...');
        
        // Get token from backend
        const tokenData = await getToken(roomId, participantName.current);
        
        setConnectionStatus('Connecting to room...');
        
        // Create room instance
        roomInstance = new Room({
          // Configure room options
          adaptiveStream: true,
          dynacast: true,
          videoCaptureDefaults: {
            resolution: {
              width: 640,
              height: 480,
            },
            facingMode: 'user',
          },
        });

        roomRef.current = roomInstance;
        setRoom(roomInstance);

        // Set up event listeners
        roomInstance.on(RoomEvent.Connected, () => {
          setIsConnected(true);
          setConnectionStatus('Connected');
          setLocalParticipant(roomInstance.localParticipant);
          
          // Update participants map
          setParticipants(new Map([
            [roomInstance.localParticipant.sid, roomInstance.localParticipant],
            ...Array.from(roomInstance.remoteParticipants.entries())
          ]));
        });

        roomInstance.on(RoomEvent.Disconnected, () => {
          setIsConnected(false);
          setConnectionStatus('Disconnected');
        });

        roomInstance.on(RoomEvent.ParticipantConnected, (participant) => {
          console.log('Participant connected:', participant.identity);
          setParticipants(prev => new Map(prev.set(participant.sid, participant)));
        });

        roomInstance.on(RoomEvent.ParticipantDisconnected, (participant) => {
          console.log('Participant disconnected:', participant.identity);
          setParticipants(prev => {
            const newMap = new Map(prev);
            newMap.delete(participant.sid);
            return newMap;
          });
        });

        roomInstance.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
          console.log('Track subscribed:', track.kind, participant.identity);
          
          if (track.kind === Track.Kind.Video) {
            // The track will be automatically attached to video elements
            // You can handle this in your VideoGrid component
          }
        });

        roomInstance.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
          console.log('Track unsubscribed:', track.kind, participant.identity);
        });

        roomInstance.on(RoomEvent.LocalTrackPublished, (publication, participant) => {
          console.log('Local track published:', publication.kind);
          
          if (publication.kind === Track.Kind.Video && publication.videoTrack) {
            const videoTrack = publication.videoTrack;
            if (localVideoRef.current) {
              videoTrack.attach(localVideoRef.current);
            }
            setLocalStream(videoTrack.mediaStream);
          }
        });

        // Connect to the room
        await roomInstance.connect(tokenData.wsUrl, tokenData.token);
        
        setConnectionStatus('Enabling camera and microphone...');
        
        // Enable camera and microphone
        await roomInstance.localParticipant.enableCameraAndMicrophone();
        
        setConnectionStatus('Ready');

      } catch (error) {
        console.error('Error connecting to room:', error);
        setConnectionStatus(`Connection Error: ${error.message}`);
      }
    };

    connectToRoom();

    // Cleanup
    return () => {
      if (roomInstance) {
        roomInstance.disconnect();
      }
    };
  }, [roomId]);

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
            <h1 className="text-2xl font-bold text-blue-400 mb-1">LiveKit Video Conference</h1>
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
                <span className="font-semibold">{totalParticipants}</span> participant{totalParticipants !== 1 ? 's' : ''}
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
          <li>You can test with multiple users simultaneously</li>
          <li>Use pagination buttons below if more than 6 people join</li>
        </ol>
      </div>

      {/* Video Grid Section */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Video Participants</h2>
          {remoteParticipants.length > videosPerPage && (
            <div className="text-sm text-gray-400">
              Showing {Math.min(videosPerPage, remoteParticipants.length)} of {remoteParticipants.length} remote participants
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
              <span className="text-green-400">●</span> You ({participantName.current})
            </div>
            <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs">
              Local
            </div>
          </div>
          
          {/* Remote Videos */}
          {paginatedParticipants.map((participant) => (
            <RemoteParticipantVideo key={participant.sid} participant={participant} />
          ))}
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

      {/* Debug Info */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <h3 className="font-semibold mb-2 text-gray-300">🔧 Debug Info:</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Your Name:</span>
            <p className="font-mono text-xs text-blue-300 truncate">{participantName.current}</p>
          </div>
          <div>
            <span className="text-gray-400">Remote Participants:</span>
            <p className="text-white font-semibold">{remoteParticipants.length}</p>
          </div>
          <div>
            <span className="text-gray-400">Total Participants:</span>
            <p className="text-white font-semibold">{totalParticipants}</p>
          </div>
          <div>
            <span className="text-gray-400">Connection:</span>
            <p className={`font-semibold ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      {room && localParticipant && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <LiveKitControls
            room={room}
            localParticipant={localParticipant}
          />
        </div>
      )}
    </div>
  );
}

// Component for rendering remote participant video
function RemoteParticipantVideo({ participant }) {
  const videoRef = useRef();
  const audioRef = useRef();

  useEffect(() => {
    const handleTrackSubscribed = (track, publication) => {
      if (track.kind === Track.Kind.Video && videoRef.current) {
        track.attach(videoRef.current);
      } else if (track.kind === Track.Kind.Audio && audioRef.current) {
        track.attach(audioRef.current);
      }
    };

    const handleTrackUnsubscribed = (track) => {
      track.detach();
    };

    // Attach existing tracks
    participant.videoTracks.forEach((publication) => {
      if (publication.track) {
        handleTrackSubscribed(publication.track, publication);
      }
    });

    participant.audioTracks.forEach((publication) => {
      if (publication.track) {
        handleTrackSubscribed(publication.track, publication);
      }
    });

    // Listen for new tracks
    participant.on('trackSubscribed', handleTrackSubscribed);
    participant.on('trackUnsubscribed', handleTrackUnsubscribed);

    return () => {
      participant.off('trackSubscribed', handleTrackSubscribed);
      participant.off('trackUnsubscribed', handleTrackUnsubscribed);
    };
  }, [participant]);

  return (
    <div className="relative group">
      <video 
        ref={videoRef}
        autoPlay
        className="w-full rounded-lg shadow-lg bg-gray-700"
        style={{ maxHeight: '300px', objectFit: 'cover' }}
      />
      <audio ref={audioRef} autoPlay />
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white px-3 py-1 rounded-full text-sm font-medium">
        <span className="text-blue-400">●</span> {participant.identity}
      </div>
      <div className="absolute top-2 right-2 bg-purple-600 text-white px-2 py-1 rounded text-xs">
        Remote
      </div>
    </div>
  );
}

// Updated controls component for LiveKit
function LiveKitControls({ room, localParticipant }) {
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  const toggleVideo = async () => {
    try {
      if (isVideoEnabled) {
        await localParticipant.setCameraEnabled(false);
      } else {
        await localParticipant.setCameraEnabled(true);
      }
      setIsVideoEnabled(!isVideoEnabled);
    } catch (error) {
      console.error('Error toggling video:', error);
    }
  };

  const toggleAudio = async () => {
    try {
      if (isAudioEnabled) {
        await localParticipant.setMicrophoneEnabled(false);
      } else {
        await localParticipant.setMicrophoneEnabled(true);
      }
      setIsAudioEnabled(!isAudioEnabled);
    } catch (error) {
      console.error('Error toggling audio:', error);
    }
  };

  const leaveRoom = () => {
    room.disconnect();
    window.location.href = '/'; // Redirect to home or handle as needed
  };

  return (
    <div className="flex items-center gap-4 bg-gray-800 rounded-full px-6 py-3 shadow-lg">
      <button
        onClick={toggleAudio}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
          isAudioEnabled 
            ? 'bg-gray-600 hover:bg-gray-700 text-white' 
            : 'bg-red-600 hover:bg-red-700 text-white'
        }`}
        title={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
      >
        {isAudioEnabled ? '🎤' : '🔇'}
      </button>

      <button
        onClick={toggleVideo}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
          isVideoEnabled 
            ? 'bg-gray-600 hover:bg-gray-700 text-white' 
            : 'bg-red-600 hover:bg-red-700 text-white'
        }`}
        title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
      >
        {isVideoEnabled ? '📹' : '📷'}
      </button>

      <button
        onClick={leaveRoom}
        className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors"
        title="Leave room"
      >
        📞
      </button>
    </div>
  );
}

export default RoomComponent;