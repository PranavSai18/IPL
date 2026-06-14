import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Lobby from './pages/Lobby';
import Room from './pages/Room';
import CreateRoom from './pages/CreateRoom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/create-room" element={<CreateRoom />} />
        <Route path="/room/:code" element={<Room />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
