const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/register', async (req, res) => {
  const { username, password, role, college } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ error: 'Username already exists' });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = new User({ username, password: hashedPassword, role, college });
    await user.save();
    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user._id, role: user.role, college: user.college }, process.env.JWT_SECRET);
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    // Return role and college so the client can filter psychiatrists correctly
    const user = await User.findById(req.user.userId).select('role college username');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ role: user.role, college: user.college, username: user.username });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/psychiatrists', async (req, res) => {
  try {
    const psychiatrists = await User.find({ role: 'psychiatrist' });
    res.json(psychiatrists);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Psychiatrists can block a student
router.post('/block/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    if (req.user.role !== 'psychiatrist') return res.status(403).json({ error: 'Only psychiatrists can block users' });
    const doctor = await User.findById(req.user.userId);
    if (!doctor) return res.status(404).json({ error: 'Psychiatrist not found' });
    if (!doctor.blockedUsers.includes(userId)) doctor.blockedUsers.push(userId);
    await doctor.save();
    res.json({ message: 'User blocked' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/unblock/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    if (req.user.role !== 'psychiatrist') return res.status(403).json({ error: 'Only psychiatrists can unblock users' });
    const doctor = await User.findById(req.user.userId);
    if (!doctor) return res.status(404).json({ error: 'Psychiatrist not found' });
    doctor.blockedUsers = doctor.blockedUsers.filter(id => id.toString() !== userId);
    await doctor.save();
    res.json({ message: 'User unblocked' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;