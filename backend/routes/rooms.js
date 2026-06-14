const express = require('express');
const Room = require('../models/Room');
const jwt = require('jsonwebtoken');

const router = express.Router();

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
      timePerBid
    } = req.body;
    
    let roomCode = code || Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Ensure uniqueness
    let existingRoom = await Room.findOne({ code: roomCode });
    if (existingRoom && code) {
      // If code was explicitly sent and exists, append a random char or generate a new one
      roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    }
    
    const purseInRupees = (startingPurse !== undefined ? Number(startingPurse) : 100) * 10000000;
    const teamsState = {};
    if (franchise) {
      teamsState[franchise] = {
        teamId: franchise,
        userId: req.user.userId,
        purse: purseInRupees,
        rtmCards: auctionType === 'mega' ? 6 : 0,
        retentions: [],
        squad: []
      };
    }

    const room = new Room({
      code: roomCode,
      type: type || 'public',
      owner: req.user.userId,
      players: [req.user.userId],
      auctionType: auctionType || 'mini',
      franchise: franchise || '',
      poolSource: poolSource || 'default',
      playersPerTeam: playersPerTeam !== undefined ? Number(playersPerTeam) : 20,
      startingPurse: startingPurse !== undefined ? Number(startingPurse) : 100,
      maxOverseas: maxOverseas !== undefined ? Number(maxOverseas) : 4,
      bidIncrement: bidIncrement !== undefined ? Number(bidIncrement) : 1000000,
      rtmEnabled: rtmEnabled !== undefined ? Boolean(rtmEnabled) : true,
      timePerBid: timePerBid !== undefined ? Number(timePerBid) : 30,
      teamsState
    });
    
    await room.save();
    res.status(201).json(room);
  } catch (error) {
    console.error('Room creation error:', error);
    res.status(500).json({ error: 'Server error', details: error.stack || error.message });
  }
});

// List public rooms
router.get('/', async (req, res) => {
  try {
    const rooms = await Room.find({ type: 'public', status: 'waiting' }).populate('owner', 'name');
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
    
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.status !== 'waiting') return res.status(400).json({ error: 'Room is already active or completed' });
    if (room.players.length >= room.maxPlayers) return res.status(400).json({ error: 'Room is full' });
    
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
