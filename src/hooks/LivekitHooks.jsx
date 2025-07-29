// hooks/useLiveKit.js
import { useState, useEffect, useCallback, useRef } from 'react';
import livekitService from '../services/livekitService';

// Hook for managing LiveKit room connection
export const useLiveKit = (wsUrl, token) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [room, setRoom] = useState(null);

  const connect = useCallback(async () => {
    if (isConnecting || isConnected) return;

    setIsConnecting(true);
    setError(null);

    try {
      const roomInstance = await livekitService.connect(wsUrl, token);
      setRoom(roomInstance);
      setIsConnected(true);
    } catch (err) {
      setError(err.message);
      console.error('Failed to connect to room:', err);
    } finally {
      setIsConnecting(false);
    }
  }, [wsUrl, token, isConnecting, isConnected]);

  const disconnect = useCallback(async () => {
    try {
      await livekitService.disconnect();
      setRoom(null);
      setIsConnected(false);
      setError(null);
    } catch (err) {
      console.error('Error disconnecting from room:', err);
    }
  }, []);

  useEffect(() => {
    if (wsUrl && token && !isConnected && !isConnecting) {
      connect();
    }

    return () => {
      if (isConnected) {
        disconnect();
      }
    };
  }, [wsUrl, token, connect, disconnect, isConnected, isConnecting]);

  return {
    room,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect
  };
};

// Hook for managing participants
export const useLiveKitParticipants = () => {
  const [participants, setParticipants] = useState([]);
  const [localParticipant, setLocalParticipant] = useState(null);

  const updateParticipants = useCallback(() => {
    const currentParticipants = livekitService.getParticipants();
    setParticipants(currentParticipants);
    
    const local = currentParticipants.find(p => p.isLocal);
    setLocalParticipant(local);
  }, []);

  useEffect(() => {
    // Initial load
    updateParticipants();

    // Set up event listeners
    const handleParticipantConnected = () => updateParticipants();
    const handleParticipantDisconnected = () => updateParticipants();
    const handleTrackMuted = () => updateParticipants();
    const handleTrackUnmuted = () => updateParticipants();

    livekitService.on('participantConnected', handleParticipantConnected);
    livekitService.on('participantDisconnected', handleParticipantDisconnected);
    livekitService.on('trackMuted', handleTrackMuted);
    livekitService.on('trackUnmuted', handleTrackUnmuted);

    return () => {
      livekitService.off('participantConnected', handleParticipantConnected);
      livekitService.off('participantDisconnected', handleParticipantDisconnected);
      livekitService.off('trackMuted', handleTrackMuted);
      livekitService.off('trackUnmuted', handleTrackUnmuted);
    };
  }, [updateParticipants]);

  return {
    participants,
    localParticipant,
    updateParticipants
  };
};

// Hook for managing media tracks
export const useLiveKitTracks = (participantIdentity) => {
  const [videoTrack, setVideoTrack] = useState(null);
  const [audioTrack, setAudioTrack] = useState(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);

  const updateTracks = useCallback(() => {
    const video = livekitService.getVideoTrack(participantIdentity);
    const audio = livekitService.getAudioTrack(participantIdentity);
    
    setVideoTrack(video);
    setAudioTrack(audio);
    setIsVideoEnabled(video && !video.isMuted);
    setIsAudioEnabled(audio && !audio.isMuted);
  }, [participantIdentity]);

  useEffect(() => {
    updateTracks();

    const handleTrackSubscribed = ({ participant }) => {
      if (participant.identity === participantIdentity) {
        updateTracks();
      }
    };

    const handleTrackUnsubscribed = ({ participant }) => {
      if (participant.identity === participantIdentity) {
        updateTracks();
      }
    };

    const handleTrackMuted = ({ participant }) => {
      if (participant.identity === participantIdentity) {
        updateTracks();
      }
    };

    const handleTrackUnmuted = ({ participant }) => {
      if (participant.identity === participantIdentity) {
        updateTracks();
      }
    };

    livekitService.on('trackSubscribed', handleTrackSubscribed);
    livekitService.on('trackUnsubscribed', handleTrackUnsubscribed);
    livekitService.on('trackMuted', handleTrackMuted);
    livekitService.on('trackUnmuted', handleTrackUnmuted);

    return () => {
      livekitService.off('trackSubscribed', handleTrackSubscribed);
      livekitService.off('trackUnsubscribed', handleTrackUnsubscribed);
      livekitService.off('trackMuted', handleTrackMuted);
      livekitService.off('trackUnmuted', handleTrackUnmuted);
    };
  }, [participantIdentity, updateTracks]);

  return {
    videoTrack,
    audioTrack,
    isVideoEnabled,
    isAudioEnabled,
    updateTracks
  };
};

// Hook for managing local media controls
export const useLiveKitLocalMedia = () => {
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isToggling, setIsToggling] = useState({ video: false, audio: false });

  const toggleVideo = useCallback(async () => {
    if (isToggling.video) return;

    setIsToggling(prev => ({ ...prev, video: true }));
    try {
      const enabled = await livekitService.toggleVideo();
      setIsVideoEnabled(enabled);
    } catch (error) {
      console.error('Failed to toggle video:', error);
    } finally {
      setIsToggling(prev => ({ ...prev, video: false }));
    }
  }, [isToggling.video]);

  const toggleAudio = useCallback(async () => {
    if (isToggling.audio) return;

    setIsToggling(prev => ({ ...prev, audio: true }));
    try {
      const enabled = await livekitService.toggleAudio();
      setIsAudioEnabled(enabled);
    } catch (error) {
      console.error('Failed to toggle audio:', error);
    } finally {
      setIsToggling(prev => ({ ...prev, audio: false }));
    }
  }, [isToggling.audio]);

  const enableVideo = useCallback(async () => {
    try {
      await livekitService.enableVideo();
      setIsVideoEnabled(true);
    } catch (error) {
      console.error('Failed to enable video:', error);
    }
  }, []);

  const disableVideo = useCallback(async () => {
    try {
      await livekitService.disableVideo();
      setIsVideoEnabled(false);
    } catch (error) {
      console.error('Failed to disable video:', error);
    }
  }, []);

  const enableAudio = useCallback(async () => {
    try {
      await livekitService.enableAudio();
      setIsAudioEnabled(true);
    } catch (error) {
      console.error('Failed to enable audio:', error);
    }
  }, []);

  const disableAudio = useCallback(async () => {
    try {
      await livekitService.disableAudio();
      setIsAudioEnabled(false);
    } catch (error) {
      console.error('Failed to disable audio:', error);
    }
  }, []);

  return {
    isVideoEnabled,
    isAudioEnabled,
    isToggling,
    toggleVideo,
    toggleAudio,
    enableVideo,
    disableVideo,
    enableAudio,
    disableAudio
  };
};

// Hook for managing chat messages
export const useLiveKitChat = () => {
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const addMessage = useCallback((message) => {
    const newMessage = {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      ...message
    };
    
    setMessages(prev => [...prev, newMessage]);
    setUnreadCount(prev => prev + 1);
  }, []);

  const sendMessage = useCallback(async (messageText, sender) => {
    try {
      const message = {
        type: 'chat',
        message: messageText,
        sender: sender,
        timestamp: Date.now()
      };

      await livekitService.sendDataMessage(message);
      
      // Add to local messages
      addMessage({
        ...message,
        sender: 'You',
        isLocal: true
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }, [addMessage]);

  const clearUnreadCount = useCallback(() => {
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    const handleDataReceived = ({ payload, participant }) => {
      try {
        const decoder = new TextDecoder();
        const data = JSON.parse(decoder.decode(payload));
        
        if (data.type === 'chat') {
          addMessage({
            ...data,
            sender: participant.name || participant.identity,
            isLocal: false
          });
        }
      } catch (error) {
        console.error('Error parsing chat message:', error);
      }
    };

    livekitService.on('dataReceived', handleDataReceived);

    return () => {
      livekitService.off('dataReceived', handleDataReceived);
    };
  }, [addMessage]);

  return {
    messages,
    unreadCount,
    sendMessage,
    clearUnreadCount,
    addMessage
  };
};

// Hook for managing screen sharing
export const useLiveKitScreenShare = () => {
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenShareTrack, setScreenShareTrack] = useState(null);
  const [error, setError] = useState(null);

  const startScreenShare = useCallback(async () => {
    try {
      setError(null);
      
      // Get screen share stream
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          mediaSource: 'screen',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 15 }
        },
        audio: true
      });

      const videoTrack = stream.getVideoTracks()[0];
      
      // Handle screen share end
      videoTrack.onended = () => {
        stopScreenShare();
      };

      // Publish screen share track (you'll need to implement this in livekitService)
      // await livekitService.publishScreenShare(stream);
      
      setScreenShareTrack(videoTrack);
      setIsScreenSharing(true);
      
    } catch (error) {
      console.error('Failed to start screen share:', error);
      setError(error.message);
    }
  }, []);

  const stopScreenShare = useCallback(async () => {
    try {
      if (screenShareTrack) {
        screenShareTrack.stop();
        setScreenShareTrack(null);
      }

      // Unpublish screen share track
      // await livekitService.unpublishScreenShare();
      
      setIsScreenSharing(false);
      setError(null);
    } catch (error) {
      console.error('Failed to stop screen share:', error);
      setError(error.message);
    }
  }, [screenShareTrack]);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      await stopScreenShare();
    } else {
      await startScreenShare();
    }
  }, [isScreenSharing, startScreenShare, stopScreenShare]);

  return {
    isScreenSharing,
    screenShareTrack,
    error,
    startScreenShare,
    stopScreenShare,
    toggleScreenShare
  };
};

// Hook for managing connection quality
export const useLiveKitConnectionQuality = (participantIdentity) => {
  const [connectionQuality, setConnectionQuality] = useState('unknown');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const updateConnectionQuality = () => {
      const participants = livekitService.getParticipants();
      const participant = participants.find(p => p.identity === participantIdentity);
      
      if (participant) {
        setConnectionQuality(participant.connectionQuality || 'unknown');
      }
    };

    // Update initially
    updateConnectionQuality();

    // Set up interval to check connection quality
    const interval = setInterval(updateConnectionQuality, 2000);

    // Listen for connection quality changes
    const handleConnectionQualityChanged = ({ participant, quality }) => {
      if (participant.identity === participantIdentity) {
        setConnectionQuality(quality);
      }
    };

    livekitService.on('connectionQualityChanged', handleConnectionQualityChanged);

    return () => {
      clearInterval(interval);
      livekitService.off('connectionQualityChanged', handleConnectionQualityChanged);
    };
  }, [participantIdentity]);

  return {
    connectionQuality,
    stats
  };
};

// Hook for managing room metadata and info
export const useLiveKitRoom = () => {
  const [roomInfo, setRoomInfo] = useState(null);
  const [metadata, setMetadata] = useState(null);

  useEffect(() => {
    const updateRoomInfo = () => {
      const info = livekitService.getRoomInfo();
      setRoomInfo(info);
      
      if (info?.metadata) {
        try {
          setMetadata(JSON.parse(info.metadata));
        } catch (error) {
          setMetadata(info.metadata);
        }
      }
    };

    updateRoomInfo();

    // Listen for room updates
    const handleRoomUpdated = () => {
      updateRoomInfo();
    };

    livekitService.on('roomMetadataChanged', handleRoomUpdated);

    return () => {
      livekitService.off('roomMetadataChanged', handleRoomUpdated);
    };
  }, []);

  return {
    roomInfo,
    metadata
  };
};

// Hook for device management
export const useMediaDevices = () => {
  const [devices, setDevices] = useState({
    cameras: [],
    microphones: [],
    speakers: []
  });
  const [selectedDevices, setSelectedDevices] = useState({
    camera: null,
    microphone: null,
    speaker: null
  });
  const [permissions, setPermissions] = useState({
    camera: 'prompt',
    microphone: 'prompt'
  });

  const getDevices = useCallback(async () => {
    try {
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      
      const cameras = deviceList.filter(device => device.kind === 'videoinput');
      const microphones = deviceList.filter(device => device.kind === 'audioinput');
      const speakers = deviceList.filter(device => device.kind === 'audiooutput');
      
      setDevices({ cameras, microphones, speakers });
      
      // Set default devices if none selected
      if (!selectedDevices.camera && cameras.length > 0) {
        setSelectedDevices(prev => ({ ...prev, camera: cameras[0].deviceId }));
      }
      if (!selectedDevices.microphone && microphones.length > 0) {
        setSelectedDevices(prev => ({ ...prev, microphone: microphones[0].deviceId }));
      }
      if (!selectedDevices.speaker && speakers.length > 0) {
        setSelectedDevices(prev => ({ ...prev, speaker: speakers[0].deviceId }));
      }
      
    } catch (error) {
      console.error('Failed to get media devices:', error);
    }
  }, [selectedDevices]);

  const checkPermissions = useCallback(async () => {
    try {
      const cameraPermission = await navigator.permissions.query({ name: 'camera' });
      const microphonePermission = await navigator.permissions.query({ name: 'microphone' });
      
      setPermissions({
        camera: cameraPermission.state,
        microphone: microphonePermission.state
      });
    } catch (error) {
      console.error('Failed to check permissions:', error);
    }
  }, []);

  const requestPermissions = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      setPermissions({
        camera: 'granted',
        microphone: 'granted'
      });
      
      // Refresh device list after getting permissions
      await getDevices();
    } catch (error) {
      console.error('Permission denied:', error);
      setPermissions({
        camera: 'denied',
        microphone: 'denied'
      });
    }
  }, [getDevices]);

  const switchCamera = useCallback(async (deviceId) => {
    try {
      setSelectedDevices(prev => ({ ...prev, camera: deviceId }));
      // Implement camera switching in livekitService
      // await livekitService.switchCamera(deviceId);
    } catch (error) {
      console.error('Failed to switch camera:', error);
    }
  }, []);

  const switchMicrophone = useCallback(async (deviceId) => {
    try {
      setSelectedDevices(prev => ({ ...prev, microphone: deviceId }));
      // Implement microphone switching in livekitService  
      // await livekitService.switchMicrophone(deviceId);
    } catch (error) {
      console.error('Failed to switch microphone:', error);
    }
  }, []);

  useEffect(() => {
    getDevices();
    checkPermissions();

    // Listen for device changes
    navigator.mediaDevices.addEventListener('devicechange', getDevices);

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', getDevices);
    };
  }, [getDevices, checkPermissions]);

  return {
    devices,
    selectedDevices,
    permissions,
    getDevices,
    requestPermissions,
    switchCamera,
    switchMicrophone
  };
};