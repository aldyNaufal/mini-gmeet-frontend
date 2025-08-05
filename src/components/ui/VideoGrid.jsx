import React from 'react';
import { Track } from 'livekit-client';
import ParticipantVideo from './ParticipantVideo.jsx';

const VideoGrid = ({ 
  participants, 
  participantName, 
  localVideoRef, 
  remoteVideoRefs, 
  isAudioEnabled 
}) => {
  
  // Create video ref callback for remote participants
  const createVideoRefCallback = (participant) => (el) => {
    if (el && participant) {
      remoteVideoRefs.current.set(participant.identity, el);
      
      // If participant already has video track, attach it immediately
      const videoPublication = participant.getTrackPublication(Track.Source.Camera);
      if (videoPublication && videoPublication.isSubscribed && videoPublication.track) {
        const element = videoPublication.track.attach();
        if (el.firstChild) {
          el.removeChild(el.firstChild);
        }
        el.appendChild(element);
        console.log('Immediately attached video for:', participant.identity);
      }
    }
  };

  return (
    <div className="flex-1 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 h-full">
        {/* Local participant (always first) */}
        <ParticipantVideo
          isLocal={true}
          participantName={participantName}
          videoRef={localVideoRef}
          isAudioEnabled={isAudioEnabled}
        />
        
        {/* Remote participants */}
        {Array.from(participants.values()).map((participant) => (
          <ParticipantVideo
            key={participant.identity}
            participant={participant}
            videoRef={createVideoRefCallback(participant)}
            isLocal={false}
          />
        ))}
      </div>
    </div>
  );
};

export default VideoGrid;