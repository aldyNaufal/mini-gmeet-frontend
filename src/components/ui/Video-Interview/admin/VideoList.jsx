import React from 'react';
import { Trash2 } from 'lucide-react';

const VideoList = ({ videos, onDelete }) => {
    if (videos.length === 0) return null;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Video yang Diupload</h3>
        <div className="space-y-3">
            {videos.map(video => (
            <div key={video.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex items-center justify-between">
                <div>
                <p className="text-gray-900 font-semibold">{video.title}</p>
                <p className="text-gray-600 text-sm">{video.filename} • {video.size} • {video.uploadedAt}</p>
                </div>
                <button
                onClick={() => onDelete(video.id)}
                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                >
                <Trash2 className="text-red-600" size={18} />
                </button>
            </div>
            ))}
        </div>
        </div>
    );
};
export default VideoList;