import React, { useState } from "react";
import { Camera, ArrowRight } from 'lucide-react';
import InterviewFlowPage from "./InterviewFlowPage";

const InstructionsPage = () => {
  const [startInterview, setStartInterview] = useState(false);

  if (startInterview) {
    return <InterviewFlowPage />;
  }

  return (
    <div className="h-screen w-full bg-gray-50 flex items-center justify-center overflow-y-auto">
      <div className=" w-full h-full bg-white rounded-xl shadow-lg p-6 my-4">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <Camera className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Interview Instructions</h1>
          <p className="text-gray-600 text-sm">Please read carefully before proceeding</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-3 flex items-center">
              <span className="text-lg mr-2">📋</span>
              Before You Start
            </h3>
            <ul className="text-blue-700 space-y-2 text-sm">
              <li>• Stable internet connection</li>
              <li>• Quiet, well-lit environment</li>
              <li>• Test camera and microphone</li>
            </ul>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-3 flex items-center">
              <span className="text-lg mr-2">🎯</span>
              Interview Process
            </h3>
            <ul className="text-green-700 space-y-2 text-sm">
              <li>• Watch video with questions</li>
              <li>• Take notes if needed</li>
              <li>• Record your responses</li>
              <li>• Maintain eye contact</li>
            </ul>
          </div>

          <div className="bg-amber-50 rounded-lg p-4">
            <h3 className="font-semibold text-amber-800 mb-3 flex items-center">
              <span className="text-lg mr-2">⚠️</span>
              Important Notes
            </h3>
            <ul className="text-amber-700 space-y-2 text-sm">
              <li>• Cannot pause/rewind video</li>
              <li>• 3 minutes per response</li>
              <li>• Grant camera permissions</li>
              <li>• Stay professional</li>
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