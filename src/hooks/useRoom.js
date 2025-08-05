import { useState, useEffect, useRef, useCallback } from 'react';
import { Track } from 'livekit-client';
import { LiveKitService } from '../services/livekit.js';
import { getToken } from '../services/apiService.js';

export const useRoom = () => {
  const [isJoined, setIsJoined] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [participants, setParticipants] = useState(new Map());
  const [error, setError] = useState('');
  const [room, setRoom] = useState(null);

  const livekitService = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRefs = useRef(new Map());

  // Initialize LiveKit service
  useEffect(() => {
    livekitService.current = new LiveKitService();
    
    // Set up callbacks
    livekitService.current.setCallbacks({
      onParticipantConnected: handleParticipantConnected,
      onParticipantDisconnected: handleParticipantDisconnected,
      onVideoTrackSubscribed: handleVideoTrackSubscribed,
      onLocalTrackPublished: handleLocalTrackPublished,
      onConnected: handleConnected,
      onDisconnected: handleDisconnected,
    });

    return () => {
      if (livekitService.current) {
        livekitService.current.disconnect();
      }
    };
  }, []);

  // Handle participant connected
  const handleParticipantConnected = useCallback((participant) => {
    setParticipants(prev => new Map(prev.set(participant.identity, participant)));
  }, []);

  // Handle participant disconnected
  const handleParticipantDisconnected = useCallback((participant) => {
    setParticipants(prev => {
      const newMap = new Map(prev);
      newMap.delete(participant.identity);
      return newMap;
    });
    remoteVideoRefs.current.delete(participant.identity);
  }, []);

  // Handle video track subscribed
  const handleVideoTrackSubscribed = useCallback((element, participant) => {
    const videoRef = remoteVideoRefs.current.get(participant.identity);
    if (videoRef && element) {
      // Clear existing video element
      while (videoRef.firstChild) {
        videoRef.removeChild(videoRef.firstChild);
      }
      videoRef.appendChild(element);
      console.log('Video element attached for participant:', participant.identity);
    } else {
      console.warn('Video ref not found for participant:', participant.identity);
    }
  }, []);

  // Handle local track published
  const handleLocalTrackPublished = useCallback((publication, participant) => {
    if (publication.kind === Track.Kind.Video && localVideoRef.current) {
      const videoTrack = participant.getTrackPublication(Track.Source.Camera)?.track;
      if (videoTrack) {
        const element = videoTrack.attach();
        if (localVideoRef.current.firstChild) {
          localVideoRef.current.removeChild(localVideoRef.current.firstChild);
        }
        localVideoRef.current.appendChild(element);
      }
    }
  }, []);

  // Handle connected
  const handleConnected = useCallback((roomInstance) => {
    setIsJoined(true);
    setRoom(roomInstance);
    
    // Initialize participants map with existing participants
    const existingParticipants = new Map();
    roomInstance.remoteParticipants.forEach((participant, identity) => {
      existingParticipants.set(identity, participant);
    });
    setParticipants(existingParticipants);
  }, []);

  // Handle disconnected
  const handleDisconnected = useCallback(() => {
    setIsJoined(false);
    setRoom(null);
    setParticipants(new Map());
    
    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.innerHTML = '';
    }
    remoteVideoRefs.current.clear();
  }, []);

  // Join room function
  const joinRoom = async (roomName, participantName) => {
    if (!roomName.trim() || !participantName.trim()) {
      setError('Please enter both room name and your name');
      return;
    }

    setIsConnecting(true);
    setError('');

    try {
      // Get token from backend
      const tokenData = await getToken(roomName, participantName);
      console.log('Token received:', tokenData);
      
      // Create and connect to room
      const roomInstance = livekitService.current.createRoom();
      await livekitService.current.connect(tokenData.wsUrl, tokenData.token);

    } catch (error) {
      console.error('Failed to join room:', error);
      setError(error.message || 'Failed to join room. Please check your connection and try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  // Leave room function
  const leaveRoom = async () => {
    await livekitService.current.disconnect();
  };

  return {
    // State
    isJoined,
    isConnecting,
    participants,
    error,
    room,
    
    // Refs
    localVideoRef,
    remoteVideoRefs,
    
    // Actions
    joinRoom,
    leaveRoom,
    
    // Service reference
    livekitService: livekitService.current
  };
};