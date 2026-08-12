import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useAuctionStore, socket } from '../store/auctionStore';
import axios from 'axios';

/* ====================================================================
   PARTICLE CANVAS
   ==================================================================== */
const ParticleCanvas = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    const pts = Array.from({ length: 45 }, () => ({
      x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
      r: Math.random() * 2 + 0.4, vx: (Math.random() - 0.5) * 0.15,
      vy: -(Math.random() * 0.4 + 0.1), a: Math.random() * 0.4 + 0.05,
      c: Math.random() > 0.5 ? '255,107,0' : '255,184,0',
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        p.a += (Math.random() - 0.5) * 0.005;
        p.a = Math.max(0.02, Math.min(0.5, p.a));
        if (p.y < -8) { p.y = canvas.height + 8; p.x = Math.random() * canvas.width; }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.c},${p.a})`; ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }} />;
};

/* ====================================================================
   TEAMS
   ==================================================================== */
const TEAMS = [
  { id: 'CSK',  name: 'Chennai Super Kings',        color: '#F5C518', logo: 'https://scores.iplt20.com/ipl/teamlogos/CSK.png' },
  { id: 'MI',   name: 'Mumbai Indians',             color: '#004BA0', logo: 'https://scores.iplt20.com/ipl/teamlogos/MI.png' },
  { id: 'RCB',  name: 'Royal Challengers Bengaluru',color: '#C8102E', logo: 'https://scores.iplt20.com/ipl/teamlogos/RCB.png' },
  { id: 'KKR',  name: 'Kolkata Knight Riders',      color: '#3A225D', logo: 'https://scores.iplt20.com/ipl/teamlogos/KKR.png' },
  { id: 'SRH',  name: 'Sunrisers Hyderabad',        color: '#F26522', logo: 'https://scores.iplt20.com/ipl/teamlogos/SRH.png' },
  { id: 'DC',   name: 'Delhi Capitals',             color: '#0078BC', logo: 'https://scores.iplt20.com/ipl/teamlogos/DC.png' },
  { id: 'PBKS', name: 'Punjab Kings',               color: '#D71920', logo: 'https://scores.iplt20.com/ipl/teamlogos/PBKS.png' },
  { id: 'RR',   name: 'Rajasthan Royals',           color: '#E8295B', logo: 'https://scores.iplt20.com/ipl/teamlogos/RR.png' },
  { id: 'GT',   name: 'Gujarat Titans',             color: '#1C3F6E', logo: 'https://scores.iplt20.com/ipl/teamlogos/GT.png' },
  { id: 'LSG',  name: 'Lucknow Super Giants',       color: '#00A19C', logo: 'https://scores.iplt20.com/ipl/teamlogos/LSG.png' },
];
const getTeamData  = (id) => TEAMS.find(t => t.id === id) || null;
const getTeamColor = (id) => getTeamData(id)?.color || '#FF6B00';

const fmt = (val) => {
  if (!val) return '₹0';
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2).replace(/\.00$/, '')}CR`;
  return `₹${(val / 100000).toFixed(0)}L`;
};

/* -- Image proxy helper --
   Routes all IPL headshot URLs through our own backend to bypass CORS.
   documents.iplt20.com blocks direct browser fetch with CORS headers.
   Our backend fetches it server-side (no browser CORS restriction) and pipes it back.
*/
const getProxiedImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  const iplMatch = imageUrl.match(/IPLHeadshot\d+\/(\d+)\.png/i);
  if (iplMatch) return `http://localhost:5000/api/player-image/${iplMatch[1]}`;
  if (imageUrl.startsWith('http')) return `http://localhost:5000/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
  return imageUrl;
};

/* -- Role colour map -- */
const ROLE_COLORS = {
  batter:     { bg: '#7C3AED', solid: '#6D28D9', light: 'rgba(124,58,237,0.18)', border: 'rgba(124,58,237,0.45)', text: '#C4B5FD' },
  bowler:     { bg: '#DC2626', solid: '#B91C1C', light: 'rgba(220,38,38,0.18)',  border: 'rgba(220,38,38,0.45)',  text: '#FCA5A5' },
  allrounder: { bg: '#059669', solid: '#047857', light: 'rgba(5,150,105,0.18)',  border: 'rgba(5,150,105,0.45)', text: '#6EE7B7' },
  wkbatter:   { bg: '#0284C7', solid: '#0369A1', light: 'rgba(2,132,199,0.18)',  border: 'rgba(2,132,199,0.45)', text: '#7DD3FC' },
};
const getRoleKey = (role = '') => {
  const r = role.toLowerCase().replace(/[-\s]/g, '');
  if (r.includes('wk') || r.includes('keeper')) return 'wkbatter';
  if (r.includes('allrounder') || r.includes('allround')) return 'allrounder';
  if (r.includes('bowl')) return 'bowler';
  return 'batter';
};
const getRoleColors = (role) => ROLE_COLORS[getRoleKey(role)] || ROLE_COLORS.batter;

/* -- Shared badge base -- */
const BB = 'inline-flex items-center gap-1 h-6 px-3 rounded-full text-[9px] font-black uppercase tracking-wider border leading-none';

const getNationalityBadge = (p) => {
  const nat = p?.nationality || 'Indian';
  const isOverseas = nat !== 'India' && nat !== 'Indian';
  return (
    <span className={`${BB} ${isOverseas ? 'bg-sky-900/30 border-sky-500/35 text-sky-300' : 'bg-white/5 border-white/10 text-white/50'}`}>
      {isOverseas ? '✈️ Overseas' : '🇮🇳 Indian'}
    </span>
  );
};
const getRoleBadge = (role) => {
  if (!role) return null;
  const c = getRoleColors(role);
  return <span className={BB} style={{ background: c.light, borderColor: c.border, color: c.text }}>{role}</span>;
};
const getCappedBadge = (p) => p?.isCapped
  ? <span className={`${BB} bg-[#FFB800]/15 border-[#FFB800]/30 text-[#FFB800]`}>★ Capped</span>
  : <span className={`${BB} bg-white/5 border-white/10 text-white/35`}>Uncapped</span>;
const getCategoryBadge = (cat) => {
  if (!cat) return null;
  const isM = (cat || '').toLowerCase().includes('marquee');
  return <span className={`${BB} ${isM ? 'bg-[#FF6B00]/15 border-[#FF6B00]/35 text-[#FF6B00]' : 'bg-white/5 border-white/10 text-white/50'}`}>{isM ? '👑 ' : ''}{cat}</span>;
};

const PLAYER_PHOTOS = {
  // ── VERIFIED WIKIMEDIA COMMONS URLS (Wikidata P18 resolved, 250px) ──
  "Rishabh Pant": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Rishabh_Pant.jpg/250px-Rishabh_Pant.jpg",
  "Shreyas Iyer": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Shreyas_Iyer_2021.jpg/250px-Shreyas_Iyer_2021.jpg",
  "KL Rahul": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/LOKESH_RAHUL-15573141953_%28cropped%29.JPG/250px-LOKESH_RAHUL-15573141953_%28cropped%29.JPG",
  "Jos Buttler": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Jos_buttler.JPG/250px-Jos_buttler.JPG",
  "Mitchell Starc": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Mitchell_Starc_2023.jpg/250px-Mitchell_Starc_2023.jpg",
  "Jofra Archer": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Australia_captain_wicketkeeper_Tim_Paine_and_spin_bowler_Nathan_Lyon_of_Australia_discuss_tactics_as_Jofra_Archer_walks_to_the_wicket_on_Day_4_of_the_3rd_Test_of_the_2019_Ashes_at_Headingley_%2848630967226%29_%28Archer_cropped%29.jpg/250px-thumbnail.jpg",
  "Josh Hazlewood": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Josh_Hazlewood_2011.jpg/250px-Josh_Hazlewood_2011.jpg",
  "Mohammed Shami": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Mohammed_Shami_%28Indian_Cricket_team_training_SCG_2015%29.jpg/250px-Mohammed_Shami_%28Indian_Cricket_team_training_SCG_2015%29.jpg",
  "Ishan Kishan": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Ishan_Kishan.jpg/250px-Ishan_Kishan.jpg",
  "Marco Jansen": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Marco_Jansen_2022.jpg/250px-Marco_Jansen_2022.jpg",
  "Virat Kohli": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Virat_Kohli_in_PMO_New_Delhi.jpg/250px-Virat_Kohli_in_PMO_New_Delhi.jpg",
  "Jasprit Bumrah": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Jasprit_Bumrah_in_PMO_New_Delhi.jpg/250px-Jasprit_Bumrah_in_PMO_New_Delhi.jpg",
  "Rohit Sharma": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Rohit_Sharma_in_PMO_New_Delhi.jpg/250px-Rohit_Sharma_in_PMO_New_Delhi.jpg",
  "Suryakumar Yadav": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Suryakumar_Yadav_%281%29.jpg/250px-Suryakumar_Yadav_%281%29.jpg",
  "Hardik Pandya": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Hardik_Pandya_in_PMO_New_Delhi.jpg/250px-Hardik_Pandya_in_PMO_New_Delhi.jpg",
  "Rashid Khan": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Rashid_Khan.jpg/250px-Rashid_Khan.jpg",
  "Ravindra Jadeja": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Ravindra_Jadeja_in_2018.jpg/250px-Ravindra_Jadeja_in_2018.jpg",
  "Sanju Samson": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Sanju_Samson_in_PMO_New_Delhi.jpg/250px-Sanju_Samson_in_PMO_New_Delhi.jpg",
  "Yashasvi Jaiswal": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Yashasvi_Jaiswal_in_PMO_New_Delhi.jpg/250px-Yashasvi_Jaiswal_in_PMO_New_Delhi.jpg",
  "Pat Cummins": "https://upload.wikimedia.org/wikipedia/commons/1/1f/2018.01.21.14.55.22-Roy_c_Finch_b_Cummins-0001_%2840183230984%29_%28Cummins_cropped%29.jpg",
  "Axar Patel": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Axar.Patel.jpg/250px-Axar.Patel.jpg",
  "Sunil Narine": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Sunil_Narine.jpg/250px-Sunil_Narine.jpg",
  "Andre Russell": "https://upload.wikimedia.org/wikipedia/commons/a/a6/Andre_Russell.jpg",
  "Tilak Varma": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Tilak_Varma_in_March_2026.png/250px-Tilak_Varma_in_March_2026.png",
  "Bhuvneshwar Kumar": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Bhuvneshwar_kumar_With_Rashid_Zirak_%28Bhuvneshwar_Kumar_cropped%29.jpg/250px-Bhuvneshwar_kumar_With_Rashid_Zirak_%28Bhuvneshwar_Kumar_cropped%29.jpg",
  "Khaleel Ahmed": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/2_29_Khaleel_mugshot.jpg/250px-2_29_Khaleel_mugshot.jpg",
  "Kagiso Rabada": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Rabada.jpg/250px-Rabada.jpg",
  "Wanindu Hasaranga": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Waniya.jpg/250px-Waniya.jpg",
  "Ravichandran Ashwin": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Ravi_Ashwin.jpg/250px-Ravi_Ashwin.jpg",
  "Trent Boult": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Trent_Boult.jpg/250px-Trent_Boult.jpg",
  "Sam Curran": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/The_Prime_Minister_welcomes_the_World_Cup_winning_cricketers_%2852764650104%29_-_Sam_Curran_%28cropped%29.jpg/250px-The_Prime_Minister_welcomes_the_World_Cup_winning_cricketers_%2852764650104%29_-_Sam_Curran_%28cropped%29.jpg",
  "Krunal Pandya": "https://upload.wikimedia.org/wikipedia/commons/7/73/Krunal_Pandya_and_Hardik_Pandya_%28cropped%29_1.jpg",
  "Washington Sundar": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Washington_Sundar.jpg/250px-Washington_Sundar.jpg",
  "Quinton de Kock": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/QUINTON_DE_KOCK_%2815085160584%29.jpg/250px-QUINTON_DE_KOCK_%2815085160584%29.jpg",
  "Phil Salt": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/2_02_Phil_Salt.jpg/250px-2_02_Phil_Salt.jpg",
  "MS Dhoni": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Mahendra_Singh_Dhoni_receiving_Padma_Bhushan.jpg/250px-Mahendra_Singh_Dhoni_receiving_Padma_Bhushan.jpg",
  // ── Players without verified Wikimedia (fallback to ESPN/backend proxy) ──
  // Venkatesh Iyer, Liam Livingstone, Shubman Gill, Ruturaj Gaikwad,
  // Heinrich Klaasen, Travis Head, Abhishek Sharma, Nicholas Pooran,
  // Kuldeep Yadav, Rinku Singh, Varun Chakravarthy, Arshdeep Singh,
  // Matheesha Pathirana, Riyan Parag, Dhruv Jurel, Nitish Kumar Reddy,
  // Rajat Patidar, Sai Sudharsan, Avesh Khan, T Natarajan, Anrich Nortje,
  // Noor Ahmad, Maheesh Theekshana, Prasidh Krishna, Will Jacks,
  // Mitchell Marsh, Marcus Stoinis, Glenn Phillips, Azmatullah Omarzai,
  // Abdul Samad, Jitesh Sharma
};

const getPlayerPhoto = (name) => PLAYER_PHOTOS[name] || null;

const getESPNPhoto = (player) => {
  if (!player?.espnId) return null;
  const url = `https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/author/dpr_2.0/content/player/${player.espnId}.png`;
  return `http://localhost:5000/api/proxy-image?url=${encodeURIComponent(url)}`;
};

const getIPLOfficialPhoto = (player) => {
  if (!player?.iplId) return null;
  return `http://localhost:5000/api/player-image/${player.iplId}`;
};

const getBackendProxyPhoto = (name) => {
  if (!name) return null;
  return `http://localhost:5000/api/player-photo/${encodeURIComponent(name)}?v=3`;
};

const AvatarFallback = ({ name, role, size }) => {
  const initials = name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';
  const roleGradients = {
    'WK-Batter':    'radial-gradient(circle, #1a237e, #0d0d5e)',
    'Batter':       'radial-gradient(circle, #4a148c, #2d0d6e)',
    'Bowler':       'radial-gradient(circle, #b71c1c, #7f0000)',
    'All-Rounder':  'radial-gradient(circle, #1b5e20, #0a3d10)',
  };
  const background = roleGradients[role] || 'radial-gradient(circle, #333, #111)';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      color: 'white', fontWeight: 'bold',
      boxShadow: 'inset 0 0 20px rgba(0,0,0,0.6)',
      border: '3px solid rgba(255,255,255,0.1)'
    }}>
      <span style={{ fontSize: size * 0.38, fontWeight: '800', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>{initials}</span>
      <span style={{ fontSize: size * 0.08, opacity: 0.7, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{role}</span>
    </div>
  );
};

/* ====================================================================
   PLAYER AVATAR — real photo via proxy, falls back to role-coded initials
   ==================================================================== */
const PlayerAvatar = ({ player, size = 128 }) => {
  const [imgSrc, setImgSrc] = useState(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [photoLoaded, setPhotoLoaded] = useState(false);

  // Construct the fallback list
  // Priority: backend proxy (IPL scores jersey photos) → Wikimedia statics → ESPN → IPL official by iplId → DB imageUrl
  const fallbackSources = [
    getBackendProxyPhoto(player?.name),   // Source 1: scores.iplt20.com jersey photo via proxy
    getPlayerPhoto(player?.name),          // Source 2: verified Wikimedia Commons headshots
    getESPNPhoto(player),                  // Source 3: ESPN Cricinfo by ESPN ID
    getIPLOfficialPhoto(player),           // Source 4: IPL official by iplId field
    player?.imageUrl ? getProxiedImageUrl(player.imageUrl) : null  // Source 5: DB imageUrl
  ].filter(Boolean);

  const handleImageError = () => {
    const nextAttempt = attemptCount + 1;
    if (nextAttempt < fallbackSources.length) {
      setImgSrc(fallbackSources[nextAttempt]);
      setAttemptCount(nextAttempt);
    } else {
      setImgSrc(null); // Force avatar fallback
    }
  };

  // Whenever the player changes, reset attempts and set initial image source
  useEffect(() => {
    setTimeout(() => {
      setAttemptCount(0);
      setPhotoLoaded(false);
      if (fallbackSources.length > 0) {
        setImgSrc(fallbackSources[0]);
      } else {
        setImgSrc(null);
      }
    }, 0);
  }, [player?.name]);

  // Handle timeout (2 seconds for proxy-based images)
  useEffect(() => {
    if (!player) return;
    const timeout = setTimeout(() => {
      if (!photoLoaded && imgSrc) {
        console.warn(`[PlayerAvatar] Photo load timeout (2s) for ${player.name}, attempt ${attemptCount + 1}/${fallbackSources.length}. Trying next source.`);
        handleImageError();
      }
    }, 2000);
    return () => clearTimeout(timeout);
  }, [imgSrc, photoLoaded, player?.name]);

  // Early return for mystery player (moved here to comply with Rules of Hooks)
  if (player?.isMystery && !player?.revealed) {
    return (
      <div
        className="rounded-full relative overflow-hidden flex items-center justify-center animate-pulse shrink-0"
        style={{
          width: size, height: size,
          background: `radial-gradient(circle at 50% 50%, rgba(255, 107, 0, 0.25) 0%, #1A1008 70%, #0E0A06 100%)`,
          boxShadow: `inset 0 0 28px rgba(0,0,0,0.85), 0 0 0 3px rgba(255, 107, 0, 0.4)`,
        }}
      >
        <span
          className="font-heading font-black leading-none text-[#FF6B00] animate-bounce"
          style={{ fontSize: size * 0.5, textShadow: '0 0 20px rgba(255,107,0,0.6)' }}
        >?</span>
      </div>
    );
  }

  if (!imgSrc) {
    return <AvatarFallback name={player?.name} role={player?.role} size={size} />;
  }

  return (
    <div
      className="rounded-full relative overflow-hidden flex items-center justify-center shrink-0"
      style={{
        width: size, height: size,
        boxShadow: `inset 0 0 28px rgba(0,0,0,0.65), 0 0 0 3px rgba(255,184,0,0.3)`,
        background: '#1A1008'
      }}
    >
      {/* Fallback avatar rendered in background while image is loading */}
      {!photoLoaded && (
        <div className="absolute inset-0">
          <AvatarFallback name={player?.name} role={player?.role} size={size} />
        </div>
      )}
      <img
        src={imgSrc}
        alt={player?.name}
        onLoad={() => setPhotoLoaded(true)}
        onError={handleImageError}
        className="absolute inset-0 w-full h-full transition-opacity duration-300"
        style={{ 
          opacity: photoLoaded ? 1 : 0,
          objectFit: 'cover',
          objectPosition: '50% 15%'
        }}
        loading="eager"
      />
    </div>
  );
};

/* ====================================================================
   TIMER RING
   ==================================================================== */
const TimerRing = ({ timeLeft, maxTime = 30, isPaused }) => {
  const r = 26, circ = 2 * Math.PI * r;
  const frac   = isPaused ? 0 : Math.max(0, Math.min(1, timeLeft / maxTime));
  const danger = timeLeft <= 5 && !isPaused;
  const warning = timeLeft > 5 && timeLeft <= 15 && !isPaused;
  const col    = isPaused ? '#4B5563' : danger ? '#EF4444' : warning ? '#F5A623' : '#22C55E';
  return (
    <div className="relative flex items-center justify-center" style={{ width: 68, height: 68 }}>
      <svg width="68" height="68" viewBox="0 0 68 68" className="absolute inset-0" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="34" cy="34" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
        <circle cx="34" cy="34" r={r} fill="none" stroke={col} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={`${frac * circ} ${circ}`}
          style={{ transition: 'stroke-dasharray 1s linear, stroke 0.4s ease' }} />
      </svg>
      <div className="relative z-10 flex items-center justify-center">
        {isPaused
          ? <span style={{ color: '#6B7280', fontSize: 20 }}>⏸</span>
          : <span
              className={`font-heading font-bold leading-none ${danger ? 'text-[#EF4444]' : warning ? 'text-[#F5A623]' : 'text-white'}`}
              style={{ fontSize: 17, textShadow: danger ? '0 0 8px rgba(239,68,68,0.6)' : warning ? '0 0 8px rgba(245,166,35,0.6)' : 'none' }}
            >{timeLeft}s</span>
        }
      </div>
    </div>
  );
};

/* ====================================================================
   LIVE TICKER — horizontal scrolling broadcast strip at bottom of screen
   Color-coded segments: gold=announcements, green=sold, red=unsold, orange=bids
   ==================================================================== */
const LiveTicker = ({ logs, player, currentBid, highestBidder, timeLeft, isPaused }) => {
  const segments = [];

  if (player) {
    segments.push({ text: `🎙️ NOW ON THE BLOCK: ${player.name} (${player.role}) · Base: ${fmt(player.basePrice)}`, color: '#FFB800' });
    if (currentBid > 0) {
      segments.push({ text: `⚡ CURRENT BID: ${fmt(currentBid)} — ${highestBidder} leads`, color: '#FF6B00' });
    } else {
      segments.push({ text: '✉️ No bids yet — open the floor!', color: 'rgba(255,255,255,0.35)' });
    }
    segments.push({ text: `⏱️ Clock: ${isPaused ? 'PAUSED' : `${timeLeft}s remaining`}`, color: isPaused ? '#FCD34D' : '#4ADE80' });
  } else {
    segments.push({ text: '🎙️ Preparing next lot — stand by...', color: 'rgba(255,255,255,0.25)' });
  }

  logs.slice(-8).forEach(log => {
    const col = log.type === 'sold' ? '#4ADE80' : log.type === 'unsold' ? '#F87171' : log.type === 'bid' ? '#FB923C' : '#94A3B8';
    segments.push({ text: log.message, color: col });
  });

  return (
    <div className="shrink-0 bg-[#060401] border-t border-[#FF6B00]/20 overflow-hidden relative z-20 flex items-stretch" style={{ height: 38 }}>
      {/* LIVE TICKER badge */}
      <div className="shrink-0 bg-[#FF6B00] flex items-center justify-center px-3" style={{ minWidth: 72 }}>
        <span className="text-white text-[8px] font-black uppercase tracking-[0.15em] leading-tight text-center">LIVE<br/>TICKER</span>
      </div>
      <div className="w-px bg-[#FF6B00]/40 shrink-0" />
      {/* Scrolling track */}
      <div className="flex-1 overflow-hidden relative flex items-center">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none" style={{ background: 'linear-gradient(to right, #060401, transparent)' }} />
        <div className="absolute right-0 top-0 bottom-0 w-8 z-10 pointer-events-none" style={{ background: 'linear-gradient(to left, #060401, transparent)' }} />
        {/* Ticker content — duplicated to create seamless loop */}
        <div className="animate-ticker whitespace-nowrap will-change-transform flex items-center gap-0">
          {[...segments, ...segments].map((seg, i) => (
            <span key={i} className="inline-flex items-center text-[11px] font-bold uppercase tracking-wider" style={{ color: seg.color }}>
              {seg.text}
              <span className="text-white/15 mx-5 font-normal">•••</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ====================================================================
   MAIN ROOM COMPONENT
   ==================================================================== */
const Room = () => {
  const { code } = useParams();
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const { room, auctionState, connectSocket, disconnectSocket, joinRoom, setRoomState, updateAuction, updateTimer } = useAuctionStore();
  
  const [activeResultsTeam, setActiveResultsTeam] = useState(null);

  const [logs,               setLogs]               = useState([]);
  const [error,              setError]              = useState('');
  const [claimedTeam,        setClaimedTeam]        = useState(null);
  const [availablePlayers,   setAvailablePlayers]   = useState([]);
  const [selectedRetentions, setSelectedRetentions] = useState([]);
  const [showSquadDrawer,    setShowSquadDrawer]    = useState(false);
  const [showPoolDrawer,     setShowPoolDrawer]     = useState(false);
  const [showSpectatorView,  setShowSpectatorView]  = useState(false);
  const [isPaused,           setIsPaused]           = useState(false);
  const [customBid,          setCustomBid]          = useState('');
  const [showCustomInput,    setShowCustomInput]    = useState(false);
  const [bidPulse,           setBidPulse]           = useState(false);
  const [soldAnimation,      setSoldAnimation]      = useState(false);
  const [soldPlayer,         setSoldPlayer]         = useState(null);
  const [unsoldAnimation,    setUnsoldAnimation]    = useState(false);
  const [confetti,           setConfetti]           = useState([]);
  const [isResolved,         setIsResolved]         = useState(false);
  const [intermissionCountdown, setIntermissionCountdown] = useState(10);

  // Passed teams on the current player
  const [passedTeams, setPassedTeams] = useState([]);
  const [prevPlayerName, setPrevPlayerName] = useState(null);
  const [loadingError, setLoadingError] = useState(false);

  // Completion states
  const [isCompleted,         setIsCompleted]         = useState(false);
  const [auctionSummary,      setAuctionSummary]      = useState(null);

  // Helper to resolve userId to participant name
  const getClaimerName = (userId) => {
    if (!userId) return null;
    const p = room?.players?.find(player => (player._id || player) === userId);
    return p ? p.name : 'Claimed';
  };



  const getSummaryStats = () => {
    if (auctionSummary) return auctionSummary;
    // Calculate client-side fallback
    const teams = Object.values(room?.teamsState || {});
    const allDrafted = [];
    teams.forEach(t => {
      if (t.squad) {
        t.squad.forEach(p => {
          allDrafted.push({ ...p, teamId: t.teamId });
        });
      }
    });

    allDrafted.sort((a, b) => b.price - a.price);
    const biggestBuy = allDrafted[0] || null;

    const cappedDrafted = allDrafted.filter(p => p.price > 0 && !p.name.includes("Uncapped"));
    cappedDrafted.sort((a, b) => a.price - b.price);
    const bestBargain = cappedDrafted[0] || null;

    const sortedTeamsByPurse = [...teams].sort((a, b) => b.purse - a.purse);
    const richTeam = sortedTeamsByPurse[0] || null;

    // find biggest spender (least purse left)
    const sortedSpenders = [...teams].sort((a, b) => a.purse - b.purse);
    const biggestSpender = sortedSpenders[0] || null;

    return {
      biggestBuy,
      bestBargain,
      richTeam,
      biggestSpender
    };
  };

  const downloadSquadCard = () => {
    const stats = getSummaryStats();
    let text = `==================================================\n`;
    text += `          IPL AUCTION LIVE SIMULATOR RESULTS      \n`;
    text += `==================================================\n\n`;
    
    text += `--- AUCTION HIGHLIGHTS ---\n`;
    if (stats.biggestBuy) {
      text += `👑 Most Expensive Player: ${stats.biggestBuy.name} to ${stats.biggestBuy.teamId} for ${fmt(stats.biggestBuy.price)}\n`;
    }
    if (stats.bestBargain) {
      text += `💎 Best Value Pick: ${stats.bestBargain.name} to ${stats.bestBargain.teamId} for ${fmt(stats.bestBargain.price)}\n`;
    }
    if (stats.biggestSpender) {
      const TOTAL_P = room.startingPurse ? room.startingPurse * 10000000 : 1200000000;
      text += `💰 Biggest Spender: ${stats.biggestSpender.teamId} (Spent ${fmt(TOTAL_P - stats.biggestSpender.purse)})\n`;
    }
    if (stats.richTeam) {
      text += `🏦 Most Purse Remaining: ${stats.richTeam.teamId} (${fmt(stats.richTeam.purse)} remaining)\n`;
    }
    text += `\n`;

    Object.values(room.teamsState || {}).forEach(t => {
      text += `--------------------------------------------------\n`;
      text += `${t.teamId} SQUAD (Purse Left: ${fmt(t.purse)} | Players: ${t.squad?.length || 0})\n`;
      text += `--------------------------------------------------\n`;
      if (t.squad && t.squad.length > 0) {
        t.squad.forEach((p, i) => {
          text += `${i + 1}. ${p.name} (${p.role}) - ${fmt(p.price)}\n`;
        });
      } else {
        text += `No players drafted.\n`;
      }
      text += `\n`;
    });

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IPL_Auction_${code}_Final_Rosters.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Custom Dynamic Ordering & Mystery settings state
  const [mysteryRevealZoom,  setMysteryRevealZoom]  = useState(false);
  const [mysteryPlayersEnabled, setMysteryPlayersEnabled] = useState(true);
  const [auctionOrderStyle,  setAuctionOrderStyle]  = useState('auto_shuffle');
  const [manualPriorityPlayers, setManualPriorityPlayers] = useState([]);
  const [prioritySearchTerm, setPrioritySearchTerm] = useState('');
  const [mysteryCountdown,   setMysteryCountdown]   = useState(null);

  const prevBidRef = useRef(null);

  const isOwner         = room?.owner?._id === user?._id || room?.owner === user?._id;
  const hostAction = useCallback((event, extra = {}) => {
    socket.emit(event, { roomId: room?._id, userId: user?._id, ...extra });
  }, [room, user]);

  const handleLaunchAuction = () => {
    socket.emit('start-auction', {
      roomId: room._id,
      userId: user._id,
      settings: {
        mysteryPlayersEnabled,
        auctionOrderStyle,
        manualPriorityPlayers
      }
    });
  };

  const renderHostSettings = () => {
    if (!isOwner) return null;
    
    const filteredPlayers = availablePlayers.filter(p => {
      const isRetained = Object.values(room?.teamsState || {}).some(t => t.retained?.includes(p.name) || t.squad?.some(s => s.name === p.name));
      if (isRetained) return false;
      return p.name.toLowerCase().includes(prioritySearchTerm.toLowerCase());
    });

    const handleSelectPriorityPlayer = (playerName) => {
      if (manualPriorityPlayers.includes(playerName)) {
        setManualPriorityPlayers(prev => prev.filter(x => x !== playerName));
      } else {
        if (manualPriorityPlayers.length >= 5) {
          alert("You can select up to 5 priority players maximum!");
          return;
        }
        setManualPriorityPlayers(prev => [...prev, playerName]);
      }
    };

    return (
      <div className="bg-[#0E0A06] border border-[#FF6B00]/20 rounded-xl p-4 mt-4 text-left space-y-4">
        <h4 className="font-heading text-xs text-[#FF6B00] tracking-widest uppercase border-b border-white/5 pb-2 flex items-center gap-1.5">
          <span>⚙️</span> Host Auction Settings
        </h4>
        
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-white block">🎭 Mystery Players</span>
            <span className="text-[9px] text-white/40 block leading-tight">Silhouette bidding every 15 players</span>
          </div>
          <button 
            type="button"
            onClick={() => setMysteryPlayersEnabled(p => !p)}
            className={`w-10 h-5 rounded-full relative transition-all duration-300 ${mysteryPlayersEnabled ? 'bg-[#FF6B00]' : 'bg-white/10'}`}
          >
            <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all duration-300 ${mysteryPlayersEnabled ? 'right-0.5' : 'left-0.5'}`} />
          </button>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-widest text-[#8a7866] font-bold block">Player Order Mode</label>
          <div className="grid grid-cols-3 gap-1 p-1 bg-[#1A1008] border border-white/5 rounded-lg text-center">
            {['auto_shuffle', 'set_based', 'manual_priority'].map(mode => {
              const label = mode === 'auto_shuffle' ? 'Auto Shuffle' : mode === 'set_based' ? 'Set-Based' : 'Priority';
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setAuctionOrderStyle(mode)}
                  className={`text-[9px] py-1.5 rounded-md font-bold transition-all uppercase tracking-wider ${
                    auctionOrderStyle === mode 
                      ? 'bg-[#FF6B00] text-white' 
                      : 'text-white/40 hover:text-white/80'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {auctionOrderStyle === 'manual_priority' && (
          <div className="space-y-2 border-t border-white/5 pt-3">
            <span className="text-[10px] uppercase tracking-widest text-[#8a7866] font-bold block">
              Priority Players ({manualPriorityPlayers.length}/5 Selected)
            </span>
            <div className="text-[9px] text-white/50 leading-relaxed mb-1">
              Select up to 5 players to be put at the absolute start of the auction.
            </div>
            
            {manualPriorityPlayers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {manualPriorityPlayers.map(name => (
                  <span 
                    key={name} 
                    onClick={() => handleSelectPriorityPlayer(name)}
                    className="inline-flex items-center gap-1 bg-[#FF6B00]/15 border border-[#FF6B00]/30 text-[#FF6B00] px-2 py-0.5 rounded text-[9px] font-bold cursor-pointer hover:bg-red-950/20 hover:text-red-400 hover:border-red-400/30 transition-all"
                  >
                    {name} <span>×</span>
                  </span>
                ))}
              </div>
            )}

            <input 
              type="text"
              placeholder="Search player name..."
              value={prioritySearchTerm}
              onChange={e => setPrioritySearchTerm(e.target.value)}
              className="w-full bg-[#1A1008] border border-white/5 rounded px-2.5 py-1.5 text-[11px] text-white focus:outline-none focus:border-[#FF6B00]"
            />

            {prioritySearchTerm && (
              <div className="max-h-32 overflow-y-auto bg-[#1A1008] border border-white/5 rounded divide-y divide-white/5">
                {filteredPlayers.slice(0, 10).map(p => {
                  const isSelected = manualPriorityPlayers.includes(p.name);
                  return (
                    <div 
                      key={p.name}
                      onClick={() => handleSelectPriorityPlayer(p.name)}
                      className={`px-2.5 py-1.5 text-[10px] cursor-pointer flex justify-between items-center transition-all ${
                        isSelected ? 'bg-[#FF6B00]/15 text-[#FF6B00]' : 'text-white/70 hover:bg-white/5'
                      }`}
                    >
                      <span>{p.name} ({p.role})</span>
                      {isSelected ? <span className="font-bold text-xs">✓</span> : <span className="text-white/20">+ Add</span>}
                    </div>
                  );
                })}
                {filteredPlayers.length === 0 && (
                  <div className="p-2 text-center text-white/20 text-[9px] uppercase font-bold">No players found</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };



  // Preload next 5 player photos in the background
  useEffect(() => {
    if (auctionState?.playersList) {
      const upcoming = auctionState.playersList.slice(auctionState.currentIndex + 1, auctionState.currentIndex + 6);
      upcoming.forEach(player => {
        const src = getPlayerPhoto(player.name) || getBackendProxyPhoto(player.name) || getESPNPhoto(player) || getIPLOfficialPhoto(player);
        if (src) {
          const img = new Image();
          img.src = src;
        }
      });
    }
  }, [auctionState?.currentIndex, auctionState?.playersList]);

  // Intermission break countdown & auto-resume logic
  useEffect(() => {
    if (auctionState?.breakState?.active) {
      setTimeout(() => setIntermissionCountdown(10), 0);
      const interval = setInterval(() => {
        setIntermissionCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            if (isOwner) {
              hostAction('end-break');
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [auctionState?.breakState?.active, isOwner, hostAction]);

  useEffect(() => {
    const cur = auctionState?.currentBid;
    if (cur && cur !== prevBidRef.current) {
      prevBidRef.current = cur;
      setBidPulse(true);
      setTimeout(() => setBidPulse(false), 500);
    }
  }, [auctionState?.currentBid]);

  useEffect(() => {
    const fetchPlayers = async () => {
      try { const res = await axios.get('http://localhost:5000/api/players'); setAvailablePlayers(res.data); }
      catch (e) { console.error('Players fetch failed', e); }
    };
    fetchPlayers();
  }, []);

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    connectSocket();

    const loadRoom = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/rooms/${code}`, { headers: { Authorization: `Bearer ${token}` } });
        joinRoom(res.data._id, user._id);
      } catch (e) { setError(e.response?.data?.error || 'Failed to connect.'); }
    };
    loadRoom();

    socket.on('room-state', (data) => {
      setRoomState(data);
      const mine = Object.values(data.room?.teamsState || {}).find(t => t.userId === user._id);
      if (mine) { setClaimedTeam(mine); setSelectedRetentions(availablePlayers.filter(p => mine.retentions?.includes(p.name))); }
      else setClaimedTeam(null);

      if (data.room && data.room.status === 'waiting') {
        if (data.room.mysteryPlayersEnabled !== undefined) setMysteryPlayersEnabled(data.room.mysteryPlayersEnabled);
        if (data.room.auctionOrderStyle !== undefined) setAuctionOrderStyle(data.room.auctionOrderStyle);
        if (data.room.manualPriorityPlayers !== undefined) setManualPriorityPlayers(data.room.manualPriorityPlayers);
      }
      setIsResolved(false);
    });
    socket.on('error-msg',      (data) => alert(data.message));
    socket.on('auction-update', (data) => {
      const prevBid = useAuctionStore.getState().auctionState?.currentBid ?? 0;
      if (data.currentBid > prevBid && data.highestBidderTeam) {
        setLogs(p => [...p, { id: Date.now() + Math.random(), type: 'bid', message: `⚡ ${data.highestBidderTeam} raises to ${fmt(data.currentBid)}!` }]);
      }
      updateAuction(data);
      if (data.isPaused !== undefined) setIsPaused(data.isPaused);
      if (data.mysteryRevealTimeLeft !== undefined) setMysteryCountdown(data.mysteryRevealTimeLeft);
      setIsResolved(false);
    });
    socket.on('auction-paused',  () => setIsPaused(true));
    socket.on('auction-resumed', () => setIsPaused(false));
    socket.on('rtm-triggered', (data) => {
      updateAuction(data);
      setLogs(p => [...p, { id: Date.now() + Math.random(), type: 'bid', message: `🔥 RTM by ${data.rtmState?.rtmTeamId}! Counter bid pending.` }]);
    });
    socket.on('rtm-update',   (data) => updateAuction(data));
    socket.on('timer-update', ({ timeLeft, mysteryRevealTimeLeft }) => {
      updateTimer(timeLeft);
      setMysteryCountdown(mysteryRevealTimeLeft);
    });
    socket.on('ticker-announcement', ({ message, type }) => {
      let formattedMsg = message;
      if (message.startsWith('🎙️ THE') && message.includes('SET IS COMPLETE! NOW ENTERING THE')) {
        const match = message.match(/🎙️ THE (.*) SET IS COMPLETE! NOW ENTERING THE (.*) SET!/i);
        if (match) {
          formattedMsg = `📢 ${match[1]} SET COMPLETE — ${match[2]} SET BEGINS!`;
        }
      }
      setLogs(p => [...p, { id: Date.now() + Math.random(), type: type || 'announcement', message: formattedMsg }]);
    });
    socket.on('mystery-revealed', () => {
      setMysteryRevealZoom(true);
      setTimeout(() => setMysteryRevealZoom(false), 2000);
    });
    socket.on('player-sold',  ({ player, buyerTeamId, price, rtmUsed }) => {
      setIsResolved(true);
      const msg = buyerTeamId
        ? `🔨 ${player.name} → ${buyerTeamId} for ${fmt(price)}${rtmUsed ? ' (RTM)' : ''}`
        : `❌ ${player.name} returned to unsold pool`;
      if (buyerTeamId) {
        setSoldPlayer({ player, buyerTeamId, price });
        setSoldAnimation(true);
        const colors = [getTeamColor(buyerTeamId), '#FFD700', '#FF6B00', '#FFFFFF'];
        setConfetti(Array.from({ length: 60 }, () => ({
          id: Math.random(), x: Math.random() * 100, y: -10 - Math.random() * 20,
          r: Math.random() * 8 + 4, color: colors[Math.floor(Math.random() * 4)], delay: Math.random() * 2,
        })));
        setTimeout(() => setSoldAnimation(false), 3500);
      } else {
        setUnsoldAnimation(true);
        setTimeout(() => setUnsoldAnimation(false), 2500);
      }
      setLogs(p => [...p, { id: Date.now() + Math.random(), type: buyerTeamId ? 'sold' : 'unsold', message: msg }]);
    });
    socket.on('mid-auction-break', (data) => {
      setRoomState(data);
    });
    socket.on('team-passed', ({ teamId }) => {
      setPassedTeams(prev => [...prev, teamId]);
    });
    socket.on('auction-completed', (data) => {
      setAuctionSummary(data.summary);
      setIsCompleted(true);
      if (data.room) {
        setRoomState({ room: data.room, auctionState: null });
      }
    });
    socket.on('auction-ended', ({ message }) => { alert(message); navigate('/lobby'); });

    return () => {
      ['room-state','error-msg','auction-update','auction-paused','auction-resumed',
       'rtm-triggered','rtm-update','timer-update','ticker-announcement','mystery-revealed','player-sold','auction-ended','mid-auction-break', 'team-passed', 'auction-completed',
       'prompt-reauction-round','reauction-round-started'].forEach(e => socket.off(e));
      disconnectSocket();
    };
  }, [code, user, token]);

  useEffect(() => {
    let t;
    if (room && room.status === 'active' && !auctionState) {
      t = setTimeout(() => {
        setLoadingError(true);
      }, 4000);
    } else {
      setTimeout(() => {
        setLoadingError(false);
      }, 0);
    }
    return () => {
      if (t) clearTimeout(t);
    };
  }, [room, auctionState]);

  // Derive current player name from store state (no hooks, safe to compute anywhere)
  const currentPlayerName = auctionState?.currentPlayer?.name || null;

  // Must be here — BEFORE any early return — so hook count is constant every render
  useEffect(() => {
    if (currentPlayerName !== prevPlayerName) {
      setTimeout(() => {
        setPrevPlayerName(currentPlayerName);
        setPassedTeams([]);
      }, 0);
    }
  }, [currentPlayerName]);

  /* ---- Guards ---- */
  if (loadingError) return (
    <div className="min-h-screen bg-[#0E0A06] text-white flex flex-col items-center justify-center font-['Inter'] gap-6 p-6">
      <span className="text-5xl animate-bounce">⚠️</span>
      <h2 className="text-2xl font-heading text-[#FFB800] uppercase tracking-widest text-center">Failed to Sync Draft Arena</h2>
      <p className="text-white/60 text-xs text-center max-w-sm uppercase tracking-wider leading-relaxed">
        The live auction state is currently unavailable or the server restarted.
      </p>
      <div className="flex gap-4">
        {isOwner && (
          <button 
            onClick={() => {
              socket.emit('force-reset-room', { roomId: room?._id });
              setLoadingError(false);
            }}
            className="px-6 py-2.5 bg-[#FFB800] hover:bg-[#FFB800]/90 text-black font-black text-xs uppercase tracking-widest rounded-lg transition"
          >
            🔄 Re-Initialize Lobby
          </button>
        )}
        <button 
          onClick={() => navigate('/lobby')} 
          className="px-6 py-2.5 bg-[#1A1008] hover:bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-widest rounded-lg transition"
        >
          ← Back to Lobby
        </button>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#0E0A06] text-white flex items-center justify-center font-['Inter']">
      <div className="bg-[#1A1008] border border-[#FF6B00] rounded-2xl p-10 max-w-md text-center shadow-2xl">
        <span className="text-5xl block mb-4">⚠️</span>
        <h2 className="text-2xl font-heading text-[#FFB800] tracking-widest mb-4">ROOM ERROR</h2>
        <p className="text-white/60 mb-8">{error}</p>
        <button onClick={() => navigate('/lobby')} className="btn-orange px-6 py-2.5 text-xs font-bold tracking-widest">Back to Lobby</button>
      </div>
    </div>
  );

  if (!room) return (
    <div className="min-h-screen bg-[#0E0A06] text-white flex flex-col items-center justify-center font-['Inter'] gap-4">
      <div className="w-12 h-12 rounded-full border-2 border-white/5 border-t-[#FFB800] animate-spin" />
      <p className="text-[#FFB800] font-heading tracking-widest text-lg">Entering Bidding Arena...</p>
    </div>
  );

  if (room.status === 'active' && (!room.teamsState || !auctionState)) return (
    <div className="min-h-screen bg-[#0E0A06] text-white flex flex-col items-center justify-center font-['Inter'] gap-6 relative overflow-hidden select-none">
      <div className="absolute w-96 h-96 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle,rgba(255,184,0,0.1) 0%,transparent 70%)', filter: 'blur(40px)' }} />
      <div className="z-10 flex flex-col items-center gap-4 text-center">
        <span className="text-5xl animate-bounce">🎙️</span>
        <h2 className="text-2xl font-heading text-[#FFB800] tracking-widest font-black uppercase">Preparing the Draft Arena...</h2>
        <p className="text-white/40 text-xs uppercase tracking-widest">Configuring franchises, player rosters, and synchronization</p>
        <div className="mt-4 flex items-center gap-2">
          <span className="inline-block h-5 w-5 border-2 border-[#FFB800] border-t-transparent rounded-full animate-spin" />
          <span className="text-[10px] text-[#C8A060] font-black uppercase tracking-wider">Synchronizing live state...</span>
        </div>
      </div>
    </div>
  );


  /* ---- Derived state ---- */
  const isAuctionActive = room.status === 'active';
  const player          = auctionState?.currentPlayer;
  const timeLeft        = auctionState?.timeLeft ?? 0;

  const rtmState        = auctionState?.rtmState;
  const currentBid      = auctionState?.currentBid || 0;
  const highestBidder   = auctionState?.highestBidderTeam;
  const leaderColor     = getTeamColor(highestBidder);
  const teamsArr        = Object.values(room.teamsState || {});
  const TOTAL_PURSE     = room.startingPurse ? room.startingPurse * 10000000 : 1200000000;

  const getBcciInc = (v) => v < 10000000 ? 500000 : v < 20000000 ? 1000000 : v < 50000000 ? 2500000 : 5000000;
  const nextBid    = currentBid === 0 ? (player?.basePrice || 20000000) : currentBid + getBcciInc(currentBid);
  const INCS       = [{ label: '+25L', val: 2500000 }, { label: '+50L', val: 5000000 }, { label: '+1CR', val: 10000000 }, { label: '+2CR', val: 20000000 }];

  const placeBid    = (amount) => { if (!claimedTeam || isPaused) return; socket.emit('place-bid', { roomId: room._id, userId: user._id, teamId: claimedTeam.teamId, amount }); };
  const doCustomBid = () => { const cr = parseFloat(customBid); if (isNaN(cr) || cr <= 0) return; placeBid(Math.round(cr * 10000000)); setCustomBid(''); setShowCustomInput(false); };

  const handleClaimFranchise = (tid) => {
    const teams = Object.values(room?.teamsState || {});
    const alreadyClaimed = teams.find(t => t.userId === user?._id);

    if (alreadyClaimed) {
      if (alreadyClaimed.teamId === tid) {
        if (room.status !== 'waiting') {
          alert('Cannot release franchise after auction has started.');
          return;
        }
        if (window.confirm(`Release ${tid}? You can then pick a different franchise.`)) {
          socket.emit('release-franchise', { roomId: room._id, userId: user._id, teamId: tid });
        }
      } else {
        alert(`You already claimed ${alreadyClaimed.teamId}. Release it first to pick another.`);
      }
      return;
    }

    const teamState = room.teamsState?.[tid];
    if (teamState?.userId && teamState.userId !== user?._id) {
      alert(`${tid} is already claimed by another player.`);
      return;
    }

    socket.emit('select-team', { roomId: room._id, userId: user._id, teamId: tid });
  };
  const toggleRetention = (p)   => {
    if (!claimedTeam) return;
    const already = selectedRetentions.some(x => x.name === p.name);
    const nr = already ? selectedRetentions.filter(x => x.name !== p.name) : (selectedRetentions.length >= 6 ? (alert('Max 6 retentions!'), selectedRetentions) : [...selectedRetentions, p]);
    setSelectedRetentions(nr);
    socket.emit('update-retentions', { roomId: room._id, userId: user._id, teamId: claimedTeam.teamId, retentions: nr });
  };
  const rtmDecision     = (u)   => socket.emit('rtm-decision',      { roomId: room._id, teamId: claimedTeam.teamId, useRtm: u });
  const counterBid      = (a)   => socket.emit('place-counter-bid', { roomId: room._id, teamId: claimedTeam.teamId, amount: a });
  const passCounter     = ()    => socket.emit('pass-counter-bid',  { roomId: room._id, teamId: claimedTeam.teamId });
  const matchRtm        = (m)   => socket.emit('final-match-rtm',   { roomId: room._id, teamId: claimedTeam.teamId, match: m });

  if (isCompleted || room?.status === 'completed') {
    const stats = getSummaryStats();
    const teams = Object.values(room?.teamsState || {});
    const activeTeam = activeResultsTeam || teams[0]?.teamId;
    const activeTeamObj = teams.find(t => t.teamId === activeTeam);
    const activeTd = getTeamData(activeTeam);
    
    return (
      <div className="min-h-screen bg-[#0E0A06] text-white font-['Inter'] flex flex-col relative overflow-hidden z-10 select-none">
        <ParticleCanvas />
        <header className="bg-[#1A1008] border-b border-[#FF6B00]/25 px-6 py-4 flex justify-between items-center z-20 shrink-0">
          <div className="font-heading text-2xl tracking-widest">
            <span className="text-[#FFB800]">IPL </span><span className="text-[#FF6B00]">DRAFT ARENA</span>
          </div>
          <div className="bg-[#00E676]/10 border border-[#00E676]/35 text-[#00E676] px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase">
            🏆 SIMULATION COMPLETE
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 z-10 max-w-[1100px] mx-auto w-full">
          {/* Highlights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Box 1: Most Expensive */}
            <div className="bg-[#1A1008] border border-[#FFD700]/25 rounded-2xl p-4 flex flex-col justify-between shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 h-16 w-16 bg-[#FFD700]/5 rounded-full filter blur-xl" />
              <div>
                <span className="text-[9px] font-black uppercase text-[#FFD700] tracking-widest block mb-1">👑 HIGHEST BID</span>
                <h4 className="font-heading text-base font-black truncate">{stats.biggestBuy?.name || 'N/A'}</h4>
                <p className="text-[10px] text-white/50 uppercase mt-0.5">{stats.biggestBuy?.role || ''}</p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs font-bold text-white/70">{stats.biggestBuy?.teamId || ''}</span>
                <span className="font-mono text-base font-black text-[#FFD700]">{stats.biggestBuy ? fmt(stats.biggestBuy.price) : '—'}</span>
              </div>
            </div>

            {/* Box 2: Best Value */}
            <div className="bg-[#1A1008] border border-cyan-500/25 rounded-2xl p-4 flex flex-col justify-between shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 h-16 w-16 bg-cyan-500/5 rounded-full filter blur-xl" />
              <div>
                <span className="text-[9px] font-black uppercase text-cyan-400 tracking-widest block mb-1">💎 BEST VALUE PICK</span>
                <h4 className="font-heading text-base font-black truncate">{stats.bestBargain?.name || 'N/A'}</h4>
                <p className="text-[10px] text-white/50 uppercase mt-0.5">{stats.bestBargain?.role || ''}</p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs font-bold text-white/70">{stats.bestBargain?.teamId || ''}</span>
                <span className="font-mono text-base font-black text-cyan-400">{stats.bestBargain ? fmt(stats.bestBargain.price) : '—'}</span>
              </div>
            </div>

            {/* Box 3: Biggest Spender */}
            <div className="bg-[#1A1008] border border-red-500/25 rounded-2xl p-4 flex flex-col justify-between shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 h-16 w-16 bg-red-500/5 rounded-full filter blur-xl" />
              <div>
                <span className="text-[9px] font-black uppercase text-red-400 tracking-widest block mb-1">💰 BIGGEST SPENDER</span>
                <h4 className="font-heading text-base font-black truncate">{stats.biggestSpender?.teamId || 'N/A'}</h4>
                <p className="text-[10px] text-white/50 uppercase mt-0.5">Franchise spender</p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs font-bold text-white/70">Spent</span>
                <span className="font-mono text-base font-black text-red-400">{stats.biggestSpender ? fmt(TOTAL_PURSE - stats.biggestSpender.purse) : '—'}</span>
              </div>
            </div>

            {/* Box 4: Most Purse Left */}
            <div className="bg-[#1A1008] border border-emerald-500/25 rounded-2xl p-4 flex flex-col justify-between shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-500/5 rounded-full filter blur-xl" />
              <div>
                <span className="text-[9px] font-black uppercase text-emerald-400 tracking-widest block mb-1">🏦 MOST PURSE REMAINING</span>
                <h4 className="font-heading text-base font-black truncate">{stats.richTeam?.teamId || 'N/A'}</h4>
                <p className="text-[10px] text-white/50 uppercase mt-0.5 font-sans">Smart savings</p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs font-bold text-white/70">Purse Left</span>
                <span className="font-mono text-base font-black text-emerald-400">{stats.richTeam ? fmt(stats.richTeam.purse) : '—'}</span>
              </div>
            </div>
          </div>

          {/* Roster & Squad details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Team Picker List */}
            <div className="lg:col-span-1 bg-[#1A1008] border border-white/5 rounded-2xl p-4 shadow-xl space-y-2 max-h-[450px] overflow-y-auto scrollbar-thin">
              <h3 className="font-heading text-sm text-[#FFB800] uppercase tracking-wider mb-3">FRANCHISE ROSTERS</h3>
              {teams.map(t => {
                const isActive = t.teamId === activeTeam;
                const td = getTeamData(t.teamId);
                const col = td?.color || '#FF6B00';
                return (
                  <button
                    key={t.teamId}
                    onClick={() => setActiveResultsTeam(t.teamId)}
                    className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
                      isActive ? 'bg-[#FF6B00]/10 border-[#FFB800]' : 'bg-[#0E0A06] border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {td?.logo && <img src={td.logo} alt={t.teamId} className="h-6 w-6 object-contain shrink-0"/>}
                      <div className="text-left">
                        <span className="font-heading text-xs font-black block" style={{ color: col }}>{t.teamId}</span>
                        <span className="text-[9px] text-white/40 block mt-0.5">Players: {t.squad?.length || 0}</span>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-extrabold text-white/70">{fmt(t.purse)} left</span>
                  </button>
                );
              })}
            </div>

            {/* Selected Team Squad List */}
            <div className="lg:col-span-2 bg-[#1A1008] border border-white/5 rounded-2xl p-5 shadow-xl flex flex-col h-[450px]">
              <div className="border-b border-white/5 pb-3 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {activeTd?.logo && <img src={activeTd.logo} alt={activeTeam} className="h-8 w-8 object-contain shrink-0"/>}
                  <div>
                    <h3 className="font-heading text-base font-black uppercase" style={{ color: activeTd?.color || '#FF6B00' }}>
                      {activeTeam} SQUAD
                    </h3>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">
                      Purse Remaining: {activeTeamObj ? fmt(activeTeamObj.purse) : '—'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-white/40 uppercase font-black tracking-widest block">Total Squad Size</span>
                  <span className="font-heading text-lg text-white font-black">{activeTeamObj?.squad?.length || 0} / 25</span>
                </div>
              </div>

              <div className="flex-grow overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                {activeTeamObj?.squad && activeTeamObj.squad.length > 0 ? (
                  activeTeamObj.squad.map((p, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-[#0E0A06] border border-white/5 hover:border-white/10 transition-all">
                      <div>
                        <span className="font-bold text-xs text-white block">{p.name}</span>
                        <span className="text-[9px] text-white/40 uppercase tracking-widest font-mono">{p.role} • {p.nationality || 'Indian'}</span>
                      </div>
                      <span className="font-mono text-xs text-[#FFB800] font-bold">{fmt(p.price)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 text-white/20 uppercase tracking-widest text-[10px] font-bold my-auto">
                    No players drafted for this franchise.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <button
              onClick={downloadSquadCard}
              className="px-8 py-3.5 bg-[#FF6B00] hover:bg-[#FF6B00]/95 text-[#0d0805] font-black uppercase tracking-widest text-xs rounded-full shadow-[0_0_20px_rgba(255,107,0,0.2)] transition-all duration-300 w-full sm:w-auto"
            >
              📥 DOWNLOAD SQUAD CARD
            </button>
            <button
              onClick={() => { navigate('/'); window.location.reload(); }}
              className="px-8 py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 font-black uppercase tracking-widest text-xs rounded-full transition-all duration-300 w-full sm:w-auto"
            >
              🏠 BACK TO HOME
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ================================================================
     RENDER
     ================================================================ */

  /* ── Derived values used across the new layout ── */
  const soldCount    = Object.values(room?.teamsState || {}).reduce((s, t) => s + (t.squad || []).filter(p => !p.isRetained).length, 0);
  const unsoldCount  = auctionState?.unsoldPool?.length || 0;
  const upcomingCount = auctionState?.playersList ? Math.max(0, auctionState.playersList.length - (auctionState.currentIndex || 0)) : 0;
  const totalPlayers  = auctionState?.playersList?.length || 1;
  const progressFrac  = Math.min(1, (auctionState?.currentIndex || 0) / totalPlayers);

  return (
    <>
      <ParticleCanvas />

      {/* Confetti */}
      {soldAnimation && (
        <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
          {confetti.map(c => (
            <div key={c.id} style={{ position: 'absolute', left: `${c.x}%`, top: `${c.y}%`, width: c.r, height: c.r, backgroundColor: c.color, borderRadius: '50%', animation: `confettiFall 3.5s ease-out infinite`, animationDelay: `${c.delay}s` }} />
          ))}
        </div>
      )}

      {/* MID-AUCTION BREAK OVERLAY */}
      {auctionState?.breakState?.active && (
        <div className="fixed inset-0 bg-gradient-to-br from-[#0E0A06]/98 via-[#1A1008]/99 to-[#0E0A06]/98 z-40 flex flex-col items-center justify-center p-6 overflow-y-auto">
          <div className="max-w-4xl w-full bg-[#1A1008]/85 border border-[#FF6B00]/25 rounded-2xl p-8 backdrop-blur-md shadow-2xl flex flex-col items-center max-h-[90vh]">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-[#FFB800]/10 border border-[#FFB800]/25 px-4 py-1.5 rounded-full mb-3">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FFB800] animate-pulse">☕ MID-AUCTION BREAK ☕</span>
              </div>
              <h2 className="text-3xl font-heading text-white tracking-widest uppercase mb-1">STRATEGIC INTERMISSION</h2>
              
              <div className="text-[#FFB800] font-heading font-black text-sm tracking-wider uppercase mb-3 animate-pulse">
                Resuming in {intermissionCountdown}s...
              </div>

              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 text-[10px] font-black uppercase tracking-widest my-2">
                <span className="text-[#00E676] bg-[#00E676]/10 border border-[#00E676]/30 px-3.5 py-1 rounded-full">
                  ✅ COMPLETED: {((auctionState?.playersList?.[auctionState?.currentIndex - 1]?.category) || auctionState?.breakState?.setName || 'Previous Set').toUpperCase()}
                </span>
                <span className="text-white/40">➔</span>
                <span className="text-[#FFB800] bg-[#FFB800]/10 border border-[#FFB800]/30 px-3.5 py-1 rounded-full">
                  ⏭ NEXT UP: {((auctionState?.playersList?.[auctionState?.currentIndex]?.category) || 'Next Set').toUpperCase()}
                </span>
              </div>
            </div>

            {/* Franchise Standings/Leaderboard */}
            <div className="w-full flex-grow overflow-y-auto mb-6 pr-2">
              <div className="text-[10px] text-white/30 font-black uppercase tracking-widest mb-3 text-center">Franchise Leaderboard</div>
              <div className="space-y-3">
                {teamsArr
                  .map(t => {
                    const spent = TOTAL_PURSE - (t.purse || TOTAL_PURSE);
                    const squadCount = t.squad?.length || 0;
                    return { ...t, spent, squadCount };
                  })
                  .sort((a, b) => b.squadCount - a.squadCount || b.purse - a.purse)
                  .map((t, idx) => {
                    const td = getTeamData(t.teamId);
                    const spentPercent = Math.min(1, Math.max(0, t.spent / TOTAL_PURSE));
                    return (
                      <div key={t.teamId} className="bg-black/45 border border-white/5 hover:border-[#FFB800]/30 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300">
                        {/* Rank & Team Name */}
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <span className="font-heading text-lg font-black text-[#FFB800] w-6">#{idx + 1}</span>
                          {td?.logo && <img src={td.logo} alt={t.teamId} className="h-8 w-8 object-contain" />}
                          <div className="truncate">
                            <span className="font-black text-sm text-white block leading-tight">{t.teamId}</span>
                            <span className="text-[10px] text-white/40 font-bold">{td?.name || ""}</span>
                          </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="flex items-center justify-between md:justify-end gap-6 flex-grow">
                          {/* Players Drafted */}
                          <div className="text-right min-w-[100px]">
                            <span className="text-[9px] text-white/30 font-black uppercase block tracking-widest">Players</span>
                            <span className="font-heading text-sm text-[#FFB800] font-black">{t.squadCount}</span>
                          </div>

                          {/* Remaining Purse */}
                          <div className="text-right min-w-[120px]">
                            <span className="text-[9px] text-white/30 font-black uppercase block tracking-widest">Remaining Purse</span>
                            <span className="font-heading text-sm text-[#00E676] font-black">{fmt(t.purse)}</span>
                          </div>

                          {/* Spent Purse Bar */}
                          <div className="hidden sm:block w-36">
                            <span className="text-[9px] text-white/30 font-black uppercase block tracking-widest text-right mb-1">Spent: {fmt(t.spent)}</span>
                            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${spentPercent * 100}%`, background: `linear-gradient(90deg, ${td?.color || '#FF6B00'}cc, ${td?.color || '#FFB800'})` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Host actions / Status */}
            <div className="w-full text-center border-t border-white/5 pt-6 shrink-0">
              {isOwner ? (
                <button onClick={() => hostAction('end-break')} className="px-10 py-3.5 bg-gradient-to-r from-[#FF6B00] to-[#FFB800] text-black font-black uppercase tracking-widest text-xs rounded-full shadow-[0_0_25px_rgba(255,107,0,0.35)] hover:shadow-[0_0_35px_rgba(255,107,0,0.55)] hover:scale-105 transition-all duration-300">
                  Resume Auction & Load Next Player (Skip Break)
                </button>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <span className="inline-block h-6 w-6 border-2 border-[#FFB800] border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-[#C8A060] font-black uppercase tracking-[0.2em] animate-pulse">Waiting for host or timer ({intermissionCountdown}s)...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="auction-room-grid text-white font-['Inter']">

        {/* ROW 1 — TOP BAR */}
        <div className="top-bar">
          <div className="flex items-center gap-3">
            <span className="top-bar-logo" onClick={() => navigate('/lobby')} style={{ color: '#F5A623' }}>
              IPL <span style={{ color: '#FF6B35' }}>DRAFT</span>
            </span>
            <div className="room-code-pill">
              ROOM: <strong>{code}</strong>
              <button onClick={() => { navigator.clipboard.writeText(code); }} title="Copy" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, padding: 0, lineHeight: 1 }}>📋</button>
            </div>
            {isAuctionActive && room.currentRound && (
              <span className="round-badge-pill">{room.currentRound} Round</span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {claimedTeam ? (
              <>
                <div className="top-stat-block">
                  <span className="top-stat-label">Purse Left</span>
                  <span className={`top-stat-value ${claimedTeam.purse < 100000000 ? 'danger' : 'gold'}`}>{fmt(claimedTeam.purse)}</span>
                </div>
                <div className="top-stat-block">
                  <span className="top-stat-label">Squad</span>
                  <span className="top-stat-value">{claimedTeam.squad?.length || 0}/25</span>
                </div>
                {room.auctionType === 'mini' && claimedTeam.rtmCards > 0 && (
                  <div className="top-stat-block">
                    <span className="top-stat-label">RTM</span>
                    <span className="top-stat-value gold">{claimedTeam.rtmCards}</span>
                  </div>
                )}
                {isAuctionActive && (
                  <button onClick={() => setShowSquadDrawer(true)} style={{ background: '#F5A623', color: '#000', border: 'none', borderRadius: 7, padding: '7px 16px', fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', cursor: 'pointer', textTransform: 'uppercase' }}>Squad</button>
                )}
              </>
            ) : (
              <>
                <span className="round-badge-pill" style={{ borderColor: '#8A7866', color: '#8A7866' }}>👁️ Spectator</span>
                <button onClick={() => setShowSpectatorView(false)} style={{ background: '#F5A623', color: '#000', border: 'none', borderRadius: 7, padding: '7px 16px', fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', cursor: 'pointer', textTransform: 'uppercase' }}>Claim Franchise</button>
              </>
            )}
          </div>
        </div>

        {/* ROW 2 — HOST CONTROLS BAR */}
        {isAuctionActive && isOwner ? (
          <div className="host-controls-bar">
            <span style={{ fontSize: 9, color: '#8A7866', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginRight: 4, flexShrink: 0 }}>Host Controls</span>
            {isPaused
              ? <button className="ctrl-btn resume" onClick={() => hostAction('resume-auction')}>▶ Resume</button>
              : <button className="ctrl-btn neutral" onClick={() => hostAction('pause-auction')}>⏸ Pause</button>
            }
            <button className="ctrl-btn neutral" onClick={() => hostAction('skip-player')}>⏭ Skip</button>
            <button className="ctrl-btn neutral" onClick={() => hostAction('re-auction-player')}>🔄 Re-Auction</button>
            {isResolved && <button className="ctrl-btn next" onClick={() => hostAction('next-player')}>⏭ Next Player</button>}
            <button className="ctrl-btn danger" onClick={() => { if (window.confirm('End the auction?')) hostAction('force-end-auction'); }}>✕ End Auction</button>
            {isPaused && (
              <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: '#F5A623', letterSpacing: '0.15em', textTransform: 'uppercase' }}>⏸ AUCTION PAUSED</span>
            )}
          </div>
        ) : isAuctionActive && isPaused ? (
          <div className="host-controls-bar" style={{ justifyContent: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#F5A623', letterSpacing: '0.15em', textTransform: 'uppercase' }}>⏸ Auction Paused by Host</span>
          </div>
        ) : (
          <div style={{ height: 0 }} />
        )}

        {/* ROW 3 — PROGRESS BAR */}
        <div className="auction-progress-bar">
          <div className="auction-progress-fill" style={{ width: `${progressFrac * 100}%` }} />
        </div>

        {/* ROW 4 — MAIN CONTENT */}
        <div style={{ overflow: 'hidden', position: 'relative' }}>

        {/* FRANCHISE CLAIM OVERLAY */}
        {!claimedTeam && !showSpectatorView && (
          <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-6 backdrop-blur-md">
            <div className="bg-[#1A1008] border border-[#FF6B00]/40 rounded-2xl max-w-4xl w-full p-8 text-center shadow-2xl">
              <h2 className="text-3xl font-heading text-[#FFB800] tracking-widest mb-2">CLAIM YOUR FRANCHISE</h2>
              <p className="text-white/40 text-xs mb-6">Choose an available franchise to command</p>
              <div className="mb-8 p-4 bg-[#0E0A06] border border-white/5 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 max-w-xl mx-auto">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/40 font-bold uppercase tracking-wider">Room Code:</span>
                  <span className="font-mono text-xl text-[#FFB800] font-black tracking-widest">{code}</span>
                  <button onClick={() => { navigator.clipboard.writeText(code); alert('Copied Room Code!'); }} className="text-[#FF6B00] text-base hover:scale-115 transition-transform" title="Copy Room Code">📋</button>
                </div>
                <button onClick={() => setShowSpectatorView(true)} className="bg-white/5 hover:bg-white/10 text-white/80 px-4 py-1.5 rounded-lg border border-white/10 text-[10px] font-black uppercase tracking-wider transition-all">👁️ Spectate Only</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {TEAMS.map(team => {
                  const t = room.teamsState?.[team.id] || {};
                  const isMine = t.userId === user?._id;
                  const isTakenByOther = t.userId && t.userId !== user?._id;
                  const userAlreadyHasTeam = Object.values(room.teamsState || {}).some(tm => tm.userId === user?._id);
                  const isAvailable = !t.userId && !userAlreadyHasTeam;
                  return (
                    <button key={team.id} onClick={() => handleClaimFranchise(team.id)}
                      className={`p-5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                        isMine
                          ? 'bg-[#FF6B00]/5 border-[#FFB800] shadow-[0_0_15px_rgba(255,184,0,0.12)] cursor-pointer'
                          : isTakenByOther
                            ? 'bg-black/40 border-white/5 opacity-30 cursor-not-allowed'
                            : userAlreadyHasTeam
                              ? 'bg-black/20 border-white/5 opacity-30 cursor-not-allowed'
                              : 'bg-[#0E0A06] border-white/10 hover:border-[#FFB800] hover:shadow-[0_0_15px_rgba(255,184,0,0.15)] transform hover:-translate-y-1 cursor-pointer'
                      }`}>
                      <img src={team.logo} alt={team.name} className="h-12 w-12 object-contain mb-2" />
                      <span className="font-bold text-sm text-white block mb-1">{team.id}</span>
                      <span className="text-[10px] text-white/50 line-clamp-1">{team.name}</span>
                      {isMine && <span className="text-[9px] text-[#FFB800] uppercase font-black tracking-widest mt-1 block">👑 You</span>}
                      {isTakenByOther && <span className="text-[9px] text-[#FF6B00] uppercase font-black tracking-widest mt-1 block">Claimed</span>}
                      {isAvailable && <span className="text-[9px] text-white/40 uppercase font-black tracking-widest mt-1 block">Available</span>}
                      {userAlreadyHasTeam && !isMine && !isTakenByOther && <span className="text-[9px] text-white/20 uppercase font-black tracking-widest mt-1 block">Unavailable</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

            {!isAuctionActive ? (
              <div className="w-full max-w-[1100px] flex flex-col gap-6 animate-fade-in">
                {/* LOBBY STATS BAR */}
                <div className="bg-[#1A1008] border border-[#FF6B00]/15 rounded-xl px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
                  <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#FFB800] animate-pulse" />
                      <span className="text-[10px] text-white/40 uppercase font-black tracking-widest font-sans">Room Code:</span>
                      <span className="font-mono text-base text-[#FFB800] font-black tracking-widest">{code}</span>
                      <button onClick={() => { navigator.clipboard.writeText(code); alert('Copied Room Code!'); }} className="text-[#FF6B00] text-sm hover:scale-115 transition-transform" title="Copy Room Code">📋</button>
                    </div>
                    <div className="h-4 w-px bg-white/10 hidden sm:block" />
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#00E676]" />
                      <span className="text-[10px] text-white/40 uppercase font-black tracking-widest font-sans">Franchises Claimed:</span>
                      <span className="font-heading text-sm text-white font-black">
                        {new Set(teamsArr.filter(t => t.userId).map(t => t.userId.toString())).size}/10
                      </span>
                    </div>
                    <div className="h-4 w-px bg-white/10 hidden sm:block" />
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-sky-400" />
                      <span className="text-[10px] text-white/40 uppercase font-black tracking-widest font-sans">Remaining Slots:</span>
                      <span className="font-heading text-sm text-sky-400 font-black">
                        {10 - new Set(teamsArr.filter(t => t.userId).map(t => t.userId.toString())).size}
                      </span>
                    </div>
                  </div>
                  <span className="bg-[#FFB800]/10 border border-[#FFB800]/35 text-[#FFB800] px-4 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">
                    ⏳ LOBBY WAITING ROOM
                  </span>
                </div>

                {/* MULTI-COLUMN CONTENT */}
                <div className={`grid gap-6 ${claimedTeam && room.auctionType === 'mini' ? 'lg:grid-cols-3' : 'md:grid-cols-2'}`}>
                  {/* COLUMN 1 — FRANCHISES GRID */}
                  <div className={`${claimedTeam && room.auctionType === 'mini' ? 'lg:col-span-2' : 'md:col-span-2'} bg-[#1A1008] border border-white/5 rounded-2xl p-5 shadow-xl`}>
                    <h3 className="font-heading text-lg text-[#FFB800] mb-4 uppercase tracking-wider flex items-center justify-between">
                      <span>🏟️ FRANCHISES BOARD</span>
                      <span className="text-[9px] text-white/30 font-sans tracking-normal lowercase">Click available card to claim</span>
                    </h3>
                    <div className={`grid gap-3 ${claimedTeam && room.auctionType === 'mini' ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
                      {teamsArr.map(t => {
                        const td = getTeamData(t.teamId);
                        const claimer = getClaimerName(t.userId);
                        const isMine = t.userId === user?._id;
                        const isTakenByOther = t.userId && t.userId !== user?._id;
                        const userAlreadyHasTeam = Object.values(room.teamsState || {}).some(tm => tm.userId === user?._id);
                        const col = td?.color || '#FF6B00';
                        return (
                          <button
                            key={t.teamId}
                            onClick={() => handleClaimFranchise(t.teamId)}
                            className={`p-3.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                              isMine
                                ? 'bg-[#FF6B00]/5 border-[#FFB800] shadow-[0_0_15px_rgba(255,184,0,0.12)] cursor-pointer'
                                : isTakenByOther
                                  ? 'bg-black/40 border-white/5 opacity-40 cursor-not-allowed'
                                  : userAlreadyHasTeam
                                    ? 'bg-black/20 border-white/5 opacity-40 cursor-not-allowed'
                                    : 'bg-[#0E0A06] border-white/10 hover:border-[#FFB800] hover:shadow-[0_0_15px_rgba(255,184,0,0.15)] hover:-translate-y-0.5 cursor-pointer'
                            }`}
                          >
                            {td?.logo && <img src={td.logo} alt={t.teamId} className="h-9 w-9 object-contain mb-1.5" />}
                            <span className="font-heading text-[11px] font-black block" style={{ color: col }}>{t.teamId}</span>
                            <span className="text-[9px] text-white/40 block leading-tight font-medium mt-0.5 truncate max-w-full">{td?.name || ''}</span>
                            {t.userId ? (
                              <div className="mt-2 bg-[#FF6B00]/10 border border-[#FF6B00]/30 rounded px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-[#FF6B00] flex items-center gap-1 w-full justify-center truncate">
                                <span>👑</span> {isMine ? 'You' : claimer}
                              </div>
                            ) : (
                              <div className="mt-2 bg-white/5 border border-white/10 rounded px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white/50 w-full justify-center">
                                {userAlreadyHasTeam ? 'Unavailable' : '🤝 Available'}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* COLUMN 2 — STRATEGY BOARD / CONFIG PREVIEW */}
                  {claimedTeam && room.auctionType === 'mini' && (
                    <div className="bg-[#1A1008] border border-white/5 rounded-2xl p-5 shadow-xl">
                      <h3 className="font-heading text-lg text-[#FFB800] mb-2 uppercase tracking-wider">
                        📋 RETENTIONS BOARD
                      </h3>
                      {room.auctionYear === '2025' ? (
                        <>
                          <p className="text-[#FF6B00] text-[9px] uppercase tracking-widest font-black mb-3">🔒 OFFICIAL RETENTIONS LOCKED</p>
                          <div className="max-h-72 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                            {(claimedTeam.squad || []).map((p, idx) => (
                              <div key={idx} className="flex justify-between items-center p-3 rounded-lg border border-[#FF6B00]/30 bg-[#FF6B00]/5">
                                <div>
                                  <span className="font-bold text-xs text-white block">{p.name}</span>
                                  <span className="text-[9px] text-white/40 uppercase tracking-widest font-mono">{p.role} • {p.isCapped ? 'Capped' : 'Uncapped'}</span>
                                </div>
                                <span className="font-mono text-xs text-[#FFB800] font-bold">₹{(p.price / 10000000).toFixed(1)} CR</span>
                              </div>
                            ))}
                            {(!claimedTeam.squad || claimedTeam.squad.length === 0) && (
                              <div className="text-white/20 text-xs uppercase tracking-widest text-center py-10">No retentions loaded</div>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-white/40 text-[9px] uppercase tracking-widest mb-3">Select up to 6 players to retain.</p>
                          <div className="max-h-72 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                            {availablePlayers.filter(p => p.team === claimedTeam.teamId).map(p => {
                              const kept = selectedRetentions.some(x => x.name === p.name);
                              return (
                                <div key={p.name} onClick={() => toggleRetention(p)}
                                  className={`flex justify-between items-center p-2.5 rounded-lg border cursor-pointer transition-all ${kept ? 'border-[#FF6B00] bg-[#FF6B00]/5' : 'border-white/5 hover:border-white/10'}`}>
                                  <div>
                                    <span className="font-bold text-xs text-white block">{p.name}</span>
                                    <span className="text-[9px] text-white/40 uppercase tracking-widest">{p.role}</span>
                                  </div>
                                  <span className="font-mono text-xs text-[#FFB800] font-bold">₹{(p.basePrice / 10000000).toFixed(1)} CR</span>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  )}


                </div>

                {/* BOTTOM ACTION BAR — Host Launch settings or Guest waiting info */}
                <div className="bg-[#1c1410] border border-[#3a2a1a] rounded-xl p-5 shadow-xl">
                  {isOwner ? (
                    <div className="flex flex-col gap-4 text-left">
                      {renderHostSettings()}
                      <div className="flex justify-between items-center border-t border-white/5 pt-4 mt-2">
                        <div className="text-xs text-white/40 font-bold uppercase tracking-wider">
                          Ready to start the simulation?
                        </div>
                        <button onClick={handleLaunchAuction}
                          className="px-10 py-3.5 bg-gradient-to-r from-[#FF6B00] to-[#FFB800] text-black font-black uppercase tracking-widest text-xs rounded-full shadow-[0_0_25px_rgba(255,107,0,0.25)] hover:shadow-[0_0_35px_rgba(255,107,0,0.45)] hover:scale-105 transition-all duration-300">
                          🚦 START AUCTION / LAUNCH ARENA
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-center py-2">
                      <span className="inline-block h-6 w-6 border-2 border-[#FFB800] border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs text-[#C8A060] font-black uppercase tracking-[0.2em] animate-pulse">Waiting for host to start the auction arena...</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="auction-main-content" style={{ height: '100%' }}>

                {/* UNSOLD overlay */}
                {unsoldAnimation && (
                  <div className="fixed inset-0 bg-[#0E0A06]/95 z-30 flex items-center justify-center">
                    <div className="border-4 border-dashed border-[#EF4444] text-[#EF4444] font-heading text-6xl tracking-widest font-black rotate-[-12deg] px-12 py-6 rounded-2xl animate-pulse shadow-2xl bg-black/60 flex flex-col items-center">
                      <span className="text-[10px] tracking-[0.2em] uppercase font-black text-[#EF4444]/60 mb-2 font-sans">Hammer Down</span>UNSOLD
                    </div>
                  </div>
                )}

                {/* SOLD overlay */}
                {soldPlayer && soldAnimation && (
                  <div className="fixed inset-0 bg-black/95 z-30 flex flex-col items-center justify-center text-center p-6">
                    <div className="text-[10px] uppercase tracking-widest text-[#FFB800] font-black bg-[#FFB800]/10 px-4 py-1.5 rounded-full mb-6 border border-[#FFB800]/30 animate-pulse">⚡ HAMMER DOWN • SOLD ⚡</div>
                    <div className="mb-4 w-24 h-24 rounded-full border-2 border-[#FFB800] flex items-center justify-center bg-gradient-to-br from-[#1A1008] to-[#0E0A06]">
                      {getTeamData(soldPlayer.buyerTeamId)?.logo
                        ? <img src={getTeamData(soldPlayer.buyerTeamId).logo} alt={soldPlayer.buyerTeamId} className="w-16 h-16 object-contain" />
                        : <span className="font-heading text-2xl text-white">{soldPlayer.buyerTeamId}</span>}
                    </div>
                    <h2 className="font-heading text-3xl font-black text-white tracking-wide mb-1 uppercase">{soldPlayer.player.name}</h2>
                    <div className="font-heading text-5xl font-black text-[#FFB800] mt-2">{fmt(soldPlayer.price)}</div>
                  </div>
                )}

                {/* ACTIVE STATS COUNTER BAR */}
                {auctionState && (
                  <div className="bg-[#1A1008] border border-[#FF6B00]/15 rounded-xl px-5 py-3 mb-5 flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-6">
                      {/* UPCOMING */}
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#FFB800] animate-pulse" />
                        <span className="text-[10px] text-white/40 uppercase font-black tracking-widest font-sans">Upcoming</span>
                        <span className="font-heading text-sm text-[#FFB800] font-black">
                          {auctionState.playersList ? Math.max(0, auctionState.playersList.length - auctionState.currentIndex) : 0}
                        </span>
                      </div>
                      {/* Divider */}
                      <div className="h-4 w-px bg-white/10" />
                      {/* SOLD */}
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#00E676]" />
                        <span className="text-[10px] text-white/40 uppercase font-black tracking-widest font-sans">Sold</span>
                        <span className="font-heading text-sm text-[#00E676] font-black">
                          {Object.values(room.teamsState || {}).reduce((sum, t) => sum + (t.squad || []).filter(p => !p.isRetained).length, 0)}
                        </span>
                      </div>
                      {/* Divider */}
                      <div className="h-4 w-px bg-white/10" />
                      {/* UNSOLD */}
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#FF3333]" />
                        <span className="text-[10px] text-white/40 uppercase font-black tracking-widest font-sans">Unsold</span>
                        <span className="font-heading text-sm text-[#FF3333] font-black">
                          {auctionState.unsoldPool?.length || 0}
                        </span>
                      </div>
                    </div>
                    
                    {/* POOL drawer trigger */}
                    <button 
                      onClick={() => setShowPoolDrawer(true)}
                      className="text-[10px] uppercase font-black tracking-widest text-[#FF6B00] border border-[#FF6B00]/30 hover:border-[#FF6B00] bg-[#FF6B00]/5 hover:bg-[#FF6B00]/10 px-4 py-2 rounded-lg transition duration-250 flex items-center gap-2 shadow-inner"
                    >
                      <span>📋</span> VIEW POOL
                    </button>
                  </div>
                )}

                {/* THREE-COLUMN LAYOUT */}
                <div className="flex gap-5 items-start">

                  {/* COL 1 — PLAYER CARD */}
                  <div className="w-[34%] shrink-0">
                    {player ? (
                      <div className={`rounded-2xl p-5 relative flex flex-col gap-3 overflow-hidden ${mysteryRevealZoom ? 'mystery-zoom-reveal' : ''}`} style={{
                        background: 'linear-gradient(160deg,#1e1108 0%,#0E0A06 60%,#16100a 100%)',
                        border: `1px solid ${getRoleColors(player.role).border}`,
                        boxShadow: `0 0 28px ${getRoleColors(player.role).light},0 8px 32px rgba(0,0,0,0.6)`,
                      }}>
                        <div className="absolute inset-0 pointer-events-none opacity-30" style={{ background: `radial-gradient(ellipse at 60% 0%,${getRoleColors(player.role).bg}33 0%,transparent 65%)` }} />
                        {player.category?.toLowerCase().includes('marquee') && (
                          <div className="absolute -top-3 -right-3 bg-gradient-to-r from-[#FF6B00] to-[#FFB800] h-10 w-10 rounded-full flex items-center justify-center shadow-lg border border-[#0E0A06] animate-bounce z-10">
                            <span className="text-xl">👑</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center z-10" style={player.isMystery && !player.revealed ? { filter: 'blur(5px)', pointerEvents: 'none' } : {}}>
                          {getCategoryBadge(player.category)}
                          {getNationalityBadge(player)}
                        </div>
                        <div className="flex justify-center z-10 my-1">
                          <PlayerAvatar player={player} size={120} />
                        </div>
                        <div className="text-center z-10">
                          <h2 className="font-heading text-[22px] font-black text-white tracking-wide leading-none uppercase mb-2">
                            {player.isMystery && !player.revealed ? "???" : player.name}
                          </h2>
                          <div className="flex justify-center items-center gap-1.5 flex-wrap" style={player.isMystery && !player.revealed ? { filter: 'blur(5px)', pointerEvents: 'none' } : {}}>
                            {getRoleBadge(player.role)}
                            {getCappedBadge(player)}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 border-t border-white/5 pt-3 z-10" style={player.isMystery && !player.revealed ? { filter: 'blur(5px)', pointerEvents: 'none' } : {}}>
                          <div>
                            <span className="text-[9px] text-white/35 block font-bold uppercase tracking-wider">Base Price</span>
                            <span className="font-heading text-sm text-[#FFB800] font-black">
                              {player.isMystery && !player.revealed ? "???" : fmt(player.basePrice)}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] text-white/35 block font-bold uppercase tracking-wider">Prev Team</span>
                            <span className="font-heading text-sm text-white font-bold">
                              {player.isMystery && !player.revealed ? "???" : (player.team || '—')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full rounded-2xl bg-[#1A1008] border border-white/5 flex items-center justify-center" style={{ height: 340 }}>
                        <div className="text-center">
                          <div className="w-8 h-8 border-2 border-white/10 border-t-[#FFB800] rounded-full animate-spin mx-auto mb-3" />
                          <span className="text-white/20 text-xs uppercase tracking-widest">Loading player...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* COL 2 — BIDDING ARENA */}
                  <div className="flex-1 flex flex-col gap-3 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[9px] text-white/25 font-black uppercase tracking-[0.2em]">Bidding Arena</span>
                      <div className="flex-1 h-px bg-white/5" />
                      {isPaused
                        ? <span className="text-[9px] font-black uppercase tracking-widest text-amber-400/70">Paused</span>
                        : <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400/70 flex items-center gap-1"><span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />Live</span>
                      }
                    </div>

                    {/* Timer */}
                    <div className="rounded-xl px-5 py-3.5 flex justify-between items-center" style={{ background: isPaused ? 'rgba(15,10,4,0.6)' : 'rgba(26,16,8,0.7)', border: isPaused ? '1px solid rgba(107,114,128,0.25)' : '1px solid rgba(255,255,255,0.07)' }}>
                      {player?.isMystery && !player?.revealed ? (
                        <div>
                          <span className="text-[9px] text-[#FF6B00] block font-bold uppercase tracking-wider animate-pulse">🎭 Mystery Reveal Clock</span>
                          <span className="text-sm font-bold mt-0.5 block text-white/90">Revealing in {mysteryCountdown !== null ? mysteryCountdown : 5}s...</span>
                        </div>
                      ) : (
                        <div>
                          <span className="text-[9px] text-white/35 block font-bold uppercase tracking-wider">Bidding Clock</span>
                          <span className={`text-sm font-bold mt-0.5 block ${isPaused ? 'text-gray-500' : 'text-white/80'}`}>{isPaused ? 'Clock Paused' : 'Live Decision Clock'}</span>
                        </div>
                      )}
                      <TimerRing timeLeft={player?.isMystery && !player?.revealed ? (mysteryCountdown !== null ? mysteryCountdown : 5) : timeLeft} maxTime={player?.isMystery && !player?.revealed ? 5 : 30} isPaused={isPaused} />
                    </div>

                    {/* Bid panel */}
                    <div className="rounded-2xl p-5" style={{
                      background: currentBid > 0 ? 'linear-gradient(135deg,#1e1108 0%,#120c04 100%)' : '#1A1008',
                      border: currentBid > 0 ? '1px solid rgba(255,107,0,0.35)' : '1px solid rgba(255,255,255,0.06)',
                      boxShadow: currentBid > 0 ? '0 0 20px rgba(255,107,0,0.12),inset 0 0 30px rgba(255,107,0,0.04)' : 'none',
                    }}>
                      {/* Current bid + leader */}
                      <div className="flex justify-between items-start mb-5">
                        <div>
                          <span className="text-[9px] text-white/35 block font-bold uppercase tracking-wider mb-1">Current Highest Bid</span>
                          <div className={`font-heading text-4xl tracking-wide ${bidPulse ? 'scale-110' : ''} transition-transform`} style={{ color: currentBid > 0 ? '#FFB800' : '#ffffff30', textShadow: currentBid > 0 ? '0 0 20px rgba(255,184,0,0.3)' : 'none' }}>
                            {currentBid > 0 ? fmt(currentBid) : 'NO BIDS'}
                          </div>
                        </div>
                        {highestBidder ? (
                          <div className="text-right">
                            <span className="text-[9px] text-white/35 block font-bold uppercase tracking-wider mb-1">Leading</span>
                            <div className="flex items-center gap-1.5 justify-end">
                              <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ background: leaderColor }} />
                              <span className="font-heading text-xl text-white tracking-wide">{highestBidder}</span>
                            </div>
                            <span className="text-[9px] mt-0.5 block font-bold" style={{ color: leaderColor }}>↑ Leading The Bid</span>
                          </div>
                        ) : (
                          <div className="text-right">
                            <span className="text-[9px] text-white/35 block font-bold uppercase tracking-wider mb-1">Status</span>
                            <span className="text-[11px] text-white/30 font-bold uppercase tracking-wider">No Bids Yet</span>
                          </div>
                        )}
                      </div>

                      {!rtmState?.active && (
                        <div className={`transition-opacity ${isPaused ? 'opacity-40 pointer-events-none' : ''}`}>
                          <div className="flex gap-2 mb-3">
                            {INCS.map(opt => (
                              <button key={opt.label} onClick={() => placeBid(currentBid + opt.val)} disabled={isPaused || !claimedTeam}
                                className="flex-1 text-[10px] font-black uppercase tracking-wider h-8 rounded-lg border transition-all bg-white/5 border-white/10 text-white/70 hover:bg-[#FF6B00]/15 hover:border-[#FF6B00]/40 hover:text-[#FF6B00] disabled:cursor-not-allowed">
                                {opt.label}
                              </button>
                            ))}
                            <button onClick={() => setShowCustomInput(v => !v)} disabled={isPaused || !claimedTeam}
                              className="flex-1 text-[10px] font-black uppercase tracking-wider h-8 rounded-lg border transition-all bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white/80 disabled:cursor-not-allowed">Custom</button>
                          </div>
                          {showCustomInput && (
                            <div className="flex gap-2 mb-3">
                              <input type="number" placeholder="Amount in CR (e.g. 1.5)" value={customBid} onChange={e => setCustomBid(e.target.value)}
                                className="flex-1 bg-[#0E0A06] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#FFB800]/50" />
                              <button onClick={doCustomBid} className="px-4 py-1.5 rounded-lg bg-[#FFB800]/20 border border-[#FFB800]/30 text-[#FFB800] text-xs font-black">Bid</button>
                            </div>
                          )}
                          {claimedTeam ? (
                            passedTeams.includes(claimedTeam.teamId) ? (
                              <button disabled className="w-full bg-gray-800 text-white/40 font-black uppercase tracking-widest text-xs py-3.5 rounded-xl cursor-not-allowed">
                                ❌ YOU HAVE PASSED
                              </button>
                            ) : (
                              <button onClick={() => placeBid(nextBid)} disabled={isPaused}
                                className="w-full bg-[#FF6B00] hover:bg-[#FF6B00]/85 text-white font-black uppercase tracking-widest text-xs py-3.5 rounded-xl transition-all transform hover:-translate-y-0.5 flex flex-col items-center justify-center gap-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                                style={{ boxShadow: isPaused ? 'none' : '0 4px 20px rgba(255,107,0,0.3)' }}>
                                <span>⚡ PLACE BID</span>
                                <span className="text-[10px] text-white/70 normal-case font-medium">Next: {fmt(nextBid)}</span>
                              </button>
                            )
                          ) : (
                            <div className="w-full bg-[#1A1008] border border-white/5 text-white/35 text-xs py-3.5 rounded-xl text-center font-bold uppercase tracking-wider">👁️ Spectator Mode — Bidding Disabled</div>
                          )}
                        </div>
                      )}

                      {/* RTM phases */}
                      {rtmState?.active && rtmState.phase === 'decision' && (
                        <div className="bg-[#0E0A06] border border-[#FFB800]/30 p-4 rounded-xl text-center">
                          <h4 className="font-heading text-lg text-[#FFB800] mb-1">RTM INVOCATION</h4>
                          <p className="text-white/60 text-[10px] uppercase tracking-wider mb-4">{rtmState.rtmTeamId} has {rtmState.timeLeft}s to exercise RTM</p>
                          {claimedTeam?.teamId === rtmState.rtmTeamId ? (
                            <div className="flex gap-2">
                              <button onClick={() => rtmDecision(true)} className="flex-1 btn-gold py-2.5 text-xs font-black tracking-widest">USE RTM</button>
                              <button onClick={() => rtmDecision(false)} className="flex-1 bg-[#1A1008] border border-white/10 py-2.5 text-xs font-black tracking-widest">PASS RTM</button>
                            </div>
                          ) : <div className="text-white/40 text-[11px] font-bold uppercase tracking-widest py-2 bg-[#1A1008] rounded border border-white/5">⌛ Waiting for {rtmState.rtmTeamId}...</div>}
                        </div>
                      )}
                      {rtmState?.active && rtmState.phase === 'counter' && (
                        <div className="bg-[#0E0A06] border border-[#FF6B00]/30 p-4 rounded-xl text-center">
                          <h4 className="font-heading text-lg text-[#FF6B00] mb-1">COUNTER-BID ROUND</h4>
                          <p className="text-white/60 text-[10px] uppercase tracking-wider mb-4">{rtmState.highestBidderTeamId} has {rtmState.timeLeft}s to raise</p>
                          {claimedTeam?.teamId === rtmState.highestBidderTeamId ? (
                            <div className="flex flex-col gap-3">
                              <div className="flex gap-2">
                                <button onClick={() => counterBid(rtmState.preRtmBid + 10000000)} className="flex-grow btn-orange py-2 text-xs font-black">RAISE +10CR</button>
                                <button onClick={() => counterBid(rtmState.preRtmBid + 20000000)} className="flex-grow btn-orange py-2 text-xs font-black">RAISE +20CR</button>
                              </div>
                              <button onClick={passCounter} className="w-full bg-[#1A1008] border border-white/10 py-2 text-xs font-black">DECLINE (PASS)</button>
                            </div>
                          ) : <div className="text-white/40 text-[11px] font-bold uppercase tracking-widest py-2 bg-[#1A1008] rounded border border-white/5">⌛ Waiting for {rtmState.highestBidderTeamId}...</div>}
                        </div>
                      )}
                      {rtmState?.active && rtmState.phase === 'final-match' && (
                        <div className="bg-[#0E0A06] border border-[#FFB800]/30 p-4 rounded-xl text-center">
                          <h4 className="font-heading text-lg text-[#FFB800] mb-1">MATCH COUNTER-BID</h4>
                          <p className="text-white/60 text-[10px] uppercase tracking-wider mb-4">Raised to {fmt(rtmState.raisedBid)}. {rtmState.rtmTeamId} has {rtmState.timeLeft}s.</p>
                          {claimedTeam?.teamId === rtmState.rtmTeamId ? (
                            <div className="flex gap-2">
                              <button onClick={() => matchRtm(true)} className="flex-1 btn-gold py-2.5 text-xs font-black">MATCH ({fmt(rtmState.raisedBid)})</button>
                              <button onClick={() => matchRtm(false)} className="flex-1 bg-[#1A1008] border border-white/10 py-2.5 text-xs font-black">WITHDRAW</button>
                            </div>
                          ) : <div className="text-white/40 text-[11px] font-bold uppercase tracking-widest py-2 bg-[#1A1008] rounded border border-white/5">⌛ Waiting for {rtmState.rtmTeamId}...</div>}
                        </div>
                      )}
                    </div>
                  </div>

                </div>{/* end 3 cols */}
              </div>{/* end auction-main-content */}
            )}
            </div>{/* end ROW 4 */}

        {/* ROW 5 — LIVE TICKER */}
        {isAuctionActive ? (
          <LiveTicker
            logs={logs}
            player={player}
            currentBid={currentBid}
            highestBidder={highestBidder}
            timeLeft={timeLeft}
            isPaused={isPaused}
          />
        ) : (
          <div style={{ height: 40, background: '#1C1410', borderTop: '1px solid #2A1F14' }} />
        )}

      </div>{/* end auction-room-grid */}

      {/* SQUAD DRAWER */}
      {showSquadDrawer && claimedTeam && (
        <div className="fixed inset-y-0 right-0 w-96 bg-[#1A1008] border-l border-[#FF6B00]/30 z-40 p-6 flex flex-col justify-between shadow-2xl">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-heading text-2xl text-[#FFB800] tracking-widest uppercase">{claimedTeam.teamId} Squad</h3>
              <button onClick={() => setShowSquadDrawer(false)} className="text-xs uppercase tracking-widest border border-white/10 hover:border-[#FF6B00] px-3 py-1 rounded transition">Close</button>
            </div>

            {/* Role Breakdown Aggregation Banner */}
            {claimedTeam.squad && claimedTeam.squad.length > 0 && (() => {
              let wk = 0, bat = 0, bowl = 0, ar = 0, ovs = 0;
              claimedTeam.squad.forEach(pItem => {
                const nameStr = typeof pItem === 'string' ? pItem : pItem.name;
                const pi = availablePlayers.find(p => p.name === nameStr) || pItem;
                const r = (pi.role || '').toLowerCase();
                if (r.includes('wk') || r.includes('keeper')) wk++;
                else if (r.includes('all-rounder') || r.includes('all rounder') || r.includes('all-round') || r.includes('allround')) ar++;
                else if (r.includes('bowl') || r.includes('spin') || r.includes('fast')) bowl++;
                else if (r.includes('bat') || r.includes('field')) bat++;
                
                if (pi.isOverseas || pItem.isOverseas) ovs++;
              });
              return (
                <div className="grid grid-cols-5 gap-1.5 p-2 bg-[#0E0A06] border border-white/5 rounded-xl mb-4 text-center">
                  <div className="flex flex-col"><span className="text-[8px] text-white/30 uppercase font-black font-sans">BAT</span><span className="text-xs font-bold text-white">{bat}</span></div>
                  <div className="flex flex-col"><span className="text-[8px] text-white/30 uppercase font-black font-sans">BOWL</span><span className="text-xs font-bold text-[#FFB800]">{bowl}</span></div>
                  <div className="flex flex-col"><span className="text-[8px] text-white/30 uppercase font-black font-sans">AR</span><span className="text-xs font-bold text-sky-400">{ar}</span></div>
                  <div className="flex flex-col"><span className="text-[8px] text-white/30 uppercase font-black font-sans">WK</span><span className="text-xs font-bold text-emerald-400">{wk}</span></div>
                  <div className="flex flex-col"><span className="text-[8px] text-[#FF6B00] uppercase font-black font-sans">OVS</span><span className="text-xs font-bold text-[#FF6B00]">{ovs}</span></div>
                </div>
              );
            })()}

            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 scrollbar-none">
              {claimedTeam.squad?.length
                ? claimedTeam.squad.map((pItem, idx) => {
                    const nameStr = typeof pItem === 'string' ? pItem : pItem.name;
                    const pi = availablePlayers.find(p => p.name === nameStr) || {
                      name: nameStr,
                      role: pItem.role || 'All-Rounder',
                      isCapped: pItem.isCapped !== undefined ? pItem.isCapped : true,
                      nationality: pItem.nationality || 'Indian',
                      isOverseas: pItem.isOverseas || false
                    };
                    return (
                      <div key={idx} className="p-3.5 bg-black/40 rounded-xl border border-white/5 flex justify-between items-center hover:border-[#FF6B00]/30 transition-all">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-xs text-white">{pi.name}</span>
                          <div className="flex items-center gap-1.5">{getRoleBadge(pi.role)}{getNationalityBadge(pi)}</div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {getCappedBadge(pi)}
                          {pItem.price !== undefined && (
                            <span className="text-[10px] text-[#FFB800] font-black font-mono">{fmt(pItem.price)}</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                : <div className="text-white/20 text-xs uppercase tracking-widest text-center py-12">No players in squad</div>
              }
            </div>
          </div>
          <div className="pt-4 border-t border-white/5 text-center text-[10px] uppercase tracking-widest text-white/30">Squad limit: 25 max · 8 overseas max</div>
        </div>
      )}

      {/* POOL DRAWER */}
      {showPoolDrawer && auctionState && (
        <div className="fixed inset-y-0 right-0 w-96 bg-[#1A1008] border-l border-[#FF6B00]/30 z-40 p-6 flex flex-col justify-between shadow-2xl animate-fade-in">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-heading text-2xl text-[#FFB800] tracking-widest uppercase">Remaining Pool</h3>
              <button onClick={() => setShowPoolDrawer(false)} className="text-xs uppercase tracking-widest border border-white/10 hover:border-[#FF6B00] px-3 py-1 rounded transition">Close</button>
            </div>
            <div className="space-y-2 max-h-[75vh] overflow-y-auto pr-2 scrollbar-none">
              {auctionState.playersList?.length && auctionState.currentIndex < auctionState.playersList.length
                ? auctionState.playersList.slice(auctionState.currentIndex).map((p, idx) => (
                    <div key={idx} className="p-3.5 bg-black/40 rounded-xl border border-white/5 flex justify-between items-center hover:border-[#FF6B00]/30 transition-all">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-xs text-white flex items-center gap-1.5">
                          {p.name}
                          {p.category?.toLowerCase().includes('marquee') && <span className="text-[10px] text-[#FFB800]">👑</span>}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[8px] uppercase tracking-wider px-2 py-0.5 rounded font-black border border-white/5 bg-white/5 text-white/50">{p.role}</span>
                          <span className="text-[8px] uppercase tracking-wider px-2 py-0.5 rounded font-black border border-white/5 bg-white/5 text-white/50">{p.nationality}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[8px] text-white/35 block font-bold uppercase tracking-wider">Base Price</span>
                        <span className="font-mono text-xs text-[#FFB800] font-black">{fmt(p.basePrice)}</span>
                      </div>
                    </div>
                  ))
                : <div className="text-white/20 text-xs uppercase tracking-widest text-center py-12">No players remaining in pool</div>
              }
            </div>
          </div>
          <div className="pt-4 border-t border-white/5 text-center text-[10px] uppercase tracking-widest text-white/30">
            Pool shows all upcoming non-retained players
          </div>
        </div>
      )}
    </>
  );
};

export default Room;
