import React from 'react';
import Header from '../components/ui/Header.jsx';
import VideoGrid from '../components/ui/VideoGrid.jsx';
import ControlsBar from '../components/controls/ControlsBar.jsx';

const VideoConference = ({
  roomName,
  participantName,
  participants,
  localVideoRef,
  remoteVideoRefs,
  isAudioEnabled,
  isVideoEnabled,
  isScreenSharing,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onLeaveRoom
}) => {
  const participantCount = participants.size + 1; // +1 for local participant

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header 
        roomName={roomName}
        participantName={participantName}
        participantCount={participantCount}
        onLeaveRoom={onLeaveRoom}
      />

      <VideoGrid 
        participants={participants}
        participantName={participantName}
        localVideoRef={localVideoRef}
        remoteVideoRefs={remoteVideoRefs}
        isAudioEnabled={isAudioEnabled}
      />

      <ControlsBar 
        isAudioEnabled={isAudioEnabled}
        isVideoEnabled={isVideoEnabled}
        isScreenSharing={isScreenSharing}
        onToggleAudio={onToggleAudio}
        onToggleVideo={onToggleVideo}
        onToggleScreenShare={onToggleScreenShare}
        onLeaveRoom={onLeaveRoom}
      />
    </div>
  );
};

export default VideoConference;