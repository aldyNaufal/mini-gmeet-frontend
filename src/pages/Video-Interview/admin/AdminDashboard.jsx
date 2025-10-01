import React, { useEffect, useState } from 'react';    
import VideoUploadPage from './VideoUploadPage';
import QuestionListPage from './QuestionListPage';
import UserManagementPage from './UserManagementPage';
import generateThumbnail from '../../../components/ui/Video-Interview/admin/GenerateThumbnail';
import { Video, ListChecks, Users } from 'lucide-react';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('videos');
    const [videos, setVideos] = useState([]);
    const [questionVideos, setQuestionVideos] = useState([]);
    const [questionLists, setQuestionLists] = useState([]);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const fetchVideos = async () => {
        try {
                const res = await fetch('http://localhost:8000/video/videos/hr');
                if (!res.ok) throw new Error('Gagal mengambil data video');
                
                const data = await res.json();

                // 1. Buat array of promises untuk generate semua thumbnail
                const thumbnailPromises = data.map(async (video) => {
                    const fixedUrl = video.video_url.replace(/\\/g, "/");
                    const fullUrl = `http://localhost:8000/${fixedUrl}`;
                    // Tunggu thumbnail selesai di-generate untuk video ini
                    const thumb = await generateThumbnail(fullUrl);

                    // Kembalikan objek lengkap dengan thumbnail
                    return {
                        id: video.id_question,
                        title: video.title,
                        url: fullUrl,
                        thumbnail: thumb
                    };
                });

                // 2. Tunggu SEMUA promise selesai dengan Promise.all
                const videosWithThumbnails = await Promise.all(
                    data.map(async (video) => {
                        let thumb = null;
                        try {
                        thumb = await generateThumbnail(video.video_url);
                        } catch {
                        thumb = "https://via.placeholder.com/300x200?text=Video";
                        }

                        return {
                        id: video.id_question,
                        title: video.title,
                        url: video.video_url,
                        thumbnail: thumb
                        };
                    })
                );

                // 3. Update state HANYA SEKALI dengan data yang sudah lengkap
                setQuestionVideos(videosWithThumbnails);

            }

        //     // ✅ Sesuaikan nama field ke frontend
        //     const mapped = data.map(video => ({
        //     id: video.id_question,
        //     title: video.title,
        //     url: video.video_url,
        //     thumbnail: 'https://via.placeholder.com/300x200?text=Video' // bisa diganti nanti
        //     }));

        //     setQuestionVideos(mapped);
        // } 
            catch (err) {
            console.error(err);
        }
    };
        fetchVideos();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-6">
            <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Kelola video, pertanyaan, dan pengguna</p>
            </div>

            <div className="flex gap-2 mb-6 border-b border-gray-200">
            <button
                onClick={() => setActiveTab('videos')}
                className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all border-b-2 ${
                activeTab === 'videos'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
            >
                <Video size={20} />
                Upload Video
            </button>
            <button
                onClick={() => setActiveTab('questions')}
                className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all border-b-2 ${
                activeTab === 'questions'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
            >
                <ListChecks size={20} />
                List Pertanyaan
            </button>
            <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all border-b-2 ${
                activeTab === 'users'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
            >
                <Users size={20} />
                Pengguna
            </button>
            </div>

            {activeTab === 'videos' && (
            <VideoUploadPage videos={videos} setVideos={setVideos} />
            )}
            
            {activeTab === 'questions' && (
            <QuestionListPage
                questionVideos={questionVideos}
                questionLists={questionLists}
                setQuestionLists={setQuestionLists}
            />
            )}
            
            {activeTab === 'users' && (
            <UserManagementPage
                users={users}
                setUsers={setUsers}
                questionLists={questionLists}
            />
            )}
        </div>
        </div>
    );
}
