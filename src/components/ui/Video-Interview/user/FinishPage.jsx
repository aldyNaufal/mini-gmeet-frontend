import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ArrowRight, Home } from 'lucide-react';


const FinishPage = () => {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen flex items-center justify-center bg-green-50 p-6">
        <div className="max-w-xl bg-white rounded-xl shadow-lg p-8 text-center">
            <h1 className="text-2xl font-bold mb-4 text-green-700">Interview Selesai</h1>
            <p className="text-gray-700 text-justify">
            Terima kasih telah menyelesaikan video interview. Jawaban anda akan segera dievaluasi oleh tim kami, harap menunggu email lanjutan
            </p>
            <button
                onClick={() => navigate("/video-interview")}
                className="mt-4 inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700"
            >
                <Home className="mr-2" />
                Kembali ke Beranda
            </button>
        </div>
        </div>
    );
};

export default FinishPage;
