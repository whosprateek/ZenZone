const express = require('express');
const Message = require('../models/Message');
const Appointment = require('../models/Appointment');
const authMiddleware = require('../middlewares/authMiddleware');
const { Types } = require('mongoose');
const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { userId, role } = req.user;
    let messages = [];

    if (role === 'psychiatrist') {
      const appointments = await Appointment.find({ psychiatristId: userId, status: 'approved' }).select('userId');
      if (!appointments.length) return res.json([]);

      // Build a safe list of ObjectIds for students in approved appointments
      const studentObjectIds = appointments
        .map(a => a.userId)
        .filter(id => id && Types.ObjectId.isValid(String(id)))
        .map(id => new Types.ObjectId(String(id)));

      if (!studentObjectIds.length) return res.json([]);

      messages = await Message.find({
        $or: [
          { senderId: { $in: studentObjectIds }, recipientId: userId },
          { senderId: userId, recipientId: { $in: studentObjectIds } }
        ]
      }).populate('senderId', 'username').populate('recipientId', 'username');

    } else { // student
      const appointment = await Appointment.findOne({ userId, status: 'approved' }).select('psychiatristId');
      if (!appointment) return res.status(403).json({ error: 'No approved appointment' });

      const docId = appointment.psychiatristId;
      if (!docId || !Types.ObjectId.isValid(String(docId))) {
        return res.status(404).json({ error: 'Invalid or missing psychiatrist for this appointment' });
      }

      messages = await Message.find({
        $or: [
          { senderId: userId, recipientId: docId },
          { senderId: docId, recipientId: userId }
        ]
      }).populate('senderId', 'username').populate('recipientId', 'username');
    }

    res.json(messages);
  } catch (err) {
    console.error('GET /api/messages failed:', err);
    res.status(500).json({ error: 'Server error: ' + (err && err.message ? err.message : 'unknown') });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  let { recipientId, content, appointmentId, attachments = [] } = req.body || {};
  const { userId, role } = req.user;
  try {
    console.log('POST /api/messages - Input:', { recipientId, appointmentId, userId, role });

    // Ensure we have a valid appointmentId (derive if missing)
    if (!appointmentId) {
      console.log('Missing appointmentId, attempting to derive');
      const query = role === 'student'
        ? { userId, status: 'approved' }
        : { psychiatristId: userId, status: 'approved' };
      const appointments = await Appointment.find(query).limit(1).select('_id userId psychiatristId status');
      if (!appointments.length) {
        return res.status(400).json({ error: 'appointmentId is required or no approved appointment found' });
      }
      appointmentId = appointments[0]._id;
      console.log('Derived appointmentId:', appointmentId);
    }

    // Validate appointment and ownership
    if (!Types.ObjectId.isValid(String(appointmentId))) {
      return res.status(400).json({ error: 'Invalid appointmentId' });
    }

    const appt = await Appointment.findById(appointmentId).select('userId psychiatristId status');
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });
    if (appt.status !== 'approved') return res.status(403).json({ error: 'Appointment is not approved' });

    const owns = role === 'student'
      ? appt.userId.toString() === userId
      : appt.psychiatristId.toString() === userId;
    if (!owns) return res.status(403).json({ error: 'Not authorized to send messages for this appointment' });

    // Derive recipientId from appointment if missing/invalid
    const counterpartId = role === 'student' ? appt.psychiatristId : appt.userId;
    if (!recipientId || !Types.ObjectId.isValid(String(recipientId))) {
      recipientId = counterpartId.toString();
    }

    // Block check (only meaningful if doctor has blocked student)
    const doctorId = role === 'psychiatrist' ? userId : recipientId;
    const studentId = role === 'student' ? userId : recipientId;
    const User = require('../models/User');
    if (Types.ObjectId.isValid(String(doctorId))) {
      const doctor = await User.findById(doctorId).select('blockedUsers');
      if (doctor && doctor.blockedUsers?.some(id => id.toString() === String(studentId))) {
        return res.status(403).json({ error: 'You cannot send messages to this psychiatrist.' });
      }
    }

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

// Latest message for an appointment (for previews/unread sidebars)
router.get('/last/:appointmentId', authMiddleware, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { userId, role } = req.user;
    if (!Types.ObjectId.isValid(String(appointmentId))) {
      return res.status(400).json({ error: 'Invalid appointmentId' });
    }

    // Authorize: appointment must belong to current user (either role) and be approved
    const filter = role === 'psychiatrist'
      ? { _id: appointmentId, psychiatristId: userId, status: 'approved' }
      : { _id: appointmentId, userId, status: 'approved' };
    const appointment = await Appointment.findOne(filter).select('_id userId psychiatristId');
    if (!appointment) return res.status(404).json({ error: 'Appointment not found or not approved' });

    const msg = await Message.findOne({ appointmentId: appointmentId })
      .sort({ timestamp: -1 })
      .select('content timestamp senderId recipientId appointmentId')
      .lean();

    res.json(msg || null);
  } catch (err) {
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