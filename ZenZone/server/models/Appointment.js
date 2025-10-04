const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  psychiatristId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  college: { type: String, required: true },
  date: { type: Date, required: true },
  message: { type: String, required: true },
status: { type: String, enum: ['pending', 'approved', 'rejected', 'closed'], default: 'pending' },
});

module.exports = mongoose.model('Appointment', appointmentSchema);