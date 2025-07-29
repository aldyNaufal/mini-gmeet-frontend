import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Users, Plus, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { createRoom, getRooms } from '../config/api';

const Room = () => {
  const [roomName, setRoomName] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [showRooms, setShowRooms] = useState(false);
  const navigate = useNavigate();

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!roomName.trim() || !participantName.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsCreating(true);
    try {
      await createRoom({
        roomName: roomName.trim(),
        maxParticipants: 50
      });
      toast.success('Room created successfully!');
      navigate(`/room/${roomName.trim()}?participant=${encodeURIComponent(participantName.trim())}`);
    } catch (error) {
      console.error('Error creating room:', error);
      toast.error('Failed to create room. Room might already exist.');
      // Even if creation fails, try to join the room
      navigate(`/room/${roomName.trim()}?participant=${encodeURIComponent(participantName.trim())}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!roomName.trim() || !participantName.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    navigate(`/room/${roomName.trim()}?participant=${encodeURIComponent(participantName.trim())}`);
  };

  const loadRooms = async () => {
    try {
      const roomList = await getRooms();
      setRooms(roomList.rooms || []);
      setShowRooms(true);
    } catch (error) {
      console.error('Error loading rooms:', error);
      toast.error('Failed to load rooms');
    }
  };

  const joinExistingRoom = (room) => {
    if (!participantName.trim()) {
      toast.error('Please enter your name first');
      return;
    }
    navigate(`/room/${room.name}?participant=${encodeURIComponent(participantName.trim())}`);
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
                Your Name
              </label>
              <input
                type="text"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Room Name
              </label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Enter room name"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isCreating}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                {isCreating ? 'Creating...' : 'Create Room'}
              </button>

              <button
                type="button"
                onClick={handleJoinRoom}
                disabled={isJoining}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Join Room
              </button>
            </div>
          </form>

          {/* Existing Rooms */}
          <div className="mt-6 pt-6 border-t border-white/20">
            <button
              onClick={loadRooms}
              className="w-full flex items-center justify-center gap-2 text-blue-400 hover:text-blue-300 font-medium py-2 transition-colors"
            >
              <Users className="w-4 h-4" />
              View Active Rooms
            </button>

            {showRooms && (
              <div className="mt-4 space-y-2">
                {rooms.length > 0 ? (
                  rooms.map((room) => (
                    <div
                      key={room.sid}
                      className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/10"
                    >
                      <div>
                        <h3 className="text-white font-medium">{room.name}</h3>
                        <p className="text-gray-400 text-sm">
                          {room.numParticipants} participant{room.numParticipants !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => joinExistingRoom(room)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                      >
                        Join
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-4">No active rooms</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-400 text-sm">
          <p>Powered by LiveKit • Secure video conferencing</p>
        </div>
      </div>
    </div>
  );
};

export default Room;