const express = require('express');
const Player = require('../models/Player');
const mockPlayers2025 = require('./mockPlayers2025');

const router = express.Router();

// Fetch all players
router.get('/', async (req, res) => {
  try {
    const players = await Player.find();
    res.json(players);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Seed players (rich set of 47 players for simulation)
router.post('/seed', async (req, res) => {
  try {
    // Clear old players to ensure fresh seed
    await Player.deleteMany({});

    const mockPlayers = [
      // ════════ MARQUEE SET 1 ════════
      {
        name: 'Virat Kohli', role: 'Batsman', team: 'RCB', basePrice: 20000000,
        stats: 'Runs: 7263, SR: 130.0', imageUrl: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/2.png',
        nationality: 'Indian', category: 'Marquee Set 1', isCapped: true, isOverseas: false
      },
      {
        name: 'Jasprit Bumrah', role: 'Bowler', team: 'MI', basePrice: 20000000,
        stats: 'Wickets: 145, Econ: 7.30', imageUrl: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/9.png',
        nationality: 'Indian', category: 'Marquee Set 1', isCapped: true, isOverseas: false
      },
      {
        name: 'Ruturaj Gaikwad', role: 'Batsman', team: 'CSK', basePrice: 20000000,
        stats: 'Runs: 1797, SR: 135.5', imageUrl: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/102.png',
        nationality: 'Indian', category: 'Marquee Set 1', isCapped: true, isOverseas: false
      },
      {
        name: 'Pat Cummins', role: 'Bowler', team: 'SRH', basePrice: 20000000,
        stats: 'Wickets: 55, Econ: 8.20', imageUrl: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/81.png',
        nationality: 'Overseas', category: 'Marquee Set 1', isCapped: true, isOverseas: true
      },
      {
        name: 'Mitchell Starc', role: 'Bowler', team: 'KKR', basePrice: 20000000,
        stats: 'Wickets: 84, Econ: 7.90', imageUrl: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/74.png',
        nationality: 'Overseas', category: 'Marquee Set 1', isCapped: true, isOverseas: true
      },
      {
        name: 'Rishabh Pant', role: 'WK-Batsman', team: 'LSG', basePrice: 20000000,
        stats: 'Runs: 2838, Catches: 64', imageUrl: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/18.png',
        nationality: 'Indian', category: 'Marquee Set 1', isCapped: true, isOverseas: false
      },

      // ════════ MARQUEE SET 2 ════════
      {
        name: 'Heinrich Klaasen', role: 'WK-Batsman', team: 'SRH', basePrice: 20000000,
        stats: 'Runs: 514, SR: 172.2', imageUrl: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/202.png',
        nationality: 'Overseas', category: 'Marquee Set 2', isCapped: true, isOverseas: true
      },
      {
        name: 'Shubman Gill', role: 'Batsman', team: 'GT', basePrice: 20000000,
        stats: 'Runs: 2790, SR: 134.0', imageUrl: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/62.png',
        nationality: 'Indian', category: 'Marquee Set 2', isCapped: true, isOverseas: false
      },
      {
        name: 'Rashid Khan', role: 'Bowler', team: 'GT', basePrice: 20000000,
        stats: 'Wickets: 139, Econ: 6.67', imageUrl: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/211.png',
        nationality: 'Overseas', category: 'Marquee Set 2', isCapped: true, isOverseas: true
      },
      {
        name: 'Sunil Narine', role: 'All-Rounder', team: 'KKR', basePrice: 20000000,
        stats: 'Wickets: 163, Runs: 1046', imageUrl: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/156.png',
        nationality: 'Overseas', category: 'Marquee Set 2', isCapped: true, isOverseas: true
      },
      {
        name: 'Rohit Sharma', role: 'Batsman', team: 'MI', basePrice: 20000000,
        stats: 'Runs: 6211, SR: 130.3', imageUrl: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/6.png',
        nationality: 'Indian', category: 'Marquee Set 2', isCapped: true, isOverseas: false
      },
      {
        name: 'Shreyas Iyer', role: 'Batsman', team: 'PBKS', basePrice: 20000000,
        stats: 'Runs: 2776, SR: 125.3', imageUrl: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/12.png',
        nationality: 'Indian', category: 'Marquee Set 2', isCapped: true, isOverseas: false
      },

      // ════════ CAPPED BATTERS ════════
      {
        name: 'Yashasvi Jaiswal', role: 'Batsman', team: 'RR', basePrice: 20000000,
        stats: 'Runs: 1172, SR: 148.7', imageUrl: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/533.png',
        nationality: 'Indian', category: 'Capped Batter', isCapped: true, isOverseas: false
      },
      {
        name: 'Suryakumar Yadav', role: 'Batsman', team: 'MI', basePrice: 20000000,
        stats: 'Runs: 3249, SR: 143.3', imageUrl: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/196.png',
        nationality: 'Indian', category: 'Capped Batter', isCapped: true, isOverseas: false
      },
      {
        name: 'Travis Head', role: 'Batsman', team: 'SRH', basePrice: 20000000,
        stats: 'Runs: 562, SR: 191.1', imageUrl: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/225.png',
        nationality: 'Overseas', category: 'Capped Batter', isCapped: true, isOverseas: true
      },
      {
        name: 'Rinku Singh', role: 'Batsman', team: 'KKR', basePrice: 10000000,
        stats: 'Runs: 725, SR: 142.5', imageUrl: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/152.png',
        nationality: 'Indian', category: 'Capped Batter', isCapped: true, isOverseas: false
      },
      {
        name: 'Jos Buttler', role: 'Batsman', team: 'RR', basePrice: 20000000,
        stats: 'Runs: 3223, SR: 147.5', imageUrl: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/182.png',
        nationality: 'Overseas', category: 'Capped Batter', isCapped: true, isOverseas: true
      },

      // ════════ CAPPED ALL-ROUNDERS ════════
      {
        name: 'Hardik Pandya', role: 'All-Rounder', team: 'MI', basePrice: 20000000,
        stats: 'Runs: 2309, Wkts: 53', imageUrl: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/54.png',
        nationality: 'Indian', category: 'Capped All-Rounder', isCapped: true, isOverseas: false
      },
      {
        name: 'Ravindra Jadeja', role: 'All-Rounder', team: 'CSK', basePrice: 20000000,
        stats: 'Runs: 2692, Wkts: 152', imageUrl: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/46.png',
        nationality: 'Indian', category: 'Capped All-Rounder', isCapped: true, isOverseas: false
      },
      {
        name: 'Glenn Maxwell', role: 'All-Rounder', team: 'RCB', basePrice: 15000000,
        stats: 'Runs: 2719, SR: 157.6', imageUrl: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/28.png',
        nationality: 'Overseas', category: 'Capped All-Rounder', isCapped: true, isOverseas: true
      },
      {
        name: 'Axar Patel', role: 'All-Rounder', team: 'DC', basePrice: 15000000,
        stats: 'Runs: 1418, Wkts: 112', imageUrl: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/110.png',
        nationality: 'Indian', category: 'Capped All-Rounder', isCapped: true, isOverseas: false
      },
      {
        name: 'Marcus Stoinis', role: 'All-Rounder', team: 'LSG', basePrice: 15000000,
        stats: 'Runs: 1478, SR: 141.2', imageUrl: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/40.png',
        nationality: 'Overseas', category: 'Capped All-Rounder', isCapped: true, isOverseas: true
      },

      // ════════ CAPPED WK-BATTERS ════════
      {
        name: 'Sanju Samson', role: 'WK-Batsman', team: 'RR', basePrice: 20000000,
        stats: 'Runs: 3888, SR: 137.2', imageUrl: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/190.png',
        nationality: 'Indian', category: 'Capped WK-Batter', isCapped: true, isOverseas: false
      },
      {
        name: 'Quinton de Kock', role: 'WK-Batsman', team: 'LSG', basePrice: 15000000,
        stats: 'Runs: 2907, SR: 134.2', imageUrl: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/170.png',
        nationality: 'Overseas', category: 'Capped WK-Batter', isCapped: true, isOverseas: true
      },
      {
        name: 'Nicholas Pooran', role: 'WK-Batsman', team: 'LSG', basePrice: 20000000,
        stats: 'Runs: 1270, SR: 159.9', imageUrl: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/136.png',
        nationality: 'Overseas', category: 'Capped WK-Batter', isCapped: true, isOverseas: true
      },
      {
        name: 'Ishan Kishan', role: 'WK-Batsman', team: 'MI', basePrice: 15000000,
        stats: 'Runs: 2324, SR: 135.7', imageUrl: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/164.png',
        nationality: 'Indian', category: 'Capped WK-Batter', isCapped: true, isOverseas: false
      },
      {
        name: 'MS Dhoni', role: 'WK-Batsman', team: 'CSK', basePrice: 20000000,
        stats: 'Runs: 5082, SR: 137.5', imageUrl: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/57.png',
        nationality: 'Indian', category: 'Capped WK-Batter', isCapped: true, isOverseas: false
      },

      // ════════ CAPPED FAST BOWLERS ════════
      {
        name: 'Mohammed Shami', role: 'Bowler', team: 'GT', basePrice: 20000000,
        stats: 'Wkts: 127, Econ: 8.08', imageUrl: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/47.png',
        nationality: 'Indian', category: 'Capped Fast Bowler', isCapped: true, isOverseas: false
      },
      {
        name: 'Trent Boult', role: 'Bowler', team: 'RR', basePrice: 20000000,
        stats: 'Wkts: 105, Econ: 7.89', imageUrl: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/96.png',
        nationality: 'Overseas', category: 'Capped Fast Bowler', isCapped: true, isOverseas: true
      },
      {
        name: 'Matheesha Pathirana', role: 'Bowler', team: 'CSK', basePrice: 15000000,
        stats: 'Wkts: 34, Econ: 7.88', imageUrl: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/543.png',
        nationality: 'Overseas', category: 'Capped Fast Bowler', isCapped: true, isOverseas: true
      },
      {
        name: 'Kagiso Rabada', role: 'Bowler', team: 'PBKS', basePrice: 20000000,
        stats: 'Wkts: 105, Econ: 8.05', imageUrl: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/116.png',
        nationality: 'Overseas', category: 'Capped Fast Bowler', isCapped: true, isOverseas: true
      },
      {
        name: 'Harshal Patel', role: 'Bowler', team: 'PBKS', basePrice: 15000000,
        stats: 'Wkts: 111, Econ: 8.35', imageUrl: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/114.png',
        nationality: 'Indian', category: 'Capped Fast Bowler', isCapped: true, isOverseas: false
      },

      // ════════ CAPPED SPINNERS ════════
      {
        name: 'Yuzvendra Chahal', role: 'Bowler', team: 'RR', basePrice: 15000000,
        stats: 'Wkts: 187, Econ: 7.67', imageUrl: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/10.png',
        nationality: 'Indian', category: 'Capped Spinner', isCapped: true, isOverseas: false
      },
      {
        name: 'Kuldeep Yadav', role: 'Bowler', team: 'DC', basePrice: 15000000,
        stats: 'Wkts: 77, Econ: 8.12', imageUrl: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/14.png',
        nationality: 'Indian', category: 'Capped Spinner', isCapped: true, isOverseas: false
      },
      {
        name: 'Varun Chakaravarthy', role: 'Bowler', team: 'KKR', basePrice: 10000000,
        stats: 'Wkts: 62, Econ: 7.45', imageUrl: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/140.png',
        nationality: 'Indian', category: 'Capped Spinner', isCapped: true, isOverseas: false
      },
      {
        name: 'Ravi Bishnoi', role: 'Bowler', team: 'LSG', basePrice: 10000000,
        stats: 'Wkts: 53, Econ: 7.53', imageUrl: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/193.png',
        nationality: 'Indian', category: 'Capped Spinner', isCapped: true, isOverseas: false
      },

      // ════════ UNCAPPED BATTERS ════════
      {
        name: 'Shashank Singh', role: 'Batsman', team: 'PBKS', basePrice: 3000000,
        stats: 'Runs: 354, SR: 164.5', imageUrl: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/651.png',
        nationality: 'Indian', category: 'Uncapped Batter', isCapped: false, isOverseas: false
      },
      {
        name: 'Ashutosh Sharma', role: 'Batsman', team: 'PBKS', basePrice: 3000000,
        stats: 'Runs: 189, SR: 167.2', imageUrl: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/654.png',
        nationality: 'Indian', category: 'Uncapped Batter', isCapped: false, isOverseas: false
      },
      {
        name: 'Ayush Badoni', role: 'Batsman', team: 'LSG', basePrice: 5000000,
        stats: 'Runs: 639, SR: 132.0', imageUrl: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/540.png',
        nationality: 'Indian', category: 'Uncapped Batter', isCapped: false, isOverseas: false
      },

      // ════════ UNCAPPED ALL-ROUNDERS ════════
      {
        name: 'Rahul Tewatia', role: 'All-Rounder', team: 'GT', basePrice: 5000000,
        stats: 'Runs: 825, Wkts: 32', imageUrl: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/120.png',
        nationality: 'Indian', category: 'Uncapped All-Rounder', isCapped: false, isOverseas: false
      },
      {
        name: 'Shahrukh Khan', role: 'All-Rounder', team: 'GT', basePrice: 4000000,
        stats: 'Runs: 426, SR: 134.8', imageUrl: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/512.png',
        nationality: 'Indian', category: 'Uncapped All-Rounder', isCapped: false, isOverseas: false
      },
      {
        name: 'Ramandeep Singh', role: 'All-Rounder', team: 'KKR', basePrice: 3000000,
        stats: 'Runs: 125, SR: 201.0', imageUrl: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/582.png',
        nationality: 'Indian', category: 'Uncapped All-Rounder', isCapped: false, isOverseas: false
      },

      // ════════ UNCAPPED BOWLERS ════════
      {
        name: 'Harshit Rana', role: 'Bowler', team: 'KKR', basePrice: 5000000,
        stats: 'Wkts: 19, Econ: 8.64', imageUrl: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/588.png',
        nationality: 'Indian', category: 'Uncapped Bowler', isCapped: false, isOverseas: false
      },
      {
        name: 'Mayank Yadav', role: 'Bowler', team: 'LSG', basePrice: 4000000,
        stats: 'Wkts: 7, Econ: 6.99 (Pace 156k)', imageUrl: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/612.png',
        nationality: 'Indian', category: 'Uncapped Bowler', isCapped: false, isOverseas: false
      },
      {
        name: 'Mohit Sharma', role: 'Bowler', team: 'GT', basePrice: 5000000,
        stats: 'Wkts: 119, Econ: 8.41', imageUrl: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/100.png',
        nationality: 'Indian', category: 'Uncapped Bowler', isCapped: false, isOverseas: false
      },
      {
        name: 'Yash Dayal', role: 'Bowler', team: 'RCB', basePrice: 4000000,
        stats: 'Wkts: 28, Econ: 8.92', imageUrl: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/534.png',
        nationality: 'Indian', category: 'Uncapped Bowler', isCapped: false, isOverseas: false
      }
    ];

    const defaultPool = mockPlayers.map(p => ({ ...p, poolSource: 'default' }));
    await Player.insertMany([...defaultPool, ...mockPlayers2025]);
    res.status(201).json({ message: 'Seeded players successfully', count: defaultPool.length + mockPlayers2025.length });
  } catch (error) {
    console.error('Error seeding database:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
