import axios from 'axios';

// Configure the base URL for your backend API
// This will automatically use the production URL when deployed
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD 
    ? 'https://mini-gmeet-backend-production.up.railway.app/api/livekit'  // Replace with your actual Railway URL
    : 'http://localhost:8000/api/livekit'
  );

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout for production
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    
    // Handle network errors in production
    if (!error.response) {
      console.error('Network Error - Backend might be down');
    }
    
    return Promise.reject(error);
  }
);

// API functions

/**
 * Generate access token for joining a room
 */
export const generateToken = async ({ roomName, participantName, metadata = null }) => {
  try {
    const response = await api.post('/token', {
      roomName,
      participantName,
      metadata
    });
    return response.data;
  } catch (error) {
    console.error('Token generation failed:', error);
    throw new Error(error.response?.data?.detail || 'Failed to generate token');
  }
};

/**
 * Create a new room
 */
export const createRoom = async ({ roomName, maxParticipants = 50, metadata = null }) => {
  try {
    const response = await api.post('/room', {
      roomName,
      maxParticipants,
      metadata
    });
    return response.data;
  } catch (error) {
    console.error('Room creation failed:', error);
    throw new Error(error.response?.data?.detail || 'Failed to create room');
  }
};

/**
 * Get list of all rooms
 */
export const getRooms = async () => {
  try {
    const response = await api.get('/rooms');
    return response.data;
  } catch (error) {
    console.error('Get rooms failed:', error);
    throw new Error(error.response?.data?.detail || 'Failed to get rooms');
  }
};

/**
 * Get room information
 */
export const getRoomInfo = async (roomName) => {
  try {
    const response = await api.get(`/room/${roomName}`);
    return response.data;
  } catch (error) {
    console.error('Get room info failed:', error);
    throw new Error(error.response?.data?.detail || 'Failed to get room info');
  }
};

/**
 * Delete a room
 */
export const deleteRoom = async (roomName) => {
  try {
    const response = await api.delete(`/room/${roomName}`);
    return response.data;
  } catch (error) {
    console.error('Delete room failed:', error);
    throw new Error(error.response?.data?.detail || 'Failed to delete room');
  }
};

/**
 * Get participants in a room
 */
export const getRoomParticipants = async (roomName) => {
  try {
    const response = await api.get(`/room/${roomName}/participants`);
    return response.data;
  } catch (error) {
    console.error('Get participants failed:', error);
    throw new Error(error.response?.data?.detail || 'Failed to get participants');
  }
};

/**
 * Mute a participant
 */
export const muteParticipant = async (roomName, participantIdentity) => {
  try {
    const response = await api.post(`/room/${roomName}/mute/${participantIdentity}`);
    return response.data;
  } catch (error) {
    console.error('Mute participant failed:', error);
    throw new Error(error.response?.data?.detail || 'Failed to mute participant');
  }
};

/**
 * Unmute a participant
 */
export const unmuteParticipant = async (roomName, participantIdentity) => {
  try {
    const response = await api.post(`/room/${roomName}/unmute/${participantIdentity}`);
    return response.data;
  } catch (error) {
    console.error('Unmute participant failed:', error);
    throw new Error(error.response?.data?.detail || 'Failed to unmute participant');
  }
};

/**
 * Kick a participant from room
 */
export const kickParticipant = async (roomName, participantIdentity) => {
  try {
    const response = await api.post(`/room/${roomName}/kick/${participantIdentity}`);
    return response.data;
  } catch (error) {
    console.error('Kick participant failed:', error);
    throw new Error(error.response?.data?.detail || 'Failed to kick participant');
  }
};

/**
 * Check backend health
 */
export const checkHealth = async () => {
  try {
    const baseUrl = API_BASE_URL.replace('/api/livekit', '');
    const response = await axios.get(`${baseUrl}/health`);
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    throw new Error('Backend is not accessible');
  }
};

// Export the configured axios instance for custom requests if needed
export default api;