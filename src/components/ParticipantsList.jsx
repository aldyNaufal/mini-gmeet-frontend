import React, { useState, useEffect } from 'react';
import { Users, Mic, MicOff, Video, VideoOff, UserX, Crown } from 'lucide-react';
import { useRoomContext } from '@livekit/components-react';
import { muteParticipant, unmuteParticipant, kickParticipant } from '../config/api';
import toast from 'react-hot-toast';

const ParticipantsList = ({ isOpen, onClose }) => {
  const room = useRoomContext();
  const [participants, setParticipants] = useState([]);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    if (!room) return;

    const updateParticipants = () => {
      const allParticipants = [
        {
          ...room.localParticipant,
          isLocal: true,
          isHost: true, // Assume first participant is host
        },
        ...Array.from(room.remoteParticipants.values()).map(p => ({
          ...p,
          isLocal: false,
          isHost: false,
        }))
      ];
      setParticipants(allParticipants);
      setIsHost(true); // For demo purposes, assume current user is host
    };

    updateParticipants();
    room.on('participantConnected', updateParticipants);
    room.on('participantDisconnected', updateParticipants);
    room.on('trackMuted', updateParticipants);
    room.on('trackUnmuted', updateParticipants);

    return () => {
      room.off('participantConnected', updateParticipants);
      room.off('participantDisconnected', updateParticipants);
      room.off('trackMuted', updateParticipants);
      room.off('trackUnmuted', updateParticipants);
    };
  }, [room]);

  const handleMuteParticipant = async (participant) => {
    try {
      await muteParticipant(room.name, participant.identity);
      toast.success(`Muted ${participant.name || participant.identity}`);
    } catch (error) {
      toast.error(`Failed to mute participant: ${error.message}`);
    }
  };

  const handleUnmuteParticipant = async (participant) => {
    try {
      await unmuteParticipant(room.name, participant.identity);
      toast.success(`Unmuted ${participant.name || participant.identity}`);
    } catch (error) {
      toast.error(`Failed to unmute participant: ${error.message}`);
    }
  };

  const handleKickParticipant = async (participant) => {
    if (window.confirm(`Are you sure you want to remove ${participant.name || participant.identity} from the meeting?`)) {
      try {
        await kickParticipant(room.name, participant.identity);
        toast.success(`Removed ${participant.name || participant.identity} from meeting`);
      } catch (error) {
        toast.error(`Failed to remove participant: ${error.message}`);
      }
    }
  };

  const getAudioTrack = (participant) => {
    return Array.from(participant.audioTracks.values())[0];
  };

  const getVideoTrack = (participant) => {
    return Array.from(participant.videoTracks.values())[0];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            <h3 className="text-white font-semibold">
              Participants ({participants.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Participants List */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {participants.map((participant) => {
            const audioTrack = getAudioTrack(participant);
            const videoTrack = getVideoTrack(participant);
            const isAudioMuted = !audioTrack || audioTrack.isMuted;
            const isVideoMuted = !videoTrack || videoTrack.isMuted;

            return (
              <div
                key={participant.identity}
                className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {(participant.name || participant.identity).charAt(0).toUpperCase()}
                  </div>

                  {/* Name and Status */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">
                        {participant.name || participant.identity}
                        {participant.isLocal && ' (You)'}
                      </span>
                      {participant.isHost && (
                        <Crown className="w-4 h-4 text-yellow-400" title="Host" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {isAudioMuted ? (
                        <MicOff className="w-4 h-4 text-red-400" />
                      ) : (
                        <Mic className="w-4 h-4 text-green-400" />
                      )}
                      {isVideoMuted ? (
                        <VideoOff className="w-4 h-4 text-red-400" />
                      ) : (
                        <Video className="w-4 h-4 text-green-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Host Controls */}
                {!participant.isLocal && isHost && (
                  <div className="flex items-center gap-1">
                    {/* Mute/Unmute Button */}
                    <button
                      onClick={() => 
                        isAudioMuted 
                          ? handleUnmuteParticipant(participant)
                          : handleMuteParticipant(participant)
                      }
                      className={`p-2 rounded-lg transition-colors ${
                        isAudioMuted
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-red-600 hover:bg-red-700'
                      }`}
                      title={isAudioMuted ? 'Unmute' : 'Mute'}
                    >
                      {isAudioMuted ? (
                        <Mic className="w-4 h-4 text-white" />
                      ) : (
                        <MicOff className="w-4 h-4 text-white" />
                      )}
                    </button>

                    {/* Kick Button */}
                    <button
                      onClick={() => handleKickParticipant(participant)}
                      className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                      title="Remove participant"
                    >
                      <UserX className="w-4 h-4 text-white" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-gray-600">
          <p className="text-gray-400 text-sm text-center">
            {isHost ? 'You are the host of this meeting' : 'Meeting hosted by someone else'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ParticipantsList;