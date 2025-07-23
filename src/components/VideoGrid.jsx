function VideoGrid({ peers, userId }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {Object.entries(peers).map(([id, stream]) => (
        <div key={id} className="relative w-full aspect-video bg-black rounded overflow-hidden shadow">
          <video
            autoPlay
            playsInline
            muted={id === userId}
            ref={(video) => {
              if (video && stream) video.srcObject = stream;
            }}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-sm">
            {id === userId ? 'You' : `User ${id.slice(0, 4)}`}
          </div>
        </div>
      ))}
    </div>
  );
}

export default VideoGrid;
