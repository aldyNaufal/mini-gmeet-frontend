import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Controls({ stream, peers, localVideoRef }) {
  const [mic, setMic] = useState(true);
  const [cam, setCam] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [originalStream, setOriginalStream] = useState(null);
  const navigate = useNavigate();

  const toggleMic = () => {
    stream.getAudioTracks().forEach(track => (track.enabled = !mic));
    setMic(!mic);
  };

  const toggleCam = () => {
    stream.getVideoTracks().forEach(track => (track.enabled = !cam));
    setCam(!cam);
  };

  const toggleScreenShare = async () => {
    if (!sharing) {
      try {
        // Store the original camera stream
        setOriginalStream(stream);
        
        // Get screen share stream
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
          video: true,
          audio: true // Include system audio if available
        });
        
        const screenVideoTrack = screenStream.getVideoTracks()[0];
        const screenAudioTrack = screenStream.getAudioTracks()[0];
        
        // Update local video display to show screen share
        if (localVideoRef && localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        
        // Replace video track for all peer connections
        Object.values(peers).forEach(pc => {
          const videoSender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
          if (videoSender) {
            videoSender.replaceTrack(screenVideoTrack);
          }
          
          // Replace audio track if screen audio is available
          if (screenAudioTrack) {
            const audioSender = pc.getSenders().find(s => s.track && s.track.kind === 'audio');
            if (audioSender) {
              audioSender.replaceTrack(screenAudioTrack);
            }
          }
        });

        // Handle screen share end (when user clicks "Stop sharing" in browser)
        screenVideoTrack.onended = () => {
          stopScreenShare();
        };

        setSharing(true);
      } catch (error) {
        console.error('Error starting screen share:', error);
        // Handle permission denied or other errors
        alert('Screen sharing failed. Please check permissions.');
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = async () => {
    try {
      // Get fresh camera stream (in case original was stopped)
      let cameraStream = originalStream;
      
      if (!originalStream || originalStream.getTracks().every(track => track.readyState === 'ended')) {
        cameraStream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
      }

      const cameraVideoTrack = cameraStream.getVideoTracks()[0];
      const cameraAudioTrack = cameraStream.getAudioTracks()[0];

      // Update local video display back to camera
      if (localVideoRef && localVideoRef.current) {
        localVideoRef.current.srcObject = cameraStream;
      }

      // Replace tracks back to camera for all peer connections
      Object.values(peers).forEach(pc => {
        const videoSender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
        if (videoSender && cameraVideoTrack) {
          videoSender.replaceTrack(cameraVideoTrack);
        }
        
        const audioSender = pc.getSenders().find(s => s.track && s.track.kind === 'audio');
        if (audioSender && cameraAudioTrack) {
          audioSender.replaceTrack(cameraAudioTrack);
        }
      });

      setSharing(false);
      setOriginalStream(null);
    } catch (error) {
      console.error('Error stopping screen share:', error);
      setSharing(false);
    }
  };

  const leaveRoom = () => {
    // Stop all local tracks
    stream.getTracks().forEach(track => track.stop());
    
    // Stop original stream if it exists
    if (originalStream) {
      originalStream.getTracks().forEach(track => track.stop());
    }
    
    // Close peer connections
    Object.values(peers).forEach(pc => pc.close());
    
    // Redirect to home
    navigate('/');
  };

  return (
    <div className="mt-4 flex gap-2">
      <button 
        onClick={toggleMic} 
        className={`px-4 py-2 rounded text-white ${mic ? 'bg-blue-500 hover:bg-blue-600' : 'bg-red-500 hover:bg-red-600'}`}
      >
        {mic ? 'Mute Mic' : 'Unmute Mic'}
      </button>
      
      <button 
        onClick={toggleCam} 
        className={`px-4 py-2 rounded text-white ${cam ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
      >
        {cam ? 'Turn Off Cam' : 'Turn On Cam'}
      </button>
      
      <button 
        onClick={toggleScreenShare} 
        className={`px-4 py-2 rounded text-white ${sharing ? 'bg-orange-500 hover:bg-orange-600' : 'bg-yellow-500 hover:bg-yellow-600'}`}
      >
        {sharing ? 'Stop Share' : 'Share Screen'}
      </button>
      
      <button 
        onClick={leaveRoom} 
        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
      >
        Leave Room
      </button>
    </div>
  );
}

export default Controls;