import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  LiveKitRoom, 
  VideoConference, 
  RoomAudioRenderer,
  useRoomContext,
  useTracks
} from '@livekit/components-react';
import '@livekit/components-styles';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneOff, 
  Users, 
  Settings,
  Monitor,
  Copy,
  Check
} from 'lucide-react';
import { Room, Track } from 'livekit-client';
import toast from 'react-hot-toast';
import { generateToken } from '../config/api';
import ParticipantsList from '../components/ParticipantsList';

const MeetingRoom = () => {
  const { roomName } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const participantName = searchParams.get('participant');
  
  const [token, setToken] = useState('');
  const [wsUrl, setWsUrl] = useState('');
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [copied, setCopied] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  const MAX_RETRIES = 3;

  useEffect(() => {
    if (!participantName || !roomName) {
      console.error('Missing required parameters:', { participantName, roomName });
      navigate('/');
      return;
    }

    const getToken = async (attempt = 1) => {
      try {
        setIsConnecting(true);
        setError('');
        
        console.log(`Attempting to get token for room: ${roomName}, participant: ${participantName}, attempt: ${attempt}`);
        
        // Generate unique participant name to avoid conflicts
        const uniqueParticipantName = `${participantName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const response = await generateToken({
          roomName: roomName.trim(),
          participantName: uniqueParticipantName,
          metadata: JSON.stringify({
            displayName: participantName,
            joinedAt: new Date().toISOString()
          })
        });
        
        console.log('Token generation successful:', response);
        
        if (!response.token || !response.wsUrl) {
          throw new Error('Invalid response: missing token or wsUrl');
        }
        
        setToken(response.token);
        setWsUrl(response.wsUrl);
        setError('');
        setRetryCount(0);
        
      } catch (err) {
        console.error(`Token generation attempt ${attempt} failed:`, err);
        
        if (attempt < MAX_RETRIES) {
          console.log(`Retrying token generation... (${attempt + 1}/${MAX_RETRIES})`);
          setRetryCount(attempt);
          setTimeout(() => getToken(attempt + 1), 2000 * attempt); // Exponential backoff
        } else {
          const errorMessage = err.response?.data?.detail || err.message || 'Failed to join room';
          setError(`Unable to join room after ${MAX_RETRIES} attempts: ${errorMessage}`);
          toast.error('Failed to join room. Please try again.');
        }
      } finally {
        if (attempt >= MAX_RETRIES) {
          setIsConnecting(false);
        }
      }
    };

    getToken();
  }, [roomName, participantName, navigate]);

  const handleDisconnect = useCallback(() => {
    console.log('User disconnecting from room');
    navigate('/');
  }, [navigate]);

  const handleConnectionError = useCallback((error) => {
    console.error('LiveKit connection error:', error);
    setConnectionAttempts(prev => prev + 1);
    
    if (connectionAttempts < 2) {
      toast.error('Connection failed, retrying...');
      // Force token regeneration
      window.location.reload();
    } else {
      setError('Failed to connect to the meeting room. Please check your internet connection and try again.');
      toast.error('Unable to connect to the meeting room');
    }
  }, [connectionAttempts]);

  const copyRoomLink = async () => {
    const roomLink = `${window.location.origin}/room/${roomName}`;
    try {
      await navigator.clipboard.writeText(roomLink);
      setCopied(true);
      toast.success('Room link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy room link');
    }
  };

  if (isConnecting) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-white mb-2">Joining Room</h2>
          <p className="text-gray-400">Connecting to {roomName}...</p>
          {retryCount > 0 && (
            <p className="text-yellow-400 text-sm mt-2">
              Retry attempt {retryCount}/{MAX_RETRIES}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-semibold text-white mb-2">Connection Failed</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors w-full"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors w-full"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Add validation for token and wsUrl before rendering LiveKitRoom
  if (!token || !wsUrl) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-white mb-2">Loading...</h2>
          <p className="text-gray-400">Preparing room connection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-white font-semibold text-lg">{roomName}</h1>
          <p className="text-gray-400 text-sm">Welcome, {participantName}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={copyRoomLink}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
          
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Users className="w-4 h-4" />
            Participants
          </button>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleDisconnect}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <PhoneOff className="w-4 h-4" />
            Leave
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 relative">
        <LiveKitRoom
          token={token}
          serverUrl={wsUrl}
          onDisconnected={handleDisconnect}
          onError={handleConnectionError}
          video={true}
          audio={true}
          className="h-full"
          options={{
            // Add connection options for better reliability
            adaptiveStream: true,
            dynacast: true,
            videoCaptureDefaults: {
              resolution: {
                width: 640,
                height: 480,
                frameRate: 15,
              },
            },
          }}
        >
          <RoomContent showSettings={showSettings} participantName={participantName} />
          <RoomAudioRenderer />
          
          <ParticipantsList 
            isOpen={showParticipants} 
            onClose={() => setShowParticipants(false)} 
          />
        </LiveKitRoom>
      </div>
    </div>
  );
};

// Separate component to use LiveKit hooks
const RoomContent = ({ showSettings, participantName }) => {
  const room = useRoomContext();
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    if (!room) return;

    const updateParticipants = () => {
      const remoteParticipants = Array.from(room.remoteParticipants.values());
      const localParticipant = room.localParticipant;
      const allParticipants = localParticipant ? [localParticipant, ...remoteParticipants] : remoteParticipants;
      
      console.log('Participants updated:', allParticipants.map(p => ({
        identity: p.identity,
        name: p.name,
        metadata: p.metadata
      })));
      
      setParticipants(allParticipants);
    };

    // Initial update
    updateParticipants();

    // Listen for participant events
    room.on('participantConnected', (participant) => {
      console.log('Participant connected:', participant.identity);
      updateParticipants();
      toast.success(`${participant.name || participant.identity} joined the meeting`);
    });

    room.on('participantDisconnected', (participant) => {
      console.log('Participant disconnected:', participant.identity);
      updateParticipants();
      toast.info(`${participant.name || participant.identity} left the meeting`);
    });

    room.on('reconnecting', () => {
      console.log('Room reconnecting...');
      toast.info('Reconnecting...');
    });

    room.on('reconnected', () => {
      console.log('Room reconnected');
      toast.success('Reconnected successfully');
      updateParticipants();
    });

    return () => {
      room.off('participantConnected', updateParticipants);
      room.off('participantDisconnected', updateParticipants);
      room.off('reconnecting');
      room.off('reconnected');
    };
  }, [room]);

  return (
    <div className="h-full relative">
      {/* Video Conference */}
      <VideoConference 
        style={{ 
          height: '100%',
          '--lk-bg': '#111827',
          '--lk-fg': '#ffffff',
          '--lk-accent': '#3b82f6'
        }}
      />

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-4 right-4 bg-gray-800 rounded-lg p-4 shadow-xl border border-gray-700 z-50 min-w-64">
          <h3 className="text-white font-semibold mb-3">Meeting Info</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-300">
              <Users className="w-4 h-4" />
              <span>{participants.length} participant{participants.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="text-gray-400">
              Room: {room?.name}
            </div>
            <div className="text-gray-400">
              Status: {room?.state}
            </div>
            <div className="text-gray-400">
              Your name: {participantName}
            </div>
            {participants.length > 0 && (
              <div className="mt-3">
                <h4 className="text-white font-medium mb-2">Participants:</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {participants.map((participant, index) => (
                    <div key={participant.identity} className="text-gray-300 text-xs">
                      {participant === room?.localParticipant ? '(You) ' : ''}
                      {participant.name || participant.identity}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingRoom;