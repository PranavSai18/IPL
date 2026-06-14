import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Lobby = () => {
  const { user, token, logout } = useAuthStore();
  const [rooms, setRooms] = useState([]);
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchRooms();
  }, [user]);

  const fetchRooms = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/rooms');
      setRooms(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const createRoom = async (type) => {
    try {
      const res = await axios.post('http://localhost:5000/api/rooms', { type }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate(`/room/${res.data.code}`);
    } catch (err) {
      setError('Failed to create room');
    }
  };

  const joinRoom = async (code) => {
    try {
      const res = await axios.post('http://localhost:5000/api/rooms/join', { code }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate(`/room/${res.data.code}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to join room');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-navy-bg text-white p-6 font-['Inter']">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-10 pb-4 border-b border-white/5">
          <div>
            <h1 className="text-4xl font-heading text-gold tracking-wide">Auction Lobby</h1>
            <p className="text-slate-400 mt-1">Welcome, <span className="text-white font-medium">{user?.name}</span></p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right bg-navy-surface px-4 py-2 rounded-lg border border-white/5">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] mb-1">Wallet Balance</p>
              <p className="font-heading text-2xl text-green-success tracking-wide">₹{(user?.walletBalance / 10000000).toFixed(2)} Cr</p>
            </div>
            <button onClick={handleLogout} className="bg-navy-surface hover:bg-slate-800 px-4 py-2 rounded border border-white/10 text-xs font-bold uppercase tracking-widest transition">
              Logout
            </button>
          </div>
        </header>

        {error && <div className="bg-orange-alert/10 border border-orange-alert text-orange-alert p-3 rounded mb-6 text-sm">{error}</div>}

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <h2 className="text-xl font-heading tracking-wide border-b border-white/5 pb-2 text-orange">Public Rooms</h2>
            {rooms.length === 0 ? (
              <div className="bg-navy-surface rounded-xl p-8 text-center text-slate-500 border border-white/5">
                No active public rooms available. Create one to get started!
              </div>
            ) : (
              <div className="grid gap-4">
                {rooms.map(room => (
                  <div key={room._id} className="bg-navy-surface rounded-xl p-5 flex justify-between items-center border border-white/5 hover:border-gold/50 transition">
                    <div>
                      <h3 className="font-heading text-2xl tracking-wide">Room: <span className="text-gold">{room.code}</span></h3>
                      <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Owner: <span className="text-slate-300">{room.owner?.name}</span> • Players: {room.players.length}/{room.maxPlayers}</p>
                    </div>
                    <button 
                      onClick={() => joinRoom(room.code)}
                      className="bg-gold hover:bg-yellow-400 px-5 py-2 rounded text-navy-bg font-bold tracking-widest uppercase text-xs transition shadow-lg shadow-gold/20"
                    >
                      Join
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-navy-surface p-6 rounded-xl border border-white/5">
              <h2 className="text-lg font-heading tracking-wide mb-4">Join Private Room</h2>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="CODE" 
                  className="w-full bg-navy-bg border border-white/10 rounded px-4 py-2 focus:outline-none focus:border-gold uppercase font-mono tracking-widest"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={6}
                />
                <button 
                  onClick={() => joinRoom(joinCode)}
                  className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded transition font-bold uppercase text-xs tracking-widest"
                >
                  Join
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange/20 to-navy-surface p-6 rounded-xl border border-orange/30 shadow-lg">
              <h2 className="text-lg font-heading tracking-wide mb-4 text-white">Create Room</h2>
              <div className="space-y-3">
                <button 
                  onClick={() => navigate('/create-room')}
                  className="w-full bg-orange hover:bg-orange/80 py-3 rounded font-bold tracking-widest uppercase text-xs transition text-white shadow-lg shadow-orange/20"
                >
                  Create Auction Room
                </button>
              </div>
            </div>
            
            <div className="bg-navy-surface p-6 rounded-xl border border-white/5">
              <button 
                onClick={async () => {
                  try {
                    const res = await axios.post('http://localhost:5000/api/players/seed');
                    alert(res.data.message);
                  } catch (err) {
                    alert('Error seeding database');
                  }
                }}
                className="w-full bg-navy-bg border border-green-success/50 text-green-success hover:bg-green-success hover:text-navy-bg py-2 rounded font-bold tracking-widest uppercase text-xs transition"
              >
                Seed Dummy Players
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
