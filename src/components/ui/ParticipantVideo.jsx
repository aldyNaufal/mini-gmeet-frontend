import React from 'react';
import { Track } from 'livekit-client';
import { Camera, CameraOff, MicOff } from 'lucide-react';

const ParticipantVideo = ({ 
  participant, 
  participantName, 
  isLocal = false, 
  videoRef,
  isAudioEnabled = true 
}) => {
  const identity = isLocal ? 'local' : participant?.identity;
  const name = isLocal ? participantName : (participant?.name || participant?.identity);

  return (
    <div key={identity} className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video group">
      <div
        ref={videoRef}
        className="w-full h-full bg-gray-700 flex items-center justify-center"
      >
        {/* Fallback avatar when video is disabled */}
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center">
          <span className="text-white font-semibold text-xl">
            {name?.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>
      
      {/* Participant name */}
      <div className="absolute bottom-4 left-4 bg-black/70 px-3 py-1 rounded-lg backdrop-blur-sm">
        <span className="text-white text-sm font-medium">
          {isLocal ? 'You' : name}
        </span>
      </div>
      
      {/* Audio indicator for local participant */}
      {isLocal && !isAudioEnabled && (
        <div className="absolute top-4 right-4 bg-red-500 p-2 rounded-lg">
          <MicOff className="w-4 h-4 text-white" />
        </div>
      )}
      
      {/* Video status indicator for remote participants */}
      {!isLocal && participant && (
        <div className="absolute top-4 right-4">
          {participant.getTrackPublication(Track.Source.Camera)?.isSubscribed ? (
            <div className="bg-green-500 p-1 rounded">
              <Camera className="w-3 h-3 text-white" />
            </div>
          ) : (
            <div className="bg-gray-500 p-1 rounded">
              <CameraOff className="w-3 h-3 text-white" />
            </div>
          )}
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

export default ParticipantVideo;