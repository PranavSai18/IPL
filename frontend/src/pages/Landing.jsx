import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Settings, Trophy, Coins, Gavel, Zap, Users, Briefcase } from 'lucide-react';

const formatPrice = (val) => {
  if (!val) return '₹0';
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2).replace(/\.00$/, '')}CR`;
  return `₹${(val / 100000).toFixed(0)}L`;
};

/* ══════════════════════════════════════════════════════════════════
   PLAYER DATA
══════════════════════════════════════════════════════════════════ */
const PLAYERS = [
  {
    id: 0, name: 'Ruturaj Gaikwad', initials: 'RG', team: 'CSK',
    role: 'Batsman', salary: '₹18CR', primary: '#F5C518', secondary: '#1D2951', jersey: '31',
    photo: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/102.png',
    tag: 'CSK CAPTAIN'
  },
  {
    id: 1, name: 'Jasprit Bumrah', initials: 'JB', team: 'MI',
    role: 'Bowler', salary: '₹18CR', primary: '#004BA0', secondary: '#D4AF37', jersey: '93',
    photo: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/9.png',
    tag: 'DEATH OVERS ACE'
  },
  {
    id: 2, name: 'Virat Kohli', initials: 'VK', team: 'RCB',
    role: 'Batsman', salary: '₹21CR', primary: '#C8102E', secondary: '#FFD700', jersey: '18',
    photo: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/2.png',
    tag: 'RUN MACHINE'
  },
  {
    id: 3, name: 'Cameron Green', initials: 'CG', team: 'KKR',
    role: 'All-Rounder', salary: '₹18CR', primary: '#3A225D', secondary: '#F5D020', jersey: '51',
    photo: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/550.png',
    tag: 'POWER HITTER'
  },
  {
    id: 4, name: 'Rishabh Pant', initials: 'RP', team: 'LSG',
    role: 'WK-Batsman', salary: '₹27CR', primary: '#A0C4FF', secondary: '#0E1F51', jersey: '17',
    photo: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/18.png',
    tag: 'DYNAMIC WK'
  },
  {
    id: 5, name: 'KL Rahul', initials: 'LR', team: 'DC',
    role: 'WK-Batsman', salary: '₹14CR', primary: '#0078BC', secondary: '#EE1C25', jersey: '1',
    photo: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/19.png',
    tag: 'WK-BATSMAN'
  },
  {
    id: 6, name: 'Shubman Gill', initials: 'SG', team: 'GT',
    role: 'Batsman', salary: '₹14.5CR', primary: '#1C3F6E', secondary: '#D4AF37', jersey: '77',
    photo: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/62.png',
    tag: 'GT CAPTAIN'
  },
  {
    id: 7, name: 'Heinrich Klaasen', initials: 'HK', team: 'SRH',
    role: 'WK-Batsman', salary: '₹23CR', primary: '#F26522', secondary: '#000000', jersey: '21',
    photo: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/202.png',
    tag: 'SIX HITTER'
  },
  {
    id: 8, name: 'Yashasvi Jaiswal', initials: 'YJ', team: 'RR',
    role: 'Batsman', salary: '₹18CR', primary: '#E8295B', secondary: '#FFD700', jersey: '24',
    photo: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/533.png',
    tag: 'FIREBRAND OPENER'
  },
  {
    id: 9, name: 'Shreyas Iyer', initials: 'SI', team: 'PBKS',
    role: 'Batsman', salary: '₹26.75CR', primary: '#D71920', secondary: '#C0C0C0', jersey: '41',
    photo: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/12.png',
    tag: 'PBKS LEADER'
  },
  {
    id: 10, name: 'Rohit Sharma', initials: 'RS', team: 'MI',
    role: 'Batsman', salary: '₹16.3CR', primary: '#004BA0', secondary: '#D4AF37', jersey: '45',
    photo: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/6.png',
    tag: 'HITMAN'
  },
  {
    id: 11, name: 'MS Dhoni', initials: 'MSD', team: 'CSK',
    role: 'WK-Batsman', salary: '₹4CR', primary: '#F5C518', secondary: '#1D2951', jersey: '7',
    photo: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/57.png',
    tag: 'CSK LEGEND'
  },
];

const TEAMS = [
  { id: 'CSK', name: 'Chennai Super Kings', color: '#F5C518', logo: 'https://scores.iplt20.com/ipl/teamlogos/CSK.png' },
  { id: 'MI', name: 'Mumbai Indians', color: '#004BA0', logo: 'https://scores.iplt20.com/ipl/teamlogos/MI.png' },
  { id: 'RCB', name: 'Royal Challengers Bengaluru', color: '#C8102E', logo: 'https://scores.iplt20.com/ipl/teamlogos/RCB.png' },
  { id: 'KKR', name: 'Kolkata Knight Riders', color: '#3A225D', logo: 'https://scores.iplt20.com/ipl/teamlogos/KKR.png' },
  { id: 'SRH', name: 'Sunrisers Hyderabad', color: '#F26522', logo: 'https://scores.iplt20.com/ipl/teamlogos/SRH.png' },
  { id: 'DC', name: 'Delhi Capitals', color: '#0078BC', logo: 'https://scores.iplt20.com/ipl/teamlogos/DC.png' },
  { id: 'PBKS', name: 'Punjab Kings', color: '#D71920', logo: 'https://scores.iplt20.com/ipl/teamlogos/PBKS.png' },
  { id: 'RR', name: 'Rajasthan Royals', color: '#E8295B', logo: 'https://scores.iplt20.com/ipl/teamlogos/RR.png' },
  { id: 'GT', name: 'Gujarat Titans', color: '#1C3F6E', logo: 'https://scores.iplt20.com/ipl/teamlogos/GT.png' },
  { id: 'LSG', name: 'Lucknow Super Giants', color: '#00A19C', logo: 'https://scores.iplt20.com/ipl/teamlogos/LSG.png' }
];

/* ══════════════════════════════════════════════════════════════════
   FLOATING PARTICLE CANVAS
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
    const pts = Array.from({ length: 70 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 2.2 + 0.4,
      vx: (Math.random() - 0.5) * 0.25,
      vy: -(Math.random() * 0.55 + 0.15),
      a: Math.random() * 0.55 + 0.08,
      c: Math.random() > 0.5 ? '255,107,0' : '255,184,0',
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pts.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.a += (Math.random() - 0.5) * 0.008;
        p.a = Math.max(0.04, Math.min(0.65, p.a));
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
   CRICKET BALL CURSOR
══════════════════════════════════════════════════════════════════ */
const CricketBallCursor = () => {
  const posRef       = useRef({ x: -200, y: -200 });
  const prevRef      = useRef({ x: -200, y: -200 });
  const rotRef       = useRef(0);
  const trailRef     = useRef({ x: -200, y: -200 });
  const [ball,  setBall]  = useState({ x: -200, y: -200, rot: 0 });
  const [trail, setTrail] = useState({ x: -200, y: -200 });

  useEffect(() => {
    const onMove = (e) => {
      const dx = e.clientX - prevRef.current.x;
      const dy = e.clientY - prevRef.current.y;
      rotRef.current += Math.sqrt(dx * dx + dy * dy) * 1.8;
      prevRef.current = posRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  useEffect(() => {
    let raf;
    const tick = () => {
      setBall({ x: posRef.current.x, y: posRef.current.y, rot: rotRef.current });
      trailRef.current.x += (posRef.current.x - trailRef.current.x) * 0.13;
      trailRef.current.y += (posRef.current.y - trailRef.current.y) * 0.13;
      setTrail({ x: trailRef.current.x, y: trailRef.current.y });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      <div style={{ position: 'fixed', left: trail.x - 6, top: trail.y - 6, width: 12, height: 12, borderRadius: '50%', background: 'rgba(240, 249, 255, 0.7)', boxShadow: '0 0 10px rgba(14, 165, 233, 0.8), 0 0 20px rgba(56, 189, 248, 0.5)', zIndex: 99999, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', left: ball.x - 14, top: ball.y - 14, width: 28, height: 28, zIndex: 100000, pointerEvents: 'none', transform: `rotate(${ball.rot}deg)`, willChange: 'transform', filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.85)) drop-shadow(0 0 10px rgba(56,189,248,0.45))' }}>
        <svg viewBox="0 0 28 28" fill="none" width="28" height="28">
          <defs>
            <radialGradient id="bg2" cx="35%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="40%" stopColor="#ECEFF1" />
              <stop offset="90%" stopColor="#CFD8DC" />
              <stop offset="100%" stopColor="#90A4AE" />
            </radialGradient>
          </defs>
          <circle cx="14" cy="14" r="13" fill="url(#bg2)" />
          <path d="M4.5 14C4.5 7.5 9 3.5 14 3.5C19 3.5 23.5 7.5 23.5 14" stroke="#B71C1C" strokeWidth="1.15" fill="none" strokeLinecap="round" />
          <path d="M4.5 14C4.5 20.5 9 24.5 14 24.5C19 24.5 23.5 20.5 23.5 14" stroke="#B71C1C" strokeWidth="1.15" fill="none" strokeLinecap="round" />
          <line x1="7.5"  y1="8.5"  x2="9.5"  y2="10.5" stroke="#B71C1C" strokeWidth="0.7" />
          <line x1="8"    y1="11.5" x2="10"   y2="13"   stroke="#B71C1C" strokeWidth="0.7" />
          <line x1="7.5"  y1="17.5" x2="9.5"  y2="15.5" stroke="#B71C1C" strokeWidth="0.7" />
          <line x1="8"    y1="14.5" x2="10"   y2="13"   stroke="#B71C1C" strokeWidth="0.7" />
          <line x1="20.5" y1="8.5"  x2="18.5" y2="10.5" stroke="#B71C1C" strokeWidth="0.7" />
          <line x1="20"   y1="11.5" x2="18"   y2="13"   stroke="#B71C1C" strokeWidth="0.7" />
          <line x1="20.5" y1="17.5" x2="18.5" y2="15.5" stroke="#B71C1C" strokeWidth="0.7" />
          <line x1="20"   y1="14.5" x2="18"   y2="13"   stroke="#B71C1C" strokeWidth="0.7" />
        </svg>
      </div>
    </>
  );
};

/* ══════════════════════════════════════════════════════════════════
   SINGLE PLAYER CARD
══════════════════════════════════════════════════════════════════ */
const PlayerCard = ({ player, isActive }) => {
  const W          = isActive ? 298 : 205;
  const H          = isActive ? 418 : 292;
  const p          = player;

  return (
    <div
      style={{
        width:    W,
        height:   H,
        background: `
          radial-gradient(ellipse at 78% 18%, ${p.primary}22 0%, transparent 52%),
          radial-gradient(ellipse at 22% 82%, ${p.secondary}15 0%, transparent 48%),
          #0C0804
        `,
        border:      `1px solid ${p.primary}${isActive ? '55' : '22'}`,
        borderRadius: 16,
        boxShadow:   isActive
          ? `0 0 0 1px ${p.primary}28, 0 0 38px ${p.primary}45, 0 0 80px ${p.primary}18, 0 24px 56px rgba(0,0,0,0.65)`
          : `0 6px 28px rgba(0,0,0,0.55)`,
        padding:     isActive ? '1.15rem' : '0.75rem',
        position:    'relative',
        overflow:    'hidden',
        display:     'flex',
        flexDirection: 'column',
        userSelect:  'none',
        flexShrink:  0,
        animation:   isActive ? 'floatUp 4s ease-in-out infinite' : 'none',
      }}
    >
      {/* Top colour band */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${p.primary}, ${p.secondary})`, borderRadius: '16px 16px 0 0' }} />

      {/* Corner sparkle dots */}
      {isActive && (
        <>
          <div style={{ position: 'absolute', top: 14, right: 14, width: 4, height: 4, borderRadius: '50%', background: p.primary, boxShadow: `0 0 8px ${p.primary}`, animation: 'flicker 1.8s ease infinite' }} />
          <div style={{ position: 'absolute', top: 24, right: 24, width: 2.5, height: 2.5, borderRadius: '50%', background: p.secondary, opacity: 0.7, animation: 'flicker 2.4s ease infinite 0.4s' }} />
        </>
      )}

      {/* ── HEADER ROW ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isActive ? '0.65rem' : '0.45rem', position: 'relative', zIndex: 2, marginTop: '0.25rem' }}>
        {/* Custom Tag */}
        <div style={{
          background:  '#FF3333',
          color:       '#FFFFFF',
          fontSize:    isActive ? '0.58rem' : '0.42rem',
          fontWeight:  800,
          letterSpacing: '0.05em',
          padding:     isActive ? '0.15rem 0.5rem' : '0.1rem 0.35rem',
          borderRadius: 3,
          textTransform: 'uppercase',
          fontFamily: "'Inter', sans-serif",
          boxShadow: '0 2px 6px rgba(255,51,51,0.35)'
        }}>
          {p.tag}
        </div>

        {/* Team badge */}
        <div style={{
          background:  p.primary,
          color:       '#FFFFFF',
          fontFamily:  "'Bebas Neue', sans-serif",
          fontSize:    isActive ? '0.85rem' : '0.62rem',
          letterSpacing: '0.1em',
          padding:     isActive ? '0.2rem 0.65rem' : '0.12rem 0.4rem',
          borderRadius: 4,
          boxShadow:   isActive ? `0 0 12px ${p.primary}80` : 'none',
        }}>
          {p.team}
        </div>
      </div>

      {/* ── PLAYER IMAGE CUTOUT AREA ── */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', flex: 1, position: 'relative', zIndex: 2, height: isActive ? 220 : 150, overflow: 'hidden', marginTop: '0.4rem' }}>
        {/* Background glow behind player cutout */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          width: '90%',
          height: '75%',
          background: `radial-gradient(ellipse at bottom, ${p.primary}30 0%, transparent 70%)`,
          borderRadius: '50% 50% 0 0',
          zIndex: 1
        }} />
        
        {p.photo ? (
          <img
            src={p.photo}
            alt={p.name}
            style={{
              height: '100%',
              width: 'auto',
              maxHeight: isActive ? 210 : 140,
              objectFit: 'contain',
              zIndex: 2,
              display: 'block',
              transition: 'transform 0.3s ease',
              filter: isActive ? `drop-shadow(0 8px 16px ${p.primary}45)` : 'none',
            }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        
        {/* Fallback initials */}
        <div style={{
          display: p.photo ? 'none' : 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0, left: 0,
          zIndex: 2
        }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: isActive ? '3rem' : '2rem', letterSpacing: '0.04em', color: '#FFFFFF', textShadow: '0 0 18px rgba(255,255,255,0.65)' }}>
            {p.initials}
          </div>
        </div>
      </div>

      {/* ── BOTTOM INFO ── */}
      <div style={{ position: 'relative', zIndex: 3, marginTop: '0.65rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        {/* Gradient divider */}
        <div style={{ height: 1, width: '100%', background: `linear-gradient(90deg, transparent, ${p.primary}60, transparent)`, marginBottom: '0.55rem' }} />

        {/* Player name */}
        <div style={{
          fontFamily:   "'Bebas Neue', sans-serif",
          fontSize:     isActive ? '1.85rem' : '1.2rem',
          letterSpacing: '0.04em',
          color:         '#FFFFFF',
          lineHeight:    1,
          marginBottom:  '0.2rem',
          textTransform: 'uppercase',
          textShadow:    isActive ? `0 0 12px ${p.primary}40` : 'none',
        }}>
          {p.name}
        </div>

        {/* Subtitle: ROLE TEAM */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: isActive ? '0.68rem' : '0.52rem',
          fontWeight: 700,
          color: 'rgba(255,255,255,0.45)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          <span>{p.role}</span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />
          <span style={{ color: p.primary }}>{p.team}</span>
        </div>

        {/* Salary and details */}
        {isActive && (
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginTop: '0.6rem' }}>
            <div style={{
              padding:     '0.18rem 0.55rem',
              background:  'rgba(255,184,0,0.12)',
              border:      '1px solid rgba(255,184,0,0.48)',
              borderRadius: 4,
              fontSize:    '0.58rem',
              fontWeight:  900,
              color:       '#FFB800',
              letterSpacing: '0.06em',
            }}>
              VAL: {p.salary}
            </div>
            <div style={{ fontSize: '0.52rem', color: 'rgba(255,255,255,0.3)', fontWeight: 800, letterSpacing: '0.1em' }}>
              JERSEY #{p.jersey}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   PLAYER CAROUSEL
══════════════════════════════════════════════════════════════════ */
const PlayerCarousel = () => {
  const [current, setCurrent] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const N    = PLAYERS.length;
  const prev = (current - 1 + N) % N;
  const next = (current + 1) % N;

  // Auto-cycle every 3 s
  useEffect(() => {
    const iv = setInterval(() => {
      setCurrent((c) => (c + 1) % N);
      setAnimKey((k) => k + 1);
    }, 3000);
    return () => clearInterval(iv);
  }, [N]);

  const goTo = (i) => {
    if (i === current) return;
    setCurrent(i);
    setAnimKey((k) => k + 1);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.6rem' }}>

      {/* ── Cards stage ── */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        perspective:    '1400px',
        perspectiveOrigin: 'center center',
        position:       'relative',
        height:         438,
        // ghost peek region handled by negative margins
      }}>

        {/* Left ghost */}
        <div style={{
          transform:       'scale(0.7) rotateY(44deg)',
          transformOrigin: 'right center',
          opacity:         0.38,
          filter:          'blur(1.8px)',
          flexShrink:      0,
          marginRight:     -80,
          transition:      'opacity 0.5s',
          pointerEvents:   'none',
          zIndex:          1,
        }}>
          <PlayerCard player={PLAYERS[prev]} />
        </div>

        {/* Active card — re-mounts on key change to replay flipIn */}
        <div style={{ zIndex: 10, flexShrink: 0 }}>
          <div key={animKey} style={{ animation: 'flipIn 0.48s cubic-bezier(0.4, 0, 0.2, 1) forwards' }}>
            <PlayerCard player={PLAYERS[current]} isActive />
          </div>
        </div>

        {/* Right ghost */}
        <div style={{
          transform:       'scale(0.7) rotateY(-44deg)',
          transformOrigin: 'left center',
          opacity:         0.38,
          filter:          'blur(1.8px)',
          flexShrink:      0,
          marginLeft:      -80,
          transition:      'opacity 0.5s',
          pointerEvents:   'none',
          zIndex:          1,
        }}>
          <PlayerCard player={PLAYERS[next]} />
        </div>
      </div>

      {/* ── Progress dots ── */}
      <div style={{ display: 'flex', gap: '0.38rem', alignItems: 'center' }}>
        {PLAYERS.map((p, i) => (
          <div
            key={i}
            onClick={() => goTo(i)}
            style={{
              width:        i === current ? 24 : 5,
              height:       4,
              borderRadius: 2,
              background:   i === current ? PLAYERS[current].primary : 'rgba(255,255,255,0.18)',
              transition:   'all 0.35s ease',
              boxShadow:    i === current ? `0 0 8px ${PLAYERS[current].primary}` : 'none',
            }}
          />
        ))}
      </div>

      {/* ── Cycling label ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: PLAYERS[current].primary, display: 'inline-block', boxShadow: `0 0 8px ${PLAYERS[current].primary}`, animation: 'flicker 1.4s ease infinite' }} />
        <span style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>
          {current + 1} / {N} — Featured Players
        </span>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════════ */
const generateRoomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
};

const fadeUp = (delay, mounted) => ({
  opacity:    mounted ? 1 : 0,
  transform:  mounted ? 'translateY(0px)' : 'translateY(28px)',
  transition: `opacity 0.75s ease ${delay}s, transform 0.75s ease ${delay}s`,
});

/* ══════════════════════════════════════════════════════════════════
   LANDING COMPONENT
══════════════════════════════════════════════════════════════════ */
const Landing = () => {
  const login    = useAuthStore((state) => state.login);
  const navigate = useNavigate();
  const { user, token } = useAuthStore();

  const [showModal,   setShowModal]   = useState(false);
  const [name,        setName]        = useState('');
  const [error,       setError]       = useState('');
  const [authRedirectTarget, setAuthRedirectTarget] = useState('/lobby');

  const handleAuthClick = (target) => {
    setAuthRedirectTarget(target);
    setShowModal(true);
  };
  const [mounted,     setMounted]     = useState(false);
  const [typeText,    setTypeText]    = useState('');
  const [cursorBlink, setCursorBlink] = useState(true);
  const [players,     setPlayers]     = useState(0);
  const [teams,       setTeams]       = useState(0);
  const [purse,       setPurse]       = useState(0);

  // How to Play section refs and states
  const howToPlayRef = useRef(null);
  const observerRef = useRef(null);
  const [isMegaMode, setIsMegaMode] = useState(false);
  const [playerCount, setPlayerCount] = useState(180);
  const [purseCount, setPurseCount] = useState(40);

  const [inView, setInView] = useState(false);

  // Create Room Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [createAuctionType, setCreateAuctionType] = useState('mini'); // 'mini' | 'mega'
  const [createSelectedFranchise, setCreateSelectedFranchise] = useState('');
  const [createSquadSize, setCreateSquadSize] = useState(20);
  const [createPurse, setCreatePurse] = useState(100);
  const [createBidTimer, setCreateBidTimer] = useState(30);
  const [createRtmEnabled, setCreateRtmEnabled] = useState(false);
  const [createRoomType, setCreateRoomType] = useState('public');
  const [createPrivateCode, setCreatePrivateCode] = useState('');
  const [createMaxOverseas, setCreateMaxOverseas] = useState(4);
  const [createPoolSource, setCreatePoolSource] = useState('default'); // 'default' | '2025'
  const [createGeneratedCode] = useState(() => {
    try { return generateRoomCode() || Math.random().toString(36).substring(2, 8).toUpperCase(); }
    catch { return Math.random().toString(36).substring(2, 8).toUpperCase(); }
  });
  const [createCopied, setCreateCopied] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createIsSubmitting, setCreateIsSubmitting] = useState(false);
  const [createConfetti, setCreateConfetti] = useState([]);
  const [createHostName, setCreateHostName] = useState('');

  // Interactive Navigation Modals
  const [showTeamsModal, setShowTeamsModal] = useState(false);
  const [showPlayersModal, setShowPlayersModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleYear, setScheduleYear] = useState('2027');
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showTrophyPaymentModal, setShowTrophyPaymentModal] = useState(false);
  
  // Modal Data States
  const [allPlayersList, setAllPlayersList] = useState([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [selectedTeamForHistory, setSelectedTeamForHistory] = useState(null);
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');
  const [playerRoleFilter, setPlayerRoleFilter] = useState('all');
  const [playerPoolFilter, setPlayerPoolFilter] = useState('all');
  const [playerCappedFilter, setPlayerCappedFilter] = useState('all');

  const fetchAllPlayers = async () => {
    setLoadingPlayers(true);
    try {
      const res = await axios.get('http://localhost:5000/api/players');
      setAllPlayersList(res.data);
    } catch (err) {
      console.error('Failed to load players registry:', err);
    } finally {
      setLoadingPlayers(false);
    }
  };



  // Update RTM setting when auction type changes
  useEffect(() => {
    setTimeout(() => {
      if (createAuctionType === 'mini') {
        setCreateRtmEnabled(false);
      } else {
        setCreateRtmEnabled(true);
      }
    }, 0);
  }, [createAuctionType]);

  const handleLaunchRoom = async () => {
    setCreateError('');
    setCreateIsSubmitting(true);

    let currentToken = token;
    let currentUser = user;

    // 1. Authenticate if not logged in
    if (!currentUser) {
      if (!createHostName.trim()) {
        setCreateError('Please enter your name to host.');
        setCreateIsSubmitting(false);
        return;
      }
      try {
        const authRes = await axios.post('http://localhost:5000/api/auth/login', { name: createHostName });
        login(authRes.data.user, authRes.data.token);
        currentToken = authRes.data.token;
        currentUser = authRes.data.user;
      } catch (err) {
        setCreateError(err.response?.data?.error || 'Authentication failed.');
        setCreateIsSubmitting(false);
        return;
      }
    }

    // 2. Create the room
    const codeToUse = createRoomType === 'private' && createPrivateCode ? createPrivateCode.toUpperCase() : createGeneratedCode;
    try {
      const payload = {
        code: codeToUse,
        type: createRoomType,
        auctionType: createAuctionType,
        franchise: createSelectedFranchise,
        poolSource: createPoolSource,
        playersPerTeam: Number(createSquadSize),
        startingPurse: Number(createPurse),
        maxOverseas: Number(createMaxOverseas),
        bidIncrement: Number(createAuctionType === 'mini' ? 500000 : 1000000), // match standard brackets
        rtmEnabled: Boolean(createRtmEnabled),
        timePerBid: Number(createBidTimer)
      };

      const res = await axios.post('http://localhost:5000/api/rooms', payload, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });

      // 3. Trigger confetti burst
      const particles = Array.from({ length: 120 }, () => ({
        id: Math.random(),
        x: Math.random() * 100,
        y: -10 - Math.random() * 20,
        r: Math.random() * 8 + 4,
        color: ['#FFB800', '#FF6B00', '#FFFFFF', '#FF3333'][Math.floor(Math.random() * 4)],
        delay: Math.random() * 1.5
      }));
      setCreateConfetti(particles);

      // Wait 1.5s for user to enjoy the confetti, then navigate
      setTimeout(() => {
        navigate(`/room/${res.data.code}`);
      }, 1500);

    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        setCreateError('Your session has expired. Please enter your name to authenticate and launch the auction.');
      } else {
        setCreateError(
          err.response?.data?.error ||
          (err.request ? 'Failed to connect to backend server. Please make sure the server is running on port 5000.' : 'Failed to create room. Please try again.')
        );
      }
      setCreateIsSubmitting(false);
    }
  };


  // Toggle body class to hide native cursor
  useEffect(() => {
    document.body.classList.add('hide-cursor');
    return () => {
      document.body.classList.remove('hide-cursor');
    };
  }, []);

  /* Entrance */
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  // Intersection Observer for staggered entrance animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.05 }
    );
    if (observerRef.current) {
      observer.observe(observerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  // Player count animation
  useEffect(() => {
    const target = isMegaMode ? 520 : 180;

    const start = playerCount;
    const duration = 500; // ms
    const startTime = performance.now();

    let animationFrame;
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress * (2 - progress); // easeOutQuad
      const currentVal = Math.round(start + (target - start) * ease);
      setPlayerCount(currentVal);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isMegaMode]);

  // Purse count animation
  useEffect(() => {
    const target = isMegaMode ? 120 : 40;
    const start = purseCount;
    const duration = 500; // ms
    const startTime = performance.now();

    let animationFrame;
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress * (2 - progress); // easeOutQuad
      const currentVal = Math.round(start + (target - start) * ease);
      setPurseCount(currentVal);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isMegaMode]);


  /* Typewriter */
  useEffect(() => {
    const FULL = 'ONLINE GAME';
    let i = 0;
    let blinkIv;
    const iv = setInterval(() => {
      i += 1;
      setTypeText(FULL.slice(0, i));
      if (i >= FULL.length) {
        clearInterval(iv);
        blinkIv = setInterval(() => setCursorBlink((b) => !b), 530);
      }
    }, 95);
    return () => { clearInterval(iv); clearInterval(blinkIv); };
  }, []);

  /* Counters */
  useEffect(() => {
    const STEPS = 80;
    let step = 0;
    const iv = setInterval(() => {
      step += 1;
      const ease = 1 - Math.pow(1 - step / STEPS, 3);
      setPlayers(Math.round(520 * ease));
      setTeams(Math.round(10 * ease));
      setPurse(Math.round(120 * ease));
      if (step >= STEPS) clearInterval(iv);
    }, 2200 / STEPS);
    return () => clearInterval(iv);
  }, []);

  const handleJoin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { name });
      login(res.data.user, res.data.token);
      setShowModal(false);
      navigate(authRedirectTarget);
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    }
  };

  /* ── RENDER ── */
  return (
    <>
      <CricketBallCursor />
      <ParticleCanvas />

      <div style={{ minHeight: '100vh', background: '#0E0A06', color: '#FFFFFF', fontFamily: "'Inter', sans-serif", position: 'relative', overflow: 'hidden' }}>

        {/* ─── NAVIGATION ─── */}
        <nav style={{ background: '#1A1008', borderBottom: '1px solid rgba(255,107,0,0.2)', padding: '0 2.5rem', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 100 }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.6rem', letterSpacing: '0.08em', userSelect: 'none' }}>
            <span style={{ color: '#FFB800' }}>IPL </span>
            <span style={{ color: '#FF6B00' }}>AUCTION</span>
          </div>

          <div style={{ display: 'flex', gap: '1.75rem', alignItems: 'center' }}>
            {['Auction', 'Teams', 'Players', 'How to Play', 'Schedule', 'Support'].map((l) => (
              <a 
                key={l} 
                href={l === 'How to Play' ? '#how-to-play' : '#'} 
                className="nav-link"
                onClick={(e) => {
                  e.preventDefault();
                  if (l === 'How to Play') {
                    howToPlayRef.current?.scrollIntoView({ behavior: 'smooth' });
                  } else if (l === 'Auction') {
                    if (user) {
                      navigate('/room/create');
                    } else {
                      handleAuthClick('/room/create');
                    }
                  } else if (l === 'Teams') {
                    setShowTeamsModal(true);
                  } else if (l === 'Players') {
                    setShowPlayersModal(true);
                    if (allPlayersList.length === 0) {
                      fetchAllPlayers();
                    }
                  } else if (l === 'Schedule') {
                    setShowScheduleModal(true);
                  } else if (l === 'Support') {
                    setShowSupportModal(true);
                  }
                }}
              >
                {l}
              </a>
            ))}
          </div>


          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            <button className="btn-outline-gold" style={{ padding: '0.45rem 1.1rem', fontSize: '0.68rem' }}>
              Live Auctions
            </button>
            <button className="btn-orange" onClick={() => user ? navigate('/room/join') : handleAuthClick('/room/join')} style={{ padding: '0.45rem 1.1rem', fontSize: '0.68rem' }}>
              Join Room
            </button>
          </div>
        </nav>

        {/* ─── HERO ─── */}
        <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem', padding: '3.5rem 4rem 2.5rem', minHeight: 'calc(100vh - 68px)', position: 'relative', zIndex: 10 }}>

          {/* LEFT COLUMN */}
          <div style={{ flex: '1', maxWidth: 560 }}>

            {/* Tag */}
            <div style={{ ...fadeUp(0.1, mounted), display: 'inline-flex', alignItems: 'center', gap: '0.45rem', color: '#FF6B00', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '1.6rem', padding: '0.35rem 0.85rem', border: '1px solid rgba(255,107,0,0.35)', borderRadius: 3, background: 'rgba(255,107,0,0.08)' }}>
              <span style={{ fontSize: '0.9rem' }}>🏏</span>
              Live Cricket Auction Simulator
            </div>

            {/* Heading */}
            <div style={{ ...fadeUp(0.22, mounted), marginBottom: '0.5rem' }}>
              <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(64px, 9vw, 118px)', fontWeight: 400, lineHeight: 0.88, letterSpacing: '0.02em', color: '#FFFFFF', margin: 0 }}>
                IPL AUCTION
              </h1>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(52px, 7.5vw, 98px)', lineHeight: 0.9, letterSpacing: '0.02em', color: '#FFB800', minHeight: '1.05em', display: 'flex', alignItems: 'center' }}>
                {typeText}
                <span style={{ display: 'inline-block', width: 4, height: '0.75em', background: '#FF6B00', marginLeft: 5, borderRadius: 1, opacity: cursorBlink ? 1 : 0, transition: 'opacity 0.12s ease', boxShadow: '0 0 8px rgba(255,107,0,0.9)' }} />
              </div>
            </div>

            {/* Subtitle */}
            <div style={{ ...fadeUp(0.38, mounted), marginBottom: '2.2rem' }}>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.95rem', lineHeight: 1.75, maxWidth: 460, margin: 0 }}>
                Build your franchise in fast live auctions with private room codes, real-time bidding, and smart purse strategy.
              </p>
              <p style={{ color: 'rgba(255,255,255,0.32)', fontSize: '0.88rem', lineHeight: 1.7, marginTop: '0.45rem' }}>
                10 franchises. 520+ players. Multiplayer rooms that feel like draft night.
              </p>
            </div>

            {/* CTA Buttons */}
            <div style={{ ...fadeUp(0.52, mounted), display: 'flex', gap: '1rem', marginBottom: '3.5rem' }}>
              <button className="btn-gold" onClick={() => user ? navigate('/room/create') : handleAuthClick('/room/create')} style={{ padding: '0.9rem 2.1rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Briefcase size={18} /> Create Room
              </button>
              <button className="btn-orange" onClick={() => user ? navigate('/room/join') : handleAuthClick('/room/join')} style={{ padding: '0.9rem 2.1rem', fontSize: '0.82rem' }}>
                🎯 Join Room
              </button>
            </div>

            {/* Stats */}
            <div style={{ ...fadeUp(0.66, mounted), display: 'flex', gap: '3rem', alignItems: 'flex-end' }}>
              {[
                { val: `${players}+`, label: 'Players' },
                { val: teams,         label: 'Teams'   },
                { val: `${purse}CR`,  label: 'Purse'   },
              ].map((s) => (
                <div key={s.label}>
                  <div className="stat-number" style={{ fontSize: '2.8rem', fontWeight: 900, lineHeight: 1 }}>{s.val}</div>
                  <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginTop: '0.3rem' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN — Player Carousel */}
          <div style={{ ...fadeUp(0.28, mounted), flex: '0 0 auto', position: 'relative' }}>
            {/* Ambient glow behind carousel */}
            <div style={{ position: 'absolute', inset: '-80px', background: 'radial-gradient(ellipse at center, rgba(255,107,0,0.07) 0%, transparent 68%)', borderRadius: '50%', pointerEvents: 'none', zIndex: 0 }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <PlayerCarousel />
            </div>
          </div>
        </main>

        {/* ─── HOW TO PLAY SECTION ─── */}
        <section 
          ref={howToPlayRef} 
          id="how-to-play" 
          style={{ 
            padding: '6rem 2rem 8rem', 
            maxWidth: 1200, 
            margin: '0 auto', 
            position: 'relative', 
            zIndex: 10 
          }}
        >
          {/* Section Divider Line */}
          <div style={{ height: 1, width: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,107,0,0.2) 50%, transparent)', marginBottom: '5rem' }} />

          {/* Section Header */}
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span style={{ 
              color: '#FF6B00', 
              fontSize: '0.72rem', 
              fontWeight: 800, 
              letterSpacing: '0.22em', 
              textTransform: 'uppercase',
              display: 'inline-block',
              marginBottom: '0.8rem',
              padding: '0.25rem 0.75rem',
              border: '1px solid rgba(255,107,0,0.25)',
              borderRadius: 3,
              background: 'rgba(255,107,0,0.04)'
            }}>
              Rules & Formats
            </span>
            <h2 style={{ 
              fontFamily: "'Bebas Neue', sans-serif", 
              fontSize: 'clamp(36px, 5.5vw, 64px)', 
              color: '#FFFFFF', 
              letterSpacing: '0.04em',
              margin: 0
            }}>
              HOW TO PLAY
            </h2>
            <p style={{ 
              color: 'rgba(255,255,255,0.45)', 
              fontSize: '0.95rem', 
              maxWidth: 500, 
              margin: '0.6rem auto 0',
              lineHeight: 1.6
            }}>
              Select your format, outbid opposing franchises, and assemble the ultimate playing XI.
            </p>
          </div>

          {/* Mode Toggle Switch */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '3rem 0 2.5rem' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1.25rem', 
              background: '#1A1008', 
              border: '1px solid rgba(255,107,0,0.2)', 
              padding: '0.5rem 1.25rem', 
              borderRadius: 50, 
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)' 
            }}>
              <button
                type="button"
                onClick={() => setIsMegaMode(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: !isMegaMode ? '#FFB800' : 'rgba(255,255,255,0.4)',
                  fontWeight: !isMegaMode ? 900 : 600,
                  fontSize: '0.78rem',
                  letterSpacing: '0.12em',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textShadow: !isMegaMode ? '0 0 10px rgba(255,184,0,0.4)' : 'none',
                  fontFamily: 'inherit'
                }}
              >
                MINI AUCTION
              </button>

              <div 
                onClick={() => setIsMegaMode(prev => !prev)}
                style={{
                  width: 54,
                  height: 26,
                  background: '#0E0A06',
                  borderRadius: 13,
                  border: `1.5px solid ${isMegaMode ? '#FFB800' : 'rgba(255,107,0,0.4)'}`,
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: isMegaMode ? '0 0 14px rgba(255,184,0,0.3)' : 'none'
                }}
              >
                <div 
                  style={{
                    width: 18,
                    height: 18,
                    background: 'linear-gradient(135deg, #FF6B00, #FFB800)',
                    borderRadius: '50%',
                    position: 'absolute',
                    top: '50%',
                    left: isMegaMode ? 29 : 4,
                    transform: 'translateY(-50%)',
                    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
                  }}
                />
              </div>

              <button
                type="button"
                onClick={() => setIsMegaMode(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: isMegaMode ? '#FFB800' : 'rgba(255,255,255,0.4)',
                  fontWeight: isMegaMode ? 900 : 600,
                  fontSize: '0.78rem',
                  letterSpacing: '0.12em',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textShadow: isMegaMode ? '0 0 10px rgba(255,184,0,0.4)' : 'none',
                  fontFamily: 'inherit'
                }}
              >
                MEGA AUCTION
              </button>
            </div>
          </div>

          {/* Active Mode Specifications Card */}
          <div style={{
            background: '#1A1008',
            border: `1px solid ${isMegaMode ? 'rgba(255,184,0,0.22)' : 'rgba(255,107,0,0.18)'}`,
            borderRadius: 16,
            padding: '2rem 2.2rem',
            maxWidth: 900,
            width: '100%',
            margin: '0 auto 4.5rem',
            boxShadow: isMegaMode ? '0 10px 40px rgba(255,184,0,0.05)' : '0 10px 40px rgba(0,0,0,0.55)',
            transition: 'all 0.4s ease',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Top color indicator line */}
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0,
              height: 4,
              background: isMegaMode ? 'linear-gradient(90deg, #FF6B00, #FFB800)' : 'linear-gradient(90deg, #8C4B00, #FF6B00)',
              transition: 'all 0.4s ease'
            }} />

            <h3 style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '1.8rem',
              color: '#FFFFFF',
              letterSpacing: '0.05em',
              marginBottom: '1.2rem',
              textAlign: 'center'
            }}>
              Active Format: <span style={{ color: isMegaMode ? '#FFB800' : '#FF6B00' }}>{isMegaMode ? 'MEGA AUCTION MODE' : 'MINI AUCTION MODE'}</span>
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '1.2rem'
            }}>
              {[
                { label: 'IPL Teams', val: '10 Teams', highlight: false },
                { label: 'Player Pool', val: isMegaMode ? `${playerCount}+ Players` : `${playerCount} Players (150-200 Pool)`, highlight: true },
                { label: 'Purse Limit', val: `₹${purseCount}CR`, highlight: true },

                { label: 'RTM Cards', val: isMegaMode ? '0 - 2 Cards' : 'Disabled', highlight: false, disabled: !isMegaMode },
                { label: 'Retentions', val: isMegaMode ? 'Max 6 Retain' : 'Max 4 Release', highlight: false },
                { label: 'Game Duration', val: isMegaMode ? '60 - 90 Min' : '20 - 30 Min', highlight: false }
              ].map((spec, idx) => (
                <div key={idx} style={{
                  background: 'rgba(0,0,0,0.22)',
                  border: `1px solid ${spec.highlight ? 'rgba(255,184,0,0.18)' : 'rgba(255,255,255,0.03)'}`,
                  borderRadius: 10,
                  padding: '1.1rem 0.5rem',
                  transition: 'all 0.3s ease',
                  opacity: spec.disabled ? 0.4 : 1
                }}>
                  <div style={{
                    fontSize: '0.55rem',
                    fontWeight: 800,
                    color: 'rgba(255,255,255,0.4)',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    marginBottom: '0.45rem',
                    textAlign: 'center'
                  }}>
                    {spec.label}
                  </div>
                  <div style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: '1.45rem',
                    color: spec.highlight ? '#FFB800' : '#FFFFFF',
                    letterSpacing: '0.04em',
                    textAlign: 'center'
                  }}>
                    {spec.val}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Steps Grid */}
          <div 
            ref={observerRef}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '2rem'
            }}
          >
            {[
              {
                num: '01',
                title: 'Choose Auction Type',
                icon: <Settings size={22} style={{ color: '#FFB800' }} />,
                desc: 'Select either Mini Mode for a fast-paced game with limited releases or Mega Mode for a complete franchise overhaul from scratch.'
              },
              {
                num: '02',
                title: 'Select Franchise',
                icon: <Trophy size={22} style={{ color: '#FF6B00' }} />,
                desc: 'Claim one of the 10 iconic IPL teams. Build your brand identity, manage your purse, and outwit other human franchise owners.'
              },
              {
                num: '03',
                title: 'Plan Retention Strategy',
                icon: <Coins size={22} style={{ color: '#FFB800' }} />,
                desc: isMegaMode 
                  ? 'Retain up to 6 players (max 5 capped, 1 uncapped) to protect your core squad while planning the remaining ₹120CR purse distribution.'
                  : 'Retain your current squad base, release up to 4 players to open up squad spots, and allocate the remaining ₹30–50CR purse.'
              },
              {
                num: '04',
                title: 'Live Bidding Battles',
                icon: <Gavel size={22} style={{ color: '#FF6B00' }} />,
                desc: 'Raise your franchise paddle, place rapid quick-bid increments, and outbid opponents before the circular countdown timer expires.'
              },
              {
                num: '05',
                title: 'RTM (Right to Match)',
                icon: <Zap size={22} style={{ color: '#FFB800' }} />,
                desc: isMegaMode 
                  ? 'Use RTM cards wisely during the draft to match the highest rival bid and secure your former star players back into your squad.'
                  : 'RTM cards are not available in Mini Auction format. All bid players are directly sold to the highest bidding franchise.'
              },
              {
                num: '06',
                title: 'Build Balanced XI',
                icon: <Users size={22} style={{ color: '#FF6B00' }} />,
                desc: 'Coordinate your squad to form a balanced playing XI including specialized batsmen, bowlers, all-rounders, and keepers.'
              }
            ].map((step, idx) => {
              const isStepDisabled = idx === 4 && !isMegaMode;
              return (
                <div 
                  key={idx}
                  className="step-card"
                  style={{
                    opacity: inView ? (isStepDisabled ? 0.6 : 1) : 0,
                    transform: inView ? 'translateY(0)' : 'translateY(32px)',
                    transition: `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s, box-shadow 0.3s`,
                    transitionDelay: `${idx * 0.08}s`,
                    filter: isStepDisabled ? 'grayscale(0.4)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.2rem' }}>
                    <div className="step-number-circle">
                      {step.num}
                    </div>
                    <div style={{
                      padding: '0.45rem',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {step.icon}
                    </div>
                  </div>

                  <h4 style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: '1.4rem',
                    color: '#FFFFFF',
                    letterSpacing: '0.04em',
                    marginBottom: '0.6rem'
                  }}>
                    {step.title}
                  </h4>

                  <p style={{
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: '0.82rem',
                    lineHeight: 1.6,
                    margin: 0
                  }}>
                    {step.desc}
                  </p>

                  {isStepDisabled && (
                    <div style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      fontSize: '0.55rem',
                      fontWeight: 900,
                      color: '#FF6B00',
                      border: '1px solid rgba(255,107,0,0.4)',
                      background: 'rgba(255,107,0,0.06)',
                      padding: '0.15rem 0.45rem',
                      borderRadius: 3,
                      letterSpacing: '0.05em'
                    }}>
                      MEGA ONLY
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>


      {/* ─── MODAL ─── */}
      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(14,10,6,0.88)', backdropFilter: 'blur(10px)', zIndex: 9990, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div style={{ background: '#1A1008', border: '1px solid rgba(255,107,0,0.3)', borderRadius: 18, padding: '2.8rem 2.4rem', width: '100%', maxWidth: 400, boxShadow: '0 0 80px rgba(255,107,0,0.18)', animation: 'flipIn 0.3s ease' }}>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.6rem', letterSpacing: '0.06em', textAlign: 'center', color: '#FFFFFF', marginBottom: '0.4rem' }}>
              JOIN AUCTION
            </h2>
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', marginBottom: '1.8rem' }}>
              Enter your name to start bidding
            </p>

            {error && (
              <div style={{ background: 'rgba(255,107,0,0.1)', border: '1px solid #FF6B00', color: '#FF6B00', padding: '0.7rem 1rem', borderRadius: 6, marginBottom: '1rem', fontSize: '0.82rem', textAlign: 'center' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                type="text"
                style={{ background: '#0E0A06', border: '1px solid rgba(255,107,0,0.3)', borderRadius: 8, padding: '0.9rem 1rem', color: '#FFFFFF', fontSize: '0.95rem', textAlign: 'center', outline: 'none', fontFamily: 'inherit', letterSpacing: '0.05em', transition: 'border-color 0.2s' }}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                required
                autoFocus
                onFocus={(e) => (e.target.style.borderColor = '#FF6B00')}
                onBlur={(e)  => (e.target.style.borderColor = 'rgba(255,107,0,0.3)')}
              />
              <button type="submit" className="btn-orange" style={{ padding: '0.9rem', fontSize: '0.85rem', fontFamily: 'inherit' }}>
                Enter Lobby →
              </button>
            </form>

            <button
              onClick={() => setShowModal(false)}
              style={{ width: '100%', marginTop: '1rem', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'inherit', padding: '0.4rem', transition: 'color 0.2s' }}
              onMouseEnter={(e) => (e.target.style.color = 'rgba(255,255,255,0.7)')}
              onMouseLeave={(e) => (e.target.style.color = 'rgba(255,255,255,0.3)')}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Create Room Confetti Overlay */}
      {createConfetti.length > 0 && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, pointerEvents: 'none', overflow: 'hidden' }}>
          {createConfetti.map(c => (
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
                animation: 'confettiFall 3.5s ease-out infinite',
                animationDelay: `${c.delay}s`
              }}
            />
          ))}
        </div>
      )}

      {/* ─── CREATE ROOM MULTI-STEP MODAL ─── */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            overflow: 'hidden'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && createStep === 1) {
              setShowCreateModal(false);
            }
          }}
        >
          {createIsSubmitting && (
            <div className="fixed inset-0 bg-[#0E0A06]/95 backdrop-blur-md z-[10000] flex flex-col items-center justify-center font-['Inter'] text-white">
              <div className="flex flex-col items-center gap-6 max-w-md w-full text-center p-8 border border-[#FF6B00]/25 rounded-2xl bg-[#1A1008] shadow-[0_0_50px_rgba(255,107,0,0.15)] relative">
                <div className="absolute top-[-10%] left-[20%] w-[300px] h-[300px] rounded-full bg-[#FF6B00]/5 blur-[80px] pointer-events-none" />
                
                <span className="text-5xl animate-bounce">🏟️</span>
                <h2 className="text-2xl font-heading text-[#FFB800] tracking-widest font-black uppercase">Creating Your Draft Arena...</h2>
                
                {/* Animated progress bar */}
                <div className="w-64 h-1.5 bg-white/5 rounded-full overflow-hidden relative">
                  <div className="h-full bg-gradient-to-r from-[#FF6B00] to-[#FFB800] rounded-full animate-pulse w-full" />
                </div>

                <div className="space-y-3 text-xs uppercase tracking-widest text-[#C8A060] font-bold">
                  <div className="flex items-center justify-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-[#FF6B00] animate-ping" />
                    <span>Setting up player pool...</span>
                  </div>
                  <div className="text-white/40">Configuring franchises...</div>
                  <div className="text-white/40">Generating Arena Code...</div>
                </div>
              </div>
            </div>
          )}
          {/* Modal Container */}
          <div
            style={{
              background: '#0E0A06',
              border: '1px solid rgba(255, 107, 0, 0.25)',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '850px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              boxShadow: '0 0 50px rgba(255, 107, 0, 0.15)',
              animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              overflow: 'hidden'
            }}
          >
            {/* Top Close / Progress Area */}
            <div style={{ padding: '1.5rem 2rem 0.5rem', position: 'relative', zIndex: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'rgba(255, 255, 255, 0.4)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  Step {createStep} of 4
                </span>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {createStep >= 2 && (
                    <span style={{
                      background: 'linear-gradient(90deg, #FF6B00, #FFB800)',
                      color: '#0E0A06',
                      fontSize: '0.65rem',
                      fontWeight: 900,
                      padding: '0.2rem 0.65rem',
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.2rem',
                      boxShadow: '0 2px 8px rgba(255, 107, 0, 0.2)'
                    }}>
                      👑 ROOM OWNER
                    </span>
                  )}
                  
                  <button
                    onClick={() => setShowCreateModal(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255, 255, 255, 0.5)',
                      fontSize: '1.25rem',
                      cursor: 'pointer',
                      padding: '0.2rem',
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.color = '#FFB800'}
                    onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.5)'}
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              {/* Progress bar fills left to right in #FF6B00 orange */}
              <div style={{ height: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${(createStep / 4) * 100}%`,
                  background: '#FF6B00',
                  boxShadow: '0 0 10px #FF6B00',
                  transition: 'width 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                }} />
              </div>
            </div>

            {/* Sliding steps container */}
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div
                style={{
                  display: 'flex',
                  width: '400%',
                  height: '100%',
                  transition: 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  transform: `translateX(-${(createStep - 1) * 25}%)`
                }}
              >
                
                {/* ══ STEP 1: CHOOSE AUCTION TYPE ══ */}
                <div style={{ width: '25%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: '1rem 2rem 2.5rem' }}>
                  <h2 className="font-heading" style={{ fontSize: '2.2rem', color: '#FFB800', marginBottom: '1.5rem', letterSpacing: '0.04em' }}>
                    SELECT AUCTION TYPE
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', width: '100%', maxWidth: '650px' }}>
                    
                    {/* Mini Auction Card */}
                    <div
                      onClick={() => {
                        setCreateAuctionType('mini');
                        setTimeout(() => {
                          setCreateStep(2);
                        }, 500);
                      }}
                      className="hover-card-orange"
                      style={{
                        background: '#1A1008',
                        border: `2.5px solid ${createAuctionType === 'mini' ? '#FF6B00' : 'rgba(255, 255, 255, 0.05)'}`,
                        borderRadius: '16px',
                        padding: '1.75rem',
                        cursor: 'pointer',
                        boxShadow: createAuctionType === 'mini' ? '0 0 20px rgba(255, 107, 0, 0.35)' : 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: '220px'
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '2.8rem', display: 'block', marginBottom: '0.75rem' }}>🏏</span>
                        <h3 className="font-heading" style={{ fontSize: '1.45rem', color: '#FFFFFF', margin: '0 0 0.5rem 0', letterSpacing: '0.05em' }}>MINI AUCTION</h3>
                        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', lineHeight: '1.5', margin: 0 }}>
                          60–350 players · Quick 20–30 min · No RTM · Fill squad gaps
                        </p>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.6rem' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#FF6B00', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Orange Glow</span>
                        <span style={{ height: '6px', width: '6px', borderRadius: '50%', backgroundColor: '#FF6B00' }} />
                      </div>
                    </div>

                    {/* Mega Auction Card */}
                    <div
                      onClick={() => {
                        setCreateAuctionType('mega');
                        setTimeout(() => {
                          setCreateStep(2);
                        }, 500);
                      }}
                      className="hover-card-gold"
                      style={{
                        background: '#1A1008',
                        border: `2.5px solid ${createAuctionType === 'mega' ? '#FFB800' : 'rgba(255, 255, 255, 0.05)'}`,
                        borderRadius: '16px',
                        padding: '1.75rem',
                        cursor: 'pointer',
                        boxShadow: createAuctionType === 'mega' ? '0 0 20px rgba(255, 184, 0, 0.35)' : 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: '220px'
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '2.8rem', display: 'block', marginBottom: '0.75rem' }}>🔥</span>
                        <h3 className="font-heading" style={{ fontSize: '1.45rem', color: '#FFFFFF', margin: '0 0 0.5rem 0', letterSpacing: '0.05em' }}>MEGA AUCTION</h3>
                        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', lineHeight: '1.5', margin: 0 }}>
                          500+ players · Epic 60–90 min · RTM cards · Full squad rebuild
                        </p>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.6rem' }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#FFB800', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Gold Glow</span>
                        <span style={{ height: '6px', width: '6px', borderRadius: '50%', backgroundColor: '#FFB800' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ══ STEP 2: PICK YOUR FRANCHISE ══ */}
                <div style={{ width: '25%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'start', flexShrink: 0, overflowY: 'auto', maxHeight: '100%', padding: '1rem 2rem 2.5rem' }}>
                  <h2 className="font-heading" style={{ fontSize: '2.2rem', color: '#FFB800', fontWeight: 'bold', textAlign: 'center', marginBottom: '0.25rem', letterSpacing: '0.04em' }}>
                    PICK YOUR FRANCHISE
                  </h2>
                  <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: '1.5rem' }}>
                    Select a franchise to lead as the room owner
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem', width: '100%', maxWidth: '750px', marginBottom: '1.25rem' }}>
                    {TEAMS.map((team) => {
                      const isSelected = createSelectedFranchise === team.id;
                      return (
                        <div
                          key={team.id}
                          onClick={() => setCreateSelectedFranchise(team.id)}
                          className={`ipl-team-card ${isSelected ? 'selected' : ''}`}
                          style={{
                            '--team-color': team.color,
                            '--team-color-glow': `${team.color}40`,
                            padding: '12px 8px'
                          }}
                        >
                          <img
                            src={team.logo}
                            alt={`${team.name} Logo`}
                            style={{ width: '60px', height: '60px', objectFit: 'contain', marginBottom: '8px' }}
                          />
                          
                          <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#FFFFFF', display: 'block', marginBottom: '2px' }}>
                            {team.id}
                          </span>
                          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.5px', lineHeight: '1.2', display: 'block' }}>
                            {team.name}
                          </span>

                          {isSelected && (
                            <div style={{
                              position: 'absolute',
                              top: '6px',
                              right: '6px',
                              backgroundColor: '#FFB800',
                              color: '#0E0A06',
                              borderRadius: '50%',
                              width: '18px',
                              height: '18px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 0 6px rgba(255, 184, 0, 0.6)',
                              zIndex: 2
                            }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0E0A06" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Navigation buttons */}
                  <div style={{ display: 'flex', gap: '1rem', width: '100%', maxWidth: '300px', marginTop: 'auto' }}>
                    <button
                      onClick={() => setCreateStep(1)}
                      style={{
                        flex: 1,
                        background: '#1A1008',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#FFFFFF',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        fontSize: '0.78rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        cursor: 'pointer'
                      }}
                    >
                      Back
                    </button>
                    <button
                      onClick={() => createSelectedFranchise && setCreateStep(3)}
                      disabled={!createSelectedFranchise}
                      style={{
                        flex: 1,
                        background: createSelectedFranchise ? '#FFB800' : 'rgba(255,255,255,0.03)',
                        color: createSelectedFranchise ? '#0E0A06' : 'rgba(255,255,255,0.2)',
                        border: 'none',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        fontSize: '0.78rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        cursor: createSelectedFranchise ? 'pointer' : 'not-allowed',
                        boxShadow: createSelectedFranchise ? '0 0 15px rgba(255, 184, 0, 0.45)' : 'none',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      Next
                    </button>
                  </div>
                </div>

                {/* ══ STEP 3: ROOM SETTINGS ══ */}
                <div style={{ width: '25%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'start', flexShrink: 0, overflowY: 'auto', maxHeight: '100%', padding: '1rem 2rem 2.5rem' }}>
                  <h2 className="font-heading" style={{ fontSize: '2.2rem', color: '#FFB800', marginBottom: '1rem', letterSpacing: '0.04em' }}>
                    ROOM SETTINGS
                  </h2>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', width: '100%', maxWidth: '700px', marginBottom: '1.5rem', textAlign: 'left' }}>
                    
                    {/* Squad Size */}
                    <div style={{ background: '#1A1008', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '12px', padding: '1rem' }}>
                      <label style={{ fontSize: '0.65rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>
                        Squad Size Limit
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                        {[15, 20, 25].map((val) => (
                          <button
                            key={val}
                            onClick={() => setCreateSquadSize(val)}
                            style={{
                              padding: '0.5rem 0',
                              borderRadius: '6px',
                              border: 'none',
                              background: createSquadSize === val ? '#FF6B00' : '#0E0A06',
                              color: '#FFFFFF',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              transition: 'background 0.2s'
                            }}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Purse Limit */}
                    <div style={{ background: '#1A1008', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '12px', padding: '1rem' }}>
                      <label style={{ fontSize: '0.65rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>
                        Starting Purse
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                        {[80, 100, 120].map((val) => (
                          <button
                            key={val}
                            onClick={() => setCreatePurse(val)}
                            style={{
                              padding: '0.5rem 0',
                              borderRadius: '6px',
                              border: 'none',
                              background: createPurse === val ? '#FFB800' : '#0E0A06',
                              color: createPurse === val ? '#0E0A06' : '#FFFFFF',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              transition: 'background 0.2s'
                            }}
                          >
                            ₹{val}CR
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Bid Timer */}
                    <div style={{ background: '#1A1008', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '12px', padding: '1rem' }}>
                      <label style={{ fontSize: '0.65rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>
                        Bid Timer
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                        {[15, 30, 60].map((val) => (
                          <button
                            key={val}
                            onClick={() => setCreateBidTimer(val)}
                            style={{
                              padding: '0.5rem 0',
                              borderRadius: '6px',
                              border: 'none',
                              background: createBidTimer === val ? '#FFB800' : '#0E0A06',
                              color: createBidTimer === val ? '#0E0A06' : '#FFFFFF',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              transition: 'background 0.2s'
                            }}
                          >
                            {val}s
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Max Overseas */}
                    <div style={{ background: '#1A1008', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '12px', padding: '1rem' }}>
                      <label style={{ fontSize: '0.65rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>
                        Max Overseas
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                        {[4, 6, 8].map((val) => (
                          <button
                            key={val}
                            onClick={() => setCreateMaxOverseas(val)}
                            style={{
                              padding: '0.5rem 0',
                              borderRadius: '6px',
                              border: 'none',
                              background: createMaxOverseas === val ? '#FF6B00' : '#0E0A06',
                              color: '#FFFFFF',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              transition: 'background 0.2s'
                            }}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* RTM Toggle */}
                    <div style={{ background: '#1A1008', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '12px', padding: '1rem', opacity: createAuctionType === 'mini' ? 0.4 : 1 }}>
                      <label style={{ fontSize: '0.65rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>
                        RTM Cards {createAuctionType === 'mini' && '(Disabled)'}
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                        <button
                          disabled={createAuctionType === 'mini'}
                          onClick={() => setCreateRtmEnabled(true)}
                          style={{
                            padding: '0.5rem 0',
                            borderRadius: '6px',
                            border: 'none',
                            background: createRtmEnabled ? '#FF6B00' : '#0E0A06',
                            color: '#FFFFFF',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            cursor: createAuctionType === 'mini' ? 'not-allowed' : 'pointer',
                            transition: 'background 0.2s'
                          }}
                        >
                          ON
                        </button>
                        <button
                          disabled={createAuctionType === 'mini'}
                          onClick={() => setCreateRtmEnabled(false)}
                          style={{
                            padding: '0.5rem 0',
                            borderRadius: '6px',
                            border: 'none',
                            background: !createRtmEnabled ? '#FF6B00' : '#0E0A06',
                            color: '#FFFFFF',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            cursor: createAuctionType === 'mini' ? 'not-allowed' : 'pointer',
                            transition: 'background 0.2s'
                          }}
                        >
                          OFF
                        </button>
                      </div>
                    </div>

                    {/* Room Visibility & Custom Room Code */}
                    <div style={{ background: '#1A1008', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '12px', padding: '1rem' }}>
                      <label style={{ fontSize: '0.65rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>
                        Room Type
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginBottom: createRoomType === 'private' ? '0.5rem' : 0 }}>
                        <button
                          onClick={() => setCreateRoomType('public')}
                          style={{
                            padding: '0.5rem 0',
                            borderRadius: '6px',
                            border: 'none',
                            background: createRoomType === 'public' ? '#FF6B00' : '#0E0A06',
                            color: '#FFFFFF',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                          }}
                        >
                          Public
                        </button>
                        <button
                          onClick={() => setCreateRoomType('private')}
                          style={{
                            padding: '0.5rem 0',
                            borderRadius: '6px',
                            border: 'none',
                            background: createRoomType === 'private' ? '#FF6B00' : '#0E0A06',
                            color: '#FFFFFF',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                          }}
                        >
                          Private
                        </button>
                      </div>
                      
                      {createRoomType === 'private' && (
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="CODE (e.g. DRAFT9)"
                          value={createPrivateCode}
                          onChange={(e) => setCreatePrivateCode(e.target.value.toUpperCase())}
                          style={{
                            width: '100%',
                            background: '#0E0A06',
                            border: '1px solid rgba(255,107,0,0.3)',
                            borderRadius: '6px',
                            padding: '0.45rem',
                            color: '#FFFFFF',
                            fontSize: '0.75rem',
                            textAlign: 'center',
                            outline: 'none',
                            fontFamily: 'monospace',
                            letterSpacing: '0.1em'
                          }}
                        />
                      )}
                    </div>

                    {/* Player Pool */}
                    <div style={{ background: '#1A1008', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '12px', padding: '1rem' }}>
                      <label style={{ fontSize: '0.65rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>
                        Player Pool
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                        <button
                          onClick={() => setCreatePoolSource('default')}
                          style={{
                            padding: '0.5rem 0',
                            borderRadius: '6px',
                            border: 'none',
                            background: createPoolSource === 'default' ? '#FFB800' : '#0E0A06',
                            color: createPoolSource === 'default' ? '#0E0A06' : '#FFFFFF',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                          }}
                        >
                          Standard (47)
                        </button>
                        <button
                          onClick={() => setCreatePoolSource('2025')}
                          style={{
                            padding: '0.5rem 0',
                            borderRadius: '6px',
                            border: 'none',
                            background: createPoolSource === '2025' ? '#FFB800' : '#0E0A06',
                            color: createPoolSource === '2025' ? '#0E0A06' : '#FFFFFF',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                          }}
                        >
                          2025 Auction (141)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Navigation buttons */}
                  <div style={{ display: 'flex', gap: '1rem', width: '100%', maxWidth: '300px', marginTop: 'auto' }}>
                    <button
                      onClick={() => setCreateStep(2)}
                      style={{
                        flex: 1,
                        background: '#1A1008',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#FFFFFF',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        fontSize: '0.78rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        cursor: 'pointer'
                      }}
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setCreateStep(4)}
                      style={{
                        flex: 1,
                        background: '#FF6B00',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        fontSize: '0.78rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(255, 107, 0, 0.25)'
                      }}
                    >
                      Review
                    </button>
                  </div>
                </div>

                {/* ══ STEP 4: REVIEW & LAUNCH ══ */}
                <div style={{ width: '25%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'start', flexShrink: 0, overflowY: 'auto', maxHeight: '100%', padding: '1rem 2rem 2.5rem' }}>
                  <h2 className="font-heading" style={{ fontSize: '2.2rem', color: '#FFB800', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
                    DRAFT BOARD PREVIEW
                  </h2>

                  {createError && (
                    <div style={{ background: 'rgba(255,107,0,0.1)', border: '1px solid #FF6B00', color: '#FF6B00', padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '0.75rem', fontSize: '0.78rem', textAlign: 'center', width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                      <span className="font-bold">⚠️ Room creation failed:</span>
                      <span>{createError}</span>
                      <button 
                        onClick={handleLaunchRoom}
                        style={{ marginTop: '0.4rem', background: '#FF6B00', color: '#white', fontWeight: 'bold', fontSize: '0.7rem', padding: '0.3rem 0.75rem', borderRadius: '6px', cursor: 'pointer', border: 'none' }}
                        onMouseEnter={(e) => e.target.style.filter = 'brightness(1.1)'}
                        onMouseLeave={(e) => e.target.style.filter = 'none'}
                      >
                        TRY AGAIN
                      </button>
                    </div>
                  )}

                  <div style={{ background: '#1A1008', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '16px', padding: '1.25rem 1.5rem', width: '100%', maxWidth: '550px', marginBottom: '1.25rem', position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 50%, rgba(255,107,0,0.03) 0%, transparent 70%)', pointerEvents: 'none', borderRadius: '16px' }} />

                    {!user && (
                      <div style={{ marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
                        <label style={{ fontSize: '0.65rem', fontWeight: 900, color: '#FFB800', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.45rem' }}>
                          Enter Your Name to Host
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. John Doe"
                          value={createHostName}
                          onChange={(e) => setCreateHostName(e.target.value)}
                          required
                          style={{
                            width: '100%',
                            background: '#0E0A06',
                            border: '1px solid rgba(255,107,0,0.3)',
                            borderRadius: '8px',
                            padding: '0.6rem 0.8rem',
                            color: '#FFFFFF',
                            fontSize: '0.9rem',
                            textAlign: 'center',
                            outline: 'none',
                            fontFamily: 'inherit',
                            letterSpacing: '0.05em'
                          }}
                        />
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem', textAlign: 'left', position: 'relative', zIndex: 2 }}>
                      <div>
                        <span style={{ fontSize: '0.55rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mode</span>
                        <span style={{ display: 'block', fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.25rem', color: '#FFB800', marginTop: '0.15rem' }}>
                          {createAuctionType === 'mini' ? '🏏 MINI' : '🔥 MEGA'}
                        </span>
                      </div>
                      
                      <div>
                        <span style={{ fontSize: '0.55rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Franchise</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.25rem', color: '#FFFFFF', marginTop: '0.15rem' }}>
                          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: TEAMS.find(t=>t.id === createSelectedFranchise)?.color || '#FFB800' }} />
                          {createSelectedFranchise || 'None'}
                        </span>
                      </div>

                      <div>
                        <span style={{ fontSize: '0.55rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Purse</span>
                        <span style={{ display: 'block', fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.25rem', color: '#FF6B00', marginTop: '0.15rem' }}>
                          ₹{createPurse}CR
                        </span>
                      </div>

                      <div>
                        <span style={{ fontSize: '0.55rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Squad Size</span>
                        <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#FFFFFF', marginTop: '0.2rem' }}>
                          {createSquadSize} Players
                        </span>
                      </div>

                      <div>
                        <span style={{ fontSize: '0.55rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Overseas</span>
                        <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#FFFFFF', marginTop: '0.2rem' }}>
                          Max {createMaxOverseas}
                        </span>
                      </div>

                      <div>
                        <span style={{ fontSize: '0.55rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bid Timer</span>
                        <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#FFFFFF', marginTop: '0.2rem' }}>
                          {createBidTimer} Seconds
                        </span>
                      </div>
                    </div>

                    <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2 }}>
                      <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <div>
                          <span style={{ fontSize: '0.55rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.25rem' }}>
                            Access Code
                          </span>
                          <span style={{ fontFamily: 'monospace', fontSize: '1.25rem', fontWeight: 900, color: '#FFB800', letterSpacing: '0.1em', background: '#0E0A06', border: '1px solid rgba(255,255,255,0.05)', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                            {createRoomType === 'private' && createPrivateCode ? createPrivateCode : createGeneratedCode}
                          </span>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.55rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.25rem' }}>
                            Player Pool
                          </span>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#FFFFFF', display: 'inline-block', background: '#FF6B00', padding: '0.3rem 0.6rem', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {createPoolSource === 'default' ? 'Standard (47)' : '2025 Auction (141)'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          const codeToCopy = createRoomType === 'private' && createPrivateCode ? createPrivateCode : createGeneratedCode;
                          navigator.clipboard.writeText(codeToCopy);
                          setCreateCopied(true);
                          setTimeout(() => setCreateCopied(false), 2000);
                        }}
                        style={{
                          background: '#0E0A06',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: '#FFFFFF',
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.borderColor = '#FFB800'}
                        onMouseLeave={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                      >
                        {createCopied ? '✓ Copied!' : '📋 Copy Code'}
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', maxWidth: '320px', marginTop: 'auto' }}>
                    <button
                      disabled={createIsSubmitting}
                      onClick={handleLaunchRoom}
                      className="btn-gold"
                      style={{
                        width: '100%',
                        padding: '0.9rem',
                        fontSize: '0.8rem',
                        fontWeight: 900,
                        borderRadius: '10px',
                        boxShadow: '0 4px 25px rgba(255, 184, 0, 0.25)',
                        cursor: createIsSubmitting ? 'not-allowed' : 'pointer',
                        animation: 'glowPulseGold 1.5s infinite'
                      }}
                    >
                      {createIsSubmitting ? 'GENERATING DRAFT ARENA...' : '⚡ LAUNCH AUCTION'}
                    </button>

                    <button
                      disabled={createIsSubmitting}
                      onClick={() => setCreateStep(3)}
                      style={{
                        width: '100%',
                        background: '#1A1008',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#FFFFFF',
                        padding: '0.65rem',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        fontSize: '0.78rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        cursor: 'pointer'
                      }}
                    >
                      Back
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating IPL Trophy Button */}
      <button
        onClick={() => setShowTrophyPaymentModal(true)}
        style={{
          position: 'fixed',
          bottom: '2.5rem',
          left: '2.5rem',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #FFB800, #FF6B00)',
          border: '2px solid #FFB800',
          boxShadow: '0 0 25px rgba(255, 184, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 999,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        className="trophy-btn animate-bounce"
        title="Payment Scanner"
      >
        <Trophy size={30} color="#0E0A06" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
      </button>

      {/* Teams Modal */}
      {showTeamsModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
          <div style={{ background: '#0E0A06', border: '1px solid rgba(255,107,0,0.2)', width: '100%', maxWidth: '850px', height: '80vh', borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 10px 50px rgba(255,107,0,0.15)', position: 'relative' }}>
            
            {/* Header */}
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1A1008' }}>
              <div>
                <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', letterSpacing: '0.05em', color: '#FFB800', margin: 0 }}>
                  {selectedTeamForHistory ? 'FRANCHISE PROFILE & 2026 HISTORY' : 'IPL FRANCHISE REGISTRY'}
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem', margin: '0.2rem 0 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {selectedTeamForHistory ? 'Detailed 2026 Season Performance & Player Metrics' : 'Click a franchise card to view their complete 2026 season stats'}
                </p>
              </div>
              <button 
                onClick={() => { setShowTeamsModal(false); setSelectedTeamForHistory(null); }}
                style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '1.5rem', cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={(e) => e.target.style.color = '#FF6B00'}
                onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.4)'}
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div style={{ flexGrow: 1, overflowY: 'auto', padding: '2rem' }}>
              {!selectedTeamForHistory ? (
                /* Grid of 10 Teams */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
                  {TEAMS.map((t) => {
                    return (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTeamForHistory(t.id)}
                        style={{
                          background: '#1A1008',
                          border: `1px solid rgba(255,255,255,0.07)`,
                          borderLeft: `4px solid ${t.color}`,
                          borderRadius: '12px',
                          padding: '1.25rem',
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                        className="team-card-hover"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-4px)';
                          e.currentTarget.style.borderColor = t.color;
                          e.currentTarget.style.boxShadow = `0 4px 20px ${t.color}25`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <img src={t.logo} alt={t.name} style={{ width: '64px', height: '64px', objectFit: 'contain', marginBottom: '0.75rem' }} />
                        <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '0.02em' }}>{t.id}</span>
                        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.25rem' }}>{t.name}</span>
                        
                        {/* Floating color accent */}
                        <div style={{ position: 'absolute', bottom: 0, right: 0, width: '40px', height: '40px', background: `radial-gradient(circle, ${t.color}20 0%, transparent 70%)`, pointerEvents: 'none' }} />
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Team Profile & 2026 History Details */
                (() => {
                  const teamInfo = TEAMS.find(t => t.id === selectedTeamForHistory);
                  const teamStats = {
                    CSK: { rank: '6th Place', won: 7, lost: 7, points: 14, nrr: '+0.050', desc: 'Chennai Super Kings fought hard under Ruturaj Gaikwad but consistency eluded them in the middle stages of the tournament, finishing just outside the top 5.', captain: 'Ruturaj Gaikwad', batter: 'Ruturaj Gaikwad (490 runs)', bowler: 'Matheesha Pathirana (19 wickets)' },
                    MI: { rank: '7th Place', won: 6, lost: 8, points: 12, nrr: '-0.110', desc: 'Mumbai Indians struggled to find the right balance under Hardik Pandya. Despite strong individual performances from Jasprit Bumrah, they finished in 7th place.', captain: 'Hardik Pandya', batter: 'Suryakumar Yadav (450 runs)', bowler: 'Jasprit Bumrah (22 wickets)' },
                    RCB: { rank: 'Champions', won: 9, lost: 5, points: 18, nrr: '+0.783', desc: 'Royal Challengers Bengaluru completed a historic campaign, defending their IPL title successfully. Led by Virat Kohli, they defeated Gujarat Titans by 5 wickets in the grand finale at Ahmedabad on May 31, 2026.', captain: 'Virat Kohli', batter: 'Virat Kohli (610 runs)', bowler: 'Mohammed Siraj (21 wickets)' },
                    KKR: { rank: '5th Place', won: 7, lost: 7, points: 14, nrr: '+0.120', desc: 'Kolkata Knight Riders had a mixed season under Shreyas Iyer. They showed glimpses of their high-flying standard but missed out on the playoffs by a single win.', captain: 'Shreyas Iyer', batter: 'Phil Salt (430 runs)', bowler: 'Varun Chakaravarthy (18 wickets)' },
                    SRH: { rank: '3rd Place (Playoffs)', won: 9, lost: 5, points: 18, nrr: '+0.380', desc: 'Sunrisers Hyderabad played highly aggressive cricket under Pat Cummins, scoring multiple 200+ scores, but were knocked out in the playoff stages.', captain: 'Pat Cummins', batter: 'Abhishek Sharma (520 runs)', bowler: 'T Natarajan (20 wickets)' },
                    DC: { rank: '8th Place', won: 6, lost: 8, points: 12, nrr: '-0.180', desc: 'Delhi Capitals had a roller-coaster season under Rishabh Pant. Brilliant knocks were offset by bowling struggles in the death overs, resulting in an 8th-place finish.', captain: 'Rishabh Pant', batter: 'Rishabh Pant (410 runs)', bowler: 'Kuldeep Yadav (15 wickets)' },
                    PBKS: { rank: '9th Place', won: 5, lost: 9, points: 10, nrr: '-0.350', desc: 'Punjab Kings had a tough campaign under Sam Curran, failing to close out several tight matches and finishing in 9th place.', captain: 'Sam Curran', batter: 'Shashank Singh (380 runs)', bowler: 'Arshdeep Singh (16 wickets)' },
                    RR: { rank: '4th Place (Playoffs)', won: 8, lost: 6, points: 16, nrr: '+0.250', desc: 'Rajasthan Royals claimed the final playoff spot. Their season was highlighted by the historic run of young sensation Vaibhav Sooryavanshi, who clinched the Orange Cap and MVP awards.', captain: 'Sanju Samson', batter: 'Vaibhav Sooryavanshi (776 runs - Orange Cap & MVP)', bowler: 'Yuzvendra Chahal (21 wickets)' },
                    GT: { rank: 'Runners-up (Playoffs)', won: 9, lost: 5, points: 18, nrr: '+0.450', desc: 'Gujarat Titans performed exceptionally under Shubman Gill to finish second in the league stage and reach the final. Despite a stellar campaign, they finished as runners-up.', captain: 'Shubman Gill', batter: 'Shubman Gill (580 runs)', bowler: 'Kagiso Rabada (29 wickets - Purple Cap)' },
                    LSG: { rank: '10th Place', won: 4, lost: 10, points: 8, nrr: '-0.520', desc: 'Lucknow Super Giants faced squad balance and form issues, finishing at the bottom of the table despite valiant efforts from Nicholas Pooran.', captain: 'Nicholas Pooran', batter: 'Nicholas Pooran (420 runs)', bowler: 'Ravi Bishnoi (13 wickets)' }
                  }[selectedTeamForHistory] || { rank: 'No Data', won: 0, lost: 0, points: 0, nrr: '0.000', desc: 'No historical record found.', captain: 'N/A', batter: 'N/A', bowler: 'N/A' };

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                      {/* Title Row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1.5rem' }}>
                        <img src={teamInfo.logo} alt={teamInfo.name} style={{ width: '96px', height: '96px', objectFit: 'contain' }} />
                        <div>
                          <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '0.02em', display: 'block', lineHeight: 1 }}>{teamInfo.id}</span>
                          <span style={{ fontSize: '1.1rem', color: teamInfo.color, fontWeight: 'bold', display: 'block', marginTop: '0.25rem' }}>{teamInfo.name}</span>
                          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', display: 'block', marginTop: '0.25rem' }}>OFFICIAL IPL FRANCHISE</span>
                        </div>
                      </div>

                      {/* Stats Panel */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                        <div style={{ background: '#1A1008', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1rem' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', display: 'block' }}>2026 Standings</span>
                          <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#FFB800', display: 'block', marginTop: '0.25rem' }}>{teamStats.rank}</span>
                        </div>
                        <div style={{ background: '#1A1008', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1rem' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', display: 'block' }}>Record (W - L)</span>
                          <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#FFFFFF', display: 'block', marginTop: '0.25rem' }}>{teamStats.won} - {teamStats.lost}</span>
                        </div>
                        <div style={{ background: '#1A1008', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1rem' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', display: 'block' }}>Points</span>
                          <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FF6B00', display: 'block', marginTop: '0.25rem' }}>{teamStats.points} PTS</span>
                        </div>
                        <div style={{ background: '#1A1008', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1rem' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', display: 'block' }}>Net Run Rate</span>
                          <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#FFFFFF', display: 'block', marginTop: '0.25rem' }}>{teamStats.nrr}</span>
                        </div>
                      </div>

                      {/* Performance Details & Stars */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                        <div style={{ background: '#1A1008', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '1.5rem' }}>
                          <h4 style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#FFB800', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 1rem 0' }}>2026 Season Analysis</h4>
                          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>{teamStats.desc}</p>
                        </div>
                        <div style={{ background: '#1A1008', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          <h4 style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#FF6B00', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Franchise Leaders</h4>
                          
                          <div>
                            <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', display: 'block' }}>Captain</span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#FFFFFF' }}>{teamStats.captain}</span>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', display: 'block' }}>Top Batter</span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#FFFFFF' }}>🏏 {teamStats.batter}</span>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', display: 'block' }}>Top Bowler</span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#FFFFFF' }}>🥎 {teamStats.bowler}</span>
                          </div>
                        </div>
                      </div>

                      {/* Back Button */}
                      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                        <button
                          onClick={() => setSelectedTeamForHistory(null)}
                          style={{
                            background: '#1A1008',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#FFFFFF',
                            padding: '0.6rem 1.25rem',
                            borderRadius: '8px',
                            fontSize: '0.78rem',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.borderColor = '#FFB800'}
                          onMouseLeave={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                        >
                          ← Back to Franchises
                        </button>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>

          </div>
        </div>
      )}

      {/* Players Modal */}
      {showPlayersModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
          <div style={{ background: '#0E0A06', border: '1px solid rgba(255,107,0,0.2)', width: '100%', maxWidth: '950px', height: '80vh', borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 10px 50px rgba(255,107,0,0.15)', position: 'relative' }}>
            
            {/* Header */}
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1A1008' }}>
              <div>
                <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', letterSpacing: '0.05em', color: '#FFB800', margin: 0 }}>
                  IPL PLAYER REGISTRY
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem', margin: '0.2rem 0 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Browse all available players to plan your franchise target roster
                </p>
              </div>
              <button 
                onClick={() => setShowPlayersModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '1.5rem', cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={(e) => e.target.style.color = '#FF6B00'}
                onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.4)'}
              >
                ✕
              </button>
            </div>

            {/* Filters Panel */}
            <div style={{ padding: '1.5rem 2rem', background: '#140E08', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Search Row */}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <input
                  type="text"
                  placeholder="🔍 Search players by name..."
                  value={playerSearchQuery}
                  onChange={(e) => setPlayerSearchQuery(e.target.value)}
                  style={{
                    flexGrow: 1,
                    background: '#0E0A06',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    color: '#FFFFFF',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Filters Row */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
                {/* Pool Source */}
                <div>
                  <span style={{ fontSize: '0.6rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>Player Pool</span>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    {[
                      { id: 'all', label: 'All Pools' },
                      { id: 'default', label: 'Standard (47)' },
                      { id: '2025', label: '2025 Pool (141)' }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setPlayerPoolFilter(opt.id)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          borderRadius: '4px',
                          border: 'none',
                          background: playerPoolFilter === opt.id ? '#FFB800' : '#0E0A06',
                          color: playerPoolFilter === opt.id ? '#0E0A06' : '#FFFFFF',
                          fontSize: '0.68rem',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Role */}
                <div>
                  <span style={{ fontSize: '0.6rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>Role</span>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    {[
                      { id: 'all', label: 'All Roles' },
                      { id: 'Batter', label: 'Batters' },
                      { id: 'Bowler', label: 'Bowlers' },
                      { id: 'All-Rounder', label: 'All-Rounders' },
                      { id: 'WK', label: 'Wicket-Keepers' }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setPlayerRoleFilter(opt.id)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          borderRadius: '4px',
                          background: playerRoleFilter === opt.id ? '#FF6B00' : '#0E0A06',
                          color: '#FFFFFF',
                          fontSize: '0.68rem',
                          fontWeight: 'bold',
                          border: playerRoleFilter === opt.id ? 'none' : '1px solid rgba(255,255,255,0.05)',
                          cursor: 'pointer'
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Capped status */}
                <div>
                  <span style={{ fontSize: '0.6rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>Status</span>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    {[
                      { id: 'all', label: 'All Players' },
                      { id: 'capped', label: 'Capped' },
                      { id: 'uncapped', label: 'Uncapped' }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setPlayerCappedFilter(opt.id)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          borderRadius: '4px',
                          background: playerCappedFilter === opt.id ? '#FF3333' : '#0E0A06',
                          color: '#FFFFFF',
                          fontSize: '0.68rem',
                          fontWeight: 'bold',
                          border: playerCappedFilter === opt.id ? 'none' : '1px solid rgba(255,255,255,0.05)',
                          cursor: 'pointer'
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

            </div>

            {/* Body */}
            <div style={{ flexGrow: 1, overflowY: 'auto', padding: '2rem' }}>
              {loadingPlayers ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#FFB800', fontSize: '1.2rem', fontWeight: 'bold' }}>
                  ⚡ LOADING PLAYER REGISTRY...
                </div>
              ) : (
                (() => {
                  const filtered = allPlayersList.filter(p => {
                    const matchesSearch = p.name.toLowerCase().includes(playerSearchQuery.toLowerCase());
                    const matchesPool = playerPoolFilter === 'all' || p.poolSource === playerPoolFilter;
                    
                    let matchesRole = true;
                    if (playerRoleFilter !== 'all') {
                      const r = p.role.toLowerCase();
                      if (playerRoleFilter === 'Batter') matchesRole = r.includes('batsman') || r.includes('batter');
                      else if (playerRoleFilter === 'Bowler') matchesRole = r.includes('bowler');
                      else if (playerRoleFilter === 'All-Rounder') matchesRole = r.includes('all-rounder') || r.includes('all rounder');
                      else if (playerRoleFilter === 'WK') matchesRole = r.includes('wk') || r.includes('keeper');
                    }

                    let matchesCapped = true;
                    if (playerCappedFilter !== 'all') {
                      matchesCapped = playerCappedFilter === 'capped' ? p.isCapped : !p.isCapped;
                    }

                    return matchesSearch && matchesPool && matchesRole && matchesCapped;
                  });

                  return (
                    <>
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Showing {filtered.length} of {allPlayersList.length} Players
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                        {filtered.map(p => {
                          const isCapped = p.isCapped;
                          const r = p.role.toLowerCase();
                          let roleColor = '#FFB800'; // Batter gold
                          let roleBg = 'rgba(255,184,0,0.1)';
                          let roleBorder = 'rgba(255,184,0,0.3)';
                          if (r.includes('bowler')) {
                            roleColor = '#FF6B00'; // Bowler orange
                            roleBg = 'rgba(255,107,0,0.1)';
                            roleBorder = 'rgba(255,107,0,0.3)';
                          } else if (r.includes('all-rounder') || r.includes('all rounder')) {
                            roleColor = '#FF3333'; // All-rounder red
                            roleBg = 'rgba(255,51,51,0.1)';
                            roleBorder = 'rgba(255,51,51,0.3)';
                          } else if (r.includes('wk') || r.includes('keeper')) {
                            roleColor = '#FFA000'; // WK amber
                            roleBg = 'rgba(255,160,0,0.1)';
                            roleBorder = 'rgba(255,160,0,0.3)';
                          }

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

                          return (
                            <div
                              key={p._id}
                              style={{
                                background: '#1A1008',
                                border: '1px solid rgba(255,255,255,0.05)',
                                borderRadius: '12px',
                                padding: '1.25rem',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                gap: '1rem',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                  <span style={{ fontSize: '1rem', fontWeight: 900, color: '#FFFFFF' }}>{p.name}</span>
                                  <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>
                                    {flag} {nat === 'Overseas' ? 'Overseas' : nat}
                                  </span>
                                </div>
                                <span style={{
                                  fontSize: '0.62rem',
                                  fontWeight: 'black',
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '10px',
                                  textTransform: 'uppercase',
                                  background: roleBg,
                                  color: roleColor,
                                  border: `1px solid ${roleBorder}`
                                }}>
                                  {p.role}
                                </span>
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                                <div>
                                  <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', display: 'block' }}>Base Price</span>
                                  <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#FFB800' }}>{formatPrice(p.basePrice)}</span>
                                </div>
                                <span style={{
                                  fontSize: '0.6rem',
                                  fontWeight: 'bold',
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: '4px',
                                  textTransform: 'uppercase',
                                  background: isCapped ? 'rgba(255,184,0,0.1)' : 'rgba(255,255,255,0.05)',
                                  color: isCapped ? '#FFB800' : 'rgba(255,255,255,0.4)',
                                  border: isCapped ? '1px solid rgba(255,184,0,0.3)' : '1px solid rgba(255,255,255,0.1)'
                                }}>
                                  {isCapped ? 'Capped' : 'Uncapped'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {filtered.length === 0 && (
                        <div style={{ color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.85rem', textAlign: 'center', padding: '4rem 0' }}>
                          No matching players found in registry
                        </div>
                      )}
                    </>
                  );
                })()
              )}
            </div>

          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
          <div style={{ background: '#0E0A06', border: '1px solid rgba(255,107,0,0.2)', width: '100%', maxWidth: '750px', height: '75vh', borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 10px 50px rgba(255,107,0,0.15)', position: 'relative' }}>
            
            {/* Header */}
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1A1008' }}>
              <div>
                <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', letterSpacing: '0.05em', color: '#FFB800', margin: 0 }}>
                  IPL {scheduleYear} SCHEDULE
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem', margin: '0.2rem 0 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {scheduleYear === '2026' ? 'Championship archived fixtures and match outcomes' : 'Tentative released fixtures for the upcoming season'}
                </p>
              </div>
              <button 
                onClick={() => setShowScheduleModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '1.5rem', cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={(e) => e.target.style.color = '#FF6B00'}
                onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.4)'}
              >
                ✕
              </button>
            </div>

            {/* Year selector tabs */}
            <div style={{ display: 'flex', background: '#1A1008', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0.5rem 2rem', gap: '1rem' }}>
              <button 
                onClick={() => setScheduleYear('2027')}
                style={{
                  background: scheduleYear === '2027' ? 'rgba(255,184,0,0.1)' : 'transparent',
                  border: 'none',
                  borderBottom: scheduleYear === '2027' ? '2px solid #FFB800' : 'none',
                  color: scheduleYear === '2027' ? '#FFB800' : 'rgba(255,255,255,0.4)',
                  padding: '0.5rem 1rem',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  borderRadius: '4px'
                }}
              >
                🔥 IPL 2027 (Tentative)
              </button>
              <button 
                onClick={() => setScheduleYear('2026')}
                style={{
                  background: scheduleYear === '2026' ? 'rgba(255,107,0,0.1)' : 'transparent',
                  border: 'none',
                  borderBottom: scheduleYear === '2026' ? '2px solid #FF6B00' : 'none',
                  color: scheduleYear === '2026' ? '#FF6B00' : 'rgba(255,255,255,0.4)',
                  padding: '0.5rem 1rem',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  borderRadius: '4px'
                }}
              >
                ✅ IPL 2026 (Completed)
              </button>
            </div>

            {/* Body */}
            <div style={{ flexGrow: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {scheduleYear === '2026' ? (
                [
                  { match: 'Match 1 • Tournament Opener', teams: 'RCB vs SRH', venue: 'M. Chinnaswamy Stadium, Bengaluru', date: 'March 28, 2026', time: '7:30 PM IST', tag: 'Opening Match', outcome: '🏆 RCB won by 5 wickets' },
                  { match: 'Match 2 • El Clasico of IPL', teams: 'MI vs CSK', venue: 'Wankhede Stadium, Mumbai', date: 'April 5, 2026', time: '7:30 PM IST', tag: 'Rivalry Week', outcome: '⚡ MI won by 4 runs' },
                  { match: 'Match 3 • Southern Derby', teams: 'RCB vs CSK', venue: 'M. Chinnaswamy Stadium, Bengaluru', date: 'April 8, 2026', time: '7:30 PM IST', tag: 'High Run Alert', outcome: '⚡ RCB won by 15 runs' },
                  { match: 'Match 4 • Northern Clash', teams: 'DC vs PBKS', venue: 'Arun Jaitley Stadium, Delhi', date: 'April 11, 2026', time: '7:30 PM IST', tag: 'Regular Match', outcome: '⚡ DC won by 6 wickets' },
                  { match: 'Match 5 • West vs East', teams: 'GT vs KKR', venue: 'Narendra Modi Stadium, Ahmedabad', date: 'April 14, 2026', time: '7:30 PM IST', tag: 'Regular Match', outcome: '⚡ GT won by 3 wickets' },
                  { match: 'Match 6 • Central Derby', teams: 'LSG vs RR', venue: 'BRSABV Ekana Stadium, Lucknow', date: 'April 17, 2026', time: '7:30 PM IST', tag: 'Regular Match', outcome: '⚡ RR won by 12 runs' },
                  { match: 'Playoffs • Qualifier 1', teams: 'RCB vs GT', venue: 'Narendra Modi Stadium, Ahmedabad', date: 'May 24, 2026', time: '7:30 PM IST', tag: 'Playoffs', outcome: '⚡ GT qualified for Final' },
                  { match: 'Playoffs • Eliminator', teams: 'SRH vs RR', venue: 'M. Chinnaswamy Stadium, Bengaluru', date: 'May 26, 2026', time: '7:30 PM IST', tag: 'Playoffs', outcome: '⚡ SRH won by 4 wickets' },
                  { match: 'Playoffs • Qualifier 2', teams: 'RCB vs SRH', venue: 'M. Chinnaswamy Stadium, Bengaluru', date: 'May 28, 2026', time: '7:30 PM IST', tag: 'Playoffs', outcome: '⚡ RCB qualified for Final' },
                  { match: 'GRAND FINAL', teams: 'RCB vs GT', venue: 'Narendra Modi Stadium, Ahmedabad', date: 'May 31, 2026', time: '7:30 PM IST', tag: 'Grand Finale', outcome: '🏆 RCB won by 5 wickets (Champions!)' }
                ].map((item, idx) => (
                  <div key={idx} style={{ background: '#1A1008', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'border-color 0.2s' }} onMouseEnter={(e)=>e.currentTarget.style.borderColor='#FF6B00'} onMouseLeave={(e)=>e.currentTarget.style.borderColor='rgba(255,255,255,0.05)'}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <span style={{ fontSize: '0.62rem', color: '#FFB800', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.match}</span>
                      <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#FFFFFF' }}>{item.teams}</span>
                      <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>📍 {item.venue}</span>
                      <span style={{ fontSize: '0.8rem', color: '#00E676', fontWeight: 'bold', marginTop: '0.35rem' }}>{item.outcome}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'end', gap: '0.35rem' }}>
                      <span style={{ fontSize: '0.62rem', fontWeight: 'bold', background: 'rgba(0, 230, 118, 0.1)', color: '#00E676', padding: '0.2rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase' }}>✅ COMPLETED</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.6)' }}>{item.date}</span>
                    </div>
                  </div>
                ))
              ) : (
                [
                  { match: 'Match 1 • Tournament Opener', teams: 'RCB vs GT', venue: 'M. Chinnaswamy Stadium, Bengaluru', date: 'March 27, 2027', time: '7:30 PM IST', tag: 'Opening Match' },
                  { match: 'Match 2 • Southern Derby', teams: 'SRH vs CSK', venue: 'Rajiv Gandhi International Stadium, Hyderabad', date: 'March 28, 2027', time: '7:30 PM IST', tag: 'High Run Alert' },
                  { match: 'Match 3 • El Clasico of IPL', teams: 'MI vs CSK', venue: 'Wankhede Stadium, Mumbai', date: 'March 30, 2027', time: '7:30 PM IST', tag: 'Rivalry Week' },
                  { match: 'Match 4 • Northern Clash', teams: 'DC vs PBKS', venue: 'Arun Jaitley Stadium, Delhi', date: 'April 1, 2027', time: '7:30 PM IST', tag: 'Regular Match' },
                  { match: 'Match 5 • East Coast Clash', teams: 'KKR vs SRH', venue: 'Eden Gardens, Kolkata', date: 'April 3, 2027', time: '7:30 PM IST', tag: 'Regular Match' },
                  { match: 'Match 6 • Central Derby', teams: 'RR vs LSG', venue: 'Sawai Mansingh Stadium, Jaipur', date: 'April 5, 2027', time: '7:30 PM IST', tag: 'Regular Match' },
                  { match: 'Playoffs • Qualifier 1', teams: 'Table 1st vs Table 2nd', venue: 'Narendra Modi Stadium, Ahmedabad', date: 'May 23, 2027', time: '7:30 PM IST', tag: 'Playoffs' },
                  { match: 'Playoffs • Eliminator', teams: 'Table 3rd vs Table 4th', venue: 'M. Chinnaswamy Stadium, Bengaluru', date: 'May 25, 2027', time: '7:30 PM IST', tag: 'Playoffs' },
                  { match: 'Playoffs • Qualifier 2', teams: 'Loser Q1 vs Winner Elim', venue: 'Eden Gardens, Kolkata', date: 'May 27, 2027', time: '7:30 PM IST', tag: 'Playoffs' },
                  { match: 'GRAND FINAL', teams: 'Winner Q1 vs Winner Q2', venue: 'Wankhede Stadium, Mumbai', date: 'May 30, 2027', time: '7:30 PM IST', tag: 'Grand Finale' }
                ].map((item, idx) => (
                  <div key={idx} style={{ background: '#1A1008', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'border-color 0.2s' }} onMouseEnter={(e)=>e.currentTarget.style.borderColor='#FF6B00'} onMouseLeave={(e)=>e.currentTarget.style.borderColor='rgba(255,255,255,0.05)'}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <span style={{ fontSize: '0.62rem', color: '#FFB800', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.match}</span>
                      <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#FFFFFF' }}>{item.teams}</span>
                      <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>📍 {item.venue}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'end', gap: '0.35rem' }}>
                      <span style={{ fontSize: '0.62rem', fontWeight: 'bold', background: item.tag.includes('Final') || item.tag.includes('Playoffs') ? 'rgba(255,184,0,0.1)' : 'rgba(255,255,255,0.05)', color: item.tag.includes('Final') || item.tag.includes('Playoffs') ? '#FFB800' : 'rgba(255,255,255,0.5)', padding: '0.2rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase' }}>{item.tag}</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#FFFFFF' }}>{item.date}</span>
                      <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>{item.time}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      )}

      {/* Support Modal */}
      {showSupportModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
          <div style={{ background: '#0E0A06', border: '1px solid rgba(255,107,0,0.2)', width: '100%', maxWidth: '800px', height: '70vh', borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 10px 50px rgba(255,107,0,0.15)', position: 'relative' }}>
            
            {/* Header */}
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1A1008' }}>
              <div>
                <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', letterSpacing: '0.05em', color: '#FFB800', margin: 0 }}>
                  CUSTOMER SUPPORT & PAYMENTS
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem', margin: '0.2rem 0 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Contact support or scan to make server contributions and contributions
                </p>
              </div>
              <button 
                onClick={() => setShowSupportModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '1.5rem', cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={(e) => e.target.style.color = '#FF6B00'}
                onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.4)'}
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div style={{ flexGrow: 1, overflowY: 'auto', padding: '2rem', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
              
              {/* Left: FAQ and Support Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#FFFFFF', margin: '0 0 0.5rem 0' }}>Frequently Asked Questions</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#FF6B00', display: 'block' }}>Q: How do I invite friends?</span>
                      <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>Create a room, copy the 6-character room access code, and share it. They can join via the lobby dashboard.</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#FF6B00', display: 'block' }}>Q: What are the RTM matching rules?</span>
                      <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>When a player has bid expiry in Mega Auction, their previous team gets a 10s decision to match or release. If they match, the highest bidder gets 1 final option to raise the price.</span>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.5rem 0' }}>Need Help?</h3>
                  <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)', display: 'block' }}>Reach our official team at:</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 'black', color: '#FFB800', display: 'block', marginTop: '0.25rem' }}>support@iplauction.com</span>
                </div>
              </div>

              {/* Right: Payment QR Scanner */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#1A1008', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '1.5rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.62rem', fontWeight: 900, color: '#FFB800', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.5rem' }}>Server Support Gateway</span>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: '1.5rem' }}>Scan using GPay, PhonePe, UPI or Cards</span>
                
                {/* QR Box Visual */}
                <div style={{ width: '160px', height: '160px', background: '#0E0A06', border: '2px solid #FFB800', borderRadius: '12px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(255,184,0,0.15)', position: 'relative' }}>
                  <div style={{ width: '100%', height: '100%', border: '4px solid #FFFFFF', position: 'relative', display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '4px', background: '#FFFFFF' }}>
                    <div style={{ position: 'absolute', top: 4, left: 4, width: '32px', height: '32px', border: '8px solid #000000', background: 'transparent' }} />
                    <div style={{ position: 'absolute', top: 4, right: 4, width: '32px', height: '32px', border: '8px solid #000000', background: 'transparent' }} />
                    <div style={{ position: 'absolute', bottom: 4, left: 4, width: '32px', height: '32px', border: '8px solid #000000', background: 'transparent' }} />
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '40px', height: '40px', background: '#000000', borderRadius: '4px', opacity: 0.85 }} />
                    <div style={{ width: '100%', height: '100%', background: 'repeating-linear-gradient(45deg, #000 0px, #000 2px, transparent 2px, transparent 10px), repeating-linear-gradient(-45deg, #000 0px, #000 2px, #fff 2px, #fff 10px)', opacity: 0.15 }} />
                  </div>
                </div>

                <span style={{ fontSize: '0.6rem', color: '#FF6B00', fontWeight: 'bold', marginTop: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ⚠️ SCANNER IMAGE PLACEHOLDER
                </span>
                <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', display: 'block', marginTop: '0.2rem' }}>
                  Provide your scanner code to activate live payments
                </span>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Trophy Payment Scanner Modal */}
      {showTrophyPaymentModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
          <div style={{ background: '#0E0A06', border: '2px solid #FFB800', width: '100%', maxWidth: '500px', borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 0 50px rgba(255,184,0,0.25)', position: 'relative', padding: '2.5rem' }}>
            
            {/* Close Button */}
            <button 
              onClick={() => setShowTrophyPaymentModal(false)}
              style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '1.5rem', cursor: 'pointer', transition: 'color 0.2s' }}
              onMouseEnter={(e) => e.target.style.color = '#FF6B00'}
              onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.4)'}
            >
              ✕
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              {/* Icon wrapper */}
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #FFB800, #FF6B00)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(255, 184, 0, 0.4)', marginBottom: '1.5rem' }}>
                <Trophy size={42} color="#0E0A06" />
              </div>

              <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.2rem', color: '#FFB800', margin: '0 0 0.5rem 0', letterSpacing: '0.05em' }}>
                BUY US A CHAI ☕
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', lineHeight: 1.6, margin: '0 0 1rem 0', maxWidth: '380px' }}>
                This IPL Auction Simulator is a completely free, fun project built just for the love of the game. No entry fees, no premium tiers — just pure cricket entertainment!
              </p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', lineHeight: 1.5, margin: '0 0 2rem 0', maxWidth: '380px' }}>
                If you enjoyed the experience and want to show some appreciation, you can buy us a chai ☕ by contributing just ₹10 — totally optional, totally voluntary, and totally heartwarming. 🙏
              </p>

              {/* QR Scanner Box */}
              <div style={{ width: '220px', height: '220px', border: '3px solid #FF6B00', borderRadius: '16px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(255,107,0,0.25)', background: '#1A1008', position: 'relative', overflow: 'hidden' }}>
                {/* Outer scan line animations */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '3px', background: '#FFB800', boxShadow: '0 0 10px #FFB800', animation: 'scanLineEffect 2.5s infinite linear' }} />
                
                {/* Simulated QR Code */}
                <div style={{ width: '100%', height: '100%', border: '4px solid #FFFFFF', position: 'relative', display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '4px', background: '#FFFFFF' }}>
                  <div style={{ position: 'absolute', top: 4, left: 4, width: '42px', height: '42px', border: '10px solid #000000', background: 'transparent' }} />
                  <div style={{ position: 'absolute', top: 4, right: 4, width: '42px', height: '42px', border: '10px solid #000000', background: 'transparent' }} />
                  <div style={{ position: 'absolute', bottom: 4, left: 4, width: '42px', height: '42px', border: '10px solid #000000', background: 'transparent' }} />
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '50px', height: '50px', background: '#000000', borderRadius: '6px' }} />
                  <div style={{ width: '100%', height: '100%', background: 'repeating-linear-gradient(45deg, #000 0px, #000 3px, transparent 3px, transparent 12px), repeating-linear-gradient(-45deg, #000 0px, #000 3px, #fff 3px, #fff 12px)', opacity: 0.2 }} />
                </div>
              </div>

              <div style={{ marginTop: '2rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#FFB800', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block' }}>
                  Every small contribution keeps the fun alive!
                </span>
                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', display: 'block', marginTop: '0.25rem' }}>
                  — Made by a fellow cricket fan, for cricket fans 🏆
                </span>
              </div>

              {/* Back Button */}
              <button
                onClick={() => setShowTrophyPaymentModal(false)}
                style={{
                  background: '#1A1008',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#FFFFFF',
                  padding: '0.65rem 2rem',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginTop: '2rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.borderColor = '#FFB800'}
                onMouseLeave={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              >
                Close Gate
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default Landing;
