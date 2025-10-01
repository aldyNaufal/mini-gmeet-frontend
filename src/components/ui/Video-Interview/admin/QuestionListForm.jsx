import React from 'react';
import { Save } from 'lucide-react';

const QuestionListForm = ({ 
    currentList, 
    setCurrentList, 
    questionVideos, 
    editingList, 
    onSave 
    }) => {
    const toggleVideoInList = (videoId) => {
        setCurrentList(prev => ({
        ...prev,
        videoIds: prev.videoIds.includes(videoId)
            ? prev.videoIds.filter(id => id !== videoId)
            : [...prev.videoIds, videoId]
        }));
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {editingList ? 'Edit List Pertanyaan' : 'Buat List Pertanyaan'}
        </h2>
        
        <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
            Nama List
            </label>
            <input
            type="text"
            placeholder="Contoh: Daftar Pertanyaan untuk Frontend Developer"
            value={currentList.name}
            onChange={(e) => setCurrentList(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
        </div>

        <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
            Pilih Video Pertanyaan
            </label>
            <div className="space-y-3 max-h-96 overflow-y-auto">
            {questionVideos.map(video => (
                <label
                key={video.id}
                className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    currentList.videoIds.includes(video.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                >
                <input
                    type="checkbox"
                    checked={currentList.videoIds.includes(video.id)}
                    onChange={() => toggleVideoInList(video.id)}
                    className="w-5 h-5 text-blue-600 rounded"
                />
                <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-20 h-14 object-cover rounded"
                />
                <div className="flex-1">
                    <p className="text-gray-900 font-semibold">{video.title}</p>
                    <p className="text-gray-500 text-sm">Video ID: {video.id}</p>
                </div>
                </label>
            ))}
            </div>
        </div>

        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">
            <span className="font-semibold">Video terpilih:</span> {currentList.videoIds.length} video
            </p>
        </div>

        <button
            onClick={onSave}
            disabled={!currentList.name.trim() || currentList.videoIds.length === 0}
            className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-semibold"
        >
            <Save size={18} /> {editingList ? 'Update' : 'Simpan'} List
        </button>
        </div>
    );
};
export default QuestionListForm;