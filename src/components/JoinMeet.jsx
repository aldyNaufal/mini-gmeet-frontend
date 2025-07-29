// src/components/VideoRoom.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Room, 
  RemoteParticipant, 
  LocalParticipant,
  RoomEvent,
  Track,
  ConnectionState,
  ParticipantEvent,
  TrackEvent
} from 'livekit-client';
import { 
  Camera, 
  CameraOff, 
  Mic, 
  MicOff, 
  Monitor, 
  PhoneOff, 
  Users,
  Settings,
  MessageSquare
} from 'lucide-react';
import { liveKitAPI } from '../services/livekit';

const VideoRoom = ({ roomName, participantName, onLeave }) => {
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState(new Map());
  const [localParticipant, setLocalParticipant] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionState, setConnectionState] = useState('connecting');
  const [error, setError] = useState(null);
  
  // Controls state
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  
  const roomRef = useRef(null);
  const localVideoRef = useRef(null);
  const participantRefs = useRef(new Map());

  useEffect(() => {
    connectToRoom();
    return () => {
      disconnectFromRoom();
    };
  }, []);

  const connectToRoom = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      // Generate token from your backend
      const tokenData = await liveKitAPI.generateToken(roomName, participantName);
      
      // Create room instance
      const liveKitRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: {
            width: 1280,
            height: 720,
          },
          facingMode: 'user',
        },
      });

      roomRef.current = liveKitRoom;
      setRoom(liveKitRoom);

      // Set up event listeners
      setupRoomEventListeners(liveKitRoom);

      // Connect to room
      await liveKitRoom.connect(tokenData.wsUrl, tokenData.token);
      
      console.log('Connected to room:', roomName);
      setConnectionState('connected');
      
      // Enable camera and microphone
      await liveKitRoom.localParticipant.enableCameraAndMicrophone();
      setLocalParticipant(liveKitRoom.localParticipant);
      
    } catch (err) {
      console.error('Failed to connect to room:', err);
      setError(err.message);
      setConnectionState('failed');
    } finally {
      setIsConnecting(false);
    }
  };

  const setupRoomEventListeners = (liveKitRoom) => {
    // Connection state changes
    liveKitRoom.on(RoomEvent.ConnectionStateChanged, (state) => {
      console.log('Connection state changed:', state);
      setConnectionState(state);
    });

    // Participant events
    liveKitRoom.on(RoomEvent.ParticipantConnected, (participant) => {
      console.log('Participant connected:', participant.identity);
      setParticipants(prev => new Map(prev.set(participant.sid, participant)));
      setupParticipantEventListeners(participant);
    });

    liveKitRoom.on(RoomEvent.ParticipantDisconnected, (participant) => {
      console.log('Participant disconnected:', participant.identity);
      setParticipants(prev => {
        const newMap = new Map(prev);
        newMap.delete(participant.sid);
        return newMap;
      });
    });

    // Track events
    liveKitRoom.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      console.log('Track subscribed:', track.kind, participant.identity);
      attachTrackToElement(track, participant);
    });

    liveKitRoom.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
      console.log('Track unsubscribed:', track.kind, participant.identity);
      detachTrackFromElement(track, participant);
    });

    // Data received (for chat)
    liveKitRoom.on(RoomEvent.DataReceived, (payload, participant) => {
      const message = JSON.parse(new TextDecoder().decode(payload));
      setMessages(prev => [...prev, {
        id: Date.now(),
        participant: participant?.identity || 'System',
        message: message.text,
        timestamp: new Date()
      }]);
    });

    // Local participant
    if (liveKitRoom.localParticipant) {
      setupParticipantEventListeners(liveKitRoom.localParticipant);
    }
  };

  const setupParticipantEventListeners = (participant) => {
    participant.on(ParticipantEvent.TrackPublished, (publication) => {
      console.log('Track published:', publication.trackName, participant.identity);
    });

    participant.on(ParticipantEvent.TrackUnpublished, (publication) => {
      console.log('Track unpublished:', publication.trackName, participant.identity);
    });
  };

  const attachTrackToElement = (track, participant) => {
    if (track.kind === Track.Kind.Video || track.kind === Track.Kind.Audio) {
      const element = track.attach();
      element.style.width = '100%';
      element.style.height = '100%';
      element.style.objectFit = 'cover';
      
      // Find the participant's container and attach
      const participantContainer = document.getElementById(`participant-${participant.sid}`);
      if (participantContainer) {
        // Remove existing media elements
        const existingMedia = participantContainer.querySelector('video, audio');
        if (existingMedia) {
          existingMedia.remove();
        }
        participantContainer.appendChild(element);
      }
    }
  };

  const detachTrackFromElement = (track, participant) => {
    const elements = track.detach();
    elements.forEach(element => element.remove());
  };

  const disconnectFromRoom = async () => {
    if (roomRef.current) {
      await roomRef.current.disconnect();
      roomRef.current = null;
      setRoom(null);
      setParticipants(new Map());
      setLocalParticipant(null);
    }
  };

  const toggleCamera = async () => {
    if (localParticipant) {
      if (isCameraOn) {
        await localParticipant.setCameraEnabled(false);
      } else {
        await localParticipant.setCameraEnabled(true);
      }
      setIsCameraOn(!isCameraOn);
    }
  };

  const toggleMicrophone = async () => {
    if (localParticipant) {
      if (isMicOn) {
        await localParticipant.setMicrophoneEnabled(false);
      } else {
        await localParticipant.setMicrophoneEnabled(true);
      }
      setIsMicOn(!isMicOn);
    }
  };

  const toggleScreenShare = async () => {
    if (localParticipant) {
      if (isScreenSharing) {
        await localParticipant.setScreenShareEnabled(false);
      } else {
        await localParticipant.setScreenShareEnabled(true);
      }
      setIsScreenSharing(!isScreenSharing);
    }
  };

  const sendMessage = async () => {
    if (newMessage.trim() && room) {
      const message = { text: newMessage.trim() };
      const data = new TextEncoder().encode(JSON.stringify(message));
      await room.localParticipant.publishData(data, { reliable: true });
      
      // Add to local messages
      setMessages(prev => [...prev, {
        id: Date.now(),
        participant: 'You',
        message: newMessage.trim(),
        timestamp: new Date()
      }]);
      setNewMessage('');
    }
  };

  const leaveRoom = async () => {
    await disconnectFromRoom();
    onLeave();
  };

  if (isConnecting) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Connecting to {roomName}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white max-w-md">
          <h2 className="text-xl font-bold mb-4">Connection Failed</h2>
          <p className="mb-6">{error}</p>
          <button
            onClick={onLeave}
            className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const allParticipants = localParticipant 
    ? [localParticipant, ...Array.from(participants.values())]
    : Array.from(participants.values());

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold">{roomName}</h1>
          <p className="text-sm text-gray-300">
            {allParticipants.length} participant{allParticipants.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`w-3 h-3 rounded-full ${
            connectionState === 'connected' ? 'bg-green-500' : 'bg-red-500'
          }`}></span>
          <span className="text-sm">{connectionState}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Video Grid */}
        <div className="flex-1 p-4">
          <div className={`grid gap-4 h-full ${
            allParticipants.length === 1 ? 'grid-cols-1' :
            allParticipants.length === 2 ? 'grid-cols-2' :
            allParticipants.length <= 4 ? 'grid-cols-2 grid-rows-2' :
            allParticipants.length <= 6 ? 'grid-cols-3 grid-rows-2' :
            'grid-cols-3 grid-rows-3'
          }`}>
            {allParticipants.map((participant) => (
              <div
                key={participant.sid}
                id={`participant-${participant.sid}`}
                className="bg-gray-800 rounded-lg relative overflow-hidden"
              >
                {/* Participant name */}
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm z-10">
                  {participant.identity} {participant === localParticipant && '(You)'}
                </div>
                
                {/* Muted indicator */}
                {!participant.isMicrophoneEnabled && (
                  <div className="absolute top-2 right-2 bg-red-600 p-1 rounded-full z-10">
                    <MicOff size={16} className="text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Chat Panel */}
        {showChat && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-white font-semibold flex items-center">
                <MessageSquare size={20} className="mr-2" />
                Chat
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.map((msg) => (
                <div key={msg.id} className="text-sm">
                  <span className="text-blue-400 font-medium">{msg.participant}:</span>
                  <span className="text-white ml-2">{msg.message}</span>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t border-gray-700">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-700 text-white px-3 py-2 rounded border-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={sendMessage}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4 flex justify-center space-x-4">
        <button
          onClick={toggleMicrophone}
          className={`p-3 rounded-full ${isMicOn ? 'bg-gray-600' : 'bg-red-600'} hover:opacity-80`}
        >
          {isMicOn ? <Mic className="text-white" size={24} /> : <MicOff className="text-white" size={24} />}
        </button>
        
        <button
          onClick={toggleCamera}
          className={`p-3 rounded-full ${isCameraOn ? 'bg-gray-600' : 'bg-red-600'} hover:opacity-80`}
        >
          {isCameraOn ? <Camera className="text-white" size={24} /> : <CameraOff className="text-white" size={24} />}
        </button>
        
        <button
          onClick={toggleScreenShare}
          className={`p-3 rounded-full ${isScreenSharing ? 'bg-blue-600' : 'bg-gray-600'} hover:opacity-80`}
        >
          <Monitor className="text-white" size={24} />
        </button>
        
        <button
          onClick={() => setShowChat(!showChat)}
          className={`p-3 rounded-full ${showChat ? 'bg-blue-600' : 'bg-gray-600'} hover:opacity-80`}
        >
          <MessageSquare className="text-white" size={24} />
        </button>
        
        <button
          onClick={() => setShowParticipants(!showParticipants)}
          className={`p-3 rounded-full ${showParticipants ? 'bg-blue-600' : 'bg-gray-600'} hover:opacity-80`}
        >
          <Users className="text-white" size={24} />
        </button>
        
        <button
          onClick={leaveRoom}
          className="p-3 rounded-full bg-red-600 hover:bg-red-700"
        >
          <PhoneOff className="text-white" size={24} />
        </button>
      </div>
    </div>
  );
};

export default VideoRoom;