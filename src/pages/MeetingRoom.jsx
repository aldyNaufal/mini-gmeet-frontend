import React, { useState, useEffect, useRef } from 'react';
import { 
  Room, 
  LocalParticipant, 
  RemoteParticipant, 
  Track,
  ConnectionState,
  RoomEvent,
  TrackPublication,
  RemoteTrackPublication,
  LocalTrackPublication
} from 'livekit-client';

const VideoConference = () => {
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [localParticipant, setLocalParticipant] = useState(null);
  const [connectionState, setConnectionState] = useState('disconnected');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [roomName, setRoomName] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [roomsList, setRoomsList] = useState([]);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  
  const localVideoRef = useRef(null);
  const remoteVideosRef = useRef({});
  
  // API Base URL - adjust this to match your backend
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
    (import.meta.env.PROD ? 'https://mini-gmeet-backend-production.up.railway.app/api' : 'http://localhost:8000/api');
  
  // Generate invite URL
  const generateInviteUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}?room=${encodeURIComponent(roomName)}&name=`;
  };

  // Generate meeting ID (simple hash of room name)
  const generateMeetingId = (roomName) => {
    let hash = 0;
    for (let i = 0; i < roomName.length; i++) {
      const char = roomName.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString().slice(0, 6);
  };

  // Copy invite link to clipboard
  const copyInviteLink = async () => {
    const inviteUrl = generateInviteUrl();
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = inviteUrl;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiedToClipboard(true);
        setTimeout(() => setCopiedToClipboard(false), 2000);
      } catch (err) {
        console.error('Fallback copy failed: ', err);
      }
      document.body.removeChild(textArea);
    }
  };

  // Share via Web Share API (mobile-friendly)
  const shareInviteLink = async () => {
    const inviteUrl = generateInviteUrl();
    const meetingId = generateMeetingId(roomName);
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Video Meeting',
          text: `Join "${roomName}" video meeting (ID: ${meetingId})`,
          url: inviteUrl,
        });
      } catch (err) {
        console.error('Error sharing: ', err);
        copyInviteLink(); // Fallback to copy
      }
    } else {
      copyInviteLink(); // Fallback for desktop
    }
  };

  // Send invite via email (opens email client)
  const sendEmailInvite = () => {
    const inviteUrl = generateInviteUrl();
    const meetingId = generateMeetingId(roomName);
    const subject = encodeURIComponent(`Join Video Meeting - ${roomName}`);
    const body = encodeURIComponent(
      `Hi there!\n\n` +
      `You're invited to join a video meeting:\n\n` +
      `Meeting: ${roomName}\n` +
      `Meeting ID: ${meetingId}\n` +
      `Host: ${participantName}\n\n` +
      `Click here to join: ${inviteUrl}\n\n` +
      `Or copy and paste this link in your browser:\n${inviteUrl}\n\n` +
      `Best regards,\n${participantName}`
    );
    
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  // Generate WhatsApp invite link
  const sendWhatsAppInvite = () => {
    const inviteUrl = generateInviteUrl();
    const meetingId = generateMeetingId(roomName);
    const message = encodeURIComponent(
      `🎥 Join my video meeting!\n\n` +
      `Meeting: *${roomName}*\n` +
      `Meeting ID: *${meetingId}*\n` +
      `Host: ${participantName}\n\n` +
      `Click to join: ${inviteUrl}`
    );
    
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  useEffect(() => {
    fetchRooms();
    
    // Check for URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const roomFromUrl = urlParams.get('room');
    const nameFromUrl = urlParams.get('name');
    
    if (roomFromUrl) setRoomName(roomFromUrl);
    if (nameFromUrl) setParticipantName(nameFromUrl);
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/rooms`);
      const data = await response.json();
      setRoomsList(data.rooms || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const generateToken = async (roomName, participantName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomName,
          participantName,
          maxParticipants: 10
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error generating token:', error);
      throw error;
    }
  };

  const connectToRoom = async () => {
    if (!roomName.trim() || !participantName.trim()) {
      setError('Please enter both room name and participant name');
      return;
    }
    setIsConnecting(true);
    setError('');
    try {
      // Generate token
      const tokenData = await generateToken(roomName.trim(), participantName.trim());
      
      // Create room instance
      const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
        publishDefaults: {
          videoSimulcast: true,
          videoCodec: 'vp8',
        },
      });
      // Set up event listeners
      setupRoomListeners(newRoom);
      // Connect to room
      await newRoom.connect(tokenData.wsUrl, tokenData.token);
      
      setRoom(newRoom);
      setConnectionState('connected');
      
      // Enable camera and microphone
      await newRoom.localParticipant.enableCameraAndMicrophone();
      
      setLocalParticipant(newRoom.localParticipant);
      setParticipants([...newRoom.remoteParticipants.values()]);
    } catch (error) {
      console.error('Error connecting to room:', error);
      setError(`Failed to connect: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const setupRoomListeners = (room) => {
    room.on(RoomEvent.Connected, () => {
      console.log('Connected to room');
      setConnectionState('connected');
    });
    room.on(RoomEvent.Disconnected, () => {
      console.log('Disconnected from room');
      setConnectionState('disconnected');
      cleanup();
    });
    room.on(RoomEvent.ParticipantConnected, (participant) => {
      console.log('Participant connected:', participant.identity);
      setParticipants(prev => [...prev, participant]);
      setupParticipantListeners(participant);
    });
    room.on(RoomEvent.ParticipantDisconnected, (participant) => {
      console.log('Participant disconnected:', participant.identity);
      setParticipants(prev => prev.filter(p => p.sid !== participant.sid));
    });
    room.on(RoomEvent.LocalTrackPublished, (publication, participant) => {
      console.log('Local track published:', publication.trackSid);
      attachTrack(publication, participant, true);
    });
    room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      console.log('Track subscribed:', publication.trackSid);
      attachTrack(publication, participant, false);
    });
    room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
      console.log('Track unsubscribed:', publication.trackSid);
      detachTrack(publication, participant);
    });
    // Set up local participant listeners
    setupParticipantListeners(room.localParticipant);
  };

  const setupParticipantListeners = (participant) => {
    participant.videoTrackPublications.forEach((publication) => {
      if (publication.track) {
        attachTrack(publication, participant, participant === room?.localParticipant);
      }
    });
    participant.audioTrackPublications.forEach((publication) => {
      if (publication.track) {
        attachTrack(publication, participant, participant === room?.localParticipant);
      }
    });
  };

  const attachTrack = (publication, participant, isLocal) => {
    const track = publication.track;
    if (!track) return;
    if (track.kind === Track.Kind.Video) {
      const videoElement = isLocal ? localVideoRef.current : remoteVideosRef.current[participant.sid];
      if (videoElement) {
        track.attach(videoElement);
      }
    } else if (track.kind === Track.Kind.Audio && !isLocal) {
      // Only attach remote audio, not local (to avoid echo)
      track.attach();
    }
  };

  const detachTrack = (publication, participant) => {
    const track = publication.track;
    if (!track) return;
    track.detach();
  };

  const toggleAudio = async () => {
    if (room && localParticipant) {
      const enabled = !isMuted;
      await localParticipant.setMicrophoneEnabled(enabled);
      setIsMuted(!enabled);
    }
  };

  const toggleVideo = async () => {
    if (room && localParticipant) {
      const enabled = !isVideoEnabled;
      await localParticipant.setCameraEnabled(enabled);
      setIsVideoEnabled(enabled);
    }
  };

  const leaveRoom = async () => {
    if (room) {
      await room.disconnect();
    }
    cleanup();
  };

  const cleanup = () => {
    setRoom(null);
    setParticipants([]);
    setLocalParticipant(null);
    setConnectionState('disconnected');
    setIsVideoEnabled(true);
    setIsAudioEnabled(true);
    setIsMuted(false);
  };

  const createNewRoom = async () => {
    if (!roomName.trim()) {
      setError('Please enter a room name');
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/room`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomName: roomName.trim(),
          maxParticipants: 10,
          metadata: 'Created from frontend'
        }),
      });
      if (response.ok) {
        await fetchRooms();
        setError('');
      } else {
        const errorData = await response.json();
        setError(`Failed to create room: ${errorData.detail}`);
      }
    } catch (error) {
      console.error('Error creating room:', error);
      setError('Failed to create room');
    }
  };

  // Invite Modal Component
  const InviteModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">Invite Others</h3>
          <button 
            onClick={() => setShowInviteModal(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">Meeting Details:</p>
            <div className="bg-gray-50 p-3 rounded-lg text-sm">
              <p><strong>Room:</strong> {roomName}</p>
              <p><strong>Meeting ID:</strong> {generateMeetingId(roomName)}</p>
              <p><strong>Host:</strong> {participantName}</p>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-gray-600 mb-2">Invite Link:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={generateInviteUrl()}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
              />
              <button
                onClick={copyInviteLink}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  copiedToClipboard 
                    ? 'bg-green-500 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {copiedToClipboard ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-gray-600 mb-3">Share via:</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={shareInviteLink}
                className="flex items-center justify-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                <span className="text-sm">Share</span>
              </button>
              
              <button
                onClick={sendEmailInvite}
                className="flex items-center justify-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-sm">Email</span>
              </button>
              
              <button
                onClick={sendWhatsAppInvite}
                className="flex items-center justify-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488z"/>
                </svg>
                <span className="text-sm">WhatsApp</span>
              </button>
              
              <button
                onClick={() => {
                  const tweetText = encodeURIComponent(`Join my video meeting "${roomName}"!\nMeeting ID: ${generateMeetingId(roomName)}\n${generateInviteUrl()}`);
                  window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank');
                }}
                className="flex items-center justify-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
                <span className="text-sm">Twitter</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (connectionState === 'connected' && room) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Header */}
        <div className="bg-gray-800 p-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Room: {roomName}</h1>
            <p className="text-sm text-gray-400">
              Participants: {participants.length + 1} | ID: {generateMeetingId(roomName)}
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setShowInviteModal(true)}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Invite
            </button>
            <button
              onClick={toggleAudio}
              className={`p-3 rounded-full ${
                isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
              } transition-colors`}
            >
              {isMuted ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            <button
              onClick={toggleVideo}
              className={`p-3 rounded-full ${
                !isVideoEnabled ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
              } transition-colors`}
            >
              {!isVideoEnabled ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A2 2 0 0017 14V6a2 2 0 00-2-2h-6.586L3.707 2.293z" />
                  <path d="M1 8a2 2 0 012-2h2.586l2 2H3v4.586l2 2H3a2 2 0 01-2-2V8z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                </svg>
              )}
            </button>
            <button
              onClick={leaveRoom}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
            >
              Leave Room
            </button>
          </div>
        </div>

        {/* Video Grid */}
        <div className="p-4">
          <div className={`grid gap-4 ${
            participants.length === 0 ? 'grid-cols-1' :
            participants.length === 1 ? 'grid-cols-2' :
            participants.length <= 4 ? 'grid-cols-2' :
            'grid-cols-3'
          }`}>
            {/* Local Participant */}
            <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 px-2 py-1 rounded text-sm">
                {participantName} (You)
                {isMuted && <span className="ml-2 text-red-400">🔇</span>}
              </div>
            </div>
            {/* Remote Participants */}
            {participants.map((participant) => (
              <div
                key={participant.sid}
                className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video"
              >
                <video
                  ref={(el) => {
                    if (el) {
                      remoteVideosRef.current[participant.sid] = el;
                    }
                  }}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 px-2 py-1 rounded text-sm">
                  {participant.identity}
                  {participant.isMuted && <span className="ml-2 text-red-400">🔇</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Invite Modal */}
        {showInviteModal && <InviteModal />}

        {/* Error Display */}
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg max-w-sm">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Video Conference
          </h1>
          <p className="text-gray-600">Join or create a room to get started</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              disabled={isConnecting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Room Name
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter room name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              disabled={isConnecting}
            />
          </div>

          {roomsList.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Or select existing room
              </label>
              <select
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                disabled={isConnecting}
              >
                <option value="">Select a room...</option>
                {roomsList.map((room) => (
                  <option key={room.sid} value={room.name}>
                    {room.name} ({room.numParticipants} participants)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={connectToRoom}
              disabled={isConnecting || !roomName.trim() || !participantName.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              {isConnecting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connecting...
                </>
              ) : (
                'Join Room'
              )}
            </button>
            <button
              onClick={createNewRoom}
              disabled={isConnecting || !roomName.trim()}
              className="px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors duration-200"
            >
              Create
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="text-center">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Advanced Settings
            </button>
          </div>

          {showSettings && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="text-sm text-gray-600">
                <p><strong>API Endpoint:</strong> {API_BASE_URL}</p>
                <p><strong>Available Rooms:</strong> {roomsList.length}</p>
              </div>
              <button
                onClick={fetchRooms}
                className="w-full text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded transition-colors"
              >
                Refresh Rooms
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoConference;