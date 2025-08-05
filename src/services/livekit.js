import { Room, RoomEvent, Track } from 'livekit-client';
import { ROOM_CONFIG, VIDEO_ATTACH_DELAY } from '../utils/constants.js';

export class LiveKitService {
  constructor() {
    this.room = null;
    this.callbacks = {};
  }

  // Set up event callbacks
  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  // Create and configure room
  createRoom() {
    const room = new Room(ROOM_CONFIG);
    
    // Set up event listeners
    room.on(RoomEvent.ParticipantConnected, this.handleParticipantConnected.bind(this));
    room.on(RoomEvent.ParticipantDisconnected, this.handleParticipantDisconnected.bind(this));
    room.on(RoomEvent.TrackSubscribed, this.handleTrackSubscribed.bind(this));
    room.on(RoomEvent.TrackUnsubscribed, this.handleTrackUnsubscribed.bind(this));
    room.on(RoomEvent.LocalTrackPublished, this.handleLocalTrackPublished.bind(this));
    room.on(RoomEvent.Connected, this.handleConnected.bind(this));
    room.on(RoomEvent.Disconnected, this.handleDisconnected.bind(this));

    this.room = room;
    return room;
  }

  // Connect to room
  async connect(wsUrl, token) {
    if (!this.room) {
      throw new Error('Room not created. Call createRoom() first.');
    }

    await this.room.connect(wsUrl, token);
    await this.room.localParticipant.enableCameraAndMicrophone();
  }

  // Disconnect from room
  async disconnect() {
    if (this.room) {
      await this.room.disconnect();
      this.room = null;
    }
  }

  // Event handlers
  handleParticipantConnected(participant) {
    console.log('Participant connected:', participant.identity);
    
    if (this.callbacks.onParticipantConnected) {
      this.callbacks.onParticipantConnected(participant);
    }
    
    // Subscribe to existing published tracks when participant connects
    participant.trackPublications.forEach((publication) => {
      if (publication.isSubscribed && publication.track) {
        this.handleTrackSubscribed(publication.track, publication, participant);
      }
    });
  }

  handleParticipantDisconnected(participant) {
    console.log('Participant disconnected:', participant.identity);
    
    if (this.callbacks.onParticipantDisconnected) {
      this.callbacks.onParticipantDisconnected(participant);
    }
  }

  handleTrackSubscribed(track, publication, participant) {
    console.log('Track subscribed:', track.kind, participant.identity);
    
    if (track.kind === Track.Kind.Video || track.kind === Track.Kind.Audio) {
      const element = track.attach();
      
      if (track.kind === Track.Kind.Video) {
        // Delay to ensure video ref is available
        setTimeout(() => {
          if (this.callbacks.onVideoTrackSubscribed) {
            this.callbacks.onVideoTrackSubscribed(element, participant);
          }
        }, VIDEO_ATTACH_DELAY);
      }
      
      if (track.kind === Track.Kind.Audio) {
        element.play().catch(e => console.warn('Audio play failed:', e));
      }
    }
  }

  handleTrackUnsubscribed(track, publication, participant) {
    console.log('Track unsubscribed:', track.kind, participant.identity);
    track.detach();
  }

  handleLocalTrackPublished(publication, participant) {
    console.log('Local track published:', publication.kind);
    
    if (this.callbacks.onLocalTrackPublished) {
      this.callbacks.onLocalTrackPublished(publication, participant);
    }
  }

  handleConnected() {
    console.log('Connected to room');
    
    if (this.callbacks.onConnected) {
      this.callbacks.onConnected(this.room);
    }
  }

  handleDisconnected() {
    console.log('Disconnected from room');
    
    if (this.callbacks.onDisconnected) {
      this.callbacks.onDisconnected();
    }
  }

  // Media controls
  async toggleMicrophone(enabled) {
    if (this.room?.localParticipant) {
      await this.room.localParticipant.setMicrophoneEnabled(enabled);
    }
  }

  async toggleCamera(enabled) {
    if (this.room?.localParticipant) {
      await this.room.localParticipant.setCameraEnabled(enabled);
    }
  }

  async toggleScreenShare(enabled) {
    if (this.room?.localParticipant) {
      await this.room.localParticipant.setScreenShareEnabled(enabled);
    }
  }

  // Get current room instance
  getRoom() {
    return this.room;
  }
}