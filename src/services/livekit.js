// src/services/api.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class LiveKitAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Token Management
  async generateToken(roomName, participantName, metadata = null, maxParticipants = 100) {
    return this.request('/api/livekit/token', {
      method: 'POST',
      body: {
        roomName,
        participantName,
        metadata,
        maxParticipants,
      },
    });
  }

  // Room Management
  async createRoom(roomName, maxParticipants = 50, metadata = null) {
    return this.request('/api/livekit/room', {
      method: 'POST',
      body: {
        roomName,
        maxParticipants,
        metadata,
      },
    });
  }

  async listRooms() {
    return this.request('/api/livekit/rooms');
  }

  async getRoomInfo(roomName) {
    return this.request(`/api/livekit/room/${encodeURIComponent(roomName)}`);
  }

  async deleteRoom(roomName) {
    return this.request(`/api/livekit/room/${encodeURIComponent(roomName)}`, {
      method: 'DELETE',
    });
  }

  // Participant Management
  async getRoomParticipants(roomName) {
    return this.request(`/api/livekit/room/${encodeURIComponent(roomName)}/participants`);
  }

  async muteParticipant(roomName, participantIdentity) {
    return this.request(`/api/livekit/room/${encodeURIComponent(roomName)}/mute/${encodeURIComponent(participantIdentity)}`, {
      method: 'POST',
    });
  }

  async unmuteParticipant(roomName, participantIdentity) {
    return this.request(`/api/livekit/room/${encodeURIComponent(roomName)}/unmute/${encodeURIComponent(participantIdentity)}`, {
      method: 'POST',
    });
  }

  async kickParticipant(roomName, participantIdentity) {
    return this.request(`/api/livekit/room/${encodeURIComponent(roomName)}/kick/${encodeURIComponent(participantIdentity)}`, {
      method: 'POST',
    });
  }

  // Health Check
  async healthCheck() {
    return this.request('/health');
  }
}

export const liveKitAPI = new LiveKitAPI();
export default liveKitAPI;