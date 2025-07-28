import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Room, LocalParticipant, RemoteParticipant, Track, RoomEvent, ParticipantEvent } from 'livekit-client';

// Configuration - Update these with your actual backend URL
const BACKEND_URL = 'https://mini-gmeet-backend-production.up.railway.app';
const LIVEKIT_URL = 'wss://job-hire-p0x9h07m.livekit.cloud';

// Main App Component
export default function VideoConferenceApp() {
  const [currentView, setCurrentView] = useState('join');
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

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomFromUrl = urlParams.get('room');
    if (roomFromUrl) {
      setRoomName(roomFromUrl);
    }
  }, []);

  const generateToken = async (roomName, participantName) => {
    try {
      console.log('Generating token for:', { roomName, participantName });
      
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
        const errorText = await response.text();
        console.error('Token generation failed:', response.status, errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { detail: `HTTP ${response.status}: ${errorText}` };
        }
        throw new Error(errorData.detail || 'Failed to generate token');
      }

      const tokenData = await response.json();
      console.log('Token generated successfully:', tokenData);
      return tokenData;
    } catch (error) {
      console.error('Token generation error:', error);
      throw error;
    }
  };

  const createRoom = async (roomName) => {
    try {
      console.log('Creating room:', roomName);
      
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
        const errorText = await response.text();
        console.error('Room creation failed:', response.status, errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { detail: `HTTP ${response.status}: ${errorText}` };
        }
        
        // Room might already exist, which is fine
        if (!errorData.detail?.includes('already exists')) {
          throw new Error(errorData.detail || 'Failed to create room');
        }
      }

      const roomData = await response.json();
      console.log('Room created/exists:', roomData);
      return roomData;
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
        participantName,
        roomName
      });
      
    } catch (error) {
      console.error('Join room error:', error);
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

    let roomInstance = null;

    const connectToRoom = async () => {
      try {
        console.log('Connecting to room with data:', roomData);
        setConnectionState('connecting');
        
        roomInstance = new Room({
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
          
          // Update participants list with existing participants
          const remoteParticipants = Array.from(roomInstance.remoteParticipants.values());
          setParticipants(remoteParticipants);
          console.log('Existing participants:', remoteParticipants.length);
        });

        roomInstance.on(RoomEvent.ParticipantConnected, (participant) => {
          console.log('Participant connected:', participant.identity);
          setParticipants(prev => {
            // Avoid duplicates
            if (prev.find(p => p.sid === participant.sid)) {
              return prev;
            }
            return [...prev, participant];
          });
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
          console.log('Local track published:', publication.trackSid, publication.kind);
          
          if (publication.track) {
            if (publication.track.kind === Track.Kind.Video && localVideoRef.current) {
              publication.track.attach(localVideoRef.current);
            } else if (publication.track.kind === Track.Kind.Audio && localAudioRef.current) {
              publication.track.attach(localAudioRef.current);
            }
          }
        });

        // Handle connection errors
        roomInstance.on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
          console.log('Connection quality changed:', quality, participant?.identity);
        });

        roomInstance.on(RoomEvent.Reconnecting, () => {
          console.log('Reconnecting to room...');
          setConnectionState('reconnecting');
        });

        roomInstance.on(RoomEvent.Reconnected, () => {
          console.log('Reconnected to room');
          setConnectionState('connected');
        });

        // Connect to room
        const wsUrl = roomData.wsUrl || LIVEKIT_URL;
        console.log('Connecting to:', wsUrl);
        
        await roomInstance.connect(wsUrl, roomData.token);
        setRoom(roomInstance);
        
        console.log('Room connected, enabling camera and microphone...');
        
        // Enable camera and microphone
        try {
          await roomInstance.localParticipant.enableCameraAndMicrophone();
          console.log('Camera and microphone enabled');
        } catch (mediaError) {
          console.error('Failed to enable camera/microphone:', mediaError);
          setError(`Media access failed: ${mediaError.message}`);
        }
        
      } catch (error) {
        console.error('Failed to connect to room:', error);
        setError(`Failed to connect: ${error.message}`);
        setConnectionState('error');
      }
    };

    connectToRoom();

    // Cleanup function
    return () => {
      console.log('Cleaning up room connection');
      if (roomInstance) {
        roomInstance.disconnect();
      }
    };
  }, [roomData, setError]);

  const copyRoomLink = () => {
    const url = new URL(window.location);
    url.searchParams.set('room', roomData.roomName);
    navigator.clipboard.writeText(url.toString()).then(() => {
      alert('Room link copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy link:', err);
      // Fallback: show the link in an alert
      alert(`Share this link: ${url.toString()}`);
    });
  };

  const leaveRoom = useCallback(() => {
    console.log('Leaving room');
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

  if (connectionState === 'reconnecting') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-yellow-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-white text-xl font-semibold mb-2">Reconnecting...</h2>
          <p className="text-gray-400">Connection lost, attempting to reconnect</p>
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
          <p className="text-gray-400">
            Participants: {participants.length + 1} 
            {connectionState === 'connected' && <span className="text-green-400 ml-2">● Connected</span>}
          </p>
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
            playsInline
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
  const [hasVideo, setHasVideo] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);

  useEffect(() => {
    console.log('Setting up remote participant:', participant.identity);

    // Function to attach track
    const attachTrack = (track, ref) => {
      if (track && ref.current) {
        track.attach(ref.current);
        console.log(`Attached ${track.kind} track for ${participant.identity}`);
      }
    };

    // Attach existing tracks
    participant.videoTracks.forEach((publication) => {
      if (publication.track) {
        attachTrack(publication.track, videoRef);
        setHasVideo(true);
      }
    });

    participant.audioTracks.forEach((publication) => {
      if (publication.track) {
        attachTrack(publication.track, audioRef);
        setHasAudio(true);
      }
    });

    // Handle track subscriptions
    const handleTrackSubscribed = (track, publication) => {
      console.log(`Track subscribed: ${track.kind} from ${participant.identity}`);
      
      if (track.kind === Track.Kind.Video) {
        attachTrack(track, videoRef);
        setHasVideo(true);
      } else if (track.kind === Track.Kind.Audio) {
        attachTrack(track, audioRef);
        setHasAudio(true);
      }
    };

    const handleTrackUnsubscribed = (track, publication) => {
      console.log(`Track unsubscribed: ${track.kind} from ${participant.identity}`);
      track.detach();
      
      if (track.kind === Track.Kind.Video) {
        setHasVideo(false);
      } else if (track.kind === Track.Kind.Audio) {
        setHasAudio(false);
      }
    };

    const handleTrackMuted = (publication) => {
      console.log(`Track muted: ${publication.kind} from ${participant.identity}`);
    };

    const handleTrackUnmuted = (publication) => {
      console.log(`Track unmuted: ${publication.kind} from ${participant.identity}`);
    };

    // Add event listeners
    participant.on(ParticipantEvent.TrackSubscribed, handleTrackSubscribed);
    participant.on(ParticipantEvent.TrackUnsubscribed, handleTrackUnsubscribed);
    participant.on(ParticipantEvent.TrackMuted, handleTrackMuted);
    participant.on(ParticipantEvent.TrackUnmuted, handleTrackUnmuted);

    // Cleanup
    return () => {
      participant.off(ParticipantEvent.TrackSubscribed, handleTrackSubscribed);
      participant.off(ParticipantEvent.TrackUnsubscribed, handleTrackUnsubscribed);
      participant.off(ParticipantEvent.TrackMuted, handleTrackMuted);
      participant.off(ParticipantEvent.TrackUnmuted, handleTrackUnmuted);
    };
  }, [participant]);

  return (
    <div className="relative group">
      <div className="w-full rounded-lg shadow-lg bg-gray-700 relative" style={{ height: '300px' }}>
        <video 
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full rounded-lg object-cover"
          style={{ display: hasVideo ? 'block' : 'none' }}
        />
        {!hasVideo && (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mb-2">
                <span className="text-2xl">👤</span>
              </div>
              <p className="text-white text-sm">Camera off</p>
            </div>
          </div>
        )}
      </div>
      <audio ref={audioRef} autoPlay />
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white px-3 py-1 rounded-full text-sm font-medium">
        <span className="text-blue-400">●</span> {participant.identity}
      </div>
      <div className="absolute top-2 right-2 flex gap-1">
        {hasVideo && (
          <div className="bg-green-600 text-white px-2 py-1 rounded text-xs">Video</div>
        )}
        {hasAudio && (
          <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs">Audio</div>
        )}
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
      console.log('Video toggled:', !isVideoEnabled);
    } catch (error) {
      console.error('Error toggling video:', error);
    }
  };

  const toggleAudio = async () => {
    try {
      await localParticipant.setMicrophoneEnabled(!isAudioEnabled);
      setIsAudioEnabled(!isAudioEnabled);
      console.log('Audio toggled:', !isAudioEnabled);
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