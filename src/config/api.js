const API_CONFIG = {
  // Use Railway URL in production, localhost in development
  BACKEND_URL: process.env.NODE_ENV === 'production' 
    ? 'https://mini-gmeet-backend-production.up.railway.app'
    : 'http://localhost:8000',

  // LiveKit server URL (usually from your FastAPI backend)
  LIVEKIT_URL: 'wss://job-hire-p0x9h07m.livekit.cloud',
};

export default API_CONFIG;