// src/components/VideoConferenceApp.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Camera, 
  CameraOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  Users, 
  Copy,
  CheckCircle,
  Monitor,
  MonitorOff,
  Loader2
} from 'lucide-react';
import { 
  Room, 
  RoomEvent, 
  Track,
  RemoteTrack,
  RemoteTrackPublication,
  RemoteParticipant,
  LocalParticipant
} from 'livekit-client';

// Configuration - Using environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://mini-gmeet-backend-production.up.railway.app/api';

const VideoConferenceApp = () => {
  // State management
  const [roomName, setRoomName] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState(new Map());
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Refs
  const localVideoRef = useRef(null);
  const roomRef = useRef(null);
  const remoteVideoRefs = useRef(new Map());

  // Handle participant connected
  const handleParticipantConnected = useCallback((participant) => {
    console.log('Participant connected:', participant.identity);
    setParticipants(prev => new Map(prev.set(participant.identity, participant)));
  }, []);

  // Handle participant disconnected
  const handleParticipantDisconnected = useCallback((participant) => {
    console.log('Participant disconnected:', participant.identity);
    setParticipants(prev => {
      const newMap = new Map(prev);
      newMap.delete(participant.identity);
      return newMap;
    });
  }, []);

  // Handle track subscribed
  const handleTrackSubscribed = useCallback((track, publication, participant) => {
    console.log('Track subscribed:', track.kind, participant.identity);
    
    if (track.kind === Track.Kind.Video || track.kind === Track.Kind.Audio) {
      const element = track.attach();
      
      if (track.kind === Track.Kind.Video) {
        const videoRef = remoteVideoRefs.current.get(participant.identity);
        if (videoRef) {
          // Replace existing video element
          if (videoRef.firstChild) {
            videoRef.removeChild(videoRef.firstChild);
          }
          videoRef.appendChild(element);
        }
      }
    }
  }, []);

  // Handle track unsubscribed
  const handleTrackUnsubscribed = useCallback((track, publication, participant) => {
    console.log('Track unsubscribed:', track.kind, participant.identity);
    track.detach();
  }, []);

  // Handle local track published
  const handleLocalTrackPublished = useCallback((publication, participant) => {
    console.log('Local track published:', publication.kind);
    
    if (publication.kind === Track.Kind.Video && localVideoRef.current) {
      const videoTrack = participant.getTrackPublication(Track.Source.Camera)?.track;
      if (videoTrack) {
        const element = videoTrack.attach();
        if (localVideoRef.current.firstChild) {
          localVideoRef.current.removeChild(localVideoRef.current.firstChild);
        }
        localVideoRef.current.appendChild(element);
      }
    }
  }, []);

  // Join room function
  const joinRoom = async () => {
    if (!roomName.trim() || !participantName.trim()) {
      setError('Please enter both room name and your name');
      return;
    }

    setIsConnecting(true);
    setError('');

    try {
      // Get token from backend
      const tokenResponse = await fetch(`${API_BASE_URL}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomName: roomName.trim(),
          participantName: participantName.trim(),
          maxParticipants: 10
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${tokenResponse.status}: ${tokenResponse.statusText}`);
      }

      const tokenData = await tokenResponse.json();
      console.log('Token received:', tokenData);
      
      // Create new room instance
      const roomInstance = new Room({
        adaptive: true,
        dynacast: true,
        publishDefaults: {
          videoCodec: 'vp9',
        },
      });

      // Set up event listeners
      roomInstance.on(RoomEvent.ParticipantConnected, handleParticipantConnected);
      roomInstance.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
      roomInstance.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
      roomInstance.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
      roomInstance.on(RoomEvent.LocalTrackPublished, handleLocalTrackPublished);
      
      roomInstance.on(RoomEvent.Connected, () => {
        console.log('Connected to room');
        setIsJoined(true);
        
        // Initialize participants map with existing participants
        const existingParticipants = new Map();
        roomInstance.remoteParticipants.forEach((participant, identity) => {
          existingParticipants.set(identity, participant);
        });
        setParticipants(existingParticipants);
      });

      roomInstance.on(RoomEvent.Disconnected, () => {
        console.log('Disconnected from room');
        setIsJoined(false);
        setRoom(null);
        setParticipants(new Map());
      });

      // Connect to room
      await roomInstance.connect(tokenData.wsUrl, tokenData.token);
      
      // Enable camera and microphone
      await roomInstance.localParticipant.enableCameraAndMicrophone();
      
      roomRef.current = roomInstance;
      setRoom(roomInstance);

    } catch (error) {
      console.error('Failed to join room:', error);
      setError(error.message || 'Failed to join room. Please check your connection and try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  // Leave room function
  const leaveRoom = async () => {
    if (roomRef.current) {
      await roomRef.current.disconnect();
      roomRef.current = null;
    }
    
    setRoom(null);
    setIsJoined(false);
    setParticipants(new Map());
    setIsScreenSharing(false);
    
    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.innerHTML = '';
    }
    remoteVideoRefs.current.clear();
  };

  // Toggle audio
  const toggleAudio = async () => {
    if (room?.localParticipant) {
      const newState = !isAudioEnabled;
      await room.localParticipant.setMicrophoneEnabled(newState);
      setIsAudioEnabled(newState);
    }
  };

  // Toggle video
  const toggleVideo = async () => {
    if (room?.localParticipant) {
      const newState = !isVideoEnabled;
      await room.localParticipant.setCameraEnabled(newState);
      setIsVideoEnabled(newState);
    }
  };

  // Toggle screen share
  const toggleScreenShare = async () => {
    if (room?.localParticipant) {
      const newState = !isScreenSharing;
      await room.localParticipant.setScreenShareEnabled(newState);
      setIsScreenSharing(newState);
    }
  };

  // Copy room link
  const copyRoomLink = () => {
    const roomLink = `${window.location.origin}?room=${encodeURIComponent(roomName)}`;
    navigator.clipboard.writeText(roomLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomFromUrl = urlParams.get('room');
    if (roomFromUrl) {
      setRoomName(decodeURIComponent(roomFromUrl));
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
    };
  }, []);

  // Render participant video
  const renderParticipantVideo = (participant, isLocal = false) => {
    const identity = isLocal ? 'local' : participant.identity;
    const name = isLocal ? participantName : (participant.name || participant.identity);
    
    return (
      <div key={identity} className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video group">
        <div
          ref={isLocal ? localVideoRef : (el) => {
            if (el && !isLocal) {
              remoteVideoRefs.current.set(participant.identity, el);
            }
          }}
          className="w-full h-full bg-gray-700 flex items-center justify-center"
        >
          {/* Fallback avatar when video is disabled */}
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-xl">
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
        
        {/* Participant name */}
        <div className="absolute bottom-4 left-4 bg-black/70 px-3 py-1 rounded-lg backdrop-blur-sm">
          <span className="text-white text-sm font-medium">
            {isLocal ? 'You' : name}
          </span>
        </div>
        
        {/* Audio indicator */}
        {isLocal && !isAudioEnabled && (
          <div className="absolute top-4 right-4 bg-red-500 p-2 rounded-lg">
            <MicOff className="w-4 h-4 text-white" />
          </div>
        )}
        
        {/* Connection status for remote participants */}
        {!isLocal && (
          <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-green-500 w-3 h-3 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>
    );
  };

  if (!isJoined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/20">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-blue-400 to-purple-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Join Meeting</h1>
            <p className="text-blue-200">Connect with others instantly</p>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-blue-200 text-sm font-medium mb-2">
                Room Name
              </label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Enter room name"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                disabled={isConnecting}
              />
            </div>

            <div>
              <label className="block text-blue-200 text-sm font-medium mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                disabled={isConnecting}
              />
            </div>

            <button
              onClick={joinRoom}
              disabled={isConnecting || !roomName.trim() || !participantName.trim()}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 flex items-center justify-center gap-2"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Camera className="w-5 h-5" />
                  Join Meeting
                </>
              )}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-white/20">
            <p className="text-blue-200 text-sm text-center">
              Powered by LiveKit • Secure & Private
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 w-10 h-10 rounded-lg flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">{roomName}</h1>
              <p className="text-gray-400 text-sm flex items-center gap-2">
                <Users className="w-4 h-4" />
                {participants.size + 1} participant{participants.size !== 0 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={copyRoomLink}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Share
                </>
              )}
            </button>

            <button
              onClick={leaveRoom}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <PhoneOff className="w-4 h-4" />
              Leave
            </button>
          </div>
        </div>
      </div>

      {/* Main Video Grid */}
      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 h-full">
          {/* Local participant (always first) */}
          {renderParticipantVideo(null, true)}
          
          {/* Remote participants */}
          {Array.from(participants.values()).map((participant) => 
            renderParticipantVideo(participant, false)
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="bg-gray-800 border-t border-gray-700 px-6 py-4">
        <div className="flex items-center justify-center gap-4">
          {/* Audio Toggle */}
          <button
            onClick={toggleAudio}
            className={`p-4 rounded-full transition-all transform hover:scale-105 ${
              isAudioEnabled 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25'
            }`}
            title={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
          >
            {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </button>

          {/* Video Toggle */}
          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full transition-all transform hover:scale-105 ${
              isVideoEnabled 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25'
            }`}
            title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            {isVideoEnabled ? <Camera className="w-6 h-6" /> : <CameraOff className="w-6 h-6" />}
          </button>

          {/* Screen Share */}
          <button
            onClick={toggleScreenShare}
            className={`p-4 rounded-full transition-all transform hover:scale-105 ${
              isScreenSharing 
                ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25' 
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
            title={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
          >
            {isScreenSharing ? <MonitorOff className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
          </button>

          {/* Leave Call */}
          <button
            onClick={leaveRoom}
            className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all transform hover:scale-105 shadow-lg shadow-red-500/25"
            title="Leave meeting"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoConferenceApp;