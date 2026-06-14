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
  poolSource: { type: String, enum: ['default', '2025'], default: 'default' },
  playersPerTeam: { type: Number, default: 20 },
  startingPurse: { type: Number, default: 100 },
  maxOverseas: { type: Number, default: 4 },
  bidIncrement: { type: Number, default: 1000000 },
  rtmEnabled: { type: Boolean, default: true },
  timePerBid: { type: Number, default: 30 },
  // BCCI additions
  teamsState: { type: mongoose.Schema.Types.Mixed, default: {} },
  currentRound: { type: String, default: 'pre-auction' }
});

module.exports = mongoose.model('Room', RoomSchema);
