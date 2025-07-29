import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Users, Plus, LogIn, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { createRoom, getRooms, checkHealth } from '../config/api';

const Room = () => {
  const [roomName, setRoomName] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [showRooms, setShowRooms] = useState(false);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const navigate = useNavigate();

  // Generate a random room name
  const generateRandomRoomName = () => {
    const adjectives = ['swift', 'bright', 'calm', 'bold', 'cool', 'warm', 'fast', 'neat'];
    const nouns = ['tiger', 'eagle', 'ocean', 'mountain', 'star', 'moon', 'river', 'cloud'];
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomNumber = Math.floor(Math.random() * 1000);
    return `${randomAdjective}-${randomNoun}-${randomNumber}`;
  };

  const validateInputs = () => {
    if (!participantName.trim()) {
      toast.error('Please enter your name');
      return false;
    }
    
    if (participantName.trim().length < 2) {
      toast.error('Name must be at least 2 characters long');
      return false;
    }

    if (!roomName.trim()) {
      toast.error('Please enter a room name');
      return false;
    }

    if (roomName.trim().length < 3) {
      toast.error('Room name must be at least 3 characters long');
      return false;
    }

    // Check for valid characters in room name
    const validRoomName = /^[a-zA-Z0-9-_\s]+$/.test(roomName.trim());
    if (!validRoomName) {
      toast.error('Room name can only contain letters, numbers, spaces, hyphens, and underscores');
      return false;
    }

    return true;
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    
    if (!validateInputs()) return;

    setIsCreating(true);
    
    try {
      // Test backend connectivity first
      await checkHealth();
      
      const cleanRoomName = roomName.trim().replace(/\s+/g, '-').toLowerCase();
      
      console.log('Creating room:', cleanRoomName);
      
      await createRoom({
        roomName: cleanRoomName,
        maxParticipants: 50,
        metadata: JSON.stringify({
          createdBy: participantName.trim(),
          createdAt: new Date().toISOString()
        })
      });
      
      toast.success('Room created successfully!');
      
      // Navigate to the room
      navigate(`/room/${cleanRoomName}?participant=${encodeURIComponent(participantName.trim())}`);
      
    } catch (error) {
      console.error('Error creating room:', error);
      
      // If room creation fails, it might already exist - try to join anyway
      if (error.message.includes('already exists') || error.response?.status === 409) {
        toast.info('Room already exists. Joining existing room...');
        const cleanRoomName = roomName.trim().replace(/\s+/g, '-').toLowerCase();
        navigate(`/room/${cleanRoomName}?participant=${encodeURIComponent(participantName.trim())}`);
      } else {
        toast.error('Failed to create room. Please check your connection and try again.');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    
    if (!validateInputs()) return;

    setIsJoining(true);
    
    try {
      // Test backend connectivity first
      await checkHealth();
      
      const cleanRoomName = roomName.trim().replace(/\s+/g, '-').toLowerCase();
      
      console.log('Joining room:', cleanRoomName);
      toast.success('Joining room...');
      
      navigate(`/room/${cleanRoomName}?participant=${encodeURIComponent(participantName.trim())}`);
      
    } catch (error) {
      console.error('Error connecting to backend:', error);
      toast.error('Cannot connect to server. Please try again later.');
    } finally {
      setIsJoining(false);
    }
  };

  const loadRooms = async () => {
    setIsLoadingRooms(true);
    try {
      await checkHealth();
      const roomList = await getRooms();
      setRooms(roomList.rooms || []);
      setShowRooms(true);
      
      if (!roomList.rooms || roomList.rooms.length === 0) {
        toast.info('No active rooms found');
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
      toast.error('Failed to load rooms. Please check your connection.');
    } finally {
      setIsLoadingRooms(false);
    }
  };

  const joinExistingRoom = (room) => {
    if (!participantName.trim()) {
      toast.error('Please enter your name first');
      return;
    }
    
    console.log('Joining existing room:', room.name);
    navigate(`/room/${room.name}?participant=${encodeURIComponent(participantName.trim())}`);
  };

  const quickJoin = () => {
    if (!participantName.trim()) {
      toast.error('Please enter your name first');
      return;
    }
    
    const randomRoom = generateRandomRoomName();
    setRoomName(randomRoom);
    
    // Auto-create and join
    setTimeout(() => {
      const cleanRoomName = randomRoom.replace(/\s+/g, '-').toLowerCase();
      navigate(`/room/${cleanRoomName}?participant=${encodeURIComponent(participantName.trim())}`);
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Video className="w-16 h-16 text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">VideoMeet</h1>
          <p className="text-gray-300">Connect with friends and colleagues</p>
        </div>

        {/* Main Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
          <form onSubmit={handleCreateRoom} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Your Name *
              </label>
              <input
                type="text"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                placeholder="Enter your display name"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                minLength={2}
                maxLength={50}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Room Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Enter room name or generate one"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  minLength={3}
                  maxLength={100}
                />
                <button
                  type="button"
                  onClick={() => setRoomName(generateRandomRoomName())}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-400 hover:text-blue-300 text-sm font-medium"
                >
                  Generate
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isCreating || isJoining}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                {isCreating ? 'Creating...' : 'Create Room'}
              </button>
              
              <button
                type="button"
                onClick={handleJoinRoom}
                disabled={isJoining || isCreating}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                <LogIn className="w-4 h-4" />
                {isJoining ? 'Joining...' : 'Join Room'}
              </button>
            </div>
          </form>

          {/* Quick Join */}
          <div className="mt-4">
            <button
              onClick={quickJoin}
              disabled={!participantName.trim() || isCreating || isJoining}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Quick Join (Random Room)
            </button>
          </div>

          {/* Existing Rooms */}
          <div className="mt-6 pt-6 border-t border-white/20">
            <button
              onClick={loadRooms}
              disabled={isLoadingRooms}
              className="w-full flex items-center justify-center gap-2 text-blue-400 hover:text-blue-300 font-medium py-2 transition-colors disabled:opacity-50"
            >
              <Users className="w-4 h-4" />
              {isLoadingRooms ? 'Loading...' : 'View Active Rooms'}
            </button>

            {showRooms && (
              <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                {rooms.length > 0 ? (
                  rooms.map((room) => (
                    <div
                      key={room.sid || room.name}
                      className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/10"
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium truncate">{room.name}</h3>
                        <p className="text-gray-400 text-sm">
                          {room.numParticipants || 0} participant{(room.numParticipants || 0) !== 1 ? 's' : ''}
                          {room.creationTime && (
                            <span className="ml-2">
                              • Created {new Date(room.creationTime * 1000).toLocaleTimeString()}
                            </span>
                          )}
                        </p>
                      </div>
                      <button
                        onClick={() => joinExistingRoom(room)}
                        disabled={!participantName.trim()}
                        className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-sm font-medium transition-colors ml-3"
                      >
                        Join
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-400">No active rooms found</p>
                    <p className="text-gray-500 text-sm">Create a new room to get started</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-400 text-sm">
          <p>Powered by LiveKit • Secure video conferencing</p>
          <p className="mt-1">Share the room link with others to invite them</p>
        </div>
      </div>
    </div>
  );
};

export default Room;