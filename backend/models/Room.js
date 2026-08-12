const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  type: { type: String, enum: ['public', 'private'], default: 'public' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  maxPlayers: { type: Number, default: 10 },
  status: { type: String, enum: ['waiting', 'active', 'completed'], default: 'waiting' },
  // Custom room settings
  auctionType: { type: String, enum: ['mini', 'mega'], default: 'mini' },
  franchise: { type: String, default: '' },
  poolSource: { type: String, default: '2025' }, // String representing the selected year
  playersPerTeam: { type: Number, default: 20 },
  startingPurse: { type: Number, default: 100 },
  maxOverseas: { type: Number, default: 8 },
  bidIncrement: { type: Number, default: 1000000 },
  rtmEnabled: { type: Boolean, default: true },
  timePerBid: { type: Number, default: 30 },
  // Interactive Auction setup additions
  auctionYear: { type: String, default: '2025' },
  numTeams: { type: Number, default: 10 },
  teamNames: { type: [String], default: [] },
  biddingStyle: { type: String, enum: ['open'], default: 'open' },
  basePriceRule: { type: String, enum: ['real', 'custom'], default: 'real' },
  customBasePrice: { type: Number, default: 20000000 },
  playerCategory: { type: String, default: 'all' }, // 'all' | 'batters' | 'bowlers' | 'allrounders' | 'mixed' | 'custom'
  customPlayersList: { type: [mongoose.Schema.Types.Mixed], default: [] },
  maxPlayersPerTeam: { type: Number, default: 25 },
  // BCCI additions
  teamsState: { type: mongoose.Schema.Types.Mixed, default: {} },
  currentRound: { type: String, default: 'pre-auction' },
  mysteryPlayersEnabled: { type: Boolean, default: true },
  auctionOrderStyle: { type: String, enum: ['auto_shuffle', 'set_based', 'manual_priority'], default: 'auto_shuffle' },
  manualPriorityPlayers: { type: [String], default: [] },
  lastSessionFirstPlayers: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Room', RoomSchema);
