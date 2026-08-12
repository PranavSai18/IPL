const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, required: true },
  team: { type: String }, // Previous team or retained team
  basePrice: { type: Number, required: true }, // In Rupees
  stats: { type: String }, // Backwards compatibility
  imageUrl: { type: String },
  status: { type: String, enum: ['unsold', 'sold'], default: 'unsold' },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  // BCCI additions
  nationality: { type: String, default: 'Indian' },
  category: { type: String, default: 'Capped Batter' },
  isCapped: { type: Boolean, default: true },
  isOverseas: { type: Boolean, default: false },
  poolSource: { type: String, default: 'default' },
  // Extended authentic data
  espnId: { type: String },
  cricbuzzId: { type: String },
  iplId: { type: String },
  runs: { type: Number, default: 0 },
  strikeRate: { type: Number, default: 0 },
  average: { type: Number, default: 0 },
  hundreds: { type: Number, default: 0 },
  fifties: { type: Number, default: 0 },
  wickets: { type: Number, default: 0 },
  economy: { type: Number, default: 0 },
  bestBowling: { type: String, default: '' },
  rating: { type: Number, default: 80 }
});

module.exports = mongoose.model('Player', PlayerSchema);

