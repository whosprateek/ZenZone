const express = require('express');
const router = express.Router();
const { analyzeText, isEnabled, getThresholds, DEFAULT_ATTRIBUTES } = require('../services/perspective');

// POST /api/moderation/perspective
// body: { text: string, attributes?: string[], languages?: string[] }
router.post('/perspective', async (req, res) => {
  try {
    const { text, attributes, languages } = req.body || {};
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Missing text' });
    }
    if (!isEnabled()) {
      return res.status(503).json({ error: 'Perspective not configured on server' });
    }

    const result = await analyzeText(text, {
      attributes: Array.isArray(attributes) && attributes.length ? attributes : DEFAULT_ATTRIBUTES,
      languages: Array.isArray(languages) && languages.length ? languages : ['en'],
    });

    const { BLOCK, WARN } = getThresholds();
    const maxScore = Math.max(0, ...Object.values(result.scores));
    const action = maxScore >= BLOCK ? 'block' : (maxScore >= WARN ? 'warn' : 'allow');

    return res.json({
      scores: result.scores,
      action,
      thresholds: { BLOCK, WARN },
    });
  } catch (err) {
    console.error('Perspective route error:', err.message);
    return res.status(err.status || 500).json({ error: err.message || 'Moderation failed' });
  }
});

module.exports = router;
