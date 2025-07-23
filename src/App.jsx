import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Room from './pages/MeetingRoom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/room/:roomId" element={<Room />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
