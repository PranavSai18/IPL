import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import axios from 'axios';

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

const RETAINED_PLAYERS_2025 = {
  RCB: [
    { name: "Virat Kohli", role: "Batter", price: 210000000, isOverseas: false, isCapped: true },
    { name: "Rajat Patidar", role: "Batter", price: 110000000, isOverseas: false, isCapped: true },
    { name: "Yash Dayal", role: "Bowler", price: 50000000, isOverseas: false, isCapped: true }
  ],
  MI: [
    { name: "Jasprit Bumrah", role: "Bowler", price: 180000000, isOverseas: false, isCapped: true },
    { name: "Suryakumar Yadav", role: "Batter", price: 163500000, isOverseas: false, isCapped: true },
    { name: "Hardik Pandya", role: "All-Rounder", price: 163500000, isOverseas: false, isCapped: true },
    { name: "Rohit Sharma", role: "Batter", price: 163000000, isOverseas: false, isCapped: true },
    { name: "Tilak Varma", role: "Batter", price: 80000000, isOverseas: false, isCapped: true }
  ],
  GT: [
    { name: "Shubman Gill", role: "Batter", price: 165000000, isOverseas: false, isCapped: true },
    { name: "Rashid Khan", role: "Bowler", price: 180000000, isOverseas: true, isCapped: true },
    { name: "Sai Sudharsan", role: "Batter", price: 85000000, isOverseas: false, isCapped: true },
    { name: "Shahrukh Khan", role: "Batter", price: 40000000, isOverseas: false, isCapped: true },
    { name: "Rahul Tewatia", role: "All-Rounder", price: 40000000, isOverseas: false, isCapped: true }
  ],
  CSK: [
    { name: "Ruturaj Gaikwad", role: "Batter", price: 180000000, isOverseas: false, isCapped: true },
    { name: "Matheesha Pathirana", role: "Bowler", price: 130000000, isOverseas: true, isCapped: true },
    { name: "Shivam Dube", role: "All-Rounder", price: 120000000, isOverseas: false, isCapped: true },
    { name: "Ravindra Jadeja", role: "All-Rounder", price: 180000000, isOverseas: false, isCapped: true },
    { name: "MS Dhoni", role: "WK-Batter", price: 40000000, isOverseas: false, isCapped: false }
  ],
  RR: [
    { name: "Sanju Samson", role: "WK-Batter", price: 180000000, isOverseas: false, isCapped: true },
    { name: "Yashasvi Jaiswal", role: "Batter", price: 180000000, isOverseas: false, isCapped: true },
    { name: "Riyan Parag", role: "All-Rounder", price: 140000000, isOverseas: false, isCapped: true },
    { name: "Dhruv Jurel", role: "WK-Batter", price: 140000000, isOverseas: false, isCapped: true },
    { name: "Sandeep Sharma", role: "Bowler", price: 50000000, isOverseas: false, isCapped: true },
    { name: "Shimron Hetmyer", role: "Batter", price: 40000000, isOverseas: true, isCapped: true }
  ],
  SRH: [
    { name: "Heinrich Klaasen", role: "WK-Batter", price: 230000000, isOverseas: true, isCapped: true },
    { name: "Pat Cummins", role: "All-Rounder", price: 180000000, isOverseas: true, isCapped: true },
    { name: "Abhishek Sharma", role: "Batter", price: 140000000, isOverseas: false, isCapped: true },
    { name: "Travis Head", role: "Batter", price: 140000000, isOverseas: true, isCapped: true },
    { name: "Nitish Kumar Reddy", role: "All-Rounder", price: 60000000, isOverseas: false, isCapped: false },
    { name: "Harshal Patel", role: "Bowler", price: 80000000, isOverseas: false, isCapped: true }
  ],
  LSG: [
    { name: "Nicholas Pooran", role: "WK-Batter", price: 210000000, isOverseas: true, isCapped: true },
    { name: "Ravi Bishnoi", role: "Bowler", price: 110000000, isOverseas: false, isCapped: true },
    { name: "Mayank Yadav", role: "Bowler", price: 110000000, isOverseas: false, isCapped: true },
    { name: "Ayush Badoni", role: "All-Rounder", price: 40000000, isOverseas: false, isCapped: true },
    { name: "Mohsin Khan", role: "Bowler", price: 40000000, isOverseas: false, isCapped: true }
  ],
  KKR: [
    { name: "Rinku Singh", role: "Batter", price: 130000000, isOverseas: false, isCapped: true },
    { name: "Varun Chakravarthy", role: "Bowler", price: 120000000, isOverseas: false, isCapped: true },
    { name: "Sunil Narine", role: "All-Rounder", price: 120000000, isOverseas: true, isCapped: true },
    { name: "Andre Russell", role: "All-Rounder", price: 120000000, isOverseas: true, isCapped: true },
    { name: "Harshit Rana", role: "Bowler", price: 40000000, isOverseas: false, isCapped: false },
    { name: "Ramandeep Singh", role: "All-Rounder", price: 40000000, isOverseas: false, isCapped: false }
  ],
  DC: [
    { name: "Axar Patel", role: "All-Rounder", price: 165000000, isOverseas: false, isCapped: true },
    { name: "Kuldeep Yadav", role: "Bowler", price: 132500000, isOverseas: false, isCapped: true },
    { name: "Tristan Stubbs", role: "Batter", price: 100000000, isOverseas: true, isCapped: true },
    { name: "Abhishek Porel", role: "WK-Batter", price: 40000000, isOverseas: false, isCapped: false },
    { name: "Mukesh Kumar", role: "Bowler", price: 80000000, isOverseas: false, isCapped: true }
  ],
  PBKS: [
    { name: "Shashank Singh", role: "Batter", price: 55000000, isOverseas: false, isCapped: true },
    { name: "Prabhsimran Singh", role: "WK-Batter", price: 40000000, isOverseas: false, isCapped: false },
    { name: "Arshdeep Singh", role: "Bowler", price: 180000000, isOverseas: false, isCapped: true },
    { name: "Nehal Wadhera", role: "Batter", price: 30000000, isOverseas: false, isCapped: false },
    { name: "Vishnu Vinod", role: "WK-Batter", price: 20000000, isOverseas: false, isCapped: false }
  ]
};

const CustomSelect = ({ value, onChange, options, icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center bg-[#0d0805] border border-[#3a2a1a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#f5a623] hover:border-[#f5a623]/40 transition"
      >
        <span className="flex items-center gap-2">
          {icon && <span className="text-[#8a7866]">{icon}</span>}
          <span className="font-semibold text-white/90">
            {options.find(opt => String(opt.value) === String(value))?.label || value}
          </span>
        </span>
        <svg className={`w-3.5 h-3.5 text-[#f5a623] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 mt-1 bg-[#1c1410] border border-[#3a2a1a] rounded-lg shadow-2xl z-50 py-1 max-h-60 overflow-y-auto">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  String(value) === String(opt.value) 
                    ? 'bg-[#f5a623]/25 text-[#f5a623] font-bold' 
                    : 'text-white/80 hover:bg-[#f5a623]/10 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const generateRoomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
};

const CreateRoom = () => {
  const { user, token } = useAuthStore();
  const navigate = useNavigate();

  // Step state
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Setup options
  const [auctionType, setAuctionType] = useState(''); // 'mini' | 'mega' or empty initially
  const [auctionYear, setAuctionYear] = useState('2025');

  const [numTeams, setNumTeams] = useState(10);
  const [teamNamingType, setTeamNamingType] = useState('real'); // 'real' | 'custom'
  const [customTeamNames, setCustomTeamNames] = useState(Array(10).fill('').map((_, i) => `Team ${i + 1}`));
  const [selectedTeam, setSelectedTeam] = useState('CSK');
  const [selectedCustomTeamIndex, setSelectedCustomTeamIndex] = useState(0);

  // Room limits & rules
  const [playersPerTeam, setPlayersPerTeam] = useState(25);
  const [startingPurse, setStartingPurse] = useState(120); // In Crores
  const [maxOverseas, setMaxOverseas] = useState(8);
  const bidIncrement = 1000000; // 10L — fixed value, not user-editable in this flow
  const [rtmEnabled, setRtmEnabled] = useState(true);
  const [timePerBid, setTimePerBid] = useState(15); // seconds
  const [playerCategory, setPlayerCategory] = useState('all'); // 'all' | 'batters' | 'bowlers' | 'allrounders' | 'mixed' | 'custom'
  const [customPlayersJSON, setCustomPlayersJSON] = useState('');
  const [basePriceRule, setBasePriceRule] = useState('real'); // 'real' | 'custom'
  const [customBasePrice, setCustomBasePrice] = useState(20000000); // Default 2Cr flat

  const roomVisibility = 'public'; // fixed for now
  const privateCode = '';           // fixed for now

  // Selected retentions
  const [hostRetentions, setHostRetentions] = useState([]);

  // Generated code — initialized eagerly so no on-mount effect needed
  const [generatedCode] = useState(() => {
    try { return generateRoomCode() || Math.random().toString(36).substring(2, 8).toUpperCase(); }
    catch { return Math.random().toString(36).substring(2, 8).toUpperCase(); }
  });
  const [copied, setCopied] = useState(false);
  const showRatings = 'hidden'; // fixed for now — ratings panel not yet wired up

  // Automatically initialize hostRetentions when franchise, mode or year changes
  useEffect(() => {
    setTimeout(() => {
      if (auctionType === 'mini' && auctionYear === '2025' && selectedTeam) {
        const defaultPlayers = RETAINED_PLAYERS_2025[selectedTeam] || [];
        setHostRetentions(defaultPlayers.map(p => p.name));
      } else {
        setHostRetentions([]);
      }
    }, 0);
  }, [selectedTeam, auctionType, auctionYear]);

  const getRetainedCost = () => {
    if (auctionType !== 'mini' || auctionYear !== '2025' || !selectedTeam) return 0;
    const defaultPlayers = RETAINED_PLAYERS_2025[selectedTeam] || [];
    return defaultPlayers
      .filter(p => hostRetentions.includes(p.name))
      .reduce((sum, p) => sum + p.price, 0);
  };

  const validateStep = (s) => {
    if (s === 1) {
      if (!auctionType) {
        setError('Please select an auction mode.');
        return false;
      }
    }
    if (s === 2) {
      if (teamNamingType === 'real') {
        if (!selectedTeam) {
          setError('Please claim a franchise.');
          return false;
        }
      } else {
        const claimedName = customTeamNames[selectedCustomTeamIndex];
        if (!claimedName || !claimedName.trim()) {
          setError('Please claim a franchise and specify its name.');
          return false;
        }
      }
    }
    if (s === 3) {
      if (auctionType === 'mini') {
        if (hostRetentions.length > 6) {
          setError('You can retain a maximum of 6 players.');
          return false;
        }
        const cost = getRetainedCost() / 10000000;
        if (cost > startingPurse) {
          setError(`Total cost of retentions (₹${cost.toFixed(1)} Cr) exceeds the starting purse (₹${startingPurse} Cr).`);
          return false;
        }
      }
    }
    return true;
  };

  const goNext = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, 4));
      setError('');
    }
  };

  const goBack = () => {
    setStep(prev => Math.max(prev - 1, 1));
    setError('');
  };

  // CustomSelect Options
  const maxOverseasOptions = [
    { value: 8, label: '8 (Real IPL Rules)' },
    { value: 4, label: '4 (Fantasy Rules)' }
  ];
  
  const basePriceRuleOptions = [
    { value: 'real', label: 'Real Base Prices' },
    { value: 'custom', label: 'Flat Base Price' }
  ];
  
  const playerCategoryOptions = [
    { value: 'all', label: 'All Players' },
    { value: 'batters', label: 'Batters Only' },
    { value: 'bowlers', label: 'Bowlers Only' },
    { value: 'allrounders', label: 'All-Rounders' },
    { value: 'mixed', label: 'Mixed (Shuffled 30)' },
    { value: 'custom', label: 'Custom JSON Upload' }
  ];


  // Automatically configure parameters when Year or Mode (auctionType) changes
  useEffect(() => {
    if (!auctionType) return;
    setTimeout(() => {
      if (auctionType === 'mega') {
        setRtmEnabled(false);
        if (auctionYear === '2025') setStartingPurse(120);
        else if (auctionYear === '2022') setStartingPurse(90);
        else if (auctionYear === '2018') setStartingPurse(80);
        else if (auctionYear === '2014') setStartingPurse(60);
        else if (auctionYear === '2011') setStartingPurse(41.4);
        else if (auctionYear === '2008') setStartingPurse(20);
        else setStartingPurse(120);
      } else {
        setRtmEnabled(true);
        if (auctionYear === '2025') setStartingPurse(120);
        else if (auctionYear === '2024') setStartingPurse(100);
        else if (auctionYear === '2023') setStartingPurse(95);
        else if (auctionYear === '2021') setStartingPurse(85);
        else if (auctionYear === '2020') setStartingPurse(85);
        else if (auctionYear === '2019') setStartingPurse(82);
        else setStartingPurse(100);
      }
    }, 0);
  }, [auctionType, auctionYear]);

  const handleCustomTeamNameChange = (index, value) => {
    const updated = [...customTeamNames];
    updated[index] = value;
    setCustomTeamNames(updated);
    if (index === 0) {
      setSelectedTeam(value);
    }
  };


  const handleCopyCode = () => {
    const codeToCopy = roomVisibility === 'private' && privateCode ? privateCode : generatedCode;
    navigator.clipboard.writeText(codeToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLaunch = async () => {
    setError('');
    setIsSubmitting(true);

    const codeToUse = roomVisibility === 'private' && privateCode ? privateCode.toUpperCase() : generatedCode;

    // Validate custom players list if custom is selected
    let customPlayersList = [];
    if (playerCategory === 'custom') {
      try {
        customPlayersList = JSON.parse(customPlayersJSON || '[]');
        if (!Array.isArray(customPlayersList)) {
          throw new Error('Must be a JSON Array of player objects');
        }
      } catch {
        setError('Invalid custom players JSON format. Must be an array of objects: [{"name":"Virat","role":"Batter","basePrice":20000000}]');
        setIsSubmitting(false);
        return;
      }
    }

    const finalTeamNames = teamNamingType === 'custom'
      ? customTeamNames.slice(0, numTeams).map((name, i) => name.trim() || `Team ${i + 1}`)
      : (() => {
          // Make sure the selectedTeam is in the list, then fill the rest from TEAMS
          const result = [selectedTeam];
          TEAMS.forEach(t => {
            if (result.length < numTeams && t.id !== selectedTeam) {
              result.push(t.id);
            }
          });
          return result;
        })();

    const hostClaimTeam = teamNamingType === 'custom'
      ? (finalTeamNames[Math.min(selectedCustomTeamIndex, numTeams - 1)] || '')
      : selectedTeam;

    try {
      const payload = {
        code: codeToUse,
        type: roomVisibility,
        auctionType,
        franchise: hostClaimTeam,
        poolSource: auctionYear, // selected year
        playersPerTeam: Number(playersPerTeam),
        startingPurse: Number(startingPurse),
        maxOverseas: Number(maxOverseas),
        bidIncrement: Number(bidIncrement),
        rtmEnabled: Boolean(rtmEnabled),
        timePerBid: Number(timePerBid),
        // Interactive Setup variables
        auctionYear,
        numTeams: Number(numTeams),
        teamNames: finalTeamNames,
        biddingStyle: 'open',
        basePriceRule,
        customBasePrice: Number(customBasePrice),
        playerCategory,
        customPlayersList,
        maxPlayersPerTeam: Number(playersPerTeam),
        hostRetentions,
        showRatings: showRatings === 'shown'
      };

      const res = await axios.post('http://localhost:5000/api/rooms', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      navigate(`/room/${res.data.code}`);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error || 
        (err.request ? 'Failed to connect to backend server. Please make sure the server is running on port 5000.' : 'Failed to create room. Please check input parameters.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0E0A06] text-white flex items-center justify-center font-['Inter'] relative">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-[#FF6B00]/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[20%] w-[500px] h-[500px] rounded-full bg-[#FFB800]/5 blur-[120px] pointer-events-none" />
        <div className="bg-[#1A1008] border border-[#FF6B00]/30 rounded-2xl p-10 max-w-md text-center shadow-2xl relative z-10">
          <span className="text-5xl block mb-4">🔒</span>
          <h2 className="text-2xl font-heading text-[#FFB800] tracking-widest mb-4">AUTHENTICATION REQUIRED</h2>
          <p className="text-white/60 text-xs mb-8 leading-relaxed">
            You must enter your name on the homepage to host a draft arena.
          </p>
          <button 
            onClick={() => navigate('/')} 
            className="w-full bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white font-black uppercase text-xs tracking-widest py-3.5 rounded-xl transition shadow-lg shadow-[#FF6B00]/25"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#1a0f08] to-[#0d0805] text-[#f5f0e8] font-['Inter'] relative flex flex-col justify-between overflow-hidden">
      
      {/* Dynamic typography rules */}
      <style>{`
        .wizard-title-h1 {
          font-size: clamp(24px, 4vw, 40px) !important;
        }
        .wizard-title-h2 {
          font-size: clamp(18px, 3vw, 26px) !important;
        }
        .wizard-text-p {
          font-size: clamp(11px, 1.4vw, 14px) !important;
        }
      `}</style>
      
      {/* ─── LOADING OVERLAY ─── */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-[#0E0A06]/95 backdrop-blur-md z-50 flex flex-col items-center justify-center font-['Inter'] text-white">
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
      
      {/* ─── HEADER WITH PROGRESS BAR ─── */}
      <header className="w-full max-w-6xl mx-auto px-6 pt-4 pb-2 flex-shrink-0">
        <div className="flex justify-between items-center mb-3">
          <div 
            onClick={() => navigate('/lobby')} 
            className="font-heading text-2xl tracking-widest cursor-pointer hover:opacity-80 transition"
          >
            <span className="text-[#FFB800]">IPL </span>
            <span className="text-[#FF6B00]">AUCTION</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="bg-gradient-to-r from-[#FF6B00] to-[#FFB800] text-[#0E0A06] text-xs font-black px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg shadow-[#FF6B00]/15 tracking-wider uppercase animate-pulse">
              👑 Room Owner Setup
            </span>
            <button 
              onClick={() => navigate('/lobby')}
              className="text-xs uppercase tracking-widest border border-white/10 hover:border-[#FF6B00] px-4 py-2 rounded transition bg-[#1A1008]"
            >
              Exit
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative pt-1">
          <div className="flex mb-1.5 items-center justify-between text-xs font-bold uppercase tracking-widest text-white/50">
            <span>Step {step} of 4</span>
            <span className="text-[#FFB800]">
              {step === 1 && 'Select Auction Mode'}
              {step === 2 && 'Configure Room Settings'}
              {step === 3 && 'Pre-Auction / Retention Configuration'}
              {step === 4 && 'Launch Arena'}
            </span>
          </div>
          <div className="overflow-hidden h-1 text-xs flex rounded bg-white/5">
            <div 
              style={{ width: `${(step / 4) * 100}%` }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[#FF6B00] transition-all duration-500 ease-out"
            />
          </div>
        </div>
      </header>

      {/* ─── SLIDING WRAPPER CONTAINER ─── */}
      <main className="flex-1 w-full flex flex-col overflow-hidden relative min-h-0">
        {error && (
          <div className="bg-[#FF6B00]/10 border border-[#FF6B00] text-[#FF6B00] p-4 rounded-xl mx-auto my-2 text-sm text-center max-w-6xl w-full flex-shrink-0">
            {error}
          </div>
        )}

        <div className="relative w-full flex-1 min-h-0">
          <div 
            className="flex transition-transform duration-500 ease-out h-full"
            style={{ transform: `translateX(-${(step - 1) * 25}%)`, width: '400%' }}
          >
            
            {/* ══ STEP 1: SELECT AUCTION MODE ══ */}
            <div className="w-1/4 h-full flex-shrink-0 flex flex-col justify-center items-center px-6 overflow-y-auto min-h-0">
              <h1 className="font-heading text-center mb-6 text-[#FFB800] tracking-wide wizard-title-h1 animate-fade-in">
                SELECT AUCTION MODE
              </h1>
              
              <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl min-h-[300px]">
                
                {/* Mega Option */}
                <div 
                  onClick={() => {
                    setAuctionType('mega');
                    setAuctionYear('2025'); // Reset to default Mega year
                  }}
                  className={`cursor-pointer rounded-2xl p-8 bg-[#1c1410] border-2 transition text-left relative overflow-hidden flex flex-col justify-between ${
                    auctionType === 'mega' ? 'border-[#FFB800] bg-[#FFB800]/5 shadow-lg shadow-[#FFB800]/10' : 'border-[#3a2a1a] hover:border-white/10'
                  }`}
                >
                  <div className="absolute top-3 right-3 text-xs font-black uppercase text-[#FFB800] bg-[#FFB800]/15 px-2 py-0.5 rounded">
                    Mode 1
                  </div>
                  <div>
                    <h3 className="font-heading text-2xl text-white mb-3">🟢 BUILD FROM SCRATCH</h3>
                    <p className="text-xs text-white/70 mb-4 leading-relaxed wizard-text-p">
                      Every participant starts with zero players. No pre-assignments. Build your fantasy IPL team entirely through live auction bidding.
                    </p>
                  </div>
                  <ul className="text-xs text-white/50 space-y-2 flex flex-col justify-end">
                    <li><span className="text-[#f5a623] mr-1.5 font-bold">→</span> Squad slots: 11 Min to 25 Max</li>
                    <li><span className="text-[#f5a623] mr-1.5 font-bold">→</span> Limit: 4 or 8 Overseas players cap</li>
                    <li><span className="text-[#f5a623] mr-1.5 font-bold">→</span> Compulsory: 1 WK, 3 BAT, 3 BOWL, 1 ALL-ROUNDER</li>
                  </ul>
                </div>

                {/* Mini Option */}
                <div 
                  onClick={() => {
                    setAuctionType('mini');
                    setAuctionYear('2025'); // Reset to default Mini year
                  }}
                  className={`cursor-pointer rounded-2xl p-8 bg-[#1c1410] border-2 transition text-left relative overflow-hidden flex flex-col justify-between ${
                    auctionType === 'mini' ? 'border-[#FF6B00] bg-[#FF6B00]/5 shadow-lg shadow-[#FFB800]/10' : 'border-[#3a2a1a] hover:border-white/10'
                  }`}
                >
                  <div className="absolute top-3 right-3 text-xs font-black uppercase text-[#FF6B00] bg-[#FF6B00]/15 px-2 py-0.5 rounded">
                    Mode 2
                  </div>
                  <div>
                    <h3 className="font-heading text-2xl text-white mb-3">🔵 RETENTION + AUCTION</h3>
                    <p className="text-xs text-white/70 mb-4 leading-relaxed wizard-text-p">
                      Mini Auction style. Claim an IPL franchise, retain core players from their real squad (deducted from purse), then draft to fill roster slots.
                    </p>
                  </div>
                  <ul className="text-xs text-white/50 space-y-2 flex flex-col justify-end">
                    <li><span className="text-[#f5a623] mr-1.5 font-bold">→</span> Cost deductions apply based on real rosters</li>
                    <li><span className="text-[#f5a623] mr-1.5 font-bold">→</span> Remaining purse carries over to draft</li>
                    <li><span className="text-[#f5a623] mr-1.5 font-bold">→</span> RTM (Right to Match) cards toggle option</li>
                  </ul>
                </div>

              </div>
            </div>

            {/* ══ STEP 2: CONFIGURE ROOM SETTINGS ══ */}
            <div className="w-1/4 h-full flex-shrink-0 flex flex-col items-center px-6 overflow-hidden min-h-0 animate-fade-in">
              <div className="text-center mb-1.5 mt-2 flex-shrink-0">
                <span className="text-[10px] uppercase tracking-widest text-[#f5a623] font-bold border border-[#f5a623]/20 bg-[#f5a623]/5 px-3 py-1 rounded-full">
                  STEP 2 OF 4
                </span>
              </div>
              <h1 className="font-heading text-center mb-1 text-[#FFB800] tracking-widest gold-text-glow wizard-title-h1 flex-shrink-0">
                ROOM SETTINGS & ASSIGNMENTS
              </h1>
              <p className="text-[#8a7866] text-xs mb-3 text-center flex-shrink-0">Configure details for franchises, bidding format, and custom overrides</p>
              
              {/* Divider */}
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#f5a623] to-transparent opacity-60 mb-4 flex-shrink-0" />
              
              <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 items-stretch text-left flex-1 min-h-0 overflow-hidden mb-4">
                {/* LEFT SIDEBAR (240px width, scrollable if needed) */}
                <div className="w-full md:w-auto bg-[#1c1410] border border-[#3a2a1a] rounded-xl p-5 space-y-5 overflow-y-auto flex-shrink-0">
                  {/* ROOM CODE */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold tracking-widest text-[#8a7866] uppercase block">ROOM CODE</span>
                    <div className="bg-[#0d0805] border border-[#3a2a1a] rounded-lg p-3 text-center">
                      <span className="font-mono text-sm font-bold text-white tracking-widest block uppercase">
                        {roomVisibility === 'private' && privateCode ? privateCode : generatedCode}
                      </span>
                      <span className="text-[9px] text-[#8a7866] uppercase tracking-wider block mt-1">AUTO-GENERATED ON LAUNCH</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <button 
                          type="button" 
                          onClick={handleCopyCode}
                          className="flex-1 bg-[#0d0805] hover:bg-[#25150e] border border-[#3a2a1a] hover:border-[#f5a623] text-[10px] font-bold text-[#f5f0e8] py-1.5 rounded transition uppercase tracking-wider"
                        >
                          {copied ? '✓ COPIED' : 'COPY CODE'}
                        </button>
                        <button 
                          type="button" 
                          onClick={() => {
                            const joinUrl = `${window.location.origin}/room/${roomVisibility === 'private' && privateCode ? privateCode : generatedCode}`;
                            navigator.clipboard.writeText(joinUrl);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          className="flex-1 bg-[#0d0805] hover:bg-[#25150e] border border-[#3a2a1a] hover:border-[#f5a623] text-[10px] font-bold text-[#f5f0e8] py-1.5 rounded transition uppercase tracking-wider"
                        >
                          COPY LINK
                        </button>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => {
                          const joinUrl = `${window.location.origin}/room/${roomVisibility === 'private' && privateCode ? privateCode : generatedCode}`;
                          const shareText = encodeURIComponent(`Join my IPL Auction Arena! Room Code: ${roomVisibility === 'private' && privateCode ? privateCode : generatedCode}. Join Link: ${joinUrl}`);
                          window.open(`https://api.whatsapp.com/send?text=${shareText}`, '_blank');
                        }}
                        className="w-full bg-[#25D366] hover:bg-[#20ba56] text-[#0d0805] font-black text-[10px] py-1.5 rounded transition uppercase tracking-wider flex items-center justify-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.665.989 3.3 1.516 5.418 1.517 5.465 0 9.91-4.444 9.914-9.905.002-2.646-1.02-5.132-2.88-6.991-1.859-1.858-4.344-2.88-6.985-2.88-5.47 0-9.919 4.448-9.923 9.913-.002 2.037.518 3.827 1.51 5.4l-.994 3.635 3.74-.989zM15.82 13.06c-.234-.117-1.383-.682-1.597-.76-.214-.078-.37-.117-.526.117-.156.234-.604.76-.74.916-.137.156-.273.176-.508.059-.234-.117-.988-.364-1.882-1.162-.695-.62-1.165-1.387-1.302-1.622-.137-.234-.014-.361.103-.478.105-.105.234-.273.351-.41.117-.137.156-.234.234-.39.078-.156.039-.293-.02-.41-.059-.117-.526-1.267-.72-1.734-.19-.459-.383-.396-.526-.404-.136-.008-.293-.01-.45-.01-.156 0-.41.059-.624.293-.214.234-.82.8-.82 1.95 0 1.15.84 2.262.956 2.418.117.156 1.653 2.523 4.004 3.537.56.242.996.386 1.338.495.563.179 1.076.154 1.481.094.452-.067 1.383-.566 1.578-1.113.195-.547.195-1.015.137-1.113-.058-.097-.214-.156-.448-.273z"/>
                        </svg>
                        SHARE ON WHATSAPP
                      </button>
                    </div>
                  </div>

                  {/* CURRENT MODE */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold tracking-widest text-[#8a7866] uppercase block">CURRENT MODE</span>
                    <span className="text-sm font-semibold text-[#22c55e] block">
                      {auctionType === 'mega' ? '✅ Build From Scratch' : '✅ Retention + Auction'}
                    </span>
                  </div>

                  {/* CONFIGURATION SUMMARY */}
                  <div className="space-y-2 pt-2 border-t border-[#3a2a1a]">
                    <span className="text-[11px] font-bold tracking-widest text-[#8a7866] uppercase block">CONFIGURATION SUMMARY</span>
                    <div className="space-y-1.5 text-xs text-[#f5f0e8]/90 font-medium">
                      <div className="flex justify-between">
                        <span className="text-[#8a7866]">Purse:</span>
                        <span className="font-bold">₹{startingPurse} CR</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8a7866]">Roster:</span>
                        <span className="font-bold">{playersPerTeam} Max</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8a7866]">Overseas:</span>
                        <span className="font-bold">{maxOverseas} Players</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8a7866]">Timer:</span>
                        <span className="font-bold">{timePerBid} Sec</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8a7866]">Year:</span>
                        <span className="font-bold">{auctionYear}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8a7866]">Base Price:</span>
                        <span className="font-bold">{basePriceRule === 'real' ? 'Real IPL' : `Flat ₹${customBasePrice >= 10000000 ? `${(customBasePrice/10000000).toFixed(1)} Cr` : `${(customBasePrice/100000).toFixed(0)} Lakhs`}`}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8a7866]">Pool:</span>
                        <span className="font-bold uppercase truncate max-w-[120px]">
                          {{
                            all: 'All Players',
                            batters: 'Batters Only',
                            bowlers: 'Bowlers Only',
                            allrounders: 'All-Rounders',
                            mixed: 'Mixed Pool',
                            custom: 'Custom List'
                          }[playerCategory] || playerCategory}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* MAIN CONTENT AREA (Scrolls internally) */}
                <div className="flex-1 space-y-6 overflow-y-auto pr-1 min-h-0">
                  
                  {/* SECTION 1: FRANCHISE SETUP */}
                  <div className="bg-[#1c1410] border border-[#3a2a1a] rounded-xl p-6 space-y-6">
                    <div className="flex justify-between items-center pb-2 border-b border-white/5">
                      <h3 className="text-sm font-bold tracking-widest text-[#f5a623] uppercase flex items-center gap-2">
                        <span>🏟️</span> FRANCHISE SETUP
                      </h3>
                      
                      {/* Stepper for Number of Teams */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold tracking-widest text-[#8a7866] uppercase">NUMBER OF TEAMS:</span>
                        <div className="flex items-center bg-[#0d0805] border border-[#3a2a1a] rounded-lg overflow-hidden h-8">
                          <button 
                            type="button" 
                            onClick={() => {
                              const newNum = Math.max(2, numTeams - 1);
                              setNumTeams(newNum);
                              setCustomTeamNames(prev => prev.slice(0, newNum));
                            }}
                            className="px-2.5 h-full bg-[#1c1410]/50 hover:bg-[#25150e] border-r border-[#3a2a1a] text-[#8a7866] hover:text-white transition font-bold text-sm"
                          >
                            −
                          </button>
                          <span className="px-3 text-xs font-bold text-white font-mono">{numTeams}</span>
                          <button 
                            type="button" 
                            onClick={() => {
                              const newNum = Math.min(10, numTeams + 1);
                              setNumTeams(newNum);
                              if (customTeamNames.length < newNum) {
                                setCustomTeamNames(prev => [...prev, ...Array(newNum - prev.length).fill('').map((_, idx) => `Team ${prev.length + idx + 1}`)]);
                              }
                            }}
                            className="px-2.5 h-full bg-[#1c1410]/50 hover:bg-[#25150e] border-l border-[#3a2a1a] text-[#8a7866] hover:text-white transition font-bold text-sm"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Team Naming Type Toggle */}
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-[#8a7866] font-bold block">Naming Rule</label>
                      <div className="relative flex p-1 bg-[#0d0805] border border-[#3a2a1a] rounded-full w-full md:w-1/2 select-none">
                        <div 
                          className="absolute top-1 bottom-1 rounded-full bg-gradient-to-r from-[#f5a623] to-[#ff6b35] transition-all duration-300 ease-out shadow-[0_0_10px_rgba(245,166,35,0.4)]"
                          style={{
                            left: teamNamingType === 'custom' ? '50%' : '4px',
                            width: 'calc(50% - 6px)'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setTeamNamingType('real')}
                          className={`relative z-10 w-1/2 text-center py-1.5 rounded-full font-bold text-[10px] uppercase tracking-wider transition duration-300 flex items-center justify-center gap-1.5 ${
                            teamNamingType === 'real' ? 'text-[#0d0805]' : 'text-[#8a7866] hover:text-white'
                          }`}
                        >
                          <span>🏷️</span> Real Names
                        </button>
                        <button
                          type="button"
                          onClick={() => setTeamNamingType('custom')}
                          className={`relative z-10 w-1/2 text-center py-1.5 rounded-full font-bold text-[10px] uppercase tracking-wider transition duration-300 flex items-center justify-center gap-1.5 ${
                            teamNamingType === 'custom' ? 'text-[#0d0805]' : 'text-[#8a7866] hover:text-white'
                          }`}
                        >
                          <span>✏️</span> Custom Names
                        </button>
                      </div>
                    </div>

                    {/* Franchise Grid */}
                    <div className="space-y-4">
                      <span className="text-[10px] uppercase tracking-widest text-[#8a7866] font-bold block mb-1">
                        {teamNamingType === 'real' ? 'CLAIM YOUR FRANCHISE' : 'CLAIM & NAME YOUR FRANCHISES'}
                      </span>
                      
                      {teamNamingType === 'real' ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                          {TEAMS.map(t => {
                            const spec = {
                              CSK: '#f5c518', MI: '#1e5fb8', RCB: '#d4242e', KKR: '#5a2d82',
                              SRH: '#f7941d', DC: '#1996cc', PBKS: '#d4242e', RR: '#e0509a',
                              GT: '#1c3f60', LSG: '#00a3a3'
                            }[t.id] || '#f5a623';
                            const isSelected = selectedTeam === t.id;
                            return (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => setSelectedTeam(t.id)}
                                className={`relative flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300 bg-[#1c1410] ${
                                  isSelected 
                                    ? 'scale-[1.05] z-10' 
                                    : 'hover:-translate-y-1 hover:shadow-lg hover:border-[#3a2a1a]/80'
                                }`}
                                style={{
                                  borderColor: isSelected ? spec : '#3a2a1a',
                                  boxShadow: isSelected 
                                    ? `0 0 15px ${spec}35, inset 0 0 10px ${spec}15` 
                                    : `0 4px 10px rgba(0,0,0,0.2)`
                                }}
                              >
                                {isSelected && (
                                  <div 
                                    className="absolute -top-1.5 -right-1.5 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-[#1c1410] shadow-md z-20"
                                    style={{ backgroundColor: spec }}
                                  >
                                    ✓
                                  </div>
                                )}
                                <img src={t.logo} alt={t.name} className="h-10 w-10 object-contain mb-2 drop-shadow-md" />
                                <span 
                                  className="text-xs font-black uppercase tracking-widest block font-mono"
                                  style={{ color: spec }}
                                >
                                  {t.id}
                                </span>
                                <span className="text-[8px] text-[#8a7866] font-bold tracking-wide mt-0.5 text-center line-clamp-1">
                                  {t.name}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                          {Array.from({ length: numTeams }).map((_, i) => {
                            const customName = customTeamNames[i] || `Team ${i + 1}`;
                            const isSelected = selectedCustomTeamIndex === i;
                            const color = '#f5a623';
                            return (
                              <div key={i} className="space-y-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedCustomTeamIndex(i);
                                    setSelectedTeam(customName);
                                  }}
                                  className={`relative w-full flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300 bg-[#1c1410] ${
                                    isSelected 
                                      ? 'scale-[1.05] z-10' 
                                      : 'hover:-translate-y-1 hover:shadow-lg'
                                  }`}
                                  style={{
                                    borderColor: isSelected ? color : '#3a2a1a',
                                    boxShadow: isSelected 
                                      ? `0 0 15px ${color}35, inset 0 0 10px ${color}15` 
                                      : `0 4px 10px rgba(0,0,0,0.2)`
                                  }}
                                >
                                  {isSelected && (
                                    <div 
                                      className="absolute -top-1.5 -right-1.5 text-black text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-[#1c1410] shadow-md z-20"
                                      style={{ backgroundColor: color }}
                                    >
                                      ✓
                                    </div>
                                  )}
                                  <div className="h-10 w-10 rounded-full bg-[#0d0805] border border-[#3a2a1a] flex items-center justify-center mb-2">
                                    <span className="text-xs font-mono font-bold text-[#8a7866]">#{i + 1}</span>
                                  </div>
                                  <span className="text-xs font-black uppercase tracking-widest block truncate max-w-full text-center text-[#f5a623]">
                                    {customName.slice(0, 4).toUpperCase()}
                                  </span>
                                  <span className="text-[8px] text-[#8a7866] font-bold tracking-wide mt-0.5 text-center line-clamp-1">
                                    {customName}
                                  </span>
                                </button>
                                <input
                                  type="text"
                                  value={customTeamNames[i] || ''}
                                  onChange={(e) => handleCustomTeamNameChange(i, e.target.value)}
                                  placeholder={`Team ${i + 1}`}
                                  className="bg-[#0d0805] border border-[#3a2a1a] focus:border-[#f5a623] rounded-lg px-2 py-1 text-[10px] text-center focus:outline-none w-full text-white"
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SECTION 2: BIDDING FORMAT */}
                  <div className="bg-[#1c1410] border border-[#3a2a1a] rounded-xl p-6 space-y-6 text-left">
                    <h3 className="text-sm font-bold tracking-widest text-[#f5a623] uppercase flex items-center gap-2 pb-2 border-b border-white/5">
                      <span>⏱️</span> BIDDING FORMAT
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Bidding Style Toggle */}
                      <div className="space-y-2">
                        <label className="text-[11px] uppercase tracking-widest text-[#8a7866] font-bold block">Bidding Style</label>
                        <div className="flex items-center gap-2 bg-[#0d0805] border border-[#3a2a1a] rounded-full px-4 py-2">
                          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#f5a623] to-[#ff6b35] shadow-[0_0_6px_rgba(245,166,35,0.5)]"></div>
                          <span className="font-bold text-[10px] uppercase tracking-wider text-[#f5a623] flex items-center gap-1.5">
                            <span>▶</span> Open Live
                          </span>
                          <span className="text-[9px] text-[#22c55e] font-bold ml-auto">✓ DEFAULT</span>
                        </div>
                      </div>

                      {/* Timer per Bid */}
                      <div className="space-y-2">
                        <label className="text-[11px] uppercase tracking-widest text-[#8a7866] font-bold block">Timer per Bid</label>
                        <div className="relative flex p-1 bg-[#0d0805] border border-[#3a2a1a] rounded-full w-full select-none">
                          <div 
                            className="absolute top-1 bottom-1 rounded-full bg-gradient-to-r from-[#f5a623] to-[#ff6b35] transition-all duration-300 ease-out shadow-[0_0_10px_rgba(245,166,35,0.4)]"
                            style={{
                              left: `calc(${[10, 15, 30].indexOf(timePerBid) * 33.33}% + 4px)`,
                              width: 'calc(33.33% - 6px)'
                            }}
                          />
                          {[10, 15, 30].map(val => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setTimePerBid(val)}
                              className={`relative z-10 w-1/3 text-center py-1.5 rounded-full font-bold text-[10px] uppercase tracking-wider transition duration-300 flex items-center justify-center gap-1 ${
                                timePerBid === val ? 'text-[#0d0805]' : 'text-[#8a7866] hover:text-white'
                              }`}
                            >
                              <span>●</span> {val} SEC
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      {/* Bid Increment Scale */}
                      <div className="space-y-2">
                        <label className="text-[11px] uppercase tracking-widest text-[#8a7866] font-bold block">Bid Increment Scale</label>
                        <div className="bg-[#0d0805] border border-[#3a2a1a] rounded-xl p-4 space-y-2.5 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-[#8a7866]">Below ₹1 CR</span>
                            <span className="font-bold text-[#f5a623]">+₹5L raises</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[#8a7866]">Above ₹1 CR</span>
                            <span className="font-bold text-[#ff6b35]">+₹25L raises</span>
                          </div>
                        </div>
                      </div>

                      {/* Live Preview */}
                      <div className="space-y-2">
                        <label className="text-[11px] uppercase tracking-widest text-[#8a7866] font-bold block">Live Preview</label>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-[#0d0805] border border-[#3a2a1a] rounded-xl p-3 text-center">
                            <span className="text-[9px] text-[#8a7866] uppercase block font-bold mb-1">Standard</span>
                            <span className="font-bold text-white block">₹85L → ₹90L</span>
                            <span className="text-[9px] text-[#f5a623] font-bold block mt-0.5">(+5L)</span>
                          </div>
                          <div className="bg-[#0d0805] border border-[#3a2a1a] rounded-xl p-3 text-center">
                            <span className="text-[9px] text-[#8a7866] uppercase block font-bold mb-1">Premium</span>
                            <span className="font-bold text-white block">₹2CR → ₹2.25CR</span>
                            <span className="text-[9px] text-[#ff6b35] font-bold block mt-0.5">(+25L)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: RULES & OVERRIDES */}
                  <div className="bg-[#1c1410] border border-[#3a2a1a] rounded-xl p-6 space-y-6 text-left">
                    <h3 className="text-sm font-bold tracking-widest text-[#f5a623] uppercase flex items-center gap-2 pb-2 border-b border-white/5">
                      <span>⚙️</span> RULES & OVERRIDES
                    </h3>

                    {/* Clean 2-row grid layout */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Purse CR Stepper */}
                      <div className="space-y-2">
                        <label className="text-[11px] uppercase tracking-widest text-[#8a7866] font-bold block">PURSE (CR)</label>
                        <div className="flex items-center justify-between bg-[#0d0805] border border-[#3a2a1a] rounded-lg overflow-hidden h-9">
                          <button 
                            type="button" 
                            onClick={() => setStartingPurse(prev => Math.max(50, prev - 10))}
                            className="px-3 h-full bg-[#1c1410]/50 hover:bg-[#25150e] border-r border-[#3a2a1a] text-[#8a7866] hover:text-white transition font-bold"
                          >
                            −
                          </button>
                          <span className="text-xs font-mono font-bold text-[#f5f0e8]">{startingPurse}</span>
                          <button 
                            type="button" 
                            onClick={() => setStartingPurse(prev => Math.min(200, prev + 10))}
                            className="px-3 h-full bg-[#1c1410]/50 hover:bg-[#25150e] border-l border-[#3a2a1a] text-[#8a7866] hover:text-white transition font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Roster Cap Stepper */}
                      <div className="space-y-2">
                        <label className="text-[11px] uppercase tracking-widest text-[#8a7866] font-bold block">ROSTER CAP</label>
                        <div className="flex items-center justify-between bg-[#0d0805] border border-[#3a2a1a] rounded-lg overflow-hidden h-9">
                          <button 
                            type="button" 
                            onClick={() => setPlayersPerTeam(prev => Math.max(15, prev - 1))}
                            className="px-3 h-full bg-[#1c1410]/50 hover:bg-[#25150e] border-r border-[#3a2a1a] text-[#8a7866] hover:text-white transition font-bold"
                          >
                            −
                          </button>
                          <span className="text-xs font-mono font-bold text-[#f5f0e8]">{playersPerTeam}</span>
                          <button 
                            type="button" 
                            onClick={() => setPlayersPerTeam(prev => Math.min(25, prev + 1))}
                            className="px-3 h-full bg-[#1c1410]/50 hover:bg-[#25150e] border-l border-[#3a2a1a] text-[#8a7866] hover:text-white transition font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Max Overseas Dropdown */}
                      <div className="space-y-2">
                        <label className="text-[11px] uppercase tracking-widest text-[#8a7866] font-bold block">MAX OVERSEAS</label>
                        <CustomSelect
                          value={maxOverseas}
                          onChange={setMaxOverseas}
                          options={maxOverseasOptions}
                        />
                      </div>

                      {/* Auction Year Dropdown */}
                      <div className="space-y-2">
                        <label className="text-[11px] uppercase tracking-widest text-[#8a7866] font-bold block">AUCTION YEAR</label>
                        <CustomSelect
                          value={auctionYear}
                          onChange={setAuctionYear}
                          options={
                            auctionType === 'mega' ? [
                              { value: '2025', label: '2025' },
                              { value: '2022', label: '2022' },
                              { value: '2018', label: '2018' },
                              { value: '2014', label: '2014' },
                              { value: '2011', label: '2011' },
                              { value: '2008', label: '2008' }
                            ] : [
                              { value: '2025', label: '2025' },
                              { value: '2024', label: '2024' },
                              { value: '2023', label: '2023' },
                              { value: '2021', label: '2021' },
                              { value: '2020', label: '2020' },
                              { value: '2019', label: '2019' }
                            ]
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Base Price Mode Dropdown */}
                      <div className="space-y-2">
                        <label className="text-[11px] uppercase tracking-widest text-[#8a7866] font-bold block">BASE PRICE MODE</label>
                        <CustomSelect
                          value={basePriceRule}
                          onChange={setBasePriceRule}
                          options={basePriceRuleOptions}
                        />
                        {basePriceRule === 'custom' && (
                          <div className="flex items-center justify-between bg-[#0d0805] border border-[#3a2a1a] rounded-lg overflow-hidden h-9 mt-2">
                            <button 
                              type="button" 
                              onClick={() => setCustomBasePrice(prev => Math.max(1000000, prev - 5000000))}
                              className="px-3 h-full bg-[#1c1410]/50 hover:bg-[#25150e] border-r border-[#3a2a1a] text-[#8a7866] hover:text-white transition font-bold text-sm"
                            >
                              −
                            </button>
                            <span className="text-xs font-mono font-bold text-[#f5f0e8]">
                              ₹{customBasePrice >= 10000000 
                                ? `${(customBasePrice / 10000000).toFixed(1)} Cr` 
                                : `${(customBasePrice / 100000).toFixed(0)} Lakhs`}
                            </span>
                            <button 
                              type="button" 
                              onClick={() => setCustomBasePrice(prev => Math.min(50000000, prev + 5000000))}
                              className="px-3 h-full bg-[#1c1410]/50 hover:bg-[#25150e] border-l border-[#3a2a1a] text-[#8a7866] hover:text-white transition font-bold text-sm"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Player Pool Category Dropdown */}
                      <div className="space-y-2">
                        <label className="text-[11px] uppercase tracking-widest text-[#8a7866] font-bold block">PLAYER POOL CATEGORY</label>
                        <CustomSelect
                          value={playerCategory}
                          onChange={setPlayerCategory}
                          options={playerCategoryOptions}
                        />
                        {playerCategory === 'custom' && (
                          <textarea
                            rows={2}
                            placeholder='[{"name":"Virat Kohli","role":"Batter","basePrice":20000000}]'
                            value={customPlayersJSON}
                            onChange={(e) => setCustomPlayersJSON(e.target.value)}
                            className="w-full bg-[#0d0805] border border-[#3a2a1a] rounded-lg p-2.5 text-[9px] focus:outline-none focus:border-[#f5a623] font-mono text-white/80 mt-1.5"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* SECTION 4: CONFIGURATION SUMMARY CARD */}
                  <div className="bg-[#1c1410] border border-[#3a2a1a] rounded-xl p-6 text-left space-y-2.5">
                    <div className="text-xs font-bold uppercase tracking-widest text-[#22c55e] flex items-center gap-1.5">
                      <span>✅</span> CONFIGURATION SUMMARY
                    </div>
                    <p className="text-sm text-[#f5f0e8]/90 leading-relaxed font-medium">
                      Each team gets ₹{startingPurse} CR to build a {playersPerTeam}-player squad with up to {maxOverseas} overseas players, using {basePriceRule === 'real' ? 'real IPL base prices' : `flat base prices of ₹${customBasePrice >= 10000000 ? `${(customBasePrice / 10000000).toFixed(1)} CR` : `${(customBasePrice / 100000).toFixed(0)} Lakhs`}`} across all player categories. Open Live bidding with {timePerBid} second timer per player.
                    </p>
                  </div>

                </div>
              </div>
            </div>

            {/* ══ STEP 3: PRE-AUCTION / RETENTION CONFIGURATION ══ */}
            <div className="w-1/4 h-full flex-shrink-0 flex flex-col items-center px-6 min-h-0 animate-fade-in overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <style>{`.step3-scroll::-webkit-scrollbar { display: none; }`}</style>
              <div className="step3-scroll w-full flex flex-col items-center py-4 gap-3">
                <div className="text-center flex-shrink-0">
                  <span className="text-[9px] uppercase tracking-widest text-[#f5a623] font-bold border border-[#f5a623]/20 bg-[#f5a623]/5 px-2.5 py-0.5 rounded-full">
                    STEP 3 OF 4
                  </span>
                </div>
                <h1 className="font-heading text-center text-[#FFB800] tracking-widest gold-text-glow flex-shrink-0 pt-1" style={{ fontSize: 'clamp(18px, 2.5vw, 28px)', marginBottom: '2px' }}>
                  RETENTION CONFIGURATION
                </h1>
                <p className="text-[#8a7866] text-xs text-center flex-shrink-0 mb-1">
                  {auctionType === 'mega' 
                    ? 'Build from Scratch mode: review budget details' 
                    : `Retain core players for ${teamNamingType === 'custom' ? customTeamNames[selectedCustomTeamIndex] : selectedTeam}`}
                </p>
                
                <div className="w-full max-w-xl mx-auto gold-gradient-divider flex-shrink-0 mb-2" />

                <div className="w-full max-w-2xl bg-[#1c1410] border border-[#3a2a1a] rounded-2xl p-6 shadow-xl text-left">
                  {auctionType === 'mega' ? (
                    <div className="flex flex-col items-center gap-4 max-w-lg mx-auto text-center py-2">
                      <span className="text-5xl opacity-85 leading-none">🏟️</span>
                      <h2 className="text-xl font-bold text-[#f5a623] font-heading tracking-wide">
                        BUILD FROM SCRATCH ACTIVE
                      </h2>
                      <p className="text-[12px] text-white/70 leading-relaxed max-w-md">
                        All teams start with a fresh budget of ₹{startingPurse} Cr. There are no pre-assigned or retained players. All players will enter the live auction pool, and franchises will be built entirely through bidding.
                      </p>
                      
                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-3 w-full mt-2">
                        <div className="bg-[#0d0805] border border-[#3a2a1a] rounded-xl p-3.5 text-center">
                          <span className="font-heading text-2xl font-extrabold text-[#f5a623] block leading-none">
                            ₹{startingPurse} Cr
                          </span>
                          <span className="text-[9px] text-[#8a7866] uppercase tracking-wider block mt-1">
                            Draft Purse
                          </span>
                        </div>
                        <div className="bg-[#0d0805] border border-[#3a2a1a] rounded-xl p-3.5 text-center">
                          <span className="font-heading text-2xl font-extrabold text-white block leading-none">
                            {playersPerTeam}
                          </span>
                          <span className="text-[9px] text-[#8a7866] uppercase tracking-wider block mt-1">
                            Squad Limit
                          </span>
                        </div>
                        <div className="bg-[#0d0805] border border-[#3a2a1a] rounded-xl p-3.5 text-center">
                          <span className="font-heading text-2xl font-extrabold text-white block leading-none">
                            {maxOverseas}
                          </span>
                          <span className="text-[9px] text-[#8a7866] uppercase tracking-wider block mt-1">
                            Max Overseas
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-white/5 pb-3">
                        <div>
                          <h3 className="text-xs font-extrabold uppercase text-white tracking-widest font-heading">
                            {teamNamingType === 'custom' ? customTeamNames[selectedCustomTeamIndex] : selectedTeam} Retentions
                          </h3>
                          <span className="text-[9px] text-[#8a7866] uppercase tracking-wider">
                            Max 6 players (5 capped, 1 uncapped)
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-[#8a7866] block uppercase tracking-wider">Remaining Purse</span>
                          <span className="font-heading text-base text-[#f5a623] font-bold">
                            ₹{startingPurse - (getRetainedCost() / 10000000)} Cr
                          </span>
                        </div>
                      </div>

                      {/* Players list */}
                      {auctionYear === '2025' && auctionType === 'mini' ? (
                        <div className="space-y-3">
                          <div className="bg-[#f5a623]/10 border border-[#f5a623]/30 p-3 rounded-xl text-xs text-[#f5a623] leading-relaxed flex items-start gap-2">
                            <span className="text-xs">ℹ️</span>
                            <div>
                              <span className="font-bold uppercase tracking-wider block mb-0.5">Official IPL 2025 Retentions</span>
                              Official IPL 2025 retentions will be automatically loaded for all 10 franchises. Purse deductions and squad counts will apply immediately. Customization is disabled for official rosters.
                            </div>
                          </div>
                          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                            <span className="text-[9px] uppercase tracking-widest text-[#8a7866] font-bold block mb-1">Retained Squad:</span>
                            {(RETAINED_PLAYERS_2025[selectedTeam] || []).map(p => (
                              <div key={p.name} className="flex justify-between items-center p-3 rounded-xl border border-[#3a2a1a] bg-[#0d0805]">
                                <div>
                                  <span className="font-bold text-xs text-white block">{p.name}</span>
                                  <span className="text-[8px] text-[#8a7866] uppercase tracking-wider font-mono">
                                    {p.role} {p.isOverseas ? '• 🌍 Overseas' : '• 🇮🇳 Indian'}
                                  </span>
                                </div>
                                <span className="font-mono text-xs text-[#f5a623] font-black">
                                  ₹{(p.price / 10000000).toFixed(1)} Cr
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : auctionYear !== '2025' ? (
                        <div className="text-center py-4 text-[#8a7866] text-xs">
                          ⚠️ No default player retentions are available for the year {auctionYear}. You can proceed with a full purse.
                        </div>
                      ) : (RETAINED_PLAYERS_2025[selectedTeam] || []).length === 0 ? (
                        <div className="text-center py-4 text-[#8a7866] text-xs">
                          No default retained players found for this team.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                          {(RETAINED_PLAYERS_2025[selectedTeam] || []).map(p => {
                            const isChecked = hostRetentions.includes(p.name);
                            return (
                              <div 
                                key={p.name}
                                onClick={() => {
                                  if (isChecked) {
                                    setHostRetentions(prev => prev.filter(name => name !== p.name));
                                  } else {
                                    if (hostRetentions.length >= 6) {
                                      setError('Max 6 retentions allowed.');
                                      return;
                                    }
                                    setHostRetentions(prev => [...prev, p.name]);
                                  }
                                  setError('');
                                }}
                                className={`flex justify-between items-center p-3 rounded-xl border cursor-pointer transition-all duration-300 ${
                                  isChecked 
                                    ? 'border-[#f5a623] bg-[#f5a623]/5 shadow-[0_0_12px_rgba(245,166,35,0.1)]' 
                                    : 'border-white/5 bg-[#0d0805] hover:border-[#3a2a1a]'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                                    isChecked ? 'bg-[#f5a623] border-[#f5a623]' : 'border-[#3a2a1a]'
                                  }`}>
                                    {isChecked && <span className="text-[8px] text-[#0d0805] font-black">✓</span>}
                                  </div>
                                  <div>
                                    <span className="font-bold text-xs text-white block">{p.name}</span>
                                    <span className="text-[8px] text-[#8a7866] uppercase tracking-wider font-mono">
                                      {p.role} {p.isOverseas ? '• 🌍 Overseas' : '• 🇮🇳 Indian'}
                                    </span>
                                  </div>
                                </div>
                                <span className="font-mono text-xs text-[#f5a623] font-black">
                                  ₹{(p.price / 10000000).toFixed(1)} Cr
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ══ STEP 4: REVIEW & LAUNCH ══ */}
            <div className="w-1/4 h-full flex-shrink-0 flex flex-col items-center px-6 min-h-0 animate-fade-in overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <style>{`.step4-scroll::-webkit-scrollbar { display: none; }`}</style>
              <div className="step4-scroll w-full flex flex-col items-center py-4 gap-3">
                <div className="text-center flex-shrink-0">
                  <span className="text-[9px] uppercase tracking-widest text-[#f5a623] font-bold border border-[#f5a623]/20 bg-[#f5a623]/5 px-2.5 py-0.5 rounded-full">
                    STEP 4 OF 4
                  </span>
                </div>
                <h1 className="font-heading text-center text-[#FFB800] tracking-wide flex-shrink-0" style={{ fontSize: 'clamp(18px, 2.5vw, 28px)', marginBottom: '2px' }}>
                  ARENA SPECIFICATIONS
                </h1>
                
                <div className="bg-[#1c1410] border border-[#3a2a1a] rounded-2xl p-5 w-full max-w-[780px] shadow-2xl relative text-left">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3.5 relative z-10">
                    
                    <div>
                      <span className="text-[9px] uppercase tracking-widest text-white/40 block font-bold leading-tight">Simulation Year</span>
                      <span className="font-heading text-base text-[#FFB800] tracking-wide mt-0.5 block">
                        {auctionYear}
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] uppercase tracking-widest text-white/40 block font-bold leading-tight">Bidding Format</span>
                      <span className="font-heading text-base text-white tracking-wide mt-0.5 block uppercase">
                        Open Live
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] uppercase tracking-widest text-white/40 block font-bold leading-tight">Draft Purse</span>
                      <span className="font-heading text-base text-[#FF6B00] tracking-wide mt-0.5 block">
                        ₹{startingPurse - (getRetainedCost() / 10000000)}CR
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] uppercase tracking-widest text-white/40 block font-bold leading-tight">Squad Limit</span>
                      <span className="font-bold text-[13px] text-white mt-0.5 block">
                        {playersPerTeam} Max ({maxOverseas} Overseas)
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] uppercase tracking-widest text-white/40 block font-bold leading-tight">Total Franchises</span>
                      <span className="font-bold text-[13px] text-white mt-0.5 block">
                        {numTeams} Participating
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] uppercase tracking-widest text-white/40 block font-bold leading-tight">Base Price</span>
                      <span className="font-bold text-[13px] text-white mt-0.5 block font-mono">
                        {basePriceRule === 'real' ? 'Real IPL' : `₹${customBasePrice / 100000} L`}
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] uppercase tracking-widest text-white/40 block font-bold leading-tight">Timer per Bid</span>
                      <span className="font-bold text-[13px] text-white mt-0.5 block">
                        {timePerBid} Seconds
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] uppercase tracking-widest text-white/40 block font-bold leading-tight">RTM Cards</span>
                      <span className="font-bold text-[13px] text-white mt-0.5 block">
                        {rtmEnabled 
                          ? (auctionType === 'mini' 
                            ? `Max ${Math.max(0, 6 - hostRetentions.length)} Cards` 
                            : 'Enabled') 
                          : 'Disabled'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] uppercase tracking-widest text-white/40 block font-bold leading-tight">Player Category</span>
                      <span className="font-bold text-[13px] text-white mt-0.5 block uppercase truncate">
                        {playerCategory}
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] uppercase tracking-widest text-white/40 block font-bold leading-tight">Your Franchise</span>
                      <span className="font-bold text-[13px] text-[#FFB800] mt-0.5 block uppercase truncate">
                        {teamNamingType === 'custom' ? (customTeamNames[selectedCustomTeamIndex] || `Team ${selectedCustomTeamIndex + 1}`) : selectedTeam}
                      </span>
                    </div>

                    {auctionType === 'mini' && hostRetentions.length > 0 && (
                      <div>
                        <span className="text-[9px] uppercase tracking-widest text-white/40 block font-bold leading-tight">Retained Cost</span>
                        <span className="font-bold text-[13px] text-white mt-0.5 block">
                          ₹{(getRetainedCost() / 10000000).toFixed(1)} Cr ({hostRetentions.length} Players)
                        </span>
                      </div>
                    )}

                  </div>

                  {/* Arena code section */}
                  <div className="mt-4 pt-4 border-t border-white/5 z-10 relative">
                    <div className="flex flex-col sm:flex-row items-center justify-between py-3.5 px-5 bg-[#0d0805] rounded-xl border border-[#3a2a1a] gap-3">
                      <div>
                        <span className="text-[9px] uppercase tracking-widest text-white/40 block font-bold mb-0.5">
                          Arena Code
                        </span>
                        <span className="font-mono text-2xl font-black text-[#FFB800] tracking-[0.25em] block select-all">
                          {roomVisibility === 'private' && privateCode ? privateCode : generatedCode}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="bg-[#1c1410] hover:bg-[#25150e] border border-[#3a2a1a] hover:border-[#FFB800] text-[11px] font-bold uppercase tracking-widest px-4 py-2.5 rounded-lg transition-all duration-300 whitespace-nowrap"
                      >
                        {copied ? '✓ Copied!' : '📋 Copy Code'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* WHAT'S NEXT SECTION */}
                <div className="w-full max-w-[780px] bg-[#1c1410] border border-[#3a2a1a] rounded-2xl p-5 text-left">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#8a7866] mb-3">
                    What happens next
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-heading text-xl font-extrabold text-[#f5a623] opacity-50 leading-none">①</span>
                      <p className="text-[11px] text-white/60 leading-relaxed">
                        Share the Arena Code with friends so they can join your room.
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-heading text-xl font-extrabold text-[#f5a623] opacity-50 leading-none">②</span>
                      <p className="text-[11px] text-white/60 leading-relaxed">
                        Each participant claims their franchise in the lobby.
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-heading text-xl font-extrabold text-[#f5a623] opacity-50 leading-none">③</span>
                      <p className="text-[11px] text-white/60 leading-relaxed">
                        Host launches the auction and bidding begins live.
                      </p>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-[#FF6B00]/10 border border-[#FF6B00]/30 text-[#FF6B00] p-4 rounded-2xl max-w-[780px] w-full text-center shadow-lg relative overflow-hidden flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                      <span>⚠️</span> Room creation failed
                    </div>
                    <p className="text-xs text-white/70 leading-relaxed font-mono">
                      {error}
                    </p>
                    <button 
                      onClick={handleLaunch} 
                      className="bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white font-extrabold text-[10px] uppercase tracking-widest px-5 py-2 rounded-lg transition transform hover:scale-[1.03]"
                    >
                      TRY AGAIN
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Bottom Action Bar */}
      <div className="w-full flex-shrink-0 bg-[#1c1410] border-t border-[#3a2a1a] px-6 py-4 shadow-[0_-8px_30px_rgba(0,0,0,0.5)] z-40">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          {/* Left: Back Button */}
          {step > 1 ? (
            <button
              onClick={goBack}
              className="text-xs uppercase tracking-widest border border-white/10 hover:border-[#f5a623] hover:text-[#f5a623] px-5 py-2.5 rounded bg-[#0d0805] text-white/85 hover:bg-[#1a0f08] transition-all duration-300 font-bold"
            >
              ← BACK
            </button>
          ) : (
            <div className="w-16" />
          )}

          {/* Center: Progress indicator */}
          <div className="flex flex-col items-center">
            <span className="text-[9px] uppercase tracking-widest text-[#8a7866] font-bold">
              STEP {step} OF 4
            </span>
            <span className="text-[11px] font-semibold text-white/90 mt-0.5 tracking-wider uppercase font-mono">
              {step === 1 && 'Select Auction Mode'}
              {step === 2 && 'Configure Room Settings'}
              {step === 3 && 'Pre-Auction / Retention Configuration'}
              {step === 4 && 'Launch Arena'}
            </span>
          </div>

          {step < 4 ? (
            <button
              onClick={goNext}
              disabled={step === 1 && !auctionType}
              className={`font-black py-2.5 px-6 rounded-lg text-xs uppercase tracking-widest transition-all duration-300 transform shadow-lg ${
                (step === 1 && !auctionType)
                  ? 'bg-gray-700 text-gray-500 border border-gray-800 cursor-not-allowed opacity-50 shadow-none'
                  : 'bg-gradient-to-r from-[#f5a623] to-[#ff6b35] hover:from-[#ff6b35] hover:to-[#f5a623] text-[#0d0805] hover:scale-[1.03] shadow-[#f5a623]/25 hover:shadow-[#f5a623]/40 cursor-pointer'
              }`}
            >
              {step === 1 && 'PROCEED TO SETTINGS →'}
              {step === 2 && (auctionType === 'mega' ? 'PROCEED TO SPECS PREVIEW →' : 'PROCEED TO RETENTIONS →')}
              {step === 3 && 'CONTINUE TO ARENA SPECS →'}
            </button>
          ) : (
            <button
              disabled={isSubmitting}
              onClick={handleLaunch}
              className="bg-gradient-to-r from-[#f5a623] to-[#ff6b35] hover:from-[#ff6b35] hover:to-[#f5a623] text-[#0d0805] font-black uppercase text-xs tracking-widest py-2.5 px-6 rounded-lg transition-all duration-300 transform hover:scale-[1.03] shadow-lg shadow-[#f5a623]/25 disabled:opacity-50 disabled:cursor-not-allowed animate-pulse"
            >
              {isSubmitting ? 'Establishing Arena...' : 'START AUCTION →'}
            </button>
          )}
        </div>
      </div>

    </div>
  );
};

export default CreateRoom;
