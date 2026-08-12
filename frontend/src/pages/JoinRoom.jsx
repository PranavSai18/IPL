import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import axios from 'axios';

const JoinRoom = () => {
  const { user, token, login } = useAuthStore();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derived — no extra state needed
  const isAuthenticated = !!user;

  const handleLoginAndJoin = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!name.trim()) {
      setError('Please enter your name to join.');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { name });
      login(res.data.user, res.data.token);
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setError('Please enter a valid Arena Code.');
      setIsSubmitting(false);
      return;
    }

    try {
      const currentToken = token || localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/rooms/join', { code: cleanCode }, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      navigate(`/room/${res.data.code}`);
    } catch (err) {
      setError(
        err.response?.data?.error || 
        (err.request ? 'Failed to connect to backend server. Please make sure the server is running on port 5000.' : 'Failed to join room. Please check and try again.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0A06] text-white p-6 font-['Inter'] relative flex flex-col justify-between overflow-x-hidden">
      {/* Decorative fire/glow effects */}
      <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-[#FF6B00]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[20%] w-[500px] h-[500px] rounded-full bg-[#FFB800]/5 blur-[120px] pointer-events-none" />

      {/* HEADER */}
      <header className="max-w-6xl mx-auto w-full mb-6 flex justify-between items-center">
        <div 
          onClick={() => navigate('/')} 
          className="font-heading text-2xl tracking-widest cursor-pointer hover:opacity-80 transition"
        >
          <span className="text-[#FFB800]">IPL</span>
          <span className="text-[#FF6B00] ml-1">AUCTION</span>
        </div>
        <button 
          onClick={() => navigate('/')}
          className="bg-[#1A1008] hover:bg-white/5 border border-white/10 px-4 py-1.5 rounded-lg font-bold uppercase text-[10px] tracking-wider transition"
        >
          Exit
        </button>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-md mx-auto w-full flex-grow flex flex-col justify-center items-center my-8 relative z-10">
        <div className="bg-[#1A1008] border border-white/5 rounded-2xl p-8 w-full shadow-2xl relative text-center">
          
          {!isAuthenticated ? (
            /* ── AUTHENTICATION STEP ── */
            <>
              <span className="text-4xl block mb-2">🎯</span>
              <h2 className="text-3xl font-heading text-[#FFB800] tracking-widest mb-1 uppercase">JOIN ARENA LOBBY</h2>
              <p className="text-white/40 text-xs mb-6 uppercase tracking-wider font-semibold">Step 1 of 2: Who is entering the draft?</p>

              {error && (
                <div className="bg-[#FF6B00]/10 border border-[#FF6B00] text-[#FF6B00] p-3 rounded-xl mb-4 text-xs font-semibold uppercase tracking-wider text-center animate-shake">
                  {error}
                </div>
              )}

              <form onSubmit={handleLoginAndJoin} className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-white/50 font-bold block text-left mb-1.5">Your Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. MS Dhoni"
                    className="w-full bg-[#0E0A06] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#FFB800] text-center font-bold tracking-wide"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#FFB800] hover:bg-[#FFB800]/90 text-[#0E0A06] font-black uppercase text-xs tracking-widest py-3.5 rounded-xl transition shadow-lg shadow-[#FFB800]/25 disabled:opacity-50"
                >
                  {isSubmitting ? 'AUTHENTICATING...' : 'PROCEED TO JOIN ARENA →'}
                </button>
              </form>
            </>
          ) : (
            /* ── CODE ENTRY STEP ── */
            <>
              <span className="text-4xl block mb-2">⚡</span>
              <h2 className="text-3xl font-heading text-[#FFB800] tracking-widest mb-1 uppercase">ENTER ARENA</h2>
              <p className="text-white/40 text-xs mb-6 uppercase tracking-wider font-semibold">Welcome, {user?.name}. Please enter your code.</p>

              {error && (
                <div className="bg-red-950/40 border border-red-700/50 text-red-200 p-3.5 rounded-xl mb-5 text-xs font-semibold uppercase tracking-wide text-center">
                  ⚠️ {error}
                </div>
              )}

              <form onSubmit={handleJoinRoom} className="space-y-5">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-white/50 font-bold block text-left mb-1.5">Arena Invite Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. LM8LEU"
                    className="w-full bg-[#0E0A06] border border-white/10 rounded-xl px-4 py-3 text-xl focus:outline-none focus:border-[#FFB800] text-center uppercase font-mono font-black tracking-widest text-[#FFB800]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white font-black uppercase text-xs tracking-widest py-3.5 rounded-xl transition shadow-lg shadow-[#FF6B00]/25 disabled:opacity-50"
                >
                  {isSubmitting ? 'CONNECTING TO DRAFT...' : '🎯 JOIN ARENA LOBBY'}
                </button>
              </form>
            </>
          )}

        </div>
      </main>

      {/* FOOTER */}
      <footer className="max-w-6xl mx-auto w-full text-center text-[10px] uppercase tracking-widest text-white/20 mt-6 pt-4 border-t border-white/5">
        IPL Auction Live Simulator • Participant Entry Panel
      </footer>
    </div>
  );
};

export default JoinRoom;
