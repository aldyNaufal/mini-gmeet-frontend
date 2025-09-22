import React, { useState } from "react";
import { Camera, ArrowRight } from 'lucide-react';
import { use } from 'react';
import InterviewFlowPage from "./InterviewFlowPage";


const InstructionsPage = () => {
  const [startInterview, setStartInterview] = useState(false);

  if (startInterview) {
    return <InterviewFlowPage />;
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Camera className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Interview Instructions</h1>
          <p className="text-gray-600">Please read carefully before proceeding</p>
        </div>

        <div className="space-y-6 mb-8">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">📋 Before You Start</h3>
            <ul className="text-blue-700 space-y-1 text-sm">
              <li>• Ensure you have a stable internet connection</li>
              <li>• Find a quiet, well-lit environment</li>
              <li>• Test your camera and microphone</li>
              <li>• Have a glass of water nearby</li>
            </ul>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2">🎯 Interview Process</h3>
            <ul className="text-green-700 space-y-1 text-sm">
              <li>• You will watch a video with interview questions</li>
              <li>• Take notes if needed during the video</li>
              <li>• After the video, you'll record your responses</li>
              <li>• Speak clearly and maintain eye contact with the camera</li>
            </ul>
          </div>

          <div className="bg-amber-50 rounded-lg p-4">
            <h3 className="font-semibold text-amber-800 mb-2">⚠️ Important Notes</h3>
            <ul className="text-amber-700 space-y-1 text-sm">
              <li>• You cannot pause or rewind the question video</li>
              <li>• Recording time is limited to 3 minutes per response</li>
              <li>• Make sure to grant camera and microphone permissions</li>
              <li>• Stay professional and be yourself</li>
            </ul>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => setStartInterview(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center mx-auto"
          >
            I'm Ready - Start Interview
            <ArrowRight className="ml-2 w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstructionsPage;
