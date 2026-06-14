const mongoose = require('mongoose');

const BidSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
  bidderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true }, // In Rupees
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Bid', BidSchema);
