import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Lobby = () => {
  const { user, token, logout } = useAuthStore();
  const [rooms, setRooms] = useState([]);
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/rooms');
      setRooms(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    setTimeout(() => {
      fetchRooms();
    }, 0);
  }, [user, navigate]);

  const joinRoom = async (code) => {
    if (!code.trim()) return;
    try {
      setError('');
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
    <div className="h-screen bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#1a0f08] to-[#0d0805] text-[#f5f0e8] font-['Inter'] flex flex-col overflow-hidden relative">
      {/* Ambient glow */}
      <div className="absolute top-[-15%] left-[25%] w-[500px] h-[500px] rounded-full bg-[#FF6B00]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[20%] w-[500px] h-[500px] rounded-full bg-[#FFB800]/4 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="w-full flex-shrink-0 border-b border-white/5 bg-black/20 backdrop-blur-sm z-20">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex justify-between items-center">
          <div
            onClick={() => navigate('/')}
            className="font-heading text-2xl tracking-widest cursor-pointer hover:opacity-80 transition"
          >
            <span className="text-[#FFB800]">IPL </span>
            <span className="text-[#FF6B00]">AUCTION</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right bg-[#1A1008] px-4 py-1.5 rounded-lg border border-white/5">
              <p className="text-[8px] text-white/40 font-bold uppercase tracking-[0.15em]">Welcome</p>
              <p className="font-heading text-sm text-[#FFB800] tracking-wide">{user?.name}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-[10px] uppercase tracking-widest border border-white/10 hover:border-[#FF6B00] px-4 py-2 rounded-lg transition bg-[#1A1008] hover:bg-[#1A1008]/80 font-bold text-white/60 hover:text-[#FF6B00]"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto min-h-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style>{`.lobby-scroll::-webkit-scrollbar { display: none; }`}</style>
        <div className="lobby-scroll max-w-6xl mx-auto px-6 py-6">

          {error && (
            <div className="bg-[#FF6B00]/10 border border-[#FF6B00]/30 text-[#FF6B00] p-3 rounded-xl mb-5 text-xs font-bold uppercase tracking-wider text-center flex items-center justify-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">

            {/* LEFT — Public Rooms (2/3 width) */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="font-heading text-lg text-[#FFB800] tracking-widest uppercase">Public Rooms</h2>
                  <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded">
                    {rooms.length} Active
                  </span>
                </div>
                <button
                  onClick={fetchRooms}
                  className="text-[9px] uppercase tracking-widest text-white/40 hover:text-[#FFB800] border border-white/5 hover:border-[#FFB800]/30 px-3 py-1.5 rounded-lg transition font-bold"
                >
                  ↻ Refresh
                </button>
              </div>

              {loading ? (
                <div className="bg-[#1A1008] border border-white/5 rounded-2xl p-12 text-center">
                  <div className="w-8 h-8 border-2 border-white/10 border-t-[#FFB800] rounded-full animate-spin mx-auto mb-3" />
                  <span className="text-white/30 text-[10px] uppercase tracking-widest font-bold">Loading rooms...</span>
                </div>
              ) : rooms.length === 0 ? (
                /* Empty State */
                <div className="bg-[#1A1008] border border-white/5 rounded-2xl p-10 text-center relative overflow-hidden">
                  <div className="absolute inset-0 pointer-events-none opacity-20" style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(255,184,0,0.15) 0%, transparent 70%)' }} />
                  <div className="relative z-10">
                    <span className="text-5xl block mb-4">🏏</span>
                    <h3 className="font-heading text-xl text-[#FFB800] tracking-widest uppercase mb-2">
                      No Active Rooms
                    </h3>
                    <p className="text-white/40 text-xs uppercase tracking-wider leading-relaxed max-w-sm mx-auto mb-6">
                      Be the first to create an auction room and invite your friends to join the bidding war!
                    </p>
                    <button
                      onClick={() => navigate('/room/create')}
                      className="bg-gradient-to-r from-[#f5a623] to-[#ff6b35] hover:from-[#ff6b35] hover:to-[#f5a623] text-[#0d0805] font-black uppercase text-[11px] tracking-widest py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-[1.03] shadow-lg shadow-[#f5a623]/25"
                    >
                      🏟️ CREATE AUCTION ROOM
                    </button>
                  </div>
                </div>
              ) : (
                /* Room Cards */
                <div className="space-y-3">
                  {rooms.map(room => (
                    <div
                      key={room._id}
                      className="bg-[#1A1008] rounded-xl p-4 flex justify-between items-center border border-white/5 hover:border-[#FFB800]/25 transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-[#FFB800]/10 border border-[#FFB800]/20 flex items-center justify-center text-lg">
                          🏟️
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-heading text-base text-[#FFB800] tracking-widest">{room.code}</span>
                            <span className="text-[8px] font-bold uppercase tracking-wider bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <span className="h-1 w-1 rounded-full bg-[#00E676] animate-pulse" /> Waiting
                            </span>
                          </div>
                          <p className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5 font-bold">
                            Host: <span className="text-white/60">{room.owner?.name || 'Unknown'}</span>
                            <span className="mx-1.5 text-white/15">•</span>
                            Players: <span className="text-white/60">{room.players?.length || 0}/{room.maxPlayers || 10}</span>
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => joinRoom(room.code)}
                        className="bg-[#FF6B00] hover:bg-[#FF6B00]/85 text-white font-black uppercase text-[10px] tracking-widest px-5 py-2.5 rounded-lg transition-all transform hover:-translate-y-0.5 shadow-lg shadow-[#FF6B00]/20 opacity-80 group-hover:opacity-100"
                      >
                        Join →
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT — Actions Panel (1/3 width) */}
            <div className="space-y-5">

              {/* Join Private Room */}
              <div className="bg-[#1A1008] border border-white/5 rounded-2xl p-5">
                <h3 className="font-heading text-sm text-white tracking-widest uppercase mb-3 flex items-center gap-2">
                  <span className="text-base">🔑</span> Join Private Room
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="ENTER CODE"
                    className="flex-1 bg-[#0d0805] border border-white/10 rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-[#FFB800]/50 uppercase font-mono tracking-[0.3em] text-sm text-[#FFB800] placeholder:text-white/15 placeholder:tracking-widest placeholder:text-[10px] placeholder:font-sans"
                    value={joinCode}
                    onChange={e => setJoinCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    onKeyDown={e => e.key === 'Enter' && joinRoom(joinCode)}
                  />
                  <button
                    onClick={() => joinRoom(joinCode)}
                    className="bg-[#1c1410] hover:bg-white/5 border border-white/10 hover:border-[#FFB800]/30 px-4 py-2.5 rounded-lg transition font-bold uppercase text-[10px] tracking-widest text-white/60 hover:text-[#FFB800]"
                  >
                    Join
                  </button>
                </div>
              </div>

              {/* Create Room */}
              <div className="bg-gradient-to-br from-[#FF6B00]/10 to-[#1A1008] border border-[#FF6B00]/20 rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#FF6B00]/5 blur-[40px] pointer-events-none" />
                <h3 className="font-heading text-sm text-white tracking-widest uppercase mb-3 flex items-center gap-2 relative z-10">
                  <span className="text-base">🏟️</span> Create Room
                </h3>
                <p className="text-[10px] text-white/40 leading-relaxed mb-4 relative z-10">
                  Set up your own auction arena with custom rules, franchises, and player pools.
                </p>
                <button
                  onClick={() => navigate('/room/create')}
                  className="w-full bg-gradient-to-r from-[#f5a623] to-[#ff6b35] hover:from-[#ff6b35] hover:to-[#f5a623] text-[#0d0805] font-black uppercase text-[10px] tracking-widest py-3 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-[#f5a623]/20 relative z-10"
                >
                  Create Auction Room →
                </button>
              </div>

              {/* Quick Info */}
              <div className="bg-[#1A1008] border border-white/5 rounded-2xl p-5">
                <h3 className="text-[9px] uppercase tracking-widest text-white/30 font-bold mb-3">How It Works</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <span className="font-heading text-sm font-extrabold text-[#f5a623] opacity-50 leading-none mt-0.5">①</span>
                    <p className="text-[10px] text-white/50 leading-relaxed">Create a room or join with a code shared by the host.</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="font-heading text-sm font-extrabold text-[#f5a623] opacity-50 leading-none mt-0.5">②</span>
                    <p className="text-[10px] text-white/50 leading-relaxed">Claim your franchise in the lobby and wait for the host to launch.</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="font-heading text-sm font-extrabold text-[#f5a623] opacity-50 leading-none mt-0.5">③</span>
                    <p className="text-[10px] text-white/50 leading-relaxed">Bid on players in real-time and build your dream squad!</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Lobby;
