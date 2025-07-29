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

  useEffect(() => {
    if (!participantName) {
      navigate('/');
      return;
    }

    const getToken = async () => {
      try {
        setIsConnecting(true);
        const response = await generateToken({
          roomName,
          participantName
        });
        
        setToken(response.token);
        setWsUrl(response.wsUrl);
        setError('');
      } catch (err) {
        console.error('Error getting token:', err);
        setError('Failed to join room. Please try again.');
        toast.error('Failed to join room');
      } finally {
        setIsConnecting(false);
      }
    };

    getToken();
  }, [roomName, participantName, navigate]);

  const handleDisconnect = useCallback(() => {
    navigate('/');
  }, [navigate]);

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
          <button
            onClick={() => setShowParticipants(true)}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Users className="w-4 h-4" />
            Participants
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Go Back
          </button>
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
          video={true}
          audio={true}
          className="h-full"
        >
          <RoomContent showSettings={showSettings} />
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
const RoomContent = ({ showSettings }) => {
  const room = useRoomContext();
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    if (!room) return;

    const updateParticipants = () => {
      setParticipants(Array.from(room.remoteParticipants.values()));
    };

    updateParticipants();
    room.on('participantConnected', updateParticipants);
    room.on('participantDisconnected', updateParticipants);

    return () => {
      room.off('participantConnected', updateParticipants);
      room.off('participantDisconnected', updateParticipants);
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
        <div className="absolute top-4 right-4 bg-gray-800 rounded-lg p-4 shadow-xl border border-gray-700 z-50">
          <h3 className="text-white font-semibold mb-3">Meeting Info</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-300">
              <Users className="w-4 h-4" />
              <span>{participants.length + 1} participant{participants.length !== 0 ? 's' : ''}</span>
            </div>
            <div className="text-gray-400">
              Room: {room?.name}
            </div>
            <div className="text-gray-400">
              Status: {room?.state}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingRoom;