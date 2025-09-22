import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import QuestionDisplay from "../components/ui/QuestionDisplay";
import RecordingSection from "../components/ui/RecordingSection";
import FinishPage from "../components/ui/FinishPage"; // import langsung
import axios from "axios";

const questions = [
    { id: 1, videoUrl: "/1.mp4", prompt: "Ceritakan tentang dirimu." },
    { id: 2, videoUrl: "/2.mp4", prompt: "Apa kekuatan terbesarmu?" },
    { id: 3, videoUrl: "/3.mp4", prompt: "Kenapa kamu melamar di sini?" },
];

const InterviewFlowPage = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [phase, setPhase] = useState("question"); // "question" ||"recording" || "finish"
    const [isUploading, setIsUploading] = useState(false);
    const navigate = useNavigate();

    const currentQuestion = questions[currentIndex];

    const handleStartRecording = () => {
        setPhase("recording");
    };

    const handleRecordingComplete = async (videoBlob) => {
        console.log("Recorded video:", videoBlob);
        setIsUploading(true);
        
        // Simulasi ambil username dari JWT
        // const token = localStorage.getItem("token");
        // const decoded = JSON.parse(atob(token.split('.')[1]));
        // const username = decoded.sub;
        const username = "john_doe"; // sementara hardcoded

        const questionText = currentQuestion.prompt.replace(/\s+/g, "_").toLowerCase().slice(0, 20);
        const dateStr = new Date().toISOString().split("T")[0]; // format: YYYY-MM-DD
        const filename = `${username}_${questionText}_${dateStr}.webm`;

        const formData = new FormData();
        formData.append("video", videoBlob, filename);
        formData.append("question_id", currentQuestion.id);
        
        try {
            const response = await axios.post("http://127.0.0.1:8000/videos/upload", formData, {
                headers: {
                "Content-Type": "multipart/form-data",
                // Authorization: `Bearer ${token}`  // nanti diaktifkan saat pakai JWT sungguhan
                },
            });
            console.log("Upload sukses:", response.data);
            
            // Move to next question or finish interview
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setPhase("question");
            } else {
                setPhase("finish");
            }
        } catch (error) {
            console.error("Upload gagal:", error.response?.data || error.message);
            // You might want to show an error message to the user here
            alert("Failed to upload video. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-6">
                {isUploading && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                            <p className="text-gray-700">Uploading your video...</p>
                        </div>
                    </div>
                )}
                {phase === "question" && (
                    <QuestionDisplay 
                        videoUrl={currentQuestion.videoUrl} 
                        prompt={currentQuestion.prompt}
                        onStartRecording={handleStartRecording}
                        questionNumber={currentIndex + 1}
                        totalQuestions={questions.length}
                    />
                )}

                {phase === "recording" && (
                    <RecordingSection
                        questionId={currentQuestion.id}
                        onCompleteRecording={handleRecordingComplete}
                        question={currentQuestion.prompt}
                    />
                )}

                {phase === "finish" && <FinishPage />}
            </div>
        </div>
    );
};

export default InterviewFlowPage;