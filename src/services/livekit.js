// services/livekitService.js
import { 
  Room,  
  createLocalVideoTrack, 
  createLocalAudioTrack,
  RemoteParticipant,
  LocalParticipant,
  Track,
  ConnectionState,
  ParticipantEvent,
  RoomEvent
} from 'livekit-client';

class LiveKitService {
  constructor() {
    this.room = null;
    this.localVideoTrack = null;
    this.localAudioTrack = null;
    this.isConnected = false;
    this.participants = new Map();
    this.eventCallbacks = new Map();
  }

  // Connect to LiveKit room
  async connect(wsUrl, token) {
    try {
      this.room = new Room({
        // Audio and video settings
        adaptiveStream: true,
        dynacast: true,
        publishDefaults: {
          videoSimulcastLayers: [
            { resolution: { width: 640, height: 360 }, encoding: { maxBitrate: 200000 } },
            { resolution: { width: 320, height: 180 }, encoding: { maxBitrate: 100000 } }
          ]
        }
      });

      // Setup event listeners
      this.setupEventListeners();

      // Connect to room
      await this.room.connect(wsUrl, token);
      this.isConnected = true;

      console.log('Connected to LiveKit room:', this.room.name);
      return this.room;
    } catch (error) {
      console.error('Failed to connect to LiveKit room:', error);
      throw error;
    }
  }

  // Setup event listeners
  setupEventListeners() {
    if (!this.room) return;

    // Room events
    this.room.on(RoomEvent.Connected, () => {
      console.log('Connected to room');
      this.triggerCallback('connected');
    });

    this.room.on(RoomEvent.Disconnected, () => {
      console.log('Disconnected from room');
      this.isConnected = false;
      this.triggerCallback('disconnected');
    });

    this.room.on(RoomEvent.ParticipantConnected, (participant) => {
      console.log('Participant connected:', participant.identity);
      this.participants.set(participant.identity, participant);
      this.triggerCallback('participantConnected', participant);
    });

    this.room.on(RoomEvent.ParticipantDisconnected, (participant) => {
      console.log('Participant disconnected:', participant.identity);
      this.participants.delete(participant.identity);
      this.triggerCallback('participantDisconnected', participant);
    });

    this.room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      console.log('Track subscribed:', track.kind, participant.identity);
      this.triggerCallback('trackSubscribed', { track, publication, participant });
    });

    this.room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
      console.log('Track unsubscribed:', track.kind, participant.identity);
      this.triggerCallback('trackUnsubscribed', { track, publication, participant });
    });

    this.room.on(RoomEvent.TrackMuted, (publication, participant) => {
      console.log('Track muted:', publication.trackSid, participant.identity);
      this.triggerCallback('trackMuted', { publication, participant });
    });

    this.room.on(RoomEvent.TrackUnmuted, (publication, participant) => {
      console.log('Track unmuted:', publication.trackSid, participant.identity);
      this.triggerCallback('trackUnmuted', { publication, participant });
    });

    // Local participant events
    this.room.on(RoomEvent.LocalTrackPublished, (publication, participant) => {
      console.log('Local track published:', publication.trackSid);
      this.triggerCallback('localTrackPublished', { publication, participant });
    });

    this.room.on(RoomEvent.LocalTrackUnpublished, (publication, participant) => {
      console.log('Local track unpublished:', publication.trackSid);
      this.triggerCallback('localTrackUnpublished', { publication, participant });
    });

    // Data messages
    this.room.on(RoomEvent.DataReceived, (payload, participant) => {
      console.log('Data received from:', participant.identity);
      this.triggerCallback('dataReceived', { payload, participant });
    });
  }

  // Create and publish local video track
  async enableVideo() {
    try {
      if (this.localVideoTrack) {
        await this.room.localParticipant.publishTrack(this.localVideoTrack);
        return this.localVideoTrack;
      }

      this.localVideoTrack = await createLocalVideoTrack({
        resolution: { width: 1280, height: 720 },
        facingMode: 'user'
      });

      await this.room.localParticipant.publishTrack(this.localVideoTrack);
      console.log('Video track published');
      return this.localVideoTrack;
    } catch (error) {
      console.error('Failed to enable video:', error);
      throw error;
    }
  }

  // Disable video
  async disableVideo() {
    try {
      if (this.localVideoTrack) {
        await this.room.localParticipant.unpublishTrack(this.localVideoTrack);
        this.localVideoTrack.stop();
        this.localVideoTrack = null;
        console.log('Video track unpublished');
      }
    } catch (error) {
      console.error('Failed to disable video:', error);
      throw error;
    }
  }

  // Create and publish local audio track
  async enableAudio() {
    try {
      if (this.localAudioTrack) {
        await this.room.localParticipant.publishTrack(this.localAudioTrack);
        return this.localAudioTrack;
      }

      this.localAudioTrack = await createLocalAudioTrack({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      });

      await this.room.localParticipant.publishTrack(this.localAudioTrack);
      console.log('Audio track published');
      return this.localAudioTrack;
    } catch (error) {
      console.error('Failed to enable audio:', error);
      throw error;
    }
  }

  // Disable audio
  async disableAudio() {
    try {
      if (this.localAudioTrack) {
        await this.room.localParticipant.unpublishTrack(this.localAudioTrack);
        this.localAudioTrack.stop();
        this.localAudioTrack = null;
        console.log('Audio track unpublished');
      }
    } catch (error) {
      console.error('Failed to disable audio:', error);
      throw error;
    }
  }

  // Toggle video mute/unmute
  async toggleVideo() {
    try {
      if (this.localVideoTrack) {
        await this.disableVideo();
        return false;
      } else {
        await this.enableVideo();
        return true;
      }
    } catch (error) {
      console.error('Failed to toggle video:', error);
      throw error;
    }
  }

  // Toggle audio mute/unmute
  async toggleAudio() {
    try {
      if (this.localAudioTrack) {
        await this.disableAudio();
        return false;
      } else {
        await this.enableAudio();
        return true;
      }
    } catch (error) {
      console.error('Failed to toggle audio:', error);
      throw error;
    }
  }

  // Send data message to all participants
  async sendDataMessage(message, reliable = true) {
    try {
      if (!this.room || !this.isConnected) {
        throw new Error('Not connected to room');
      }

      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify(message));
      
      await this.room.localParticipant.publishData(data, { reliable });
      console.log('Data message sent:', message);
    } catch (error) {
      console.error('Failed to send data message:', error);
      throw error;
    }
  }

  // Get all participants
  getParticipants() {
    if (!this.room) return [];

    const participants = [];
    
    // Add local participant
    participants.push({
      identity: this.room.localParticipant.identity,
      name: this.room.localParticipant.name || this.room.localParticipant.identity,
      isLocal: true,
      audioEnabled: this.room.localParticipant.isMicrophoneEnabled,
      videoEnabled: this.room.localParticipant.isCameraEnabled,
      connectionQuality: this.room.localParticipant.connectionQuality
    });

    // Add remote participants
    this.room.remoteParticipants.forEach((participant) => {
      participants.push({
        identity: participant.identity,
        name: participant.name || participant.identity,
        isLocal: false,
        audioEnabled: participant.isMicrophoneEnabled,
        videoEnabled: participant.isCameraEnabled,
        connectionQuality: participant.connectionQuality
      });
    });

    return participants;
  }

  // Get video track for participant
  getVideoTrack(participantIdentity) {
    if (!this.room) return null;

    if (participantIdentity === this.room.localParticipant.identity) {
      return this.localVideoTrack;
    }

    const participant = this.room.remoteParticipants.get(participantIdentity);
    if (!participant) return null;

    const videoPublication = participant.getTrackPublication(Track.Source.Camera);
    return videoPublication?.track || null;
  }

  // Get audio track for participant  
  getAudioTrack(participantIdentity) {
    if (!this.room) return null;

    if (participantIdentity === this.room.localParticipant.identity) {
      return this.localAudioTrack;
    }

    const participant = this.room.remoteParticipants.get(participantIdentity);
    if (!participant) return null;

    const audioPublication = participant.getTrackPublication(Track.Source.Microphone);
    return audioPublication?.track || null;
  }

  // Event callback management
  on(event, callback) {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, []);
    }
    this.eventCallbacks.get(event).push(callback);
  }

  off(event, callback) {
    if (!this.eventCallbacks.has(event)) return;
    
    const callbacks = this.eventCallbacks.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  triggerCallback(event, data) {
    if (!this.eventCallbacks.has(event)) return;
    
    this.eventCallbacks.get(event).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in event callback:', error);
      }
    });
  }

  // Disconnect from room
  async disconnect() {
    try {
      if (this.localVideoTrack) {
        this.localVideoTrack.stop();
        this.localVideoTrack = null;
      }

      if (this.localAudioTrack) {
        this.localAudioTrack.stop();
        this.localAudioTrack = null;
      }

      if (this.room) {
        await this.room.disconnect();
        this.room = null;
      }

      this.isConnected = false;
      this.participants.clear();
      this.eventCallbacks.clear();
      
      console.log('Disconnected from LiveKit room');
    } catch (error) {
      console.error('Error disconnecting from room:', error);
      throw error;
    }
  }

  // Get room info
  getRoomInfo() {
    if (!this.room) return null;

    return {
      name: this.room.name,
      sid: this.room.sid,
      metadata: this.room.metadata,
      numParticipants: this.room.numParticipants,
      connectionState: this.room.state
    };
  }
}

// Create singleton instance
const livekitService = new LiveKitService();
export default livekitService;