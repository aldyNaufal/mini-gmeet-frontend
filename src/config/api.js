import axios from 'axios';

// Configure the base URL for your backend API
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD 
    ? 'https://mini-gmeet-backend-production.up.railway.app/api/livekit'
    : 'http://localhost:8000/api/livekit'
  );

console.log('API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
  // Add withCredentials if you're using authentication
  withCredentials: false, // Set to true if you need cookies/auth
});

// Request interceptor for logging and debugging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    console.log('Request data:', config.data);
    console.log('Request headers:', config.headers);
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
    console.error('API Response Error Details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL
      }
    });
    
    // Handle specific error types
    if (error.code === 'ERR_NETWORK') {
      console.error('Network Error - Check if backend is running and CORS is configured');
    } else if (error.response?.status === 404) {
      console.error('404 Error - Endpoint not found. Check your backend routes');
    } else if (error.response?.status === 0 || error.message.includes('CORS')) {
      console.error('CORS Error - Backend needs to allow your frontend origin');
    }
    
    return Promise.reject(error);
  }
);

// API functions with better error handling
/**
 * Generate access token for joining a room
 */
export const generateToken = async ({ roomName, participantName, metadata = null }) => {
  try {
    console.log('Generating token for:', { roomName, participantName });
    
    const response = await api.post('/token', {
      roomName: roomName.trim(),
      participantName: participantName.trim(),
      metadata
    });
    
    console.log('Token generated successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Token generation failed:', error);
    
    // Provide more specific error messages
    if (error.code === 'ERR_NETWORK') {
      throw new Error('Cannot connect to server. Please check your internet connection.');
    } else if (error.response?.status === 404) {
      throw new Error('Token endpoint not found. Please check backend configuration.');
    } else if (error.message.includes('CORS')) {
      throw new Error('CORS error. Please contact support.');
    } else {
      throw new Error(error.response?.data?.detail || error.message || 'Failed to generate token');
    }
  }
};

/**
 * Create a new room
 */
export const createRoom = async ({ roomName, maxParticipants = 50, metadata = null }) => {
  try {
    console.log('Creating room:', { roomName, maxParticipants });
    
    const response = await api.post('/room', {
      roomName: roomName.trim(),
      maxParticipants,
      metadata
    });
    
    console.log('Room created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Room creation failed:', error);
    
    if (error.code === 'ERR_NETWORK') {
      throw new Error('Cannot connect to server. Please check your internet connection.');
    } else if (error.response?.status === 404) {
      throw new Error('Room endpoint not found. Please check backend configuration.');
    } else if (error.response?.status === 409) {
      throw new Error('Room already exists');
    } else {
      throw new Error(error.response?.data?.detail || error.message || 'Failed to create room');
    }
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
    
    if (error.code === 'ERR_NETWORK') {
      throw new Error('Cannot connect to server. Please check your internet connection.');
    } else if (error.response?.status === 404) {
      throw new Error('Rooms endpoint not found. Please check backend configuration.');
    } else {
      throw new Error(error.response?.data?.detail || error.message || 'Failed to get rooms');
    }
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
    // Remove /api/livekit from the base URL for health check
    const baseUrl = API_BASE_URL.replace('/api/livekit', '');
    console.log('Health check URL:', `${baseUrl}/health`);
    
    const response = await axios.get(`${baseUrl}/health`, {
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
      }
    });
    
    console.log('Health check successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    
    if (error.code === 'ERR_NETWORK') {
      throw new Error('Backend server is not accessible. Please try again later.');
    } else {
      throw new Error('Backend health check failed');
    }
  }
};

// Test function to verify backend connectivity
export const testConnection = async () => {
  try {
    console.log('Testing backend connection...');
    const health = await checkHealth();
    console.log('Backend is healthy:', health);
    return true;
  } catch (error) {
    console.error('Backend connection test failed:', error);
    return false;
  }
};

// Export the configured axios instance for custom requests if needed
export default api;