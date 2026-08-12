import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Lobby from './pages/Lobby';
import Room from './pages/Room';
import CreateRoom from './pages/CreateRoom';
import JoinRoom from './pages/JoinRoom';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/create-room" element={<CreateRoom />} />
        <Route path="/room/create" element={<CreateRoom />} />
        <Route path="/room/join" element={<JoinRoom />} />
        <Route path="/room/:code" element={<ErrorBoundary><Room /></ErrorBoundary>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

