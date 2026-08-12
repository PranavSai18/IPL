const mongoose = require('mongoose');
const Player = require('./models/Player');
const playerPools = require('./routes/playerPoolsData');
const mockPlayers2025 = require('./routes/mockPlayers2025');

const MONGODB_URI = 'mongodb://127.0.0.1:27017/ipl-auction';

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected for seeding...');
    await Player.deleteMany({});
    console.log('Cleared existing players.');

    const allPlayersToInsert = [];
    const seenNames2025 = new Set();

    const defaultMockPlayers = [
      {
        name: 'Virat Kohli', role: 'Batsman', team: 'RCB', basePrice: 20000000,
        stats: 'Runs: 7263, SR: 130.0', imageUrl: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/2.png',
        nationality: 'Indian', category: 'Marquee Set 1', isCapped: true, isOverseas: false, poolSource: 'default'
      },
      {
        name: 'Jasprit Bumrah', role: 'Bowler', team: 'MI', basePrice: 20000000,
        stats: 'Wickets: 145, Econ: 7.30', imageUrl: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/9.png',
        nationality: 'Indian', category: 'Marquee Set 1', isCapped: true, isOverseas: false, poolSource: 'default'
      },
      {
        name: 'Ruturaj Gaikwad', role: 'Batsman', team: 'CSK', basePrice: 20000000,
        stats: 'Runs: 1797, SR: 135.5', imageUrl: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/102.png',
        nationality: 'Indian', category: 'Marquee Set 1', isCapped: true, isOverseas: false, poolSource: 'default'
      },
      {
        name: 'Pat Cummins', role: 'Bowler', team: 'SRH', basePrice: 20000000,
        stats: 'Wickets: 55, Econ: 8.20', imageUrl: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/81.png',
        nationality: 'Overseas', category: 'Marquee Set 1', isCapped: true, isOverseas: true, poolSource: 'default'
      },
      {
        name: 'Mitchell Starc', role: 'Bowler', team: 'KKR', basePrice: 20000000,
        stats: 'Wickets: 84, Econ: 7.90', imageUrl: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/74.png',
        nationality: 'Overseas', category: 'Marquee Set 1', isCapped: true, isOverseas: true, poolSource: 'default'
      },
      {
        name: 'Rishabh Pant', role: 'WK-Batsman', team: 'LSG', basePrice: 20000000,
        stats: 'Runs: 2838, Catches: 64', imageUrl: 'https://documents.iplt20.com/ipl/IPLHeadshot2026/18.png',
        nationality: 'Indian', category: 'Marquee Set 1', isCapped: true, isOverseas: false, poolSource: 'default'
      }
    ];

    allPlayersToInsert.push(...defaultMockPlayers);

    const players2025 = require('./seed_players_2025');
    
    // Add all 2025 players from our authentic dataset
    players2025.forEach(player => {
      allPlayersToInsert.push(player);
      seenNames2025.add(player.name);
    });

    for (const [year, playersList] of Object.entries(playerPools)) {
      if (year === '2025') continue; // Skip 2025 as it is seeded above
      playersList.forEach(player => {
        allPlayersToInsert.push({
          ...player,
          poolSource: year
        });
      });
    }

    await Player.insertMany(allPlayersToInsert);
    console.log(`Successfully seeded ${allPlayersToInsert.length} players!`);
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('Seeding error:', err);
    process.exit(1);
  });
