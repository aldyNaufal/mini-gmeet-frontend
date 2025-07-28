import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Room, LocalParticipant, RemoteParticipant, Track, RoomEvent, ParticipantEvent } from 'livekit-client';

// Configuration - Update these with your actual backend URL
const BACKEND_URL = 'https://mini-gmeet-backend-production.up.railway.app'; // Change this to your deployed backend URL
const LIVEKIT_URL = 'wss://job-hire-p0x9h07m.livekit.cloud'; // This will be fetched from backend

// Main App Component
export default function VideoConferenceApp() {
  const [currentView, setCurrentView] = useState('join'); // 'join' or 'room'
  const [roomData, setRoomData] = useState(null);
  const [error, setError] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const handleJoinRoom = (data) => {
    setRoomData(data);
    setCurrentView('room');
  };

  const handleLeaveRoom = () => {
    setRoomData(null);
    setCurrentView('join');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {currentView === 'join' ? (
        <JoinRoomForm 
          onJoin={handleJoinRoom} 
          error={error}
          setError={setError}
          isConnecting={isConnecting}
          setIsConnecting={setIsConnecting}
        />
      ) : (
        <VideoRoom 
          roomData={roomData} 
          onLeave={handleLeaveRoom}
          setError={setError}
        />
      )}
    </div>
  );
}

// Join Room Form Component
function JoinRoomForm({ onJoin, error, setError, isConnecting, setIsConnecting }) {
  const [roomName, setRoomName] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  // Auto-fill from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomFromUrl = urlParams.get('room');
    if (roomFromUrl) {
      setRoomName(roomFromUrl);
    }
  }, []);

  const generateToken = async (roomName, participantName) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/livekit/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomName,
          participantName,
          metadata: JSON.stringify({ joinedAt: new Date().toISOString() })
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate token');
      }

      return await response.json();
    } catch (error) {
      console.error('Token generation error:', error);
      throw error;
    }
  };

  const createRoom = async (roomName) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/livekit/room`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomName,
          maxParticipants: 50,
          metadata: JSON.stringify({ 
            createdAt: new Date().toISOString(),
            createdBy: participantName 
          })
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Room might already exist, which is fine
        if (!errorData.detail?.includes('already exists')) {
          throw new Error(errorData.detail || 'Failed to create room');
        }
      }

      return await response.json();
    } catch (error) {
      console.error('Room creation error:', error);
      // Don't throw error if room already exists
      if (!error.message.includes('already exists')) {
        throw error;
      }
    }
  };

  const handleSubmit = async (e, createNew = false) => {
    e.preventDefault();
    
    if (!roomName.trim() || !participantName.trim()) {
      setError('Please enter both room name and your name');
      return;
    }

    setIsConnecting(true);
    setError('');

    try {
      // Create room if requested
      if (createNew) {
        setIsCreatingRoom(true);
        await createRoom(roomName);
        setIsCreatingRoom(false);
      }

      // Generate token
      const tokenData = await generateToken(roomName, participantName);
      
      // Update URL with room parameter
      const url = new URL(window.location);
      url.searchParams.set('room', roomName);
      window.history.pushState({}, '', url);
      
      onJoin({
        ...tokenData,
        participantName
      });
      
    } catch (error) {
      setError(error.message);
      setIsConnecting(false);
      setIsCreatingRoom(false);
    }
  };

  const generateRoomId = () => {
    const randomId = Math.random().toString(36).substring(2, 8);
    setRoomName(`room-${randomId}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Video Conference</h1>
          <p className="text-gray-400">Join or create a meeting room</p>
        </div>

        {error && (
          <div className="bg-red-600 text-white p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Room Name
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter room name"
                disabled={isConnecting}
              />
              <button
                type="button"
                onClick={generateRoomId}
                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-3 rounded-lg text-sm"
                disabled={isConnecting}
                title="Generate random room ID"
              >
                🎲
              </button>
            </div>
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your name"
              disabled={isConnecting}
            />
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isConnecting || !roomName.trim() || !participantName.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-3 rounded-lg transition-colors"
            >
              {isConnecting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Joining...
                </span>
              ) : (
                'Join Room'
              )}
            </button>

            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              disabled={isConnecting || !roomName.trim() || !participantName.trim()}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-medium py-3 rounded-lg transition-colors"
            >
              {isCreatingRoom ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating & Joining...
                </span>
              ) : (
                'Create & Join Room'
              )}
            </button>
          </div>
        </div>

        <div className="mt-8 p-4 bg-gray-700 rounded-lg">
          <h3 className="text-white font-medium mb-2">💡 Share with friends:</h3>
          <p className="text-gray-300 text-sm">
            After creating a room, copy the room link to invite others!
          </p>
        </div>
      </div>
    </div>
  );
}

// Video Room Component
function VideoRoom({ roomData, onLeave, setError }) {
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [localParticipant, setLocalParticipant] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState('connecting');
  const localVideoRef = useRef();
  const localAudioRef = useRef();

  // Connect to room
  useEffect(() => {
    if (!roomData) return;

    const connectToRoom = async () => {
      try {
        setConnectionState('connecting');
        
        const roomInstance = new Room({
          adaptiveStream: true,
          dynacast: true,
          videoCaptureDefaults: {
            resolution: {
              width: 1280,
              height: 720,
            },
            facingMode: 'user',
          },
          audioCaptureDefaults: {
            autoGainControl: true,
            echoCancellation: true,
            noiseSuppression: true,
          },
        });

        // Set up event listeners
        roomInstance.on(RoomEvent.Connected, () => {
          console.log('Connected to room');
          setIsConnected(true);
          setConnectionState('connected');
          setLocalParticipant(roomInstance.localParticipant);
        });

        roomInstance.on(RoomEvent.ParticipantConnected, (participant) => {
          console.log('Participant connected:', participant.identity);
          setParticipants(prev => [...prev, participant]);
        });

        roomInstance.on(RoomEvent.ParticipantDisconnected, (participant) => {
          console.log('Participant disconnected:', participant.identity);
          setParticipants(prev => prev.filter(p => p.sid !== participant.sid));
        });

        roomInstance.on(RoomEvent.Disconnected, (reason) => {
          console.log('Disconnected from room:', reason);
          setIsConnected(false);
          setConnectionState('disconnected');
        });

        roomInstance.on(RoomEvent.LocalTrackPublished, (publication) => {
          console.log('Local track published:', publication.trackSid);
          
          if (publication.track) {
            if (publication.track.kind === Track.Kind.Video && localVideoRef.current) {
              publication.track.attach(localVideoRef.current);
            } else if (publication.track.kind === Track.Kind.Audio && localAudioRef.current) {
              publication.track.attach(localAudioRef.current);
            }
          }
        });

        // Connect to room
        await roomInstance.connect(roomData.wsUrl, roomData.token);
        setRoom(roomInstance);
        
        // Enable camera and microphone
        await roomInstance.localParticipant.enableCameraAndMicrophone();

      } catch (error) {
        console.error('Failed to connect to room:', error);
        setError(`Failed to connect: ${error.message}`);
        setConnectionState('error');
      }
    };

    connectToRoom();

    // Cleanup
    return () => {
      if (room) {
        room.disconnect();
      }
    };
  }, [roomData, setError]);

  const copyRoomLink = () => {
    const url = new URL(window.location);
    url.searchParams.set('room', roomData.roomName);
    navigator.clipboard.writeText(url.toString()).then(() => {
      // You could add a toast notification here
      alert('Room link copied to clipboard!');
    });
  };

  const leaveRoom = useCallback(() => {
    if (room) {
      room.disconnect();
    }
    onLeave();
  }, [room, onLeave]);

  if (connectionState === 'connecting') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-white text-xl font-semibold mb-2">Connecting to room...</h2>
          <p className="text-gray-400">Setting up your video and audio</p>
        </div>
      </div>
    );
  }

  if (connectionState === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-white text-xl font-semibold mb-2">Connection Failed</h2>
          <p className="text-gray-400 mb-6">Unable to connect to the meeting room</p>
          <button
            onClick={onLeave}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
          >
            Back to Join Screen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-white text-2xl font-bold">Room: {roomData.roomName}</h1>
          <p className="text-gray-400">Participants: {participants.length + 1}</p>
        </div>
        <button
          onClick={copyRoomLink}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          📋 Copy Room Link
        </button>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Local Video */}
        <div className="relative group">
          <video 
            ref={localVideoRef}
            autoPlay
            muted
            className="w-full rounded-lg shadow-lg bg-gray-700"
            style={{ maxHeight: '300px', objectFit: 'cover' }}
          />
          <audio ref={localAudioRef} autoPlay muted />
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white px-3 py-1 rounded-full text-sm font-medium">
            <span className="text-green-400">●</span> You ({roomData.participantName})
          </div>
          <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded text-xs">
            Local
          </div>
        </div>

        {/* Remote Videos */}
        {participants.map((participant) => (
          <RemoteParticipantVideo key={participant.sid} participant={participant} />
        ))}
      </div>

      {/* Controls */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2">
        {localParticipant && (
          <LiveKitControls 
            room={room} 
            localParticipant={localParticipant}
            onLeave={leaveRoom}
          />
        )}
      </div>
    </div>
  );
}

// Remote Participant Video Component
function RemoteParticipantVideo({ participant }) {
  const videoRef = useRef();
  const audioRef = useRef();

  useEffect(() => {
    // Attach existing tracks
    participant.videoTracks.forEach((publication) => {
      if (publication.track && videoRef.current) {
        publication.track.attach(videoRef.current);
      }
    });

    participant.audioTracks.forEach((publication) => {
      if (publication.track && audioRef.current) {
        publication.track.attach(audioRef.current);
      }
    });

    // Handle track subscriptions
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

    participant.on(ParticipantEvent.TrackSubscribed, handleTrackSubscribed);
    participant.on(ParticipantEvent.TrackUnsubscribed, handleTrackUnsubscribed);

    return () => {
      participant.off(ParticipantEvent.TrackSubscribed, handleTrackSubscribed);
      participant.off(ParticipantEvent.TrackUnsubscribed, handleTrackUnsubscribed);
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
    </div>
  );
}

// Controls Component
function LiveKitControls({ room, localParticipant, onLeave }) {
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  const toggleVideo = async () => {
    try {
      await localParticipant.setCameraEnabled(!isVideoEnabled);
      setIsVideoEnabled(!isVideoEnabled);
    } catch (error) {
      console.error('Error toggling video:', error);
    }
  };

  const toggleAudio = async () => {
    try {
      await localParticipant.setMicrophoneEnabled(!isAudioEnabled);
      setIsAudioEnabled(!isAudioEnabled);
    } catch (error) {
      console.error('Error toggling audio:', error);
    }
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
        onClick={onLeave}
        className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors"
        title="Leave room"
      >
        📞
      </button>
    </div>
  );
}