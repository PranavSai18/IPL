const Room = require('./models/Room');
const Player = require('./models/Player');
const User = require('./models/User');

const auctionRooms = {}; 

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

function mulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

function seededShuffle(array, rng) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getPlayerSet(player) {
  const category = (player.category || '').toLowerCase();
  const role = (player.role || '').toLowerCase();
  const isOverseas = !!player.isOverseas;
  const isCapped = !!player.isCapped;
  const basePrice = player.basePrice || 0;

  if (category.includes('marquee')) {
    return 'marquee'; // SET A
  }
  if (basePrice <= 7500000) {
    return 'budget'; // SET H
  }
  if (!isOverseas && !isCapped) {
    return 'uncapped'; // SET F
  }
  if (isOverseas) {
    return 'overseas'; // SET G
  }
  if (role.includes('wk') || role.includes('keeper')) {
    return 'wk'; // SET E
  }
  if (role.includes('all-rounder') || role.includes('allrounder') || role.includes('ar') || category.includes('all-rounder') || category.includes('allrounder')) {
    return 'allrounders'; // SET D
  }
  if (role.includes('bowl') || role.includes('spin') || role.includes('pacer') || category.includes('bowler') || category.includes('spin')) {
    return 'bowlers'; // SET C
  }
  return 'batters'; // SET B
}

function getRetentionCost(year, index) {
  const y = String(year);
  if (y === '2025') {
    if (index === 1) return 180000000; // 18Cr
    if (index === 2) return 140000000; // 14Cr
    if (index === 3) return 110000000; // 11Cr
    if (index === 4) return 180000000; // 18Cr
    if (index === 5) return 140000000; // 14Cr
    return 100000000; // fallback 10Cr
  } else if (y === '2024') {
    if (index === 1) return 160000000; // 16Cr
    if (index === 2) return 120000000; // 12Cr
    if (index === 3) return 80000000;  // 8Cr
    if (index === 4) return 120000000;
    if (index === 5) return 80000000;
    return 80000000;
  } else if (y === '2023') {
    if (index === 1) return 150000000; // 15Cr
    if (index === 2) return 120000000; // 12Cr
    if (index === 3) return 90000000;  // 9Cr
    if (index === 4) return 60000000;  // 6Cr
    if (index === 5) return 30000000;  // 3Cr
    return 50000000;
  } else {
    // 2021, 2020, 2019
    if (index === 1) return 150000000; // 15Cr
    if (index === 2) return 110000000; // 11Cr
    if (index === 3) return 70000000;  // 7Cr
    return 50000000;
  }
}

function getMaxRetentionsLimit(year) {
  const y = String(year);
  if (y === '2025') return 6;
  if (y === '2024') return 5;
  if (y === '2023') return 5;
  return 3; // 2021, 2020, 2019
}

function getRtmCardsCount(year, rtmEnabled, retCount) {
  if (!rtmEnabled) return 0;
  const y = String(year);
  if (y === '2025') {
    return Math.max(0, 6 - retCount);
  } else if (y === '2024' || y === '2023') {
    return Math.max(0, 5 - retCount);
  } else {
    // 2021, 2020, 2019
    return Math.min(3, Math.max(0, 5 - retCount));
  }
} 
// In-memory state per room:
// {
//   playersList: [],
//   currentIndex: 0,
//   currentBid: 0,
//   highestBidder: null, // userId
//   highestBidderTeam: null, // teamId
//   timer: null,
//   timeLeft: 30,
//   timePerBid: 30,
//   isPaused: false,

//   unsoldPool: [], // [playerObject]
//   playersDraftedCount: 0,
//   breakState: { active: false, type: 'leaderboard' },
//   rtmState: {
//     active: false,
//     rtmTeamId: null,
//     rtmUserId: null,
//     highestBidderUserId: null,
//     highestBidderTeamId: null,
//     preRtmBid: 0,
//     phase: 'idle', // 'idle' | 'decision' | 'counter' | 'final-match'
//     raisedBid: 0,
//     timeLeft: 10
//   }
// }

const OFFICIAL_POOL_2025 = [
  // MARQUEE SET
  { name: "Rishabh Pant", role: "WK-Batter", nationality: "Indian", basePrice: 20000000, isOverseas: false, isCapped: true, category: "Marquee Set 1" },
  { name: "Shreyas Iyer", role: "Batter", nationality: "Indian", basePrice: 20000000, isOverseas: false, isCapped: true, category: "Marquee Set 1" },
  { name: "Venkatesh Iyer", role: "All-Rounder", nationality: "Indian", basePrice: 20000000, isOverseas: false, isCapped: true, category: "Marquee Set 1" },
  { name: "KL Rahul", role: "WK-Batter", nationality: "Indian", basePrice: 20000000, isOverseas: false, isCapped: true, category: "Marquee Set 1" },
  { name: "Jos Buttler", role: "WK-Batter", nationality: "Overseas", basePrice: 20000000, isOverseas: true, isCapped: true, category: "Marquee Set 1" },
  { name: "Mitchell Starc", role: "Bowler", nationality: "Overseas", basePrice: 20000000, isOverseas: true, isCapped: true, category: "Marquee Set 1" },
  { name: "Jofra Archer", role: "Bowler", nationality: "Overseas", basePrice: 20000000, isOverseas: true, isCapped: true, category: "Marquee Set 1" },
  { name: "Josh Hazlewood", role: "Bowler", nationality: "Overseas", basePrice: 20000000, isOverseas: true, isCapped: true, category: "Marquee Set 1" },
  { name: "Mohammed Shami", role: "Bowler", nationality: "Indian", basePrice: 20000000, isOverseas: false, isCapped: true, category: "Marquee Set 1" },
  { name: "Ishan Kishan", role: "WK-Batter", nationality: "Indian", basePrice: 20000000, isOverseas: false, isCapped: true, category: "Marquee Set 1" },
  { name: "Liam Livingstone", role: "All-Rounder", nationality: "Overseas", basePrice: 20000000, isOverseas: true, isCapped: true, category: "Marquee Set 1" },
  { name: "Marco Jansen", role: "All-Rounder", nationality: "Overseas", basePrice: 12500000, isOverseas: true, isCapped: true, category: "Marquee Set 1" },

  // BATTERS SET
  { name: "Faf du Plessis", role: "Batter", nationality: "Overseas", basePrice: 20000000, isOverseas: true, isCapped: true, category: "Capped Batter" },
  { name: "Devon Conway", role: "Batter", nationality: "Overseas", basePrice: 20000000, isOverseas: true, isCapped: true, category: "Capped Batter" },
  { name: "Harry Brook", role: "Batter", nationality: "Overseas", basePrice: 20000000, isOverseas: true, isCapped: true, category: "Capped Batter" },
  { name: "Phil Salt", role: "WK-Batter", nationality: "Overseas", basePrice: 20000000, isOverseas: true, isCapped: true, category: "Capped WK-Batter" },
  { name: "Devdutt Padikkal", role: "Batter", nationality: "Indian", basePrice: 20000000, isOverseas: false, isCapped: true, category: "Capped Batter" },
  { name: "Rahul Tripathi", role: "Batter", nationality: "Indian", basePrice: 20000000, isOverseas: false, isCapped: true, category: "Capped Batter" },
  { name: "Jake Fraser-McGurk", role: "Batter", nationality: "Overseas", basePrice: 20000000, isOverseas: true, isCapped: true, category: "Capped Batter" },
  { name: "David Miller", role: "Batter", nationality: "Overseas", basePrice: 15000000, isOverseas: true, isCapped: true, category: "Capped Batter" },
  { name: "Aiden Markram", role: "Batter", nationality: "Overseas", basePrice: 15000000, isOverseas: true, isCapped: true, category: "Capped Batter" },
  { name: "Priyansh Arya", role: "Batter", nationality: "Indian", basePrice: 3000000, isOverseas: false, isCapped: false, category: "Uncapped Batter" },
  { name: "Vaibhav Suryavanshi", role: "Batter", nationality: "Indian", basePrice: 3000000, isOverseas: false, isCapped: false, category: "Uncapped Batter" },
  { name: "Angkrish Raghuvanshi", role: "Batter", nationality: "Indian", basePrice: 3000000, isOverseas: false, isCapped: false, category: "Uncapped Batter" },

  // BOWLERS SET
  { name: "Bhuvneshwar Kumar", role: "Bowler", nationality: "Indian", basePrice: 20000000, isOverseas: false, isCapped: true, category: "Capped Fast Bowler" },
  { name: "Khaleel Ahmed", role: "Bowler", nationality: "Indian", basePrice: 20000000, isOverseas: false, isCapped: true, category: "Capped Fast Bowler" },
  { name: "Avesh Khan", role: "Bowler", nationality: "Indian", basePrice: 20000000, isOverseas: false, isCapped: true, category: "Capped Fast Bowler" },
  { name: "T Natarajan", role: "Bowler", nationality: "Indian", basePrice: 20000000, isOverseas: false, isCapped: true, category: "Capped Fast Bowler" },
  { name: "Prasidh Krishna", role: "Bowler", nationality: "Indian", basePrice: 20000000, isOverseas: false, isCapped: true, category: "Capped Fast Bowler" },
  { name: "Akash Deep", role: "Bowler", nationality: "Indian", basePrice: 10000000, isOverseas: false, isCapped: true, category: "Capped Fast Bowler" },
  { name: "Noor Ahmad", role: "Bowler", nationality: "Overseas", basePrice: 20000000, isOverseas: true, isCapped: true, category: "Capped Spinner" },
  { name: "Maheesh Theekshana", role: "Bowler", nationality: "Overseas", basePrice: 15000000, isOverseas: true, isCapped: true, category: "Capped Spinner" },
  { name: "Kagiso Rabada", role: "Bowler", nationality: "Overseas", basePrice: 20000000, isOverseas: true, isCapped: true, category: "Capped Fast Bowler" },
  { name: "Anrich Nortje", role: "Bowler", nationality: "Overseas", basePrice: 20000000, isOverseas: true, isCapped: true, category: "Capped Fast Bowler" },
  { name: "Wanindu Hasaranga", role: "All-Rounder", nationality: "Overseas", basePrice: 15000000, isOverseas: true, isCapped: true, category: "Capped Spinner" },
  { name: "Adam Zampa", role: "Bowler", nationality: "Overseas", basePrice: 20000000, isOverseas: true, isCapped: true, category: "Capped Spinner" },
  { name: "Ravichandran Ashwin", role: "Bowler", nationality: "Indian", basePrice: 20000000, isOverseas: false, isCapped: true, category: "Capped Spinner" },

  // ALL-ROUNDERS SET
  { name: "Sam Curran", role: "All-Rounder", nationality: "Overseas", basePrice: 20000000, isOverseas: true, isCapped: true, category: "Capped All-Rounder" },
  { name: "Will Jacks", role: "All-Rounder", nationality: "Overseas", basePrice: 20000000, isOverseas: true, isCapped: true, category: "Capped All-Rounder" },
  { name: "Krunal Pandya", role: "All-Rounder", nationality: "Indian", basePrice: 20000000, isOverseas: false, isCapped: true, category: "Capped All-Rounder" },
  { name: "Washington Sundar", role: "All-Rounder", nationality: "Indian", basePrice: 20000000, isOverseas: false, isCapped: true, category: "Capped All-Rounder" },
  { name: "Mitchell Marsh", role: "All-Rounder", nationality: "Overseas", basePrice: 20000000, isOverseas: true, isCapped: true, category: "Capped All-Rounder" },
  { name: "Marcus Stoinis", role: "All-Rounder", nationality: "Overseas", basePrice: 20000000, isOverseas: true, isCapped: true, category: "Capped All-Rounder" },
  { name: "Glenn Phillips", role: "All-Rounder", nationality: "Overseas", basePrice: 20000000, isOverseas: true, isCapped: true, category: "Capped All-Rounder" },
  { name: "Azmatullah Omarzai", role: "All-Rounder", nationality: "Overseas", basePrice: 15000000, isOverseas: true, isCapped: true, category: "Capped All-Rounder" },
  { name: "Abdul Samad", role: "All-Rounder", nationality: "Indian", basePrice: 15000000, isOverseas: false, isCapped: true, category: "Capped All-Rounder" },
  { name: "Rachin Ravindra", role: "All-Rounder", nationality: "Overseas", basePrice: 15000000, isOverseas: true, isCapped: true, category: "Capped All-Rounder" },

  // WICKET-KEEPERS SET
  { name: "Quinton de Kock", role: "WK-Batter", nationality: "Overseas", basePrice: 10000000, isOverseas: true, isCapped: true, category: "Capped WK-Batter" },
  { name: "Ryan Rickelton", role: "WK-Batter", nationality: "Overseas", basePrice: 10000000, isOverseas: true, isCapped: true, category: "Capped WK-Batter" },
  { name: "Jitesh Sharma", role: "WK-Batter", nationality: "Indian", basePrice: 10000000, isOverseas: false, isCapped: true, category: "Capped WK-Batter" },
  { name: "Rahmanullah Gurbaz", role: "WK-Batter", nationality: "Overseas", basePrice: 20000000, isOverseas: true, isCapped: true, category: "Capped WK-Batter" },

  // UNCAPPED INDIANS SET
  { name: "Suyash Sharma", role: "Bowler", nationality: "Indian", basePrice: 3000000, isOverseas: false, isCapped: false, category: "Uncapped Bowler" },
  { name: "Anshul Kamboj", role: "Bowler", nationality: "Indian", basePrice: 3000000, isOverseas: false, isCapped: false, category: "Uncapped Bowler" },
  { name: "Gurjapneet Singh", role: "Bowler", nationality: "Indian", basePrice: 3000000, isOverseas: false, isCapped: false, category: "Uncapped Bowler" },
  { name: "Robin Minz", role: "WK-Batter", nationality: "Indian", basePrice: 3000000, isOverseas: false, isCapped: false, category: "Uncapped WK-Batter" },
  { name: "Arjun Tendulkar", role: "All-Rounder", nationality: "Indian", basePrice: 3000000, isOverseas: false, isCapped: false, category: "Uncapped All-Rounder" },
  { name: "Raj Angad Bawa", role: "All-Rounder", nationality: "Indian", basePrice: 3000000, isOverseas: false, isCapped: false, category: "Uncapped All-Rounder" },
  { name: "Naman Dhir", role: "Batter", nationality: "Indian", basePrice: 3000000, isOverseas: false, isCapped: false, category: "Uncapped Batter" },
  { name: "Ashwani Kumar", role: "Bowler", nationality: "Indian", basePrice: 3000000, isOverseas: false, isCapped: false, category: "Uncapped Bowler" },

  // OVERSEAS SET
  { name: "Spencer Johnson", role: "Bowler", nationality: "Overseas", basePrice: 7500000, isOverseas: true, isCapped: true, category: "Capped Fast Bowler" },
  { name: "Nathan Ellis", role: "Bowler", nationality: "Overseas", basePrice: 20000000, isOverseas: true, isCapped: true, category: "Capped Fast Bowler" },
  { name: "Reece Topley", role: "Bowler", nationality: "Overseas", basePrice: 7500000, isOverseas: true, isCapped: true, category: "Capped Fast Bowler" },
  { name: "Allah Ghazanfar", role: "Bowler", nationality: "Overseas", basePrice: 7500000, isOverseas: true, isCapped: true, category: "Capped Spinner" },
  { name: "Trent Boult", role: "Bowler", nationality: "Overseas", basePrice: 20000000, isOverseas: true, isCapped: true, category: "Capped Fast Bowler" },
  { name: "Mitchell Santner", role: "All-Rounder", nationality: "Overseas", basePrice: 10000000, isOverseas: true, isCapped: true, category: "Capped All-Rounder" }
];

function serializeAuctionState(state) {
  if (!state) return null;
  const { timer, ...rest } = state;
  const currentPlayer = state.playersList && state.playersList[state.currentIndex] ? state.playersList[state.currentIndex] : null;
  return { ...rest, currentPlayer };
}

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // join-room
    socket.on('join-room', async ({ roomId, userId }) => {
      socket.join(roomId);
      let roomInfo = await Room.findById(roomId).populate('players', 'name walletBalance');
      if (!roomInfo) return;

      // Auto-recover from server restart if room is active in DB but missing in-memory auction state
      if (roomInfo.status === 'active' && !auctionRooms[roomId]) {
        console.log(`[Socket] Auto-recovering room ${roomId} (active in DB but missing in memory). Resetting to waiting...`);
        roomInfo.status = 'waiting';
        if (roomInfo.teamsState) {
          const purseInRupees = (roomInfo.startingPurse || 120) * 10000000;
          Object.keys(roomInfo.teamsState).forEach(teamId => {
            roomInfo.teamsState[teamId].purse = purseInRupees;
            roomInfo.teamsState[teamId].squad = [];
            roomInfo.teamsState[teamId].retentions = [];
            roomInfo.teamsState[teamId].rtmCards = 0;
            roomInfo.teamsState[teamId].retentionsLocked = false;
          });
          roomInfo.markModified('teamsState');
        }
        await roomInfo.save();
        roomInfo = await Room.findById(roomId).populate('players', 'name walletBalance');
      }

      io.to(roomId).emit('room-state', {
        room: roomInfo ? roomInfo.toObject() : null,
        auctionState: serializeAuctionState(auctionRooms[roomId])
      });
    });

    // force-reset-room
    socket.on('force-reset-room', async ({ roomId }) => {
      try {
        const roomInfo = await Room.findById(roomId);
        if (!roomInfo) return;
        roomInfo.status = 'waiting';
        if (roomInfo.teamsState) {
          const purseInRupees = (roomInfo.startingPurse || 120) * 10000000;
          Object.keys(roomInfo.teamsState).forEach(teamId => {
            roomInfo.teamsState[teamId].purse = purseInRupees;
            roomInfo.teamsState[teamId].squad = [];
            roomInfo.teamsState[teamId].retentions = [];
            roomInfo.teamsState[teamId].rtmCards = 0;
            roomInfo.teamsState[teamId].retentionsLocked = false;
          });
          roomInfo.markModified('teamsState');
        }
        await roomInfo.save();
        const updatedRoom = await Room.findById(roomId).populate('players', 'name walletBalance').lean();
        io.to(roomId).emit('room-state', { room: updatedRoom, auctionState: null });
      } catch (err) {
        console.error(err);
      }
    });

    // pass-bid (Franchise Pass Broadcast)
    socket.on('pass-bid', ({ roomId, teamId }) => {
      io.to(roomId).emit('team-passed', { teamId });
    });

    // select-team (Franchise Claim)
    socket.on('select-team', async ({ roomId, userId, teamId }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room) return;

        room.teamsState = room.teamsState || {};

        // Server-side check 1: User already has a franchise in this room
        const userAlreadyClaimed = Object.values(room.teamsState).find(t => t.userId && t.userId.toString() === userId.toString());
        if (userAlreadyClaimed) {
          socket.emit('error-msg', { message: `You already own ${userAlreadyClaimed.teamId}. Release it first.` });
          return;
        }
        
        // Check if team is already claimed by another user
        const isClaimed = Object.values(room.teamsState).some(t => t.teamId === teamId && t.userId && t.userId.toString() !== userId);
        if (isClaimed) {
          socket.emit('error-msg', { message: 'Franchise already claimed by another player.' });
          return;
        }

        // Initialize or update teamState
        if (room.teamsState[teamId]) {
          room.teamsState[teamId].userId = userId;
          if (room.auctionType === 'mega') {
            room.teamsState[teamId].purse = room.startingPurse ? room.startingPurse * 10000000 : 1200000000;
            room.teamsState[teamId].squad = [];
            room.teamsState[teamId].retentions = [];
            room.teamsState[teamId].rtmCards = 0;
            room.teamsState[teamId].retentionsLocked = false;
          }
        } else {
          const initialPurse = room.startingPurse ? room.startingPurse * 10000000 : (room.auctionType === 'mega' ? 1200000000 : 800000000);
          const initialRtm = room.auctionType === 'mini' && room.rtmEnabled ? getRtmCardsCount(room.auctionYear, room.rtmEnabled, 0) : 0;
          room.teamsState[teamId] = {
            teamId,
            userId,
            purse: initialPurse,
            rtmCards: initialRtm,
            retentions: [],
            squad: [],
            retentionsLocked: false
          };
        }

        room.markModified('teamsState');
        await room.save();

        const updatedRoom = await Room.findById(roomId).populate('players', 'name walletBalance').lean();
        io.to(roomId).emit('room-state', { room: updatedRoom, auctionState: serializeAuctionState(auctionRooms[roomId]) });
      } catch (err) {
        console.error(err);
      }
    });

    // release-franchise (Release Claimed Franchise)
    socket.on('release-franchise', async ({ roomId, userId, teamId }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room) return;

        if (room.status !== 'waiting') {
          socket.emit('error-msg', { message: 'Cannot release franchise after auction has started.' });
          return;
        }

        room.teamsState = room.teamsState || {};
        if (room.teamsState[teamId]) {
          if (room.teamsState[teamId].userId && room.teamsState[teamId].userId.toString() === userId.toString()) {
            room.teamsState[teamId].userId = null;
            // Restore the default settings for the team's purse/squad/retentions.
            const initialPurse = room.startingPurse ? room.startingPurse * 10000000 : (room.auctionType === 'mega' ? 1200000000 : 800000000);
            const initialRtm = room.auctionType === 'mini' && room.rtmEnabled ? getRtmCardsCount(room.auctionYear, room.rtmEnabled, 0) : 0;
            room.teamsState[teamId].purse = initialPurse;
            room.teamsState[teamId].rtmCards = initialRtm;
            room.teamsState[teamId].retentions = [];
            room.teamsState[teamId].squad = [];
            room.teamsState[teamId].retentionsLocked = false;
          }
        }

        room.markModified('teamsState');
        await room.save();

        const updatedRoom = await Room.findById(roomId).populate('players', 'name walletBalance').lean();
        io.to(roomId).emit('room-state', { room: updatedRoom, auctionState: serializeAuctionState(auctionRooms[roomId]) });
      } catch (err) {
        console.error(err);
      }
    });

    socket.on('update-retentions', async ({ roomId, userId, teamId, retentions, locked }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room || !room.teamsState || !room.teamsState[teamId]) return;
        
        if (room.teamsState[teamId].userId !== userId) return;

        if (room.auctionType === 'mega') return;

        if (room.auctionYear === '2025' && room.auctionType === 'mini') return; // Locked for official IPL 2025 retentions

        let cappedCount = 0;
        let uncappedCount = 0;
        let totalCost = 0;

        const retentionObjects = [];

        retentions.forEach(p => {
          let cost = 0;
          if (p.isCapped) {
            cappedCount++;
            cost = getRetentionCost(room.auctionYear, cappedCount);
          } else {
            uncappedCount++;
            cost = 40000000; // 4CR flat
          }
          totalCost += cost;
          retentionObjects.push({
            name: p.name,
            role: p.role,
            nationality: p.nationality || 'Indian',
            isOverseas: p.isOverseas || false,
            price: cost
          });
        });

        const startingPurse = room.startingPurse ? room.startingPurse * 10000000 : (room.auctionType === 'mega' ? 1200000000 : 800000000);
        const remainingPurse = startingPurse - totalCost;
        const totalRetentionsCount = retentions.length;
        const remainingRtm = getRtmCardsCount(room.auctionYear, room.rtmEnabled, totalRetentionsCount);

        room.teamsState[teamId].retentions = retentions.map(p => p.name);
        room.teamsState[teamId].squad = retentionObjects;
        room.teamsState[teamId].purse = remainingPurse;
        room.teamsState[teamId].rtmCards = remainingRtm;
        if (locked !== undefined) {
          room.teamsState[teamId].retentionsLocked = Boolean(locked);
        }

        room.markModified('teamsState');
        await room.save();

        const updatedRoom = await Room.findById(roomId).populate('players', 'name walletBalance').lean();
        io.to(roomId).emit('room-state', { room: updatedRoom, auctionState: serializeAuctionState(auctionRooms[roomId]) });
      } catch (err) {
        console.error(err);
      }
    });

    // propose-trade
    socket.on('propose-trade', async ({ roomId, fromTeamId, toTeamId, offerPlayer, requestPlayer }) => {
      try {
        io.to(roomId).emit('trade-proposal', { fromTeamId, toTeamId, offerPlayer, requestPlayer });
      } catch (err) {
        console.error(err);
      }
    });

    // accept-trade
    socket.on('accept-trade', async ({ roomId, fromTeamId, toTeamId, offerPlayer, requestPlayer }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room) return;

        if (room.teamsState[fromTeamId] && room.teamsState[toTeamId]) {
          const offPl = room.teamsState[fromTeamId].squad.find(p => p.name === offerPlayer);
          const reqPl = room.teamsState[toTeamId].squad.find(p => p.name === requestPlayer);

          if (offPl && reqPl) {
            // Swap players
            room.teamsState[fromTeamId].squad = room.teamsState[fromTeamId].squad.filter(p => p.name !== offerPlayer);
            room.teamsState[fromTeamId].squad.push(reqPl);

            room.teamsState[toTeamId].squad = room.teamsState[toTeamId].squad.filter(p => p.name !== requestPlayer);
            room.teamsState[toTeamId].squad.push(offPl);

            room.markModified('teamsState');
            await room.save();

            const updatedRoom = await Room.findById(roomId).populate('players', 'name walletBalance').lean();
            io.to(roomId).emit('room-state', { room: updatedRoom, auctionState: serializeAuctionState(auctionRooms[roomId]) });
          }
        }
      } catch (err) {
        console.error(err);
      }
    });

    // start-auction
    socket.on('start-auction', async ({ roomId, userId, settings }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room || room.owner.toString() !== userId) return;
        
        if (settings) {
          if (settings.mysteryPlayersEnabled !== undefined) room.mysteryPlayersEnabled = settings.mysteryPlayersEnabled;
          if (settings.auctionOrderStyle !== undefined) room.auctionOrderStyle = settings.auctionOrderStyle;
          if (settings.manualPriorityPlayers !== undefined) room.manualPriorityPlayers = settings.manualPriorityPlayers;
          room.markModified('manualPriorityPlayers');
        }

        room.status = 'active';
        room.currentRound = room.auctionType === 'mega' ? 'marquee' : 'regular';
        
        const { getInitialTeamsState } = require('./retainedPlayers');
        if (!room.teamsState || Object.keys(room.teamsState).length === 0) {
          room.teamsState = getInitialTeamsState(
            room.auctionYear || '2025',
            room.startingPurse || 120,
            room.teamNames,
            room.auctionType  // 'mega'=scratch (clean slate), 'mini'=retention mode
          );
        } else if (room.auctionType === 'mega') {
          // Force clean slate for all teams in scratch mode when starting, preserving claimed user IDs
          const purseInRupees = (room.startingPurse || 120) * 10000000;
          Object.keys(room.teamsState).forEach(teamId => {
            room.teamsState[teamId].purse = purseInRupees;
            room.teamsState[teamId].squad = [];
            room.teamsState[teamId].retentions = [];
            room.teamsState[teamId].rtmCards = 0;
            room.teamsState[teamId].retentionsLocked = false;
          });
        }
        
        room.markModified('teamsState');
        await room.save();

        let draftPool = [];

        // 1. Gather all players in the pool
        if (room.playerCategory === 'custom' && room.customPlayersList && room.customPlayersList.length > 0) {
          draftPool = room.customPlayersList;
        } else {
          const year = room.auctionYear || '2025';
          let allPlayers;
          if (year === '2025' && room.auctionType === 'mini') {
            const dbPlayers = await Player.find({ poolSource: '2025' }).lean();
            const mongoose = require('mongoose');
            allPlayers = OFFICIAL_POOL_2025.map(officialPlayer => {
              const dbMatch = dbPlayers.find(p => p.name.toLowerCase() === officialPlayer.name.toLowerCase());
              if (dbMatch) {
                return {
                  ...dbMatch,
                  category: officialPlayer.category,
                  basePrice: officialPlayer.basePrice,
                  isOverseas: officialPlayer.isOverseas,
                  isCapped: officialPlayer.isCapped,
                  role: officialPlayer.role,
                  nationality: officialPlayer.nationality
                };
              }
              return {
                _id: new mongoose.Types.ObjectId(),
                stats: 'Runs: N/A, SR: N/A',
                imageUrl: '',
                ...officialPlayer
              };
            });
          } else {
            allPlayers = await Player.find({ poolSource: year }).lean();
          }

          // Filter by category
          if (room.playerCategory && room.playerCategory !== 'all') {
            const cat = room.playerCategory.toLowerCase();
            allPlayers = allPlayers.filter(p => {
              const role = p.role.toLowerCase();
              if (cat === 'batters') return role.includes('bat') || role.includes('wk');
              if (cat === 'bowlers') return role.includes('bowl') || role.includes('spin');
              if (cat === 'allrounders') return role.includes('all');
              if (cat === 'mixed') return true; // Mixed allows all
              return true;
            });

            if (cat === 'mixed') {
              // Take a shuffled subset of 30 players
              allPlayers = allPlayers.sort(() => 0.5 - Math.random()).slice(0, 30);
            }
          }
          draftPool = allPlayers;
        }

        // Apply custom base price if configured
        if (room.basePriceRule === 'custom' && room.customBasePrice) {
          draftPool = draftPool.map(p => {
            const copy = JSON.parse(JSON.stringify(p));
            copy.basePrice = room.customBasePrice;
            return copy;
          });
        }

        // Filter out retained players (RETENTION mode only)
        // In scratch (mega) mode: all players enter the auction pool untouched.
        // In mini/retention mode: remove players already retained by teams.
        if (room.auctionType !== 'mega') {
          const retainedPlayersList = [];
          Object.values(room.teamsState || {}).forEach(team => {
            if (team.squad && team.squad.length > 0) {
              team.squad.forEach(p => retainedPlayersList.push(p.name));
            }
          });
          draftPool = draftPool.filter(p => !retainedPlayersList.includes(p.name));
        }

        // --- NEW DYNAMIC SET-BASED RANDOMIZED ORDERING ---
        const sets = {
          marquee: [],
          batters: [],
          bowlers: [],
          allrounders: [],
          wk: [],
          uncapped: [],
          overseas: [],
          budget: []
        };

        draftPool.forEach(p => {
          const setName = getPlayerSet(p);
          sets[setName].push(p);
        });

        let seedVal = hashCode(room.code + '-' + Date.now());
        let rng = mulberry32(seedVal);
        let finalQueue = [];
        let first5PlayerNames = [];

        const maxRetries = 10;
        let retryCount = 0;

        while (retryCount < maxRetries) {
          rng = mulberry32(seedVal);
          
          const shuffledSets = {};
          Object.keys(sets).forEach(key => {
            shuffledSets[key] = seededShuffle(sets[key], rng);
          });

          let otherSetKeys = ['batters', 'bowlers', 'allrounders', 'wk', 'uncapped', 'overseas', 'budget'];
          if (room.auctionOrderStyle === 'set_based') {
            // Strict sequence
          } else {
            otherSetKeys = seededShuffle(otherSetKeys, rng);
          }

          const setSequence = ['marquee', ...otherSetKeys];
          const setPools = {};
          setSequence.forEach(key => {
            setPools[key] = [...shuffledSets[key]];
          });

          let tempQueue = [];
          let playersSinceLastWildcard = 0;
          let nextWildcardInterval = Math.floor(rng() * 3) + 8; // 8-10

          for (let s = 0; s < setSequence.length; s++) {
            const currentSetName = setSequence[s];
            const pool = setPools[currentSetName];
            while (pool.length > 0) {
              const player = pool.shift();
              tempQueue.push(player);
              playersSinceLastWildcard++;

              // Wildcard logic
              if (playersSinceLastWildcard >= nextWildcardInterval) {
                const futureSets = setSequence.slice(s + 1).filter(name => setPools[name] && setPools[name].length > 0);
                if (futureSets.length > 0) {
                  const randomFutureSetName = futureSets[Math.floor(rng() * futureSets.length)];
                  const wildcardPlayer = setPools[randomFutureSetName].shift();
                  if (wildcardPlayer) {
                    wildcardPlayer.isWildcard = true;
                    wildcardPlayer.wildcardFromSet = randomFutureSetName;
                    tempQueue.push(wildcardPlayer);
                  }
                }
                playersSinceLastWildcard = 0;
                nextWildcardInterval = Math.floor(rng() * 3) + 8;
              }
            }
          }

          // Apply manual priority
          if (room.auctionOrderStyle === 'manual_priority' && room.manualPriorityPlayers && room.manualPriorityPlayers.length > 0) {
            const priorityNames = room.manualPriorityPlayers;
            const priorityPlayers = [];
            const remainingPlayers = [];

            priorityNames.forEach(name => {
              const foundIdx = tempQueue.findIndex(p => p.name === name || p._id.toString() === name);
              if (foundIdx !== -1) {
                priorityPlayers.push(tempQueue[foundIdx]);
              }
            });

            tempQueue.forEach(p => {
              const isPriority = priorityNames.some(name => p.name === name || p._id.toString() === name);
              if (!isPriority) {
                remainingPlayers.push(p);
              }
            });

            tempQueue = [...priorityPlayers, ...remainingPlayers];
          }

          // Inject Mystery Players if enabled
          if (room.mysteryPlayersEnabled) {
            const mysteryQueue = [];
            for (let i = 0; i < tempQueue.length; i++) {
              if ((i + 1) % 15 === 0) {
                const realPlayer = tempQueue[i];
                const mysteryPlayer = {
                  _id: realPlayer._id,
                  name: "???",
                  role: "???",
                  imageUrl: "",
                  basePrice: realPlayer.basePrice,
                  category: realPlayer.category,
                  isOverseas: realPlayer.isOverseas,
                  isCapped: realPlayer.isCapped,
                  nationality: realPlayer.nationality,
                  isMystery: true,
                  revealed: false,
                  realPlayer: realPlayer
                };
                mysteryQueue.push(mysteryPlayer);
              } else {
                mysteryQueue.push(tempQueue[i]);
              }
            }
            tempQueue = mysteryQueue;
          }

          first5PlayerNames = tempQueue.slice(0, 5).map(p => p.name);
          const prevFirst5 = room.lastSessionFirstPlayers || [];
          const matchesPrev = prevFirst5.length > 0 && 
                              prevFirst5.every((val, idx) => val === first5PlayerNames[idx]);

          if (matchesPrev && retryCount < maxRetries - 1) {
            seedVal = hashCode(room.code + '-' + Date.now() + '-' + retryCount);
            retryCount++;
          } else {
            finalQueue = tempQueue;
            break;
          }
        }

        room.lastSessionFirstPlayers = first5PlayerNames;
        room.markModified('lastSessionFirstPlayers');
        await room.save();

        draftPool = finalQueue;

        // Initialize state
        auctionRooms[roomId] = {
          playersList: draftPool,
          currentIndex: 0,
          currentBid: 0,
          highestBidder: null,
          highestBidderTeam: null,
          timer: null,
          timeLeft: room.timePerBid || 15,
          timePerBid: room.timePerBid || 15,
          isPaused: false,

          unsoldPool: [],
          playersDraftedCount: 0,
          breakState: { active: false, type: 'leaderboard' },
          reAuctionRoundStarted: false,
          rtmState: {
            active: false,
            rtmTeamId: null,
            rtmUserId: null,
            highestBidderUserId: null,
            highestBidderTeamId: null,
            preRtmBid: 0,
            phase: 'idle',
            raisedBid: 0,
            timeLeft: 10
          }
        };

        nextPlayer(roomId);
        io.to(roomId).emit('room-state', { room: room ? room.toObject() : null, auctionState: serializeAuctionState(auctionRooms[roomId]) });
      } catch (err) {
        console.error(err);
      }
    });

    // place-bid (Open Auction Bidding)
    socket.on('place-bid', async ({ roomId, userId, teamId, amount }) => {
      const state = auctionRooms[roomId];
      if (!state || !state.playersList[state.currentIndex] || state.rtmState.active || state.isPaused) return;
      
      const currentPlayer = state.playersList[state.currentIndex];
      
      // Verification of Roster limits
      const room = await Room.findById(roomId);
      if (!room || !room.teamsState || !room.teamsState[teamId]) return;

      const teamData = room.teamsState[teamId];
      if (teamData.purse < amount) {
        socket.emit('error-msg', { message: 'Insufficient purse balance!' });
        return;
      }

      if (teamData.squad && teamData.squad.length >= (room.maxPlayersPerTeam || 25)) {
        socket.emit('error-msg', { message: 'Franchise squad roster is full!' });
        return;
      }

      if (currentPlayer.isOverseas && teamData.squad) {
        const overseasCount = teamData.squad.filter(p => p.isOverseas).length;
        if (overseasCount >= (room.maxOverseas || 8)) {
          socket.emit('error-msg', { message: 'Overseas player limit reached!' });
          return;
        }
      }

      state.currentBid = amount;
      state.highestBidder = userId;
      state.highestBidderTeam = teamId;
      state.timeLeft = state.timePerBid; // Reset bid timer to full window

      io.to(roomId).emit('auction-update', {
        currentPlayer,
        currentBid: state.currentBid,
        highestBidder: state.highestBidder,
        highestBidderTeam: state.highestBidderTeam,
        timeLeft: state.timeLeft,
        rtmState: state.rtmState,

        isPaused: false
      });
    });

    // Host Controls: Pause Timer
    socket.on('pause-auction', ({ roomId }) => {
      const state = auctionRooms[roomId];
      if (!state) return;
      state.isPaused = true;
      if (state.timer) clearInterval(state.timer);
      io.to(roomId).emit('auction-paused', { timeLeft: state.timeLeft, rtmState: state.rtmState });
    });

    // Host Controls: Resume Timer
    socket.on('resume-auction', ({ roomId }) => {
      const state = auctionRooms[roomId];
      if (!state || !state.isPaused) return;
      state.isPaused = false;
      if (state.rtmState.active) {
        startRtmTimer(roomId);
      } else {
        startDraftTimer(roomId);
      }
      io.to(roomId).emit('auction-resumed', { timeLeft: state.timeLeft, rtmState: state.rtmState });
    });

    // Host Controls: Skip Player
    socket.on('skip-player', async ({ roomId }) => {
      const state = auctionRooms[roomId];
      if (!state) return;
      if (state.timer) clearInterval(state.timer);

      const player = state.playersList[state.currentIndex];
      state.unsoldPool = state.unsoldPool || [];
      state.unsoldPool.push(player);

      io.to(roomId).emit('player-sold', {
        player,
        buyerId: null,
        buyerTeamId: null,
        price: 0
      });

      state.playersDraftedCount += 1;
      state.currentIndex += 1;
      
      handleNextStepOrBreak(roomId);
    });

    // Host Controls: Re-auction active player
    socket.on('re-auction-player', ({ roomId }) => {
      const state = auctionRooms[roomId];
      if (!state) return;
      
      state.currentBid = 0;
      state.highestBidder = null;
      state.highestBidderTeam = null;

      state.timeLeft = state.timePerBid;
      state.rtmState.active = false;
      
      io.to(roomId).emit('auction-update', {
        currentPlayer: state.playersList[state.currentIndex],
        currentBid: state.currentBid,
        highestBidder: state.highestBidder,
        highestBidderTeam: state.highestBidderTeam,
        timeLeft: state.timeLeft,
        rtmState: state.rtmState,

        isPaused: state.isPaused
      });

      if (!state.isPaused) {
        startDraftTimer(roomId);
      }
    });

    // Host Controls: Recall Unsold Player
    socket.on('recall-player', ({ roomId, playerName }) => {
      const state = auctionRooms[roomId];
      if (!state) return;

      state.unsoldPool = state.unsoldPool || [];
      const recalledPlayerIndex = state.unsoldPool.findIndex(p => p.name === playerName);
      if (recalledPlayerIndex === -1) return;

      const [recalledPlayer] = state.unsoldPool.splice(recalledPlayerIndex, 1);

      // Insert as next player
      state.playersList.splice(state.currentIndex, 0, recalledPlayer);

      state.currentBid = 0;
      state.highestBidder = null;
      state.highestBidderTeam = null;

      state.timeLeft = state.timePerBid;
      state.rtmState.active = false;

      io.to(roomId).emit('auction-update', {
        currentPlayer: recalledPlayer,
        currentBid: 0,
        highestBidder: null,
        highestBidderTeam: null,
        timeLeft: state.timeLeft,
        rtmState: state.rtmState,

        isPaused: state.isPaused
      });

      if (!state.isPaused) {
        startDraftTimer(roomId);
      }
    });

    // Host Controls: End Mid-Auction Break
    socket.on('end-break', ({ roomId }) => {
      const state = auctionRooms[roomId];
      if (!state) return;

      state.breakState = { active: false, type: 'leaderboard' };
      nextPlayer(roomId);
    });

    // Host Controls: Force Next Player
    socket.on('next-player', async ({ roomId }) => {
      const state = auctionRooms[roomId];
      if (!state) return;
      if (state.timer) clearInterval(state.timer);

      nextPlayer(roomId);
    });

    // RTM Decisions
    socket.on('rtm-decision', async ({ roomId, teamId, useRtm }) => {
      const state = auctionRooms[roomId];
      if (!state || !state.rtmState.active || state.rtmState.phase !== 'decision') return;

      const room = await Room.findById(roomId);

      if (useRtm) {
        state.rtmState.phase = 'counter';
        state.rtmState.timeLeft = 8;
        io.to(roomId).emit('rtm-update', { rtmState: state.rtmState });
        startRtmTimer(roomId);
      } else {
        await finalizeSale(roomId);
      }
    });

    // place-counter-bid (8s window raise)
    socket.on('place-counter-bid', async ({ roomId, teamId, amount }) => {
      const state = auctionRooms[roomId];
      if (!state || !state.rtmState.active || state.rtmState.phase !== 'counter') return;

      if (teamId !== state.rtmState.highestBidderTeamId) return;

      const room = await Room.findById(roomId);
      if (!room || !room.teamsState || !room.teamsState[teamId]) return;

      if (room.teamsState[teamId].purse < amount) return;
      if (amount <= state.rtmState.preRtmBid) return;

      state.rtmState.raisedBid = amount;
      state.rtmState.phase = 'final-match';
      state.rtmState.timeLeft = 10; 

      io.to(roomId).emit('rtm-update', { rtmState: state.rtmState });
      startRtmTimer(roomId);
    });

    // pass-counter-bid (Highest bidder decides not to raise)
    socket.on('pass-counter-bid', async ({ roomId, teamId }) => {
      const state = auctionRooms[roomId];
      if (!state || !state.rtmState.active || state.rtmState.phase !== 'counter') return;

      state.rtmState.raisedBid = state.rtmState.preRtmBid;
      await matchRtm(roomId, true);
    });

    // final-match-rtm (RTM team matches the raised counter-bid)
    socket.on('final-match-rtm', async ({ roomId, teamId, match }) => {
      const state = auctionRooms[roomId];
      if (!state || !state.rtmState.active || state.rtmState.phase !== 'final-match') return;

      await matchRtm(roomId, match);
    });

    // start-reauction-round
    socket.on('start-reauction-round', async ({ roomId }) => {
      try {
        const state = auctionRooms[roomId];
        if (!state || state.reAuctionRoundStarted) return;
        
        // Prepare unsold players for re-auction at reduced prices (50% discount)
        const reAuctionPlayers = state.unsoldPool.map(player => {
          const copy = JSON.parse(JSON.stringify(player));
          if (copy.isMystery) {
            delete copy.isMystery;
            delete copy.revealed;
            delete copy.realPlayer;
          }
          copy.basePrice = Math.max(2000000, Math.floor(copy.basePrice / 2));
          copy.category = `Re-Auction: ${copy.category || 'Player'}`;
          return copy;
        });

        // 1. Seeded shuffle first to break original sequence patterns
        let shuffledUnsold = seededShuffle(reAuctionPlayers, mulberry32(hashCode(roomId + '-' + Date.now())));
        
        // 2. Soft sort by base price with random offset factor (between 0.8 and 1.2)
        shuffledUnsold.sort((a, b) => {
          const scoreA = a.basePrice * (0.8 + Math.random() * 0.4);
          const scoreB = b.basePrice * (0.8 + Math.random() * 0.4);
          return scoreB - scoreA; // Descending order (higher price first)
        });

        state.unsoldPool = [];
        state.playersList = shuffledUnsold;
        state.currentIndex = 0;
        state.reAuctionRoundStarted = true;
        state.isPaused = false;
        state.timePerBid = 5; // Rapid fire: 5 seconds per player
        
        io.to(roomId).emit('reauction-round-started', {
          playersCount: shuffledUnsold.length
        });

        io.to(roomId).emit('ticker-announcement', { 
          message: `⚡ RAPID FIRE BEGINS! ${shuffledUnsold.length} UNSOLD PLAYERS GET ANOTHER CHANCE AT REDUCED BASE PRICES!`, 
          type: 'announcement' 
        });
        
        nextPlayer(roomId);
      } catch (err) {
        console.error(err);
      }
    });

    // force-end-auction
    socket.on('force-end-auction', async ({ roomId }) => {
      try {
        await endAuction(roomId);
      } catch (err) {
        console.error(err);
      }
    });

    // --- Helper functions ---

    const nextPlayer = async (roomId) => {
      const state = auctionRooms[roomId];
      if (!state) return;

      if (state.currentIndex >= state.playersList.length) {
        if (state.unsoldPool && state.unsoldPool.length > 0 && !state.reAuctionRoundStarted) {
          if (state.timer) clearInterval(state.timer);
          state.isPaused = true;
          io.to(roomId).emit('prompt-reauction-round', {
            unsoldPlayerCount: state.unsoldPool.length
          });
          return;
        }
        return endAuction(roomId);
      }

      const player = state.playersList[state.currentIndex];
      state.currentBid = 0;
      state.highestBidder = null;
      state.highestBidderTeam = null;

      state.timeLeft = state.timePerBid;
      state.rtmState = {
        active: false,
        rtmTeamId: null,
        rtmUserId: null,
        highestBidderUserId: null,
        highestBidderTeamId: null,
        preRtmBid: 0,
        phase: 'idle',
        raisedBid: 0,
        timeLeft: 10
      };

      if (player.isMystery && !player.revealed) {
        state.mysteryRevealCountdown = 5;
      } else {
        state.mysteryRevealCountdown = undefined;
      }

      // --- SET TRANSITION ANNOUNCEMENTS & UPDATE ROOM CURRENTROUND ---
      try {
        const prevPlayer = state.currentIndex > 0 ? state.playersList[state.currentIndex - 1] : null;
        const getFriendlySetName = (p) => {
          if (!p) return null;
          const s = getPlayerSet(p.isMystery && p.realPlayer ? p.realPlayer : p);
          const mapping = {
            marquee: "Marquee",
            batters: "Batters",
            bowlers: "Bowlers",
            allrounders: "All-Rounders",
            wk: "Wicket-Keepers",
            uncapped: "Uncapped Indians",
            overseas: "Overseas Players",
            budget: "Rapid Fire"
          };
          return mapping[s] || "Regular";
        };

        const currentFriendlySet = getFriendlySetName(player);
        const prevFriendlySet = getFriendlySetName(prevPlayer);

        if (currentFriendlySet && currentFriendlySet !== prevFriendlySet) {
          let msg = '';
          if (!prevPlayer) {
            const count = state.playersList.filter(p => getFriendlySetName(p) === currentFriendlySet).length;
            msg = `🎙️ THE ${currentFriendlySet.toUpperCase()} SET BEGINS! ${count} TOP PLAYERS ENTER THE AUCTION POOL!`;
          } else {
            if (player.isWildcard) {
              msg = `🎙️ SURPRISE! WE'RE JUMPING AHEAD TO THE ${currentFriendlySet.toUpperCase()} SET EARLY!`;
            } else {
              msg = `🎙️ THE ${prevFriendlySet.toUpperCase()} SET IS COMPLETE! NOW ENTERING THE ${currentFriendlySet.toUpperCase()} SET!`;
            }
          }
          
          const room = await Room.findById(roomId);
          if (room) {
            room.currentRound = currentFriendlySet;
            await room.save();
            io.to(roomId).emit('room-state', { room: room.toObject(), auctionState: serializeAuctionState(state) });
          }

          io.to(roomId).emit('ticker-announcement', { message: msg, type: 'announcement' });
        }

        if (player.isWildcard) {
          io.to(roomId).emit('ticker-announcement', { 
            message: `⚡ SURPRISE WILDCARD PICK! ${player.name} enters the auction early!`, 
            type: 'wildcard' 
          });
        }

        if (player.isMystery && !player.revealed) {
          io.to(roomId).emit('ticker-announcement', { 
            message: `🎭 A MYSTERY PLAYER ENTERS THE AUCTION! Who could it be?`, 
            type: 'mystery' 
          });
        }
      } catch (err) {
        console.error('Error handling set transitions:', err);
      }

      io.to(roomId).emit('auction-update', {
        currentPlayer: player,
        currentBid: state.currentBid,
        highestBidder: state.highestBidder,
        highestBidderTeam: state.highestBidderTeam,
        timeLeft: state.timeLeft,
        rtmState: state.rtmState,
        breakState: state.breakState,

        isPaused: state.isPaused,
        currentIndex: state.currentIndex,
        mysteryRevealTimeLeft: state.mysteryRevealCountdown
      });

      if (!state.isPaused) {
        startDraftTimer(roomId);
      }
    };

    const startDraftTimer = (roomId) => {
      const state = auctionRooms[roomId];
      if (!state) return;

      if (state.timer) clearInterval(state.timer);

      state.timer = setInterval(async () => {
        state.timeLeft -= 1;
        
        let mysteryRevealTimeLeft = undefined;
        if (state.mysteryRevealCountdown !== undefined && state.mysteryRevealCountdown > 0) {
          state.mysteryRevealCountdown -= 1;
          mysteryRevealTimeLeft = state.mysteryRevealCountdown;
          
          if (state.mysteryRevealCountdown === 0) {
            // Reveal!
            const player = state.playersList[state.currentIndex];
            if (player && player.isMystery && !player.revealed) {
              player.revealed = true;
              
              const realPlayerObj = {
                ...player.realPlayer,
                isMystery: true,
                revealed: true
              };
              
              state.playersList[state.currentIndex] = realPlayerObj;
              
              io.to(roomId).emit('mystery-revealed', { player: realPlayerObj });
              const room = await Room.findById(roomId);
              io.to(roomId).emit('room-state', { room: room ? room.toObject() : null, auctionState: serializeAuctionState(state) });
            }
          }
        }

        io.to(roomId).emit('timer-update', { 
          timeLeft: state.timeLeft,
          mysteryRevealTimeLeft: mysteryRevealTimeLeft
        });

        if (state.timeLeft <= 0) {
          clearInterval(state.timer);
          await processBidExpiry(roomId);
        }
      }, 1000);
    };

    const processBidExpiry = async (roomId) => {
      const state = auctionRooms[roomId];
      if (!state) return;

      const player = state.playersList[state.currentIndex];
      const room = await Room.findById(roomId);



      if (state.highestBidder) {
        // RTM Check
        const rtmTeamId = player.team;
        const rtmTeamData = room.teamsState ? room.teamsState[rtmTeamId] : null;

        if (
          room.auctionType === 'mini' &&
          room.rtmEnabled &&
          rtmTeamData &&
          rtmTeamData.rtmCards > 0 &&
          rtmTeamData.teamId !== state.highestBidderTeam
        ) {
          state.rtmState = {
            active: true,
            rtmTeamId,
            rtmUserId: rtmTeamData.userId,
            highestBidderUserId: state.highestBidder,
            highestBidderTeamId: state.highestBidderTeam,
            preRtmBid: state.currentBid,
            phase: 'decision',
            raisedBid: 0,
            timeLeft: 10
          };

          io.to(roomId).emit('rtm-triggered', { rtmState: state.rtmState });
          startRtmTimer(roomId);
        } else {
          await finalizeSale(roomId);
        }
      } else {
        // Unsold
        state.unsoldPool = state.unsoldPool || [];
        state.unsoldPool.push(player);

        io.to(roomId).emit('player-sold', {
          player,
          buyerId: null,
          buyerTeamId: null,
          price: 0
        });

        state.playersDraftedCount += 1;
        state.currentIndex += 1;
        
        setTimeout(() => handleNextStepOrBreak(roomId), 2000); // 2s for unsold
      }
    };

    const startRtmTimer = (roomId) => {
      const state = auctionRooms[roomId];
      if (!state) return;

      if (state.timer) clearInterval(state.timer);

      state.timer = setInterval(async () => {
        state.rtmState.timeLeft -= 1;
        io.to(roomId).emit('rtm-update', { rtmState: state.rtmState });

        if (state.rtmState.timeLeft <= 0) {
          clearInterval(state.timer);
          
          if (state.rtmState.phase === 'decision') {
            await finalizeSale(roomId);
          } else if (state.rtmState.phase === 'counter') {
            state.rtmState.raisedBid = state.rtmState.preRtmBid;
            await matchRtm(roomId, true);
          } else if (state.rtmState.phase === 'final-match') {
            await matchRtm(roomId, false);
          }
        }
      }, 1000);
    };

    const matchRtm = async (roomId, isMatched) => {
      const state = auctionRooms[roomId];
      if (!state) return;

      const room = await Room.findById(roomId);
      const player = state.playersList[state.currentIndex];

      if (isMatched) {
        const rtmTeamId = state.rtmState.rtmTeamId;
        const finalPrice = state.rtmState.raisedBid || state.rtmState.preRtmBid;

        room.teamsState[rtmTeamId].purse -= finalPrice;
        room.teamsState[rtmTeamId].squad.push({
          name: player.name,
          role: player.role,
          nationality: player.nationality,
          isOverseas: player.isOverseas,
          price: finalPrice
        });
        room.teamsState[rtmTeamId].rtmCards -= 1;
        room.markModified('teamsState');
        await room.save();

        io.to(roomId).emit('player-sold', {
          player,
          buyerId: room.teamsState[rtmTeamId].userId,
          buyerTeamId: rtmTeamId,
          price: finalPrice,
          rtmUsed: true
        });
      } else {
        const highestTeamId = state.rtmState.highestBidderTeamId;
        const finalPrice = state.rtmState.raisedBid || state.rtmState.preRtmBid;

        room.teamsState[highestTeamId].purse -= finalPrice;
        room.teamsState[highestTeamId].squad.push({
          name: player.name,
          role: player.role,
          nationality: player.nationality,
          isOverseas: player.isOverseas,
          price: finalPrice
        });
        room.markModified('teamsState');
        await room.save();

        io.to(roomId).emit('player-sold', {
          player,
          buyerId: state.rtmState.highestBidderUserId,
          buyerTeamId: highestTeamId,
          price: finalPrice,
          rtmUsed: false
        });
      }

      // Broadcast updated room state so all clients see live squad/purse changes
      io.to(roomId).emit('room-state', { room: room.toObject(), auctionState: serializeAuctionState(state) });

      state.playersDraftedCount += 1;
      state.currentIndex += 1;
      
      setTimeout(() => handleNextStepOrBreak(roomId), 3000); // 3s for sold
    };

    const finalizeSale = async (roomId) => {
      const state = auctionRooms[roomId];
      if (!state) return;

      const room = await Room.findById(roomId);
      const player = state.playersList[state.currentIndex];
      const buyerTeamId = state.highestBidderTeam;
      const finalPrice = state.currentBid;

      room.teamsState[buyerTeamId].purse -= finalPrice;
      room.teamsState[buyerTeamId].squad.push({
        name: player.name,
        role: player.role,
        nationality: player.nationality,
        isOverseas: player.isOverseas,
        price: finalPrice
      });
      room.markModified('teamsState');
      await room.save();

      io.to(roomId).emit('player-sold', {
        player,
        buyerId: state.highestBidder,
        buyerTeamId,
        price: finalPrice,
        rtmUsed: false
      });

      // Broadcast updated room so all clients refresh squad/purse immediately
      io.to(roomId).emit('room-state', { room: room.toObject(), auctionState: serializeAuctionState(state) });

      state.playersDraftedCount += 1;
      state.currentIndex += 1;
      
      setTimeout(() => handleNextStepOrBreak(roomId), 3000); // 3s for sold
    };

    const handleNextStepOrBreak = async (roomId) => {
      const state = auctionRooms[roomId];
      if (!state) return;

      const room = await Room.findById(roomId);
      const updatedRoom = await Room.findById(roomId).populate('players', 'name walletBalance').lean();

      if (state.currentIndex >= state.playersList.length) {
        if (state.unsoldPool && state.unsoldPool.length > 0 && !state.reAuctionRoundStarted) {
          if (state.timer) clearInterval(state.timer);
          state.isPaused = true;
          io.to(roomId).emit('prompt-reauction-round', {
            unsoldPlayerCount: state.unsoldPool.length
          });
          return;
        }
        return endAuction(roomId);
      }

      // Check if 20 players break is hit
      if (state.playersDraftedCount % 20 === 0 && state.playersDraftedCount > 0) {
        state.breakState = {
          active: true,
          type: 'leaderboard',
          setName: state.playersList[state.currentIndex - 1]?.category || 'Current set'
        };

        io.to(roomId).emit('mid-auction-break', {
          room: updatedRoom,
          auctionState: serializeAuctionState(state)
        });
      } else {
        nextPlayer(roomId);
      }
    };

    const endAuction = async (roomId) => {
      const room = await Room.findById(roomId);
      const state = auctionRooms[roomId];

      // Auto-fill squads that have less than 11 players from unsold pool (especially for Mode 1 - Build from Scratch)
      if (state && state.unsoldPool && state.unsoldPool.length > 0) {
        const teams = Object.values(room.teamsState || {});
        for (const team of teams) {
          if (!team.squad) team.squad = [];
          
          let currentCount = team.squad.length;
          if (currentCount < 11) {
            let needed = 11 - currentCount;
            while (needed > 0 && state.unsoldPool.length > 0) {
              // Try to find a player satisfying missing roles: WK, BAT, BOWL, AR
              let selectedIndex = 0;
              let wkCount = 0;
              let batCount = 0;
              let bowlCount = 0;
              let arCount = 0;
              
              team.squad.forEach(p => {
                const r = (p.role || '').toLowerCase();
                if (r.includes('wk') || r.includes('keeper')) wkCount++;
                else if (r.includes('all-rounder') || r.includes('all rounder') || r.includes('all-round') || r.includes('allround')) arCount++;
                else if (r.includes('bowl') || r.includes('spin') || r.includes('fast')) bowlCount++;
                else if (r.includes('bat') || r.includes('field')) batCount++;
              });
              
              const needsWk = wkCount < 1;
              const needsBat = batCount < 3;
              const needsBowl = bowlCount < 3;
              const needsAr = arCount < 1;
              
              let foundMatch = false;
              for (let i = 0; i < state.unsoldPool.length; i++) {
                const p = state.unsoldPool[i];
                const r = (p.role || '').toLowerCase();
                
                // Honor overseas player limit
                const isOverseas = p.isOverseas || false;
                const overseasCount = team.squad.filter(sp => sp.isOverseas).length;
                if (isOverseas && overseasCount >= (room.maxOverseas || 8)) {
                  continue;
                }
                
                if (needsWk && (r.includes('wk') || r.includes('keeper'))) {
                  selectedIndex = i;
                  foundMatch = true;
                  break;
                }
                if (needsAr && (r.includes('all-rounder') || r.includes('all rounder') || r.includes('all-round') || r.includes('allround'))) {
                  selectedIndex = i;
                  foundMatch = true;
                  break;
                }
                if (needsBowl && (r.includes('bowl') || r.includes('spin') || r.includes('fast'))) {
                  selectedIndex = i;
                  foundMatch = true;
                  break;
                }
                if (needsBat && (r.includes('bat') || r.includes('field'))) {
                  selectedIndex = i;
                  foundMatch = true;
                  break;
                }
              }
              
              if (!foundMatch) {
                // Look for any player that doesn't violate overseas limit
                for (let i = 0; i < state.unsoldPool.length; i++) {
                  const p = state.unsoldPool[i];
                  const isOverseas = p.isOverseas || false;
                  const overseasCount = team.squad.filter(sp => sp.isOverseas).length;
                  if (isOverseas && overseasCount >= (room.maxOverseas || 8)) {
                    continue;
                  }
                  selectedIndex = i;
                  foundMatch = true;
                  break;
                }
              }
              
              if (!foundMatch && state.unsoldPool.length > 0) {
                selectedIndex = 0;
              }
              
              const [selectedPlayer] = state.unsoldPool.splice(selectedIndex, 1);
              team.squad.push({
                name: selectedPlayer.name,
                role: selectedPlayer.role,
                nationality: selectedPlayer.nationality || 'Indian',
                isOverseas: selectedPlayer.isOverseas || false,
                price: selectedPlayer.basePrice || 2000000
              });
              team.purse -= (selectedPlayer.basePrice || 2000000);
              needed--;
            }
          }
        }
        room.markModified('teamsState');
        await room.save();
      }

      room.status = 'completed';
      await room.save();

      // Clean up in-memory state but send final report details first
      const teams = Object.values(room.teamsState || {});
      const allDrafted = [];
      teams.forEach(t => {
        if (t.squad) allDrafted.push(...t.squad);
      });

      // Stats
      allDrafted.sort((a, b) => b.price - a.price);
      const biggestBuy = allDrafted[0] || null;
      
      // Best bargain: lowest price for a capped player
      const cappedDrafted = allDrafted.filter(p => p.price > 0 && !p.name.includes("Uncapped"));
      cappedDrafted.sort((a, b) => a.price - b.price);
      const bestBargain = cappedDrafted[0] || null;

      // Calculate Most Balanced Squad
      let mostBalanced = null;
      let highestBalanceScore = -1;
      
      teams.forEach(team => {
        let wkCount = 0;
        let batCount = 0;
        let bowlCount = 0;
        let arCount = 0;
        
        if (team.squad) {
          team.squad.forEach(p => {
            const r = (p.role || '').toLowerCase();
            if (r.includes('wk') || r.includes('keeper')) wkCount++;
            else if (r.includes('all-rounder') || r.includes('all rounder') || r.includes('all-round') || r.includes('allround')) arCount++;
            else if (r.includes('bowl') || r.includes('spin') || r.includes('fast')) bowlCount++;
            else if (r.includes('bat') || r.includes('field')) batCount++;
          });
        }
        
        // Simple balance score calculation
        let score = 0;
        if (wkCount >= 1) score += 20;
        if (batCount >= 3) score += 20;
        if (bowlCount >= 3) score += 20;
        if (arCount >= 1) score += 20;
        
        score += Math.min(3, wkCount) * 2;
        score += Math.min(6, batCount) * 2;
        score += Math.min(6, bowlCount) * 2;
        score += Math.min(5, arCount) * 2;
        
        if (score > highestBalanceScore) {
          highestBalanceScore = score;
          mostBalanced = {
            teamId: team.teamId,
            score: score,
            squadSize: team.squad?.length || 0
          };
        }
      });

      // Remaining purse rankings
      const sortedTeamsByPurse = [...teams].sort((a, b) => b.purse - a.purse);
      const richTeam = sortedTeamsByPurse[0] || null;
      const purseRankings = sortedTeamsByPurse.map(t => ({
        teamId: t.teamId,
        purse: t.purse,
        squadSize: t.squad?.length || 0
      }));

      io.to(roomId).emit('auction-completed', {
        room: room ? room.toObject() : null,
        summary: {
          biggestBuy,
          bestBargain,
          richTeam,
          mostBalanced,
          purseRankings
        }
      });
      
      delete auctionRooms[roomId];
    };
  });
};
