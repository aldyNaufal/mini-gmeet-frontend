import React, { useState, useEffect, useRef } from 'react';
import { Camera, Mic, MicOff, Video, VideoOff, Square, RotateCcw, ArrowRight, Play } from 'lucide-react';

const RecordingSection = ({ onCompleteRecording, question }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [recordingComplete, setRecordingComplete] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const videoRef = useRef(null);
  const playbackVideoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);

  const maxRecordingTime = 180; // 3 minutes in seconds

  useEffect(() => {
    requestPermissions();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    let interval;
    if (isRecording && recordingTime < maxRecordingTime) {
      interval = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= maxRecordingTime - 1) {
            stopRecording();
            return maxRecordingTime;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, recordingTime]);

  // update playback video when recording is complete and want to retake
  useEffect(() => {
    if (recordingComplete && recordedBlob && playbackVideoRef.current) {
      const videoUrl = URL.createObjectURL(recordedBlob);
      console.log('Setting playback video src:', videoUrl);
      playbackVideoRef.current.src = videoUrl;
      playbackVideoRef.current.load();
    }
  }, [recordingComplete, recordedBlob]);

  useEffect(() => {
    if (streamRef.current && videoRef.current && !recordingComplete) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [recordingComplete, hasPermission]);

  const requestPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setHasPermission(true);
    } catch (err) {
      console.error('Error accessing media devices:', err);
      setHasPermission(false);
    }
  };

  const startRecording = async () => {
    if (!streamRef.current) return;

    try {
      const mediaRecorder = new MediaRecorder(streamRef.current);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        console.log('Chunks:', chunks);
        console.log('Recording complete:', blob);
        console.log('playbackVideoRef:', playbackVideoRef.current);
        setRecordingComplete(true);
        setRecordedBlob(blob);
        
        // Create URL for playback
        const videoUrl = URL.createObjectURL(blob);
        if (playbackVideoRef.current) {
          playbackVideoRef.current.src = videoUrl;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (err) {
      console.error('Error starting recording:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isCameraOn;
        setIsCameraOn(!isCameraOn);
        
        // Also hide/show the video element
        if (videoRef.current) {
          videoRef.current.style.display = !isCameraOn ? 'block' : 'none';
        }
      }
    }
  };

  const toggleMicrophone = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isMicOn;
        setIsMicOn(!isMicOn);
      }
    }
  };

  const resetRecording = () => {
    setRecordingComplete(false);
    setRecordedBlob(null);
    setRecordingTime(0);
    setIsPlayingRecording(false);
    
    // Clean up the playback video URL
    if (playbackVideoRef.current && playbackVideoRef.current.src) {
      URL.revokeObjectURL(playbackVideoRef.current.src);
      playbackVideoRef.current.src = '';
    }
    if (streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      // Show video element again and re-enable tracks based on current state
      videoRef.current.style.display = isCameraOn ? 'block' : 'none';
      
      const videoTrack = streamRef.current.getVideoTracks()[0];
      const audioTrack = streamRef.current.getAudioTracks()[0];
      
      if (videoTrack) {
        videoTrack.enabled = isCameraOn;
      }
      if (audioTrack) {
        audioTrack.enabled = isMicOn;
      }
    }
  };

  const handlePlayRecording = () => {
    if (playbackVideoRef.current) {
      if (isPlayingRecording) {
        playbackVideoRef.current.pause();
      } else {
        playbackVideoRef.current.play();
      }
      setIsPlayingRecording(!isPlayingRecording);
    }
  };

  const handleSubmitRecording = () => {
    if (recordedBlob && onCompleteRecording) {
      onCompleteRecording(recordedBlob);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (recordingTime >= maxRecordingTime * 0.9) return 'text-red-500';
    if (recordingTime >= maxRecordingTime * 0.75) return 'text-yellow-500';
    return 'text-green-500';
  };

  // Permission request UI
  if (!hasPermission) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center
      ">
        <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Camera className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Permission Required</h2>
        <p className="text-gray-600 mb-6">
          Please allow camera and microphone access to continue with the interview recording.
        </p>
        <button
          onClick={requestPermissions}
          className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
        >
          Grant Permissions
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white h-screen p-4 ">
      {/* Live Video Preview (shown during recording or when no recording exists) */}
      {!recordingComplete && (
        <div className="bg-black rounded-lg overflow-hidden mb-6 relative max-w-3xl mx-auto">
          <div className="aspect-video relative">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
              style={{ display: isCameraOn ? 'block' : 'none' }}
            />
            
            {/* Camera off overlay - always visible when camera is off */}
            {!isCameraOn && (
              <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                <div className="text-white text-center">
                  <VideoOff className="w-16 h-16 mx-auto mb-4" />
                  <p>Camera is off</p>
                </div>
              </div>
            )}
            
            {/* Recording indicator */}
            {isRecording && (
              <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center z-10">
                <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                REC
              </div>
            )}

            {/* Timer */}
            <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-lg z-10">
              <span className={`font-mono text-lg ${getTimeColor()}`}>
                {formatTime(recordingTime)} / {formatTime(maxRecordingTime)}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-gray-800 p-4">
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={toggleCamera}
                className={`p-3 rounded-full transition-all duration-200 ${
                  isCameraOn 
                    ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                {isCameraOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
              </button>

              <button
                onClick={toggleMicrophone}
                className={`p-3 rounded-full transition-all duration-200 ${
                  isMicOn 
                    ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
              </button>

              {!isRecording && (
                <button
                  onClick={startRecording}
                  className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full transition-all duration-200 transform hover:scale-105"
                >
                  <div className="w-6 h-6 bg-white rounded-sm"></div>
                </button>
              )}

              {isRecording && (
                <button
                  onClick={stopRecording}
                  className="bg-gray-600 hover:bg-gray-700 text-white p-4 rounded-full transition-all duration-200"
                >
                  <Square className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col md:flex-row gap-8 items-start md:items-center max-w-6xl mx-auto">
  {/* Video Section (Kiri) */}
  {recordingComplete && (
    <div className="bg-black rounded-lg overflow-hidden relative max-w-xl">
      <div className="aspect-video">
        <video
          ref={playbackVideoRef}
          controls={true}
          className="w-full h-full object-cover"
          onPlay={() => setIsPlayingRecording(true)}
          onPause={() => setIsPlayingRecording(false)}
          onEnded={() => setIsPlayingRecording(false)}
        />

        {/* Play/Pause overlay */}
        <button
          onClick={handlePlayRecording}
          className="absolute inset-0 flex items-center justify-center hover:bg-black/30 transition"
        >
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            {isPlayingRecording ? (
              <Square className="text-white w-8 h-8" />
            ) : (
              <Play className="text-white w-8 h-8" />
            )}
          </div>
        </button>
      </div>

      <div className="bg-gray-800 p-4 text-center">
        <p className="text-white text-sm">
          Recording Duration: {formatTime(recordingTime)}
        </p>
      </div>
    </div>
  )}

  {/* Text + Buttons (Kanan) */}
  {recordingComplete && (
    <div className="flex-1">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
          <svg
            className="w-6 h-6 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <p className="text-green-600 font-bold text-xl mb-2">
          Recording completed successfully!
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col flex-wrap gap-4 pt-10">
        <button
          onClick={resetRecording}
          className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center"
        >
          Retake Video
          <RotateCcw className="w-5 h-5 ml-3" />
        </button>

        <button
          onClick={handleSubmitRecording}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center transform hover:scale-105"
        >
          Continue to Next Question
          <ArrowRight className="w-5 h-5 ml-3" />
        </button>
      </div>
    </div>
  )}
</div>

    </div>
  );
};

export default RecordingSection;