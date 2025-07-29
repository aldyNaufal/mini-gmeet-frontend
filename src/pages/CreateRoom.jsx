// src/App.jsx
import React, { useState } from 'react';
import VideoConference from './MeetingRoom';
import VideoRoom from '../components/JoinMeet';

function Room() {
  const [currentView, setCurrentView] = useState('lobby'); // 'lobby' or 'room'
  const [currentRoom, setCurrentRoom] = useState(null);
  const [participantName, setParticipantName] = useState('');

  const joinRoom = (roomName, userName) => {
    setCurrentRoom(roomName);
    setParticipantName(userName);
    setCurrentView('room');
  };

  const leaveRoom = () => {
    setCurrentRoom(null);
    setParticipantName('');
    setCurrentView('lobby');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {currentView === 'lobby' ? (
        <VideoConference onJoinRoom={joinRoom} />
      ) : (
        <VideoRoom
          roomName={currentRoom}
          participantName={participantName}
          onLeave={leaveRoom}
        />
      )}
    </div>
  );
}

export default Room;