// QuestionDisplay.js
import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, ArrowRight } from "lucide-react";

const QuestionDisplay = ({ 
    videoUrl, 
    prompt, 
    onStartRecording, 
    questionNumber, 
    totalQuestions 
}) => {

    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const handlePlayPause = () => {
        if (!videoRef.current) return;
        if (isPlaying) {
            videoRef.current.pause();
        } else {
            videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };
    

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };

    const handleVideoEnd = () => {
        setIsPlaying(false);
        setCurrentTime(0);
    };

    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

    return (
        <div className="h-full w-full p-4">
            <div className="rounded-xl overflow-hidden shadow-md bg-black relative mb-4 max-w-2xl mx-auto">
                <video
                    ref={videoRef}
                    src={videoUrl}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={handleVideoEnd}
                    className="w-full rounded-xl"
                />

                <button
                    onClick={handlePlayPause}
                    className="absolute inset-0 flex items-center justify-center hover:bg-black/30 transition"
                >
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                        {isPlaying ? (
                            <Pause className="text-white w-8 h-8" />
                        ) : (
                            <Play className="text-white w-8 h-8" />
                        )}
                    </div>
                </button>

                <div className="bg-gray-800 p-3 text-white flex items-center space-x-2 text-sm">
                    <span>{formatTime(currentTime)}</span>
                    <div
                        className="flex-1 bg-gray-500 h-2 rounded-full overflow-hidden cursor-pointer relative"
                        onClick={(e) => {
                            if (!videoRef.current) return;
                            const rect = e.currentTarget.getBoundingClientRect();
                            const clickX = e.clientX - rect.left;
                            const percentage = clickX / rect.width;
                            const newTime = duration * percentage;
                            videoRef.current.currentTime = newTime;
                            setCurrentTime(newTime);
                        }}
                    >
                    <div
                        className="bg-purple-500 h-2 transition-all"
                        style={{ width: `${(currentTime / duration) * 100}%` }}
                    />
                    </div>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>
            <div className="flex-1 flex flex-row justify-between max-w-2xl mx-auto">
                <div className="text-center mb-6">
                    <h2 className="text-2xl text-left font-bold text-gray-800 mb-1">
                        Pertanyaan {questionNumber} dari {totalQuestions}
                    </h2>
                    <p className="text-gray-600 text-left text-sm">Tonton video dan bersiaplah untuk merekam jawaban Anda</p>
                </div>
                <div className="flex items-center text-center">
                    <button
                        onClick={onStartRecording}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg shadow-md flex items-center justify-center mx-auto transition-transform transform hover:scale-105"
                    >
                        Start Recording
                        <ArrowRight className="ml-2 w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuestionDisplay;