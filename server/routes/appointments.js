const express = require('express');
const Appointment = require('../models/Appointment');
const { Types } = require('mongoose');
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
  const { date, message, psychiatristId } = req.body;
  const { userId, role, college } = req.user;

  if (!date || !message || !psychiatristId) {
    return res.status(400).json({ error: 'Date, message, and psychiatristId are required' });
  }
  if (role !== 'student') {
    return res.status(403).json({ error: 'Only students can create appointments' });
  }

  try {
    const appointment = new Appointment({
      userId,
      psychiatristId,
      college,
      date: new Date(date),
      message,
      status: 'pending',
    });
    await appointment.save();
    res.status(201).json({ message: 'Appointment request created', appointmentId: appointment._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error: Unable to create appointment' });
  }
});

router.get('/my-appointment', authMiddleware, async (req, res) => {
  try {
    const { userId, role } = req.user;
    if (role !== 'student') return res.status(403).json({ error: 'Only students can view their appointment' });
    const appointment = await Appointment.findOne({ userId, status: 'approved' }).populate('psychiatristId', 'username');
    if (!appointment) return res.status(404).json({ error: 'No approved appointment found' });
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/my-appointments', authMiddleware, async (req, res) => {
  try {
    const { userId, role } = req.user;
    if (role !== 'psychiatrist') return res.status(403).json({ error: 'Only psychiatrists can view appointments' });
    const appointments = await Appointment.find({ psychiatristId: userId }).populate('userId', 'username');
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { userId, role } = req.user;
    if (role !== 'psychiatrist') return res.status(403).json({ error: 'Only psychiatrists can update appointments' });
    const appointment = await Appointment.findOne({ _id: id, psychiatristId: userId });
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
    appointment.status = status;
    await appointment.save();
    res.json({ message: 'Appointment updated' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});


// Return all appointments for the currently authenticated student
router.get('/my-appointments-student', authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: no user in request' });
    }

    const { userId, role } = req.user;
    if (role !== 'student') {
      return res.status(403).json({ error: 'Only students can view their appointments' });
    }

    const idStr = String(userId || '');
    if (!Types.ObjectId.isValid(idStr)) {
      return res.json([]);
    }

    const appointments = await Appointment.find({ userId: idStr }).populate('psychiatristId', 'username college');
    return res.json(appointments);
  } catch (err) {
    console.error('GET /my-appointments-student failed:', err);
    return res.status(500).json({ error: 'Internal Server Error', detail: err.message });
  }
});

// Place parameterized route AFTER specific routes to avoid shadowing
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.user;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid appointment id' });
    }

    const appointment = await Appointment.findById(id)
      .populate('userId', 'username')
      .populate('psychiatristId', 'username');

    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });

    const isOwner = role === 'psychiatrist'
      ? appointment.psychiatristId._id.toString() === userId
      : appointment.userId._id.toString() === userId;

    if (!isOwner) return res.status(403).json({ error: 'Not authorized to view this appointment' });
    res.json(appointment);
  } catch (err) {
    console.error('GET /appointments/:id failed:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Close/cancel an appointment (allowed for the student who created it or the psychiatrist assigned)
router.post('/:id/close', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.user;
    const appt = await Appointment.findById(id);
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });
    if (!(appt.userId.toString() === userId || appt.psychiatristId.toString() === userId)) {
      return res.status(403).json({ error: 'Not authorized to close this appointment' });
    }
    appt.status = 'closed';
    await appt.save();
    res.json({ message: 'Appointment closed' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
