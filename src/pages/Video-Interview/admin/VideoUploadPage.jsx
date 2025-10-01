import React from 'react';
import VideoUploadForm from '../../../components/ui/Video-Interview/admin/VideoUploadForm';
import VideoList from '../../../components/ui/Video-Interview/admin/VideoList';

const VideoUploadPage = ({ videos, setVideos }) => {
    const handleUpload = (newVideo) => {
        setVideos(prev => [...prev, newVideo]);
    };

    const handleDelete = (id) => {
        setVideos(prev => prev.filter(v => v.id !== id));
    };

    return (
        <div className="space-y-6">
        <VideoUploadForm onUpload={handleUpload} />
        <VideoList videos={videos} onDelete={handleDelete} />
        </div>
    );
};
export default VideoUploadPage;