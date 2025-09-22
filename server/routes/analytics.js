const express = require('express');
const router = express.Router();
const ChatSessionAnalytics = require('../models/ChatSessionAnalytics');
const auth = require('../middlewares/authMiddleware');

// Save or update a chat session report
router.post('/chat-session', auth, async (req, res) => {
  try {
    const { sessionId, stats, timeline, meta } = req.body || {};
    if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

    const doc = await ChatSessionAnalytics.findOneAndUpdate(
      { userId: req.user.userId, sessionId },
      { $set: { stats: stats || {}, timeline: timeline || [], meta: meta || {} } },
      { new: true, upsert: true }
    );

    return res.json({ message: 'Saved', id: doc._id });
  } catch (err) {
    console.error('Save analytics error:', err);
    return res.status(500).json({ error: 'Failed to save analytics' });
  }
});

// List chat sessions for the current user
router.get('/chat-sessions', auth, async (req, res) => {
  try {
    const items = await ChatSessionAnalytics.find({ userId: req.user.userId })
      .sort({ updatedAt: -1 })
      .limit(20)
      .lean();
    return res.json({ items });
  } catch (err) {
    console.error('List analytics error:', err);
    return res.status(500).json({ error: 'Failed to list analytics' });
  }
});

// Get one
router.get('/chat-session/:id', auth, async (req, res) => {
  try {
    const item = await ChatSessionAnalytics.findOne({ _id: req.params.id, userId: req.user.userId }).lean();
    if (!item) return res.status(404).json({ error: 'Not found' });
    return res.json(item);
  } catch (err) {
    console.error('Get analytics error:', err);
    return res.status(500).json({ error: 'Failed to get analytics' });
  }
});

module.exports = router;
