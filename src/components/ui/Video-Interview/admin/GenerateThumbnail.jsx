const generateThumbnail = (videoUrl) => {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.src = videoUrl;
        video.crossOrigin = 'anonymous';

        // Tunggu metadata dulu
        video.addEventListener('loadedmetadata', () => {
        // Set frame yang mau diambil
        video.currentTime = 1; 
        });

        // Kalau frame sudah siap, baru ambil thumbnail
        video.addEventListener('seeked', () => {
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 200;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        resolve(canvas.toDataURL('image/png'));
        });

        video.addEventListener('error', (err) => {
        console.error("Gagal memuat video:", videoUrl, err);
        // fallback biar ngga ganggu semuanya
        resolve(null);
        });
    });
};

export default generateThumbnail;
