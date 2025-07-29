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
      requestData: error.config?.data,
    });
    
    // Enhanced error type handling
    if (error.code === 'ERR_NETWORK') {
      console.error('🌐 Network Error - Check if backend is running and CORS is configured');
      console.error('Backend URL:', API_BASE_URL);
    } else if (error.response?.status === 404) {
      console.error('🔍 404 Error - Endpoint not found:', fullUrl);
      console.error('Available endpoints should be:', [
        `${API_BASE_URL}/token`,
        `${API_BASE_URL}/room`,
        `${API_BASE_URL}/rooms`,
        `${API_BASE_URL}/room/{room_name}`,
        `${API_BASE_URL}/room/{room_name}/participants`
      ]);
    } else if (error.response?.status === 422) {
      console.error('🔧 Validation Error - Check request data format');
      console.error('Request data:', error.config?.data);
      console.error('Validation errors:', error.response?.data?.detail);
    } else if (error.response?.status === 0 || error.message.includes('CORS')) {
      console.error('🚫 CORS Error - Backend needs to allow your frontend origin');
    } else if (error.response?.status >= 500) {
      console.error('🔥 Server Error - Backend is having issues');
    }
    
    return Promise.reject(error);
  }
);

/**
 * Test backend connectivity with detailed debugging
 */
export const testBackendConnection = async () => {
  try {
    console.log('🧪 Testing backend connection...');
    console.log('Using API_BASE_URL:', API_BASE_URL);
    
    // Test the base health endpoint (remove /api/livekit from URL)
    const baseUrl = API_BASE_URL.replace('/api/livekit', '');
    console.log('Base URL for health check:', baseUrl);
    
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
    
    // Test the rooms endpoint to verify API prefix is working
    try {
      const roomsResponse = await api.get('/rooms');
      console.log('✅ Rooms endpoint test successful:', roomsResponse.data);
    } catch (roomsError) {
      console.warn('⚠️ Rooms endpoint test failed (this might be expected if no rooms exist):', roomsError.response?.status);
    }
    
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
      status: error.response?.status,
      details: error.response?.data
    };
  }
};

/**
 * Generate access token for joining a room
 */
export const generateToken = async ({ roomName, participantName, metadata = null }) => {
  try {
    console.log('🎫 Generating token for:', { roomName, participantName, metadata });
    
    // Validate inputs
    if (!roomName?.trim()) {
      throw new Error('Room name is required and cannot be empty');
    }
    if (!participantName?.trim()) {
      throw new Error('Participant name is required and cannot be empty');
    }
    
    // Clean the inputs
    const cleanRoomName = roomName.trim();
    const cleanParticipantName = participantName.trim();
    
    console.log('🎫 Making token request with clean data:', { 
      roomName: cleanRoomName, 
      participantName: cleanParticipantName,
      metadata 
    });
    
    const requestData = {
      roomName: cleanRoomName,
      participantName: cleanParticipantName,
      ...(metadata && { metadata })
    };
    
    const response = await api.post('/token', requestData);
    
    console.log('✅ Token generated successfully:', response.data);
    
    // Validate response structure
    if (!response.data.token || !response.data.wsUrl) {
      throw new Error('Invalid token response: missing token or wsUrl');
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Token generation failed:', error);
    
    // Provide more specific error messages
    if (error.code === 'ERR_NETWORK') {
      throw new Error(`Cannot connect to server at ${API_BASE_URL}. Please check your internet connection and ensure the backend is running.`);
    } else if (error.response?.status === 404) {
      throw new Error(`Token endpoint not found. Tried: ${API_BASE_URL}/token. Please check backend configuration.`);
    } else if (error.response?.status === 422) {
      const validationErrors = error.response?.data?.detail;
      console.error('Validation errors:', validationErrors);
      throw new Error(`Invalid request data: ${JSON.stringify(validationErrors)}`);
    } else if (error.response?.status === 500) {
      const serverError = error.response?.data?.detail || 'Unknown server error';
      throw new Error(`Server error while generating token: ${serverError}`);
    } else if (error.message.includes('CORS')) {
      throw new Error('CORS error. Please contact support or check backend CORS configuration.');
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
    console.log('🏠 Creating room:', { roomName, maxParticipants, metadata });
    
    // Validate inputs
    if (!roomName?.trim()) {
      throw new Error('Room name is required and cannot be empty');
    }
    
    const cleanRoomName = roomName.trim();
    
    const requestData = {
      roomName: cleanRoomName,
      maxParticipants,
      ...(metadata && { metadata })
    };
    
    console.log('🏠 Making room creation request:', requestData);
    
    const response = await api.post('/room', requestData);
    
    console.log('✅ Room created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Room creation failed:', error);
    
    if (error.code === 'ERR_NETWORK') {
      throw new Error(`Cannot connect to server at ${API_BASE_URL}. Please check your internet connection and ensure the backend is running.`);
    } else if (error.response?.status === 404) {
      throw new Error(`Room creation endpoint not found. Tried: ${API_BASE_URL}/room. Please check backend configuration.`);
    } else if (error.response?.status === 409) {
      throw new Error('Room already exists with this name');
    } else if (error.response?.status === 422) {
      const validationErrors = error.response?.data?.detail;
      throw new Error(`Invalid room data: ${JSON.stringify(validationErrors)}`);
    } else if (error.response?.status === 500) {
      const serverError = error.response?.data?.detail || 'Unknown server error';
      throw new Error(`Server error while creating room: ${serverError}`);
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
    if (!roomName?.trim()) {
      throw new Error('Room name is required');
    }
    
    console.log('ℹ️ Getting room info for:', roomName);
    const response = await api.get(`/room/${encodeURIComponent(roomName.trim())}`);
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
    if (!roomName?.trim()) {
      throw new Error('Room name is required');
    }
    
    console.log('🗑️ Deleting room:', roomName);
    const response = await api.delete(`/room/${encodeURIComponent(roomName.trim())}`);
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
    if (!roomName?.trim()) {
      throw new Error('Room name is required');
    }
    
    console.log('👥 Getting participants for room:', roomName);
    const response = await api.get(`/room/${encodeURIComponent(roomName.trim())}/participants`);
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
    if (!roomName?.trim() || !participantIdentity?.trim()) {
      throw new Error('Room name and participant identity are required');
    }
    
    const response = await api.post(`/room/${encodeURIComponent(roomName.trim())}/mute/${encodeURIComponent(participantIdentity.trim())}`);
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
    if (!roomName?.trim() || !participantIdentity?.trim()) {
      throw new Error('Room name and participant identity are required');
    }
    
    const response = await api.post(`/room/${encodeURIComponent(roomName.trim())}/unmute/${encodeURIComponent(participantIdentity.trim())}`);
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
    if (!roomName?.trim() || !participantIdentity?.trim()) {
      throw new Error('Room name and participant identity are required');
    }
    
    const response = await api.post(`/room/${encodeURIComponent(roomName.trim())}/kick/${encodeURIComponent(participantIdentity.trim())}`);
    return response.data;
  } catch (error) {
    console.error('❌ Kick participant failed:', error);
    const serverMessage = error.response?.data?.detail || error.response?.data?.message;
    throw new Error(serverMessage || 'Failed to kick participant');
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
      throw new Error(`Backend health check failed: ${error.message}`);
    }
  }
};

/**
 * Test function to verify backend connectivity
 */
export const testConnection = async () => {
  try {
    console.log('Testing backend connection...');
    const connectionTest = await testBackendConnection();
    
    if (connectionTest.success) {
      console.log('✅ Backend connection test passed');
      return true;
    } else {
      console.error('❌ Backend connection test failed:', connectionTest);
      return false;
    }
  } catch (error) {
    console.error('❌ Backend connection test failed:', error);
    return false;
  }
};

// Export the configured axios instance for custom requests if needed
export default api;