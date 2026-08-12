const express = require('express');
const Room = require('../models/Room');
const jwt = require('jsonwebtoken');

const router = express.Router();

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

async function generateUniqueRoomCode() {
  let code;
  let exists = true;
  while (exists) {
    code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const room = await Room.findOne({ code });
    if (!room) {
      exists = false;
    }
  }
  return code;
}

// Middleware to protect routes
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token, authorization denied' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token is not valid' });
  }
};

// Create a room
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      type,
      code,
      auctionType,
      franchise,
      poolSource,
      playersPerTeam,
      startingPurse,
      maxOverseas,
      bidIncrement,
      rtmEnabled,
      timePerBid,
      auctionYear,
      numTeams,
      teamNames,
      basePriceRule,
      customBasePrice,
      playerCategory,
      customPlayersList,
      maxPlayersPerTeam,
      mysteryPlayersEnabled,
      auctionOrderStyle,
      manualPriorityPlayers
    } = req.body;
    
    let roomCode = code ? code.toUpperCase() : await generateUniqueRoomCode();
    
    // Ensure uniqueness for explicit code
    if (code) {
      const existingRoom = await Room.findOne({ code: roomCode });
      if (existingRoom) {
        roomCode = await generateUniqueRoomCode();
      }
    }
    
    const { getInitialTeamsState, retainedPlayersData2025 } = require('../retainedPlayers');
    const teamsState = getInitialTeamsState(
      auctionYear || '2025',
      startingPurse !== undefined ? Number(startingPurse) : 120,
      teamNames,
      auctionType  // 'mega' = scratch (no retentions), 'mini' = retention mode
    );
    if (franchise && teamsState[franchise]) {
      teamsState[franchise].userId = req.user.userId;

      // Handle custom host retentions configured in setup wizard (skip for official 2025 mini mode)
      if (req.body.hostRetentions && Array.isArray(req.body.hostRetentions) && !(auctionYear === '2025' && auctionType === 'mini')) {
        const defaultRetained = retainedPlayersData2025[franchise] || [];
        const selectedPlayers = defaultRetained.filter(p => req.body.hostRetentions.includes(p.name));

        teamsState[franchise].squad = selectedPlayers.map(p => ({ ...p, isRetained: true }));
        teamsState[franchise].retentions = selectedPlayers.map(p => p.name);

        const spent = selectedPlayers.reduce((sum, p) => sum + p.price, 0);
        const purseInRupees = (startingPurse !== undefined ? Number(startingPurse) : 120) * 10000000;
        teamsState[franchise].purse = Math.max(0, purseInRupees - spent);

        // Calculate custom RTM count based on selected retentions length
        teamsState[franchise].rtmCards = getRtmCardsCount(
          auctionYear || '2025',
          rtmEnabled !== undefined ? Boolean(rtmEnabled) : true,
          selectedPlayers.length
        );
      }
    }

    // Validate owner exists
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Must be logged in to create a room' });
    }

    const room = new Room({
      code: roomCode,
      type: type || 'public',
      owner: req.user.userId,
      players: [req.user.userId],
      maxPlayers: numTeams !== undefined ? Number(numTeams) : 10,
      auctionType: auctionType || 'mini',
      franchise: franchise || '',
      poolSource: poolSource || '2025',
      playersPerTeam: playersPerTeam !== undefined ? Number(playersPerTeam) : 25,
      startingPurse: startingPurse !== undefined ? Number(startingPurse) : 120,
      maxOverseas: maxOverseas !== undefined ? Number(maxOverseas) : 8,
      bidIncrement: bidIncrement !== undefined ? Number(bidIncrement) : 1000000,
      rtmEnabled: rtmEnabled !== undefined ? Boolean(rtmEnabled) : true,
      timePerBid: timePerBid !== undefined ? Number(timePerBid) : 15,
      auctionYear: auctionYear || '2025',
      numTeams: numTeams !== undefined ? Number(numTeams) : 10,
      teamNames: teamNames || [],
      biddingStyle: 'open',
      basePriceRule: basePriceRule || 'real',
      customBasePrice: customBasePrice !== undefined ? Number(customBasePrice) : 20000000,
      playerCategory: playerCategory || 'all',
      customPlayersList: customPlayersList || [],
      maxPlayersPerTeam: maxPlayersPerTeam !== undefined ? Number(maxPlayersPerTeam) : 25,
      mysteryPlayersEnabled: mysteryPlayersEnabled !== undefined ? Boolean(mysteryPlayersEnabled) : true,
      auctionOrderStyle: auctionOrderStyle || 'auto_shuffle',
      manualPriorityPlayers: manualPriorityPlayers || [],
      teamsState,
      createdAt: new Date()
    });
    
    await room.save();
    res.status(201).json(room);
  } catch (error) {
    console.error('Room creation error:', error);
    res.status(500).json({ error: 'Server error', details: error.stack || error.message });
  }
});

// List public rooms — only show rooms created within the last 24 hours
router.get('/', async (req, res) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const rooms = await Room.find({
      type: 'public',
      status: 'waiting',
      createdAt: { $gte: twentyFourHoursAgo }
    })
      .populate('owner', 'name')
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get room by code
router.get('/:code', authMiddleware, async (req, res) => {
  try {
    const room = await Room.findOne({ code: req.params.code }).populate('players', 'name walletBalance').populate('owner', 'name');
    if (!room) return res.status(404).json({ error: 'Room not found' });
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Join a room
router.post('/join', authMiddleware, async (req, res) => {
  try {
    const { code } = req.body;
    const room = await Room.findOne({ code });
    
    if (!room) return res.status(404).json({ error: 'Invalid Arena Code. Please check and try again.' });
    if (room.status !== 'waiting') return res.status(400).json({ error: 'This auction has already started. Ask the host for a new code.' });
    if (room.players.length >= room.maxPlayers) return res.status(400).json({ error: `This room has reached maximum franchises (${room.players.length}/${room.maxPlayers}).` });
    
    if (!room.players.includes(req.user.userId)) {
      room.players.push(req.user.userId);
      await room.save();
    }
    
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
