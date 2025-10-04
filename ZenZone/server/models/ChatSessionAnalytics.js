const mongoose = require('mongoose');

const chatSessionAnalyticsSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sessionId: { type: String, required: true },
    stats: {
      sentiments: { type: Object, default: {} },
      intents: { type: Object, default: {} },
    },
    timeline: { type: [String], default: [] },
    meta: {
      startedAt: Date,
      endedAt: Date,
      totalMessages: Number,
    },
  },
  { timestamps: true }
);

chatSessionAnalyticsSchema.index({ userId: 1, sessionId: 1 }, { unique: true });

module.exports = mongoose.model('ChatSessionAnalytics', chatSessionAnalyticsSchema);
