const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim() === '') return res.status(400).json({ error: 'Name is required' });
    
    // Find existing user by name, or create a new one
    let user = await User.findOne({ name });
    if (!user) {
      user = new User({ name });
      await user.save();
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    res.json({ token, user: { _id: user._id, name: user.name, walletBalance: user.walletBalance } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error', details: error.stack || error.message });
  }
});

module.exports = router;
