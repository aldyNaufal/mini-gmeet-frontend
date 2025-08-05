import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MeetingRoom from './pages/MeetingRoom';
import Assignment from './pages/Assignment';
import Home from './pages/home/Home'
import Layout from './components/layout/Layout';
import InterviewResult from './pages/InterviewResult';
import VideoInterview from './pages/VideoInterview';

function App() {
  return (
    <BrowserRouter>
      <Routes>
         <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="assignment" element={<Assignment />} />
          <Route path="interview-result" element={<InterviewResult />} />
          <Route path="video-interview" element={<VideoInterview />} />
        </Route>
        
        {/* <Route path="admin-room" element={<AdminRoom />} /> */}
        {/* <Route path="/room" element={<Room />} /> */}
        <Route path="/room" element={<MeetingRoom />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
