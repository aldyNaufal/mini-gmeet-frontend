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
  withCredentials: false,
});

// Enhanced request interceptor with better debugging
api.interceptors.request.use(
  (config) => {
    const fullUrl = `${config.baseURL}${config.url}`;
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${fullUrl}`);
    console.log('📤 Request data:', config.data);
    console.log('📋 Request headers:', config.headers);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Enhanced response interceptor with better error handling
api.interceptors.response.use(
  (response) => {
    const fullUrl = `${response.config.baseURL}${response.config.url}`;
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${fullUrl}`, response.data);
    return response;
  },
  (error) => {
    const fullUrl = error.config ? `${error.config.baseURL}${error.config.url}` : 'Unknown URL';
    
    console.error('❌ API Response Error Details:', {
      message: error.message,
      url: fullUrl,
      method: error.config?.method?.toUpperCase(),
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
      headers: error.response?.headers,
    });
    
    // Enhanced error type handling
    if (error.code === 'ERR_NETWORK') {
      console.error('🌐 Network Error - Check if backend is running and CORS is configured');
    } else if (error.response?.status === 404) {
      console.error('🔍 404 Error - Endpoint not found:', fullUrl);
      console.error('Available endpoints should be:', [
        `${API_BASE_URL}/token`,
        `${API_BASE_URL}/room`,
        `${API_BASE_URL}/rooms`,
        `${API_BASE_URL}/room/{room_name}`,
        `${API_BASE_URL}/room/{room_name}/participants`
      ]);
    } else if (error.response?.status === 0 || error.message.includes('CORS')) {
      console.error('🚫 CORS Error - Backend needs to allow your frontend origin');
    } else if (error.response?.status >= 500) {
      console.error('🔥 Server Error - Backend is having issues');
    }
    
    return Promise.reject(error);
  }
);

/**
 * Test backend connectivity
 */
export const testBackendConnection = async () => {
  try {
    console.log('🧪 Testing backend connection...');
    
    // Test the base health endpoint
    const baseUrl = API_BASE_URL.replace('/api/livekit', '');
    const healthResponse = await axios.get(`${baseUrl}/health`, {
      timeout: 10000,
      headers: { 'Accept': 'application/json' }
    });
    
    console.log('✅ Health check successful:', healthResponse.data);
    
    // Test the API base route
    const apiResponse = await axios.get(`${baseUrl}/`, {
      timeout: 10000,
      headers: { 'Accept': 'application/json' }
    });
    
    console.log('✅ API base route successful:', apiResponse.data);
    
    return {
      health: healthResponse.data,
      api: apiResponse.data,
      success: true
    };
  } catch (error) {
    console.error('❌ Backend connection test failed:', error);
    return {
      success: false,
      error: error.message,
      status: error.response?.status
    };
  }
};

/**
 * Generate access token for joining a room
 */
export const generateToken = async ({ roomName, participantName, metadata = null }) => {
  try {
    console.log('🎫 Generating token for:', { roomName, participantName });
    
    // Validate inputs
    if (!roomName?.trim()) {
      throw new Error('Room name is required');
    }
    if (!participantName?.trim()) {
      throw new Error('Participant name is required');
    }
    
    const response = await api.post('/token', {
      roomName: roomName.trim(),
      participantName: participantName.trim(),
      metadata
    });
    
    console.log('✅ Token generated successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Token generation failed:', error);
    
    // Provide more specific error messages
    if (error.code === 'ERR_NETWORK') {
      throw new Error('Cannot connect to server. Please check your internet connection and ensure the backend is running.');
    } else if (error.response?.status === 404) {
      throw new Error(`Token endpoint not found. Expected: ${API_BASE_URL}/token. Please check backend configuration.`);
    } else if (error.response?.status === 500) {
      throw new Error('Server error while generating token. Please check backend logs.');
    } else if (error.message.includes('CORS')) {
      throw new Error('CORS error. Please contact support.');
    } else {
      const serverMessage = error.response?.data?.detail || error.response?.data?.message;
      throw new Error(serverMessage || error.message || 'Failed to generate token');
    }
  }
};

/**
 * Create a new room
 */
export const createRoom = async ({ roomName, maxParticipants = 50, metadata = null }) => {
  try {
    console.log('🏠 Creating room:', { roomName, maxParticipants });
    
    // Validate inputs
    if (!roomName?.trim()) {
      throw new Error('Room name is required');
    }
    
    const response = await api.post('/room', {
      roomName: roomName.trim(),
      maxParticipants,
      metadata
    });
    
    console.log('✅ Room created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Room creation failed:', error);
    
    if (error.code === 'ERR_NETWORK') {
      throw new Error('Cannot connect to server. Please check your internet connection and ensure the backend is running.');
    } else if (error.response?.status === 404) {
      throw new Error(`Room endpoint not found. Expected: ${API_BASE_URL}/room. Please check backend configuration.`);
    } else if (error.response?.status === 409) {
      throw new Error('Room already exists with this name');
    } else if (error.response?.status === 500) {
      throw new Error('Server error while creating room. Please check backend logs.');
    } else {
      const serverMessage = error.response?.data?.detail || error.response?.data?.message;
      throw new Error(serverMessage || error.message || 'Failed to create room');
    }
  }
};

/**
 * Get list of all rooms
 */
export const getRooms = async () => {
  try {
    console.log('📋 Getting rooms list...');
    const response = await api.get('/rooms');
    console.log('✅ Rooms retrieved successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Get rooms failed:', error);
    
    if (error.code === 'ERR_NETWORK') {
      throw new Error('Cannot connect to server. Please check your internet connection.');
    } else if (error.response?.status === 404) {
      throw new Error(`Rooms endpoint not found. Expected: ${API_BASE_URL}/rooms`);
    } else {
      const serverMessage = error.response?.data?.detail || error.response?.data?.message;
      throw new Error(serverMessage || error.message || 'Failed to get rooms');
    }
  }
};

/**
 * Get room information
 */
export const getRoomInfo = async (roomName) => {
  try {
    console.log('ℹ️ Getting room info for:', roomName);
    const response = await api.get(`/room/${encodeURIComponent(roomName)}`);
    console.log('✅ Room info retrieved:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Get room info failed:', error);
    const serverMessage = error.response?.data?.detail || error.response?.data?.message;
    throw new Error(serverMessage || 'Failed to get room info');
  }
};

/**
 * Delete a room
 */
export const deleteRoom = async (roomName) => {
  try {
    console.log('🗑️ Deleting room:', roomName);
    const response = await api.delete(`/room/${encodeURIComponent(roomName)}`);
    console.log('✅ Room deleted:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Delete room failed:', error);
    const serverMessage = error.response?.data?.detail || error.response?.data?.message;
    throw new Error(serverMessage || 'Failed to delete room');
  }
};

/**
 * Get participants in a room
 */
export const getRoomParticipants = async (roomName) => {
  try {
    console.log('👥 Getting participants for room:', roomName);
    const response = await api.get(`/room/${encodeURIComponent(roomName)}/participants`);
    console.log('✅ Participants retrieved:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Get participants failed:', error);
    const serverMessage = error.response?.data?.detail || error.response?.data?.message;
    throw new Error(serverMessage || 'Failed to get participants');
  }
};

/**
 * Mute a participant
 */
export const muteParticipant = async (roomName, participantIdentity) => {
  try {
    const response = await api.post(`/room/${encodeURIComponent(roomName)}/mute/${encodeURIComponent(participantIdentity)}`);
    return response.data;
  } catch (error) {
    console.error('❌ Mute participant failed:', error);
    const serverMessage = error.response?.data?.detail || error.response?.data?.message;
    throw new Error(serverMessage || 'Failed to mute participant');
  }
};

/**
 * Unmute a participant
 */
export const unmuteParticipant = async (roomName, participantIdentity) => {
  try {
    const response = await api.post(`/room/${encodeURIComponent(roomName)}/unmute/${encodeURIComponent(participantIdentity)}`);
    return response.data;
  } catch (error) {
    console.error('❌ Unmute participant failed:', error);
    const serverMessage = error.response?.data?.detail || error.response?.data?.message;
    throw new Error(serverMessage || 'Failed to unmute participant');
  }
};

/**
 * Kick a participant from room
 */
export const kickParticipant = async (roomName, participantIdentity) => {
  try {
    const response = await api.post(`/room/${encodeURIComponent(roomName)}/kick/${encodeURIComponent(participantIdentity)}`);
    return response.data;
  } catch (error) {
    console.error('❌ Kick participant failed:', error);
    const serverMessage = error.response?.data?.detail || error.response?.data?.message;
    throw new Error(serverMessage || 'Failed to kick participant');
  }
};

export default api;