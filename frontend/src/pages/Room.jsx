import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useAuctionStore, socket } from '../store/auctionStore';
import axios from 'axios';

/* ══════════════════════════════════════════════════════════════════
   PARTICLE CANVAS (FIRE & GOLD BACKGROUND)
   ══════════════════════════════════════════════════════════════════ */
const ParticleCanvas = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    const pts = Array.from({ length: 45 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 2 + 0.4,
      vx: (Math.random() - 0.5) * 0.15,
      vy: -(Math.random() * 0.4 + 0.1),
      a: Math.random() * 0.4 + 0.05,
      c: Math.random() > 0.5 ? '255,107,0' : '255,184,0',
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pts.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.a += (Math.random() - 0.5) * 0.005;
        p.a = Math.max(0.02, Math.min(0.5, p.a));
        if (p.y < -8) { p.y = canvas.height + 8; p.x = Math.random() * canvas.width; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.c},${p.a})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}
    />
  );
};

/* ══════════════════════════════════════════════════════════════════
   OFFICIAL TEAMS METADATA
   ══════════════════════════════════════════════════════════════════ */
const TEAMS = [
  { id: 'CSK', name: 'Chennai Super Kings', color: '#F5C518', logo: 'https://scores.iplt20.com/ipl/teamlogos/CSK.png', textColor: '#0E0A06' },
  { id: 'MI', name: 'Mumbai Indians', color: '#004BA0', logo: 'https://scores.iplt20.com/ipl/teamlogos/MI.png', textColor: '#FFFFFF' },
  { id: 'RCB', name: 'Royal Challengers Bengaluru', color: '#C8102E', logo: 'https://scores.iplt20.com/ipl/teamlogos/RCB.png', textColor: '#FFFFFF' },
  { id: 'KKR', name: 'Kolkata Knight Riders', color: '#3A225D', logo: 'https://scores.iplt20.com/ipl/teamlogos/KKR.png', textColor: '#FFFFFF' },
  { id: 'SRH', name: 'Sunrisers Hyderabad', color: '#F26522', logo: 'https://scores.iplt20.com/ipl/teamlogos/SRH.png', textColor: '#FFFFFF' },
  { id: 'DC', name: 'Delhi Capitals', color: '#0078BC', logo: 'https://scores.iplt20.com/ipl/teamlogos/DC.png', textColor: '#FFFFFF' },
  { id: 'PBKS', name: 'Punjab Kings', color: '#D71920', logo: 'https://scores.iplt20.com/ipl/teamlogos/PBKS.png', textColor: '#FFFFFF' },
  { id: 'RR', name: 'Rajasthan Royals', color: '#E8295B', logo: 'https://scores.iplt20.com/ipl/teamlogos/RR.png', textColor: '#FFFFFF' },
  { id: 'GT', name: 'Gujarat Titans', color: '#1C3F6E', logo: 'https://scores.iplt20.com/ipl/teamlogos/GT.png', textColor: '#FFFFFF' },
  { id: 'LSG', name: 'Lucknow Super Giants', color: '#00A19C', logo: 'https://scores.iplt20.com/ipl/teamlogos/LSG.png', textColor: '#FFFFFF' }
];

const getTeamColors = (teamId) => {
  const t = TEAMS.find(x => x.id === teamId);
  return t ? { primary: t.color, secondary: '#1A1008' } : { primary: '#FF6B00', secondary: '#FFB800' };
};

const formatPrice = (val) => {
  if (!val) return '₹0';
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2).replace(/\.00$/, '')}CR`;
  return `₹${val / 100000}L`;
};

const getNationalityBadge = (p) => {
  const nat = p.nationality || 'Indian';
  const flags = {
    'India': '🇮🇳',
    'Indian': '🇮🇳',
    'Australia': '🇦🇺',
    'Sri Lanka': '🇱🇰',
    'England': '🇬🇧',
    'West Indies': '🌴',
    'Bangladesh': '🇧🇩',
    'New Zealand': '🇳🇿',
    'South Africa': '🇿🇦',
    'Afghanistan': '🇦🇫',
    'Overseas': '✈️'
  };
  const flag = flags[nat] || flags[nat === 'Overseas' ? 'Overseas' : 'India'] || '🇮🇳';
  const displayName = nat === 'Overseas' ? 'Overseas' : nat;
  return (
    <span className="text-white/60 text-[10px] font-bold flex items-center gap-1">
      <span>{flag}</span>
      <span>{displayName}</span>
    </span>
  );
};

const getRoleBadge = (role) => {
  if (!role) return null;
  const r = role.toLowerCase();
  let badgeColor = 'bg-[#FFB800]/10 border-[#FFB800]/30 text-[#FFB800]'; // Default Batter gold
  if (r.includes('bowler')) {
    badgeColor = 'bg-[#FF6B00]/10 border-[#FF6B00]/30 text-[#FF6B00]'; // Bowler orange
  } else if (r.includes('all-rounder') || r.includes('all rounder')) {
    badgeColor = 'bg-[#FF3333]/10 border-[#FF3333]/30 text-[#FF3333]'; // All-rounder red
  } else if (r.includes('wk') || r.includes('keeper') || r.includes('batsman-wk') || r.includes('batter-wk')) {
    badgeColor = 'bg-[#FFA000]/10 border-[#FFA000]/30 text-[#FFA000]'; // WK amber
  }
  return (
    <span className={`border ${badgeColor} text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider`}>
      {role}
    </span>
  );
};

const getCappedBadge = (p) => {
  if (p.isCapped) {
    return (
      <span className="bg-[#FFB800]/15 border border-[#FFB800]/30 text-[#FFB800] text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
        Capped
      </span>
    );
  }
  return (
    <span className="bg-white/5 border border-white/10 text-white/40 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
      Uncapped
    </span>
  );
};

/* ══════════════════════════════════════════════════════════════════
   ROOM SIMULATOR COMPONENT
   ══════════════════════════════════════════════════════════════════ */
const Room = () => {
  const { code } = useParams();
  const { user, token } = useAuthStore();
  const navigate = useNavigate();

  const {
    room,
    auctionState,
    connectSocket,
    disconnectSocket,
    joinRoom,
    setRoomState,
    updateAuction,
    updateTimer
  } = useAuctionStore();

  // Component UI States
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');
  const [claimedTeam, setClaimedTeam] = useState(null); // The team this player holds
  const [availablePlayers, setAvailablePlayers] = useState([]); // Seeded players to choose retentions from
  const [selectedRetentions, setSelectedRetentions] = useState([]);
  const [showSquadDrawer, setShowSquadDrawer] = useState(false);
  const [tradeTarget, setTradeTarget] = useState('');
  const [tradeOffer, setTradeOffer] = useState('');
  const [tradeRequest, setTradeRequest] = useState('');
  const [tradeProposal, setTradeProposal] = useState(null);
  const [showSpectatorView, setShowSpectatorView] = useState(false);

  // Animation triggers
  const [soldAnimation, setSoldAnimation] = useState(false);
  const [soldPlayer, setSoldPlayer] = useState(null);
  const [unsoldAnimation, setUnsoldAnimation] = useState(false);
  const [confetti, setConfetti] = useState([]);

  const logsEndRef = useRef(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Load Seeded Players (for retention options)
  useEffect(() => {
    const fetchSeeded = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/players');
        setAvailablePlayers(res.data);
      } catch (err) {
        console.error('Failed to load players pool', err);
      }
    };
    fetchSeeded();
  }, []);

  // Connect socket and load room details
  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    connectSocket();

    const loadRoom = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/rooms/${code}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        joinRoom(res.data._id, user._id);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to connect to room.');
      }
    };
    loadRoom();

    // Sockets listeners
    socket.on('room-state', (data) => {
      setRoomState(data);
      
      // Determine if we claimed a team
      const myClaim = Object.values(data.room?.teamsState || {}).find(t => t.userId === user._id);
      if (myClaim) {
        setClaimedTeam(myClaim);
        setSelectedRetentions(availablePlayers.filter(p => myClaim.retentions.includes(p.name)));
      } else {
        setClaimedTeam(null);
      }
    });

    socket.on('error-msg', (data) => {
      alert(data.message);
    });

    socket.on('trade-proposal', (data) => {
      // Show proposal if we are the target team
      const myTeam = Object.values(useAuctionStore.getState().room?.teamsState || {}).find(t => t.userId === user._id);
      if (myTeam && myTeam.teamId === data.toTeamId) {
        setTradeProposal(data);
      }
    });

    socket.on('auction-update', (data) => {
      updateAuction(data);
    });

    socket.on('rtm-triggered', (data) => {
      updateAuction(data);
      setLogs(prev => [...prev, {
        id: Date.now() + Math.random(),
        type: 'bid',
        message: `🔥 RTM card triggered by ${data.rtmState.rtmTeamId}! counter-bid pending.`
      }]);
    });

    socket.on('rtm-update', (data) => {
      updateAuction(data);
    });

    socket.on('timer-update', ({ timeLeft }) => {
      updateTimer(timeLeft);
    });

    socket.on('player-sold', ({ player, buyerId, buyerTeamId, price, rtmUsed }) => {
      const buyerName = buyerTeamId || 'Someone';
      const msg = buyerTeamId 
        ? `🏆 ${player.name} sold to ${buyerName} for ${formatPrice(price)}! ${rtmUsed ? '(via RTM)' : ''}` 
        : `❌ ${player.name} went UNSOLD.`;
      
      if (buyerTeamId) {
        setSoldPlayer({ player, buyerTeamId, price });
        setSoldAnimation(true);
        triggerConfetti(buyerTeamId);
        setTimeout(() => setSoldAnimation(false), 3500);
      } else {
        setUnsoldAnimation(true);
        setTimeout(() => setUnsoldAnimation(false), 2500);
      }

      setLogs(prev => [...prev, {
        id: Date.now() + Math.random(),
        type: buyerTeamId ? 'sold' : 'unsold',
        message: msg
      }]);
    });

    socket.on('auction-ended', ({ message }) => {
      alert(message);
      navigate('/lobby');
    });

    return () => {
      socket.off('room-state');
      socket.off('error-msg');
      socket.off('trade-proposal');
      socket.off('auction-update');
      socket.off('rtm-triggered');
      socket.off('rtm-update');
      socket.off('timer-update');
      socket.off('player-sold');
      socket.off('auction-ended');
      disconnectSocket();
    };
  }, [code, user, token]);

  const triggerConfetti = (teamId) => {
    const colors = [getTeamColors(teamId).primary, '#FFD700', '#FF6B00', '#FFFFFF'];
    const p = Array.from({ length: 60 }, () => ({
      id: Math.random(),
      x: Math.random() * 100,
      y: -10 - Math.random() * 20,
      r: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 2
    }));
    setConfetti(p);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#0E0A06] text-white flex items-center justify-center font-['Inter']">
        <div className="bg-[#1A1008] border border-[#FF6B00] rounded-2xl p-10 max-w-md text-center shadow-2xl">
          <span className="text-5xl block mb-4">⚠️</span>
          <h2 className="text-2xl font-heading text-[#FFB800] tracking-widest mb-4">ROOM ERROR</h2>
          <p className="text-white/60 mb-8">{error}</p>
          <button onClick={() => navigate('/lobby')} className="btn-orange px-6 py-2.5 text-xs font-bold tracking-widest">
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-[#0E0A06] text-white flex flex-col items-center justify-center font-['Inter'] gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-white/5 border-t-[#FFB800] animate-spin" />
        <p className="text-[#FFB800] font-heading tracking-widest text-lg">Entering Bidding Arena...</p>
      </div>
    );
  }

  const isOwner = room.owner?._id === user._id || room.owner === user._id;
  const isAuctionActive = room.status === 'active';
  const player = auctionState?.currentPlayer;
  const timeLeft = auctionState?.timeLeft;
  const rtmState = auctionState?.rtmState;
  
  // BCCI Increments check
  const getBcciIncrement = (currentVal) => {
    if (currentVal < 10000000) return 500000;
    if (currentVal < 20000000) return 1000000;
    if (currentVal < 50000000) return 2500000;
    return 5000000;
  };

  const nextIncrement = getBcciIncrement(auctionState?.currentBid || 0);
  const nextBidAmount = (auctionState?.currentBid || 0) === 0 ? (player?.basePrice || 20000000) : (auctionState.currentBid + nextIncrement);

  const handlePlaceBid = () => {
    if (!claimedTeam) return;
    socket.emit('place-bid', { roomId: room._id, userId: user._id, teamId: claimedTeam.teamId, amount: nextBidAmount });
  };

  const handleClaimFranchise = (teamId) => {
    socket.emit('select-team', { roomId: room._id, userId: user._id, teamId });
  };

  // Retention handlers
  const handleToggleRetention = (p) => {
    if (!claimedTeam) return;
    const isRetained = selectedRetentions.some(x => x.name === p.name);
    let newRet = [];
    if (isRetained) {
      newRet = selectedRetentions.filter(x => x.name !== p.name);
    } else {
      if (selectedRetentions.length >= 6) {
        alert("Maximum 6 retentions allowed!");
        return;
      }
      newRet = [...selectedRetentions, p];
    }
    setSelectedRetentions(newRet);
    socket.emit('update-retentions', { roomId: room._id, userId: user._id, teamId: claimedTeam.teamId, retentions: newRet });
  };

  // Trade actions
  const handleProposeTrade = (e) => {
    e.preventDefault();
    if (!claimedTeam) return;
    socket.emit('propose-trade', {
      roomId: room._id,
      fromTeamId: claimedTeam.teamId,
      toTeamId: tradeTarget,
      offerPlayer: tradeOffer,
      requestPlayer: tradeRequest
    });
    alert('Trade proposed!');
  };

  const handleAcceptTrade = () => {
    if (!tradeProposal) return;
    socket.emit('accept-trade', {
      roomId: room._id,
      fromTeamId: tradeProposal.fromTeamId,
      toTeamId: tradeProposal.toTeamId,
      offerPlayer: tradeProposal.offerPlayer,
      requestPlayer: tradeProposal.requestPlayer
    });
    setTradeProposal(null);
  };

  const handleRtmDecision = (useRtm) => {
    socket.emit('rtm-decision', { roomId: room._id, teamId: claimedTeam.teamId, useRtm });
  };

  const handleCounterBid = (raiseAmount) => {
    socket.emit('place-counter-bid', { roomId: room._id, teamId: claimedTeam.teamId, amount: raiseAmount });
  };

  const handlePassCounter = () => {
    socket.emit('pass-counter-bid', { roomId: room._id, teamId: claimedTeam.teamId });
  };

  const handleMatchFinalRtm = (match) => {
    socket.emit('final-match-rtm', { roomId: room._id, teamId: claimedTeam.teamId, match });
  };

  return (
    <>
      <ParticleCanvas />

      {/* Confetti Overlay */}
      {soldAnimation && (
        <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
          {confetti.map(c => (
            <div
              key={c.id}
              style={{
                position: 'absolute',
                left: `${c.x}%`,
                top: `${c.y}%`,
                width: c.r,
                height: c.r,
                backgroundColor: c.color,
                borderRadius: '50%',
                animation: `confettiFall 3.5s ease-out infinite`,
                animationDelay: `${c.delay}s`
              }}
            />
          ))}
        </div>
      )}

      <div className="min-h-screen bg-[#0E0A06] text-white font-['Inter'] flex flex-col relative overflow-hidden z-10">
        
        {/* ─── FRANCHISE CLAIM SCREEN (IF NO TEAM ASSIGNED) ─── */}
        {!claimedTeam && !showSpectatorView && (
          <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-6 backdrop-blur-md">
            <div className="bg-[#1A1008] border border-[#FF6B00]/40 rounded-2xl max-w-4xl w-full p-8 text-center shadow-2xl relative">
              <h2 className="text-3xl font-heading text-[#FFB800] tracking-widest mb-2">CLAIM YOUR FRANCHISE</h2>
              <p className="text-white/40 text-xs mb-6">Choose an available franchise board to command</p>
              
              {/* Room Invitation Panel */}
              <div className="mb-8 p-4 bg-[#0E0A06] border border-white/5 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 max-w-xl mx-auto text-left">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/40 font-bold uppercase tracking-wider">Lobby Code:</span>
                  <span className="font-mono text-xl text-[#FFB800] font-black tracking-widest">{code}</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(code);
                      alert('Invite code copied to clipboard!');
                    }}
                    className="text-[#FF6B00] hover:text-[#FF6B00]/80 text-xs font-black"
                    title="Copy Invite Code"
                  >
                    📋 Copy
                  </button>
                </div>
                <div className="hidden sm:block h-6 w-px bg-white/15" />
                <button 
                  onClick={() => setShowSpectatorView(true)}
                  className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-white/80 px-4 py-1.5 rounded-lg border border-white/10 text-[10px] font-black uppercase tracking-wider transition-all"
                >
                  👁 Enter as Spectator
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {TEAMS.map((team) => {
                  const claimedBy = Object.values(room.teamsState || {}).find(t => t.teamId === team.id);
                  const isClaimed = !!claimedBy;
                  
                  return (
                    <button
                      key={team.id}
                      disabled={isClaimed}
                      onClick={() => handleClaimFranchise(team.id)}
                      className={`relative p-5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                        isClaimed 
                          ? 'bg-black/40 border-white/5 opacity-30 cursor-not-allowed'
                          : 'bg-[#0E0A06] border-white/10 hover:border-[#FFB800] hover:shadow-[0_0_15px_rgba(255,184,0,0.15)] transform hover:-translate-y-1'
                      }`}
                    >
                      <img
                        src={team.logo}
                        alt={`${team.name} Logo`}
                        className="h-12 w-12 object-contain mb-2"
                      />
                      <span className="font-bold text-sm text-white block mb-1">{team.id}</span>
                      <h3 className="text-[10px] text-white/50 line-clamp-1 mb-1">{team.name}</h3>
                      {isClaimed && (
                        <span className="text-[9px] text-[#FF6B00] uppercase font-black tracking-widest mt-1 block">
                          Claimed
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ─── HEADER indicator ─── */}
        <header className="bg-[#1A1008] border-b border-[#FF6B00]/20 px-6 py-4 flex justify-between items-center z-20 relative">
          <div className="flex items-center gap-6">
            <div onClick={() => navigate('/lobby')} className="font-heading text-2xl tracking-widest cursor-pointer text-white">
              <span className="text-[#FFB800]">IPL </span>
              <span className="text-[#FF6B00]">DRAFT</span>
            </div>
            
            {/* Room Invitation details */}
            <div className="flex items-center gap-2 bg-black/45 border border-white/5 px-3 py-1.5 rounded-lg">
              <span className="text-[9px] text-white/40 font-bold uppercase tracking-wider">Room Code:</span>
              <span className="font-mono text-xs text-[#FFB800] font-black tracking-widest">{code}</span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(code);
                  alert('Invite code copied to clipboard!');
                }}
                className="text-[#FF6B00] hover:text-[#FF6B00]/80 text-[10px] ml-1 font-bold"
                title="Copy Invite Code"
              >
                📋 Copy
              </button>
            </div>

            {isAuctionActive && (
              <span className="bg-[#FF6B00]/10 border border-[#FF6B00]/30 text-[#FF6B00] px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">
                {room.currentRound} Round
              </span>
            )}
          </div>

          {!claimedTeam && (
            <div className="flex items-center gap-3">
              <span className="bg-white/5 border border-white/10 text-white/60 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B00] animate-ping" />
                👁 Spectator Mode
              </span>
              <button
                onClick={() => setShowSpectatorView(false)}
                className="bg-[#FFB800] hover:bg-[#FFB800]/90 text-[#0E0A06] font-black px-4 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition-all"
              >
                Claim Franchise
              </button>
            </div>
          )}

          {claimedTeam && (
            <div className="flex items-center gap-6">
              {/* Franchise remaining info */}
              <div 
                className={`bg-[#0E0A06] px-4 py-2 rounded-lg border transition-all ${
                  claimedTeam.purse < 100000000 
                    ? 'border-[#FF3333] shadow-[0_0_15px_rgba(255,51,51,0.2)] animate-pulse' 
                    : 'border-white/5'
                }`}
              >
                <div className="text-[9px] text-white/40 font-bold uppercase tracking-wider mb-0.5">Remaining Purse</div>
                <div className={`font-heading text-xl tracking-wide ${claimedTeam.purse < 100000000 ? 'text-[#FF3333]' : 'text-[#FFB800]'}`}>
                  {formatPrice(claimedTeam.purse)}
                </div>
              </div>

              <div className="bg-[#0E0A06] px-4 py-2 rounded-lg border border-white/5">
                <div className="text-[9px] text-white/40 font-bold uppercase tracking-wider mb-0.5">Squad size</div>
                <div className="font-heading text-xl text-white tracking-wide">
                  {claimedTeam.squad?.length || 0}/25
                </div>
              </div>

              {room.auctionType === 'mega' && (
                <div className="bg-[#0E0A06] px-4 py-2 rounded-lg border border-white/5">
                  <div className="text-[9px] text-white/40 font-bold uppercase tracking-wider mb-0.5">RTM Cards</div>
                  <div className="font-heading text-xl text-[#FF6B00] tracking-wide">
                    {claimedTeam.rtmCards} Left
                  </div>
                </div>
              )}

              <button 
                onClick={() => setShowSquadDrawer(true)}
                className="bg-[#0E0A06] border border-white/10 hover:border-[#FFB800] text-xs uppercase tracking-widest font-black px-4 py-2.5 rounded-lg transition"
              >
                Squad
              </button>
            </div>
          )}
        </header>

        {/* ─── MAIN SIMULATION AREA ─── */}
        <div className="flex-grow flex relative z-10 overflow-hidden">
          
          {/* ─ LEFT: ACTION BLOCK ─ */}
          <div className="flex-grow p-6 flex flex-col justify-center items-center overflow-y-auto">
            
            {/* ▬▬ PRE-AUCTION STATE (LOUNGE STRATEGY BOARD) ▬▬ */}
            {!isAuctionActive ? (
              <div className="max-w-4xl w-full bg-[#1A1008] border border-[#FF6B00]/15 rounded-2xl p-8 shadow-2xl relative text-center">
                <h1 className="text-3xl font-heading text-white tracking-wide mb-2">PRE-AUCTION STRATEGY LOUNGE</h1>
                <p className="text-white/40 text-xs mb-8 uppercase tracking-widest">
                  Configure retentions {room.auctionType === 'mini' && '& trades'} before live draft begins
                </p>

                <div className="grid md:grid-cols-2 gap-8 mb-8 text-left">
                  
                  {/* Mega mode: Retentions */}
                  {room.auctionType === 'mega' && (
                    <div className="bg-[#0E0A06] border border-white/5 rounded-xl p-6">
                      <h3 className="font-heading text-lg text-[#FFB800] mb-2">RETENTIONS BOARD</h3>
                      {claimedTeam ? (
                        <>
                          <p className="text-white/40 text-[10px] uppercase tracking-widest mb-4">
                            Max 6 retentions (max 5 capped, 1 uncapped). Live purse deduction:
                          </p>
                          <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                            {availablePlayers.filter(p => p.team === claimedTeam.teamId).map(p => {
                              const isRetained = selectedRetentions.some(x => x.name === p.name);
                              return (
                                <div 
                                  key={p.name}
                                  onClick={() => handleToggleRetention(p)}
                                  className={`flex justify-between items-center p-3 rounded-lg border cursor-pointer transition-all ${
                                    isRetained 
                                      ? 'border-[#FF6B00] bg-[#FF6B00]/5' 
                                      : 'border-white/5 hover:border-white/10'
                                  }`}
                                >
                                  <div>
                                    <span className="font-bold text-sm text-white block">{p.name}</span>
                                    <span className="text-[10px] text-white/40 uppercase tracking-widest">
                                      {p.role} • {p.isCapped ? 'Capped' : 'Uncapped'}
                                    </span>
                                  </div>
                                  <span className="font-mono text-xs text-[#FFB800] font-bold">
                                    {p.isCapped ? 'Capped Retention' : '₹4CR (Uncapped)'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <span className="text-3xl mb-3">👁</span>
                          <span className="text-xs text-white/40 font-bold uppercase tracking-wider">Spectator Mode</span>
                          <p className="text-[10px] text-white/30 max-w-[200px] mt-1 leading-normal">
                            You can view the boardroom status but cannot configure retentions.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mini mode: Trade board */}
                  {room.auctionType === 'mini' && (
                    <div className="bg-[#0E0A06] border border-white/5 rounded-xl p-6">
                      <h3 className="font-heading text-lg text-[#FFB800] mb-4">TRADE WINDOW</h3>
                      {claimedTeam ? (
                        <>
                          <form onSubmit={handleProposeTrade} className="space-y-4">
                            <div>
                              <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold block mb-2">Target Franchise</label>
                              <select 
                                value={tradeTarget}
                                onChange={e=>setTradeTarget(e.target.value)}
                                className="w-full bg-[#1A1008] border border-white/10 rounded p-2 text-xs focus:outline-none"
                              >
                                <option value="">Select Target...</option>
                                {TEAMS.filter(t=>t.id !== claimedTeam.teamId).map(t => (
                                  <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold block mb-2">Player to Offer</label>
                              <input 
                                type="text"
                                placeholder="Your squad player name"
                                value={tradeOffer}
                                onChange={e=>setTradeOffer(e.target.value)}
                                className="w-full bg-[#1A1008] border border-white/10 rounded p-2 text-xs focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold block mb-2">Player to Request</label>
                              <input 
                                type="text"
                                placeholder="Target franchise player name"
                                value={tradeRequest}
                                onChange={e=>setTradeRequest(e.target.value)}
                                className="w-full bg-[#1A1008] border border-white/10 rounded p-2 text-xs focus:outline-none"
                              />
                            </div>
                            <button type="submit" className="w-full btn-orange py-2 text-xs font-bold tracking-widest uppercase">
                              PROPOSE TRADE
                            </button>
                          </form>

                          {/* Trade Proposal Pending Popup */}
                          {tradeProposal && (
                            <div className="mt-4 bg-[#FF6B00]/10 border border-[#FF6B00] p-4 rounded-xl text-center">
                              <h4 className="font-bold text-xs uppercase tracking-wider mb-2 text-white">Incoming Trade Offer</h4>
                              <p className="text-white/60 text-xs mb-3">
                                {tradeProposal.fromTeamId} offers <span className="text-[#FFB800]">{tradeProposal.offerPlayer}</span> for your <span className="text-[#FF6B00]">{tradeProposal.requestPlayer}</span>
                              </p>
                              <div className="flex gap-2">
                                <button onClick={handleAcceptTrade} className="flex-1 btn-gold py-1 text-[10px] font-black tracking-widest">Accept</button>
                                <button onClick={()=>setTradeProposal(null)} className="flex-1 bg-[#1A1008] border border-white/10 hover:border-white/20 py-1 text-[10px] font-black tracking-widest">Reject</button>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <span className="text-3xl mb-3">👁</span>
                          <span className="text-xs text-white/40 font-bold uppercase tracking-wider">Spectator Mode</span>
                          <p className="text-[10px] text-white/30 max-w-[200px] mt-1 leading-normal">
                            You can view the boardroom status but cannot propose player trades.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
{/* Right side: Franchise Roster Status */}
                  <div className="bg-[#0E0A06] border border-white/5 rounded-xl p-6 flex flex-col justify-between">
                    <div>
                      <h3 className="font-heading text-lg text-white mb-4">BOARDROOM STATUS</h3>
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {Object.values(room.teamsState || {}).map(t => (
                          <div key={t.teamId} className="flex justify-between items-center p-2.5 bg-[#1A1008] rounded border border-white/5">
                            <span className="font-bold text-xs text-white">{t.teamId} Franchise</span>
                            <span className="text-[10px] uppercase text-[#FFB800] tracking-widest">
                              {t.retentions?.length || 0} Retained • {formatPrice(t.purse)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {isOwner && (
                      <button 
                        onClick={() => socket.emit('start-auction', { roomId: room._id, userId: user._id })}
                        className="w-full btn-gold py-3 text-xs font-black tracking-widest uppercase mt-6 shadow-lg shadow-[#FFB800]/20"
                      >
                        🚦 LAUNCH DRAFT ARENA
                      </button>
                    )}
                  </div>

                </div>
              </div>
            ) : (
              // ▬▬ LIVE AUCTION RUNNING STATE ▬▬
              <div className="flex flex-col md:flex-row gap-8 max-w-5xl w-full items-center justify-center relative">
                
                {/* ─ player Sold/Unsold Animation Overlays ─ */}
                {unsoldAnimation && (
                  <div className="absolute inset-0 bg-[#0E0A06]/95 z-20 flex items-center justify-center animate-fade-up p-6 rounded-2xl border border-[#FF3333]/25">
                    <div className="relative border-4 border-dashed border-[#FF3333] text-[#FF3333] font-heading text-6xl tracking-widest font-black rotate-[-12deg] px-12 py-6 rounded-2xl animate-pulse shadow-2xl shadow-[#FF3333]/15 bg-black/60 flex flex-col items-center justify-center">
                      <span className="text-[10px] tracking-[0.2em] uppercase font-black text-[#FF3333]/60 mb-2 block font-sans">Hammer Down</span>
                      UNSOLD
                      <span className="text-[8px] tracking-[0.1em] uppercase font-bold text-[#FF3333]/40 mt-3 block font-sans">No Bid Placed</span>
                    </div>
                  </div>
                )}

                {soldPlayer && soldAnimation && (
                  <div className="absolute inset-0 bg-black/95 z-20 flex flex-col items-center justify-center animate-fade-up text-center p-6 rounded-2xl border border-[#FFB800]/30 shadow-2xl shadow-[#FFB800]/5">
                    <div className="text-[10px] uppercase tracking-widest text-[#FFB800] font-black bg-[#FFB800]/10 px-4 py-1.5 rounded-full mb-6 border border-[#FFB800]/30 animate-pulse">
                      ⚡ HAMMER DOWN • SOLD ⚡
                    </div>
                    
                    <div className="mb-4 relative">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#1A1008] to-[#0E0A06] border-2 border-[#FFB800] flex items-center justify-center shadow-lg shadow-[#FFB800]/15 relative">
                        {TEAMS.find(t => t.id === soldPlayer.buyerTeamId)?.logo ? (
                          <img 
                            src={TEAMS.find(t => t.id === soldPlayer.buyerTeamId).logo} 
                            alt={soldPlayer.buyerTeamId} 
                            className="w-16 h-16 object-contain" 
                          />
                        ) : (
                          <span className="font-heading text-2xl text-white">{soldPlayer.buyerTeamId}</span>
                        )}
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-[#FFB800] text-[#0E0A06] font-black text-xs px-2.5 py-1 rounded-md border border-[#0E0A06] shadow">
                        {soldPlayer.buyerTeamId}
                      </div>
                    </div>

                    <h2 className="font-heading text-3xl font-black text-white tracking-wide mb-1 leading-none uppercase">{soldPlayer.player.name}</h2>
                    <p className="text-white/40 uppercase tracking-widest text-[9px] font-bold mb-4">Acquired Franchise Roster Addition</p>
                    
                    <div className="text-[10px] uppercase text-white/40 font-bold tracking-wider mb-1">Winning Bid Contract</div>
                    <div className="font-heading text-5xl font-black text-[#FFB800] drop-shadow-[0_0_15px_rgba(255,184,0,0.3)]">
                      {formatPrice(soldPlayer.price)}
                    </div>
                  </div>
                )}

                {/* Player Card */}
                {player ? (
                  <div className="w-80 h-[460px] bg-gradient-to-b from-[#1A1008] via-[#0E0A06] to-[#1A1008] border border-[#FF6B00]/40 rounded-2xl p-6 relative flex flex-col justify-between shadow-[0_0_30px_rgba(255,107,0,0.15)] overflow-hidden">
                    {/* Fire & Gold background mesh effect */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#FF6B00]/5 via-transparent to-transparent pointer-events-none" />

                    {/* Crown for marquee */}
                    {player.category?.includes('Marquee') && (
                      <div className="absolute -top-3 -right-3 bg-gradient-to-r from-[#FF6B00] to-[#FFB800] h-10 w-10 rounded-full flex items-center justify-center shadow-lg border border-[#0E0A06] animate-bounce z-10">
                        <span className="text-xl">👑</span>
                      </div>
                    )}

                    {/* Header: Category Badge and Nationality Badge */}
                    <div className="flex justify-between items-center z-10 border-b border-white/5 pb-3">
                      <span className="bg-[#FF6B00]/10 border border-[#FF6B00]/30 text-[#FF6B00] text-[9px] font-black px-2.5 py-1 rounded tracking-wider uppercase">
                        {player.category}
                      </span>
                      {getNationalityBadge(player)}
                    </div>

                    {/* Avatar visual */}
                    <div className="flex-grow flex items-center justify-center my-4 relative z-10">
                      <div className="w-32 h-32 rounded-full bg-[#1A1008] border-2 border-[#FFB800]/30 flex items-center justify-center shadow-lg relative overflow-hidden">
                        {player.imageUrl ? (
                          <img 
                            src={player.imageUrl} 
                            alt={player.name} 
                            className="w-full h-full object-contain p-1"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : null}
                        <div className="absolute inset-0 flex items-center justify-center font-heading text-4xl font-black text-[#FFB800] bg-gradient-to-br from-[#FF6B00]/10 to-[#FFB800]/5 pointer-events-none">
                          {player.name.split(' ').map(n=>n[0]).join('')}
                        </div>
                      </div>
                    </div>

                    {/* Details: Name, Role Badge, Capped status, Base price, Prev Team */}
                    <div className="text-center z-10">
                      <h2 className="font-heading text-2xl font-black text-white tracking-wide mb-2 leading-none uppercase">
                        {player.name}
                      </h2>
                      
                      <div className="flex justify-center items-center gap-2 mb-4">
                        {getRoleBadge(player.role)}
                        {getCappedBadge(player)}
                      </div>

                      <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4 text-left">
                        <div>
                          <span className="text-[9px] text-white/40 block font-bold uppercase tracking-wider">Base Price</span>
                          <span className="font-heading text-sm text-[#FFB800] font-black">{formatPrice(player.basePrice)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-white/40 block font-bold uppercase tracking-wider">Prev Team</span>
                          <span className="font-heading text-sm text-white font-bold">{player.team || 'None'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-white/30 text-sm">Loading player draft visual...</div>
                )}

                {/* Bidding Controls Arena */}
                <div className="flex-1 w-full max-w-sm flex flex-col gap-4">
                  
                  {/* Active Timer Box */}
                  <div className="bg-[#1A1008] border border-white/5 rounded-xl p-5 flex justify-between items-center shadow-lg">
                    <div>
                      <span className="text-[9px] text-white/40 block font-bold uppercase tracking-wider">Bidding Timer</span>
                      <span className="text-sm font-bold text-white mt-0.5 block">Live decision clock</span>
                    </div>
                    
                    <div 
                      className={`h-14 w-14 rounded-full border-4 flex items-center justify-center font-heading text-xl font-bold transition-all duration-300 ${
                        timeLeft <= 8 
                          ? 'border-[#FF3333] text-[#FF3333] shadow-[0_0_15px_rgba(255,51,51,0.25)] animate-pulse' 
                          : 'border-[#FFB800] text-[#FFB800]'
                      }`}
                    >
                      {timeLeft}s
                    </div>
                  </div>

                  {/* Live Bid details */}
                  <div className="bg-[#1A1008] border border-[#FF6B00]/25 rounded-2xl p-6 shadow-lg">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <span className="text-[9px] text-white/40 block font-bold uppercase tracking-wider">Current Highest Bid</span>
                        <div className="font-heading text-3xl text-[#FFB800] tracking-wide mt-1">
                          {formatPrice(auctionState?.currentBid || 0)}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-white/40 block font-bold uppercase tracking-wider">Leaderboard</span>
                        <div className="font-heading text-xl text-white tracking-wide mt-1.5">
                          {auctionState?.highestBidderTeam || 'No Bids'}
                        </div>
                      </div>
                    </div>

                    {/* Standard bidding controls */}
                    {!rtmState?.active && (
                      <div className="flex gap-4">
                        {claimedTeam ? (
                          <button
                            onClick={handlePlaceBid}
                            className="flex-grow bg-[#FF6B00] hover:bg-[#FF6B00]/80 text-white font-black uppercase tracking-widest text-xs py-4 rounded-xl transition transform hover:-translate-y-0.5 shadow-lg shadow-[#FF6B00]/20 flex flex-col items-center justify-center gap-0.5"
                          >
                            <span>⚡ PLACE BID</span>
                            <span className="text-[10px] text-white/75 normal-case font-medium">
                              Next: {formatPrice(nextBidAmount)}
                            </span>
                          </button>
                        ) : (
                          <div className="flex-grow bg-[#1A1008] border border-white/5 text-white/40 text-xs py-4 rounded-xl text-center font-bold uppercase tracking-wider">
                            👁 Spectator Mode - Bidding Disabled
                          </div>
                        )}
                      </div>
                    )}

                    {/* RTM Decision phase controls (For previous franchise owner only) */}
                    {rtmState?.active && rtmState.phase === 'decision' && (
                      <div className="bg-[#0E0A06] border border-[#FFB800]/30 p-4 rounded-xl text-center animate-fade-up">
                        <h4 className="font-heading text-lg text-[#FFB800] mb-1">RTM INVOCATION</h4>
                        <p className="text-white/60 text-[10px] uppercase tracking-wider mb-4 leading-relaxed">
                          Previous Franchise {rtmState.rtmTeamId} has {rtmState.timeLeft}s to exercise RTM
                        </p>
                        
                        {claimedTeam?.teamId === rtmState.rtmTeamId ? (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleRtmDecision(true)}
                              className="flex-1 btn-gold py-2.5 text-xs font-black tracking-widest"
                            >
                              USE RTM CARD
                            </button>
                            <button 
                              onClick={() => handleRtmDecision(false)}
                              className="flex-1 bg-[#1A1008] border border-white/10 hover:border-white/20 py-2.5 text-xs font-black tracking-widest"
                            >
                              PASS RTM
                            </button>
                          </div>
                        ) : (
                          <div className="text-white/40 text-[11px] font-bold uppercase tracking-widest py-2 bg-[#1A1008] rounded border border-white/5">
                            ⌛ Waiting for {rtmState.rtmTeamId} Board...
                          </div>
                        )}
                      </div>
                    )}

                    {/* Counter-bid phase controls (For highest bidder only) */}
                    {rtmState?.active && rtmState.phase === 'counter' && (
                      <div className="bg-[#0E0A06] border border-[#FF6B00]/30 p-4 rounded-xl text-center animate-fade-up">
                        <h4 className="font-heading text-lg text-[#FF6B00] mb-1">COUNTER-BID ROUND</h4>
                        <p className="text-white/60 text-[10px] uppercase tracking-wider mb-4">
                          Highest Bidder ({rtmState.highestBidderTeamId}) has {rtmState.timeLeft}s to raise
                        </p>

                        {claimedTeam?.teamId === rtmState.highestBidderTeamId ? (
                          <div className="flex flex-col gap-3">
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleCounterBid(rtmState.preRtmBid + 10000000)} // +10CR
                                className="flex-grow btn-orange py-2 text-xs font-black tracking-widest"
                              >
                                RAISE +10CR ({formatPrice(rtmState.preRtmBid + 10000000)})
                              </button>
                              <button 
                                onClick={() => handleCounterBid(rtmState.preRtmBid + 20000000)} // +20CR
                                className="flex-grow btn-orange py-2 text-xs font-black tracking-widest"
                              >
                                RAISE +20CR ({formatPrice(rtmState.preRtmBid + 20000000)})
                              </button>
                            </div>
                            <button 
                              onClick={handlePassCounter}
                              className="w-full bg-[#1A1008] border border-white/10 hover:border-white/20 py-2 text-xs font-black tracking-widest"
                            >
                              DECLINE RAISE (PASS)
                            </button>
                          </div>
                        ) : (
                          <div className="text-white/40 text-[11px] font-bold uppercase tracking-widest py-2 bg-[#1A1008] rounded border border-white/5">
                            ⌛ Waiting for {rtmState.highestBidderTeamId} raise...
                          </div>
                        )}
                      </div>
                    )}

                    {/* Final matching phase controls (For RTM owner matching the raise) */}
                    {rtmState?.active && rtmState.phase === 'final-match' && (
                      <div className="bg-[#0E0A06] border border-[#FFB800]/30 p-4 rounded-xl text-center animate-fade-up">
                        <h4 className="font-heading text-lg text-[#FFB800] mb-1">MATCH COUNTER-BID</h4>
                        <p className="text-white/60 text-[10px] uppercase tracking-wider mb-4 leading-relaxed">
                          Highest bidder raised to <span className="text-white font-bold">{formatPrice(rtmState.raisedBid)}</span>.<br />
                          {rtmState.rtmTeamId} has {rtmState.timeLeft}s to Match or Withdraw.
                        </p>

                        {claimedTeam?.teamId === rtmState.rtmTeamId ? (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleMatchFinalRtm(true)}
                              className="flex-1 btn-gold py-2.5 text-xs font-black tracking-widest"
                            >
                              MATCH ({formatPrice(rtmState.raisedBid)})
                            </button>
                            <button 
                              onClick={() => handleMatchFinalRtm(false)}
                              className="flex-1 bg-[#1A1008] border border-white/10 hover:border-white/20 py-2.5 text-xs font-black tracking-widest"
                            >
                              WITHDRAW
                            </button>
                          </div>
                        ) : (
                          <div className="text-white/40 text-[11px] font-bold uppercase tracking-widest py-2 bg-[#1A1008] rounded border border-white/5">
                            ⌛ Waiting for {rtmState.rtmTeamId} Match...
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                </div>

              </div>
            )}

          </div>

          {/* ─ RIGHT SIDEBAR: BID LADDER & LOGS ─ */}
          <div className="w-80 bg-[#1A1008] border-l border-[#FF6B00]/20 flex flex-col justify-between overflow-hidden h-full">
            
            {/* Franchise Board */}
            <div className="p-4 border-b border-white/5">
              <h3 className="font-heading text-sm text-[#FFB800] tracking-wider mb-3">FRANCHISE BOARDS</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {Object.values(room.teamsState || {}).map(t => (
                  <div key={t.teamId} className="flex justify-between items-center p-2 bg-black/30 rounded border border-white/5">
                    <span className="font-bold text-[11px] text-white">{t.teamId} Board</span>
                    <span className="text-[10px] text-[#00E676] font-bold">{formatPrice(t.purse)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Live activity logs */}
            <div className="flex-grow flex flex-col overflow-hidden">
              <div className="p-4 pb-2">
                <h3 className="font-heading text-sm text-[#FFB800] tracking-wider">LIVE DRAFT LOG</h3>
              </div>
              
              <div className="flex-grow overflow-y-auto px-4 pb-4 space-y-2 flex flex-col">
                {logs.map(log => {
                  let border = 'border-white/5';
                  let bg = 'bg-black/15';
                  let text = 'text-white/80';
                  
                  if (log.type === 'sold') {
                    border = 'border-[#00E676]/35';
                    bg = 'bg-[#00E676]/5';
                    text = 'text-[#00E676]';
                  } else if (log.type === 'unsold') {
                    border = 'border-[#FF3333]/25';
                    bg = 'bg-[#FF3333]/3';
                    text = 'text-[#FF3333]';
                  }
                  
                  return (
                    <div key={log.id} className={`text-xs p-2.5 rounded-lg border ${border} ${bg} ${text} leading-relaxed`}>
                      {log.message}
                    </div>
                  );
                })}
                {logs.length === 0 && (
                  <div className="text-white/20 text-xs text-center py-8 uppercase tracking-widest">
                    No bids recorded yet
                  </div>
                )}
                <div ref={logsEndRef} />
              </div>
            </div>

          </div>

        </div>

        {/* ─── SQUAD DRAWER ─── */}
        {showSquadDrawer && claimedTeam && (
          <div className="fixed inset-y-0 right-0 w-96 bg-[#1A1008] border-l border-[#FF6B00]/30 z-40 p-6 flex flex-col justify-between shadow-2xl animate-fade-up">
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-heading text-2xl text-[#FFB800] tracking-widest uppercase">
                  {claimedTeam.teamId} Squad
                </h3>
                <button 
                  onClick={() => setShowSquadDrawer(false)}
                  className="text-xs uppercase tracking-widest border border-white/10 hover:border-[#FF6B00] px-3 py-1 rounded transition"
                >
                  Close
                </button>
              </div>

              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div className="bg-[#0E0A06] border border-white/5 rounded-lg p-4 mb-4">
                  <div className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-1">Squad Match Fee</div>
                  <div className="text-xs text-white/70 leading-relaxed">
                    ₹7.5L match fee per player per game applies to all matches in addition to contract price.
                  </div>
                </div>

                {claimedTeam.squad && claimedTeam.squad.length > 0 ? (
                  <div className="space-y-2">
                    {claimedTeam.squad.map((pName, idx) => {
                      const pInfo = availablePlayers.find(p => p.name === pName) || { name: pName, role: 'All-Rounder', isCapped: true, nationality: 'Indian' };
                      return (
                        <div key={idx} className="p-3.5 bg-black/40 rounded-xl border border-white/5 flex justify-between items-center hover:border-[#FF6B00]/30 transition-all duration-300">
                          <div className="flex flex-col gap-1 text-left">
                            <span className="font-bold text-xs text-white">{pInfo.name}</span>
                            <div className="flex items-center gap-2">
                              {getRoleBadge(pInfo.role)}
                              {getNationalityBadge(pInfo)}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {getCappedBadge(pInfo)}
                            <span className="text-[9px] text-white/40 uppercase font-black tracking-wider">Squad Member</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-white/20 text-xs uppercase tracking-widest text-center py-12">
                    No players in squad
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 text-center text-[10px] uppercase tracking-widest text-white/30">
              Squad limit: 25 players max • 8 overseas max
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default Room;
