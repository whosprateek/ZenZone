const express = require('express');
const Message = require('../models/Message');
const Appointment = require('../models/Appointment');
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { userId, role } = req.user;
    let messages;
    if (role === 'psychiatrist') {
      const appointments = await Appointment.find({ psychiatristId: userId, status: 'approved' });
      if (!appointments.length) return res.json([]);
      const studentIds = appointments.map(a => a.userId.toString());
      messages = await Message.find({
        $or: [
          { senderId: { $in: studentIds }, recipientId: userId },
          { senderId: userId, recipientId: { $in: studentIds } }
        ]
      }).populate('senderId', 'username').populate('recipientId', 'username');
    } else { // student
      const appointment = await Appointment.findOne({ userId, status: 'approved' });
      if (!appointment) return res.status(403).json({ error: 'No approved appointment' });
      messages = await Message.find({
        $or: [
          { senderId: userId, recipientId: appointment.psychiatristId },
          { senderId: appointment.psychiatristId, recipientId: userId }
        ]
      }).populate('senderId', 'username').populate('recipientId', 'username');
    }
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  let { recipientId, content, appointmentId, attachments = [] } = req.body || {};
  const { userId, role, college } = req.user;
  try {
    console.log('POST /api/messages - Input:', { recipientId, appointmentId, userId, role });
    if (!appointmentId) {
      console.log('Missing appointmentId, attempting to derive');
      const appointments = await Appointment.find({
        $or: [
          { userId, psychiatristId: recipientId, college, status: 'approved' },
          { psychiatristId: userId, userId: recipientId, status: 'approved' }
        ]
      });
      if (!appointments.length) {
        console.log('No valid appointment found for derivation');
        return res.status(400).json({ error: 'appointmentId is required or no valid appointment found' });
      }
      appointmentId = appointments[0]._id;
      console.log('Derived appointmentId:', appointmentId);
    }
    // Block check: if psychiatrist has blocked this student, disallow messages
    const doctorId = role === 'psychiatrist' ? userId : recipientId;
    const studentId = role === 'student' ? userId : recipientId;
    const User = require('../models/User');
    const doctor = await User.findById(doctorId).select('blockedUsers');
    if (doctor && doctor.blockedUsers?.some(id => id.toString() === studentId)) {
      return res.status(403).json({ error: 'You cannot send messages to this psychiatrist.' });
    }

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      $or: [
        { userId, psychiatristId: recipientId, college, status: 'approved' },
        { psychiatristId: userId, userId: recipientId, status: 'approved' }
      ]
    }).lean();
    if (!appointment) {
      console.log('Appointment not found:', { _id: appointmentId, userId, recipientId, status: 'approved' });
      return res.status(400).json({ error: 'No approved appointment with this user' });
    }
    console.log('Approved appointment found:', appointment._id, 'Status:', appointment.status);
    // Simple profanity filter (client has similar; server enforces)
    const banned = ['fuck','shit','bitch','asshole'];
    const mask = (txt) => txt.replace(new RegExp(banned.join('|'),'gi'), (m)=>'*'.repeat(m.length));
    const safeContent = mask(content || '');

    // Normalize attachments (optional)
    const safeAttachments = Array.isArray(attachments) ? attachments
      .filter(a => a && a.url && a.name)
      .map(a => ({
        name: String(a.name).slice(0, 200),
        url: String(a.url),
        type: String(a.type || 'application/octet-stream'),
        size: Number(a.size || 0),
      })) : [];

    const message = new Message({ senderId: userId, recipientId, content: safeContent, appointmentId, attachments: safeAttachments });
    await message.save();
    res.status(201).json(message);
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

router.get('/by-appointment/:appointmentId', authMiddleware, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { userId, role } = req.user;
    // Allow both roles if authorized
    const filter = role === 'psychiatrist' ? { _id: appointmentId, psychiatristId: userId, status: 'approved' } : { _id: appointmentId, userId, status: 'approved' };
    const appointment = await Appointment.findOne(filter);
    if (!appointment) return res.status(404).json({ error: 'Appointment not found or not approved' });
    const otherId = role === 'psychiatrist' ? appointment.userId : appointment.psychiatristId;
    const messages = await Message.find({
      $or: [
        { senderId: userId, recipientId: otherId },
        { senderId: otherId, recipientId: userId }
      ]
    }).populate('senderId', 'username').populate('recipientId', 'username');
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

module.exports = router;