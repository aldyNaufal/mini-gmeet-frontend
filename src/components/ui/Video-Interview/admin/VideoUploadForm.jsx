import React, { useState } from 'react';
import { Upload } from 'lucide-react';


const VideoUploadForm = ({ onUpload }) => {
    const [videoFile, setVideoFile] = useState(null);
    const [videoTitle, setVideoTitle] = useState('');
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
        setDragActive(true);
        } else if (e.type === "dragleave") {
        setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        const files = [...e.dataTransfer.files];
        if (files.length > 0 && files[0].type.startsWith('video/')) {
        setVideoFile(files[0]);
        }
    };

    const handleFileInput = (e) => {
        const files = [...e.target.files];
        if (files.length > 0 && files[0].type.startsWith('video/')) {
        setVideoFile(files[0]);
        }
    };

    const handleUpload = async () => {
        if (!videoFile || !videoTitle.trim()) {
            alert('Mohon isi title dan pilih video');
            return;
        }

        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('title', videoTitle);
            formData.append('file', videoFile);

            const response = await fetch('http://localhost:8000/video/questions/upload-video', {
            method: 'POST',
            body: formData,
            });

            if (!response.ok) {
            throw new Error('Upload gagal');
            }

            const result = await response.json();

            onUpload(result); // kalau ingin update state parent
            setVideoFile(null);
            setVideoTitle('');
            alert('Video berhasil diupload!');
        } catch (error) {
            console.error(error);
            alert('Terjadi kesalahan saat upload');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Video Pertanyaan</h2>
        
        <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
            Title Video
            </label>
            <input
            type="text"
            placeholder="Masukkan judul video"
            value={videoTitle}
            onChange={(e) => setVideoTitle(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
        </div>

        <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all mb-6 ${
            dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
            }`}
        >
            <Upload className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-gray-700 text-lg mb-2">
            {videoFile ? videoFile.name : 'Drag & drop video di sini'}
            </p>
            <p className="text-gray-500 mb-4">atau</p>
            <label className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors font-semibold">
            Pilih File Video
            <input
                type="file"
                accept="video/*"
                onChange={handleFileInput}
                className="hidden"
            />
            </label>
        </div>

        <button
            onClick={handleUpload}
            disabled={!videoFile || !videoTitle.trim() || uploading}
            className="w-full px-6 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-semibold text-lg flex items-center justify-center gap-2"
        >
            {uploading ? (
            <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Mengupload...
            </>
            ) : (
            <>
                <Upload size={20} />
                Upload ke Backend
            </>
            )}
        </button>
        </div>
    );
};
export default VideoUploadForm;