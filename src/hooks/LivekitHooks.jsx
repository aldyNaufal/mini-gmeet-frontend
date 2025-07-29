// src/hooks/useVideoConference.js
import { useState, useEffect, useCallback } from 'react';
import { liveKitAPI } from '../services/livekit';

export const useVideoConference = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Generate token for joining a room
  const generateToken = useCallback(async (roomName, participantName, metadata = null) => {
    setLoading(true);
    setError(null);
    
    try {
      const tokenData = await liveKitAPI.generateToken(roomName, participantName, metadata);
      return tokenData;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new room
  const createRoom = useCallback(async (roomName, maxParticipants = 50, metadata = null) => {
    setLoading(true);
    setError(null);
    
    try {
      const roomData = await liveKitAPI.createRoom(roomName, maxParticipants, metadata);
      await fetchRooms(); // Refresh rooms list
      return roomData;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all rooms
  const fetchRooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const roomsData = await liveKitAPI.listRooms();
      setRooms(roomsData.rooms || []);
      return roomsData;
    } catch (err) {
      setError(err.message);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get room information
  const getRoomInfo = useCallback(async (roomName) => {
    setLoading(true);
    setError(null);
    
    try {
      const roomInfo = await liveKitAPI.getRoomInfo(roomName);
      return roomInfo;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete a room
  const deleteRoom = useCallback(async (roomName) => {
    setLoading(true);
    setError(null);
    
    try {
      await liveKitAPI.deleteRoom(roomName);
      await fetchRooms(); // Refresh rooms list
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchRooms]);

  // Get room participants
  const getRoomParticipants = useCallback(async (roomName) => {
    try {
      const participantsData = await liveKitAPI.getRoomParticipants(roomName);
      return participantsData;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Participant management
  const muteParticipant = useCallback(async (roomName, participantIdentity) => {
    try {
      return await liveKitAPI.muteParticipant(roomName, participantIdentity);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const unmuteParticipant = useCallback(async (roomName, participantIdentity) => {
    try {
      return await liveKitAPI.unmuteParticipant(roomName, participantIdentity);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const kickParticipant = useCallback(async (roomName, participantIdentity) => {
    try {
      return await liveKitAPI.kickParticipant(roomName, participantIdentity);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Load rooms on mount
  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  return {
    rooms,
    loading,
    error,
    generateToken,
    createRoom,
    fetchRooms,
    getRoomInfo,
    deleteRoom,
    getRoomParticipants,
    muteParticipant,
    unmuteParticipant,
    kickParticipant,
  };
};