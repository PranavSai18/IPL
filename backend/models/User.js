const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  walletBalance: { type: Number, default: 1000000000 }, // 100 Crore in Rupees
});

module.exports = mongoose.model('User', UserSchema);
