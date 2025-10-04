const mongoose = require('mongoose');

const AttachmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  type: { type: String, required: true },
  size: { type: Number, required: true },
}, { _id: false });

const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  content: {
    type: String,
    // Only require text content if there are no attachments
    required: function () { return !(this.attachments && this.attachments.length > 0); },
    default: '',
    trim: true,
  },
  attachments: { type: [AttachmentSchema], default: [] },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: { createdAt: 'timestamp', updatedAt: 'updatedAt' } });

module.exports = mongoose.model('Message', messageSchema);
