import React, { useState } from 'react';
import { Camera, Users, Copy, CheckCircle, PhoneOff, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { generateRoomLink, copyToClipboard } from '../../utils/helpers.js';
import { COPY_TIMEOUT } from '../../utils/constants.js';

const Header = ({ roomName, participantName, participantCount, onLeaveRoom }) => {
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const handleCopyRoomLink = async () => {
    const roomLink = generateRoomLink(roomName, participantName);
    console.log('Copying room link:', roomLink);
    
    const success = await copyToClipboard(roomLink);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), COPY_TIMEOUT);
    }
  };

  const handleLeaveRoom = async () => {
    await onLeaveRoom();
    // Navigate back to home page after leaving
    navigate('/');
  };

  return (
    <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Back button */}
          <button
            onClick={() => navigate('/')}
            className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors"
            title="Back to home"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 w-10 h-10 rounded-lg flex items-center justify-center">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">{roomName}</h1>
            <p className="text-gray-400 text-sm flex items-center gap-2">
              <Users className="w-4 h-4" />
              {participantCount} participant{participantCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyRoomLink}
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
            onClick={handleLeaveRoom}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <PhoneOff className="w-4 h-4" />
            Leave
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;