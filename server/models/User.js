const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'psychiatrist'], required: true },
  college: { type: String, required: true },
  // For psychiatrists: list of blocked student IDs
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
});

module.exports = mongoose.model('User', userSchema);