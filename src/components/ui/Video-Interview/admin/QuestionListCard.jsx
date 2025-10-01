import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';


const QuestionListCard = ({ list, questionVideos, onEdit, onDelete }) => {
    const firstVideo = questionVideos.find(v => v.id === list.videoIds[0]);
    
    return (
        <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden hover:border-blue-300 transition-all">
        {firstVideo && (
            <img
            src={firstVideo.thumbnail}
            alt={firstVideo.title}
            className="w-full h-40 object-cover"
            />
        )}
        
        <div className="p-4">
            <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
                <h3 className="text-gray-900 font-bold text-lg mb-1">{list.name}</h3>
                <p className="text-gray-600 text-sm">
                {list.videoIds.length} video pertanyaan
                </p>
            </div>
            <div className="flex gap-2">
                <button
                onClick={() => onEdit(list)}
                className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                >
                <Edit2 className="text-blue-600" size={18} />
                </button>
                <button
                onClick={() => onDelete(list.id)}
                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                >
                <Trash2 className="text-red-600" size={18} />
                </button>
            </div>
            </div>
            
            <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                {list.videoIds.length} Video
            </span>
            </div>
        </div>
        </div>
    );
};
export default QuestionListCard;