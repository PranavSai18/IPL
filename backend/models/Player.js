const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, required: true },
  team: { type: String }, // Previous team
  basePrice: { type: Number, required: true }, // In Rupees
  stats: { type: String },
  imageUrl: { type: String },
  status: { type: String, enum: ['unsold', 'sold'], default: 'unsold' },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  // BCCI additions
  nationality: { type: String, default: 'Indian' },
  category: { type: String, default: 'Capped Batter' },
  isCapped: { type: Boolean, default: true },
  isOverseas: { type: Boolean, default: false },
  poolSource: { type: String, enum: ['default', '2025'], default: 'default' }
});

module.exports = mongoose.model('Player', PlayerSchema);
