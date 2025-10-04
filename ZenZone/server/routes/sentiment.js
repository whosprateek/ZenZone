const express = require('express');
const router = express.Router();
const vader = require('vader-sentiment');

// Simple crisis keyword detection (conservative)
const CRISIS_KEYWORDS = [
  'suicide', 'kill myself', 'end it', 'self harm', 'hurt myself', 'overdose',
  'end my life', 'die', 'want to die', 'no reason to live', 'cut myself'
];

// Lightweight emotion lexicon (keywords -> emotion weights)
// Scores are simple counts with minor weighting; not exhaustive, but effective and free.
const EMOTION_LEXICON = {
  joy: [
    'happy','glad','grateful','thankful','relieved','content','joy','excited','proud','hopeful','optimistic','peaceful'
  ],
  sadness: [
    'sad','down','depressed','numb','crying','tears','lonely','empty','hopeless','worthless','miserable','grief'
  ],
  anger: [
    'angry','mad','furious','rage','irritated','annoyed','frustrated','pissed','resentful','hate'
  ],
  fear: [
    'afraid','fear','scared','terrified','panic','panicking','phobia','anxious','anxiety','worried','worry','nervous'
  ],
  anxiety: [
    'anxiety','anxious','nervous','on edge','racing thoughts','overthinking','uneasy','restless','tense'
  ],
  stress: [
    'stress','stressed','overwhelmed','pressure','burned out','exhausted','cant cope','too much','breakdown'
  ],
  loneliness: [
    'lonely','isolated','alone','no one','left out','abandoned','disconnected'
  ],
  hope: [
    'hope','hopeful','optimistic','improving','better','progress','recover','healing','confident'
  ]
};

function detectCrisis(text = '') {
  const t = String(text || '').toLowerCase();
  return CRISIS_KEYWORDS.some(k => t.includes(k));
}

function labelFromCompound(compound) {
  if (compound >= 0.05) return 'positive';
  if (compound <= -0.05) return 'negative';
  return 'neutral';
}

function scoreEmotions(text = '') {
  const t = String(text || '').toLowerCase();
  const scores = {};
  for (const [emotion, words] of Object.entries(EMOTION_LEXICON)) {
    let score = 0;
    for (const w of words) {
      // Count occurrences with word boundary where safe; fall back to includes for multi-word phrases
      if (w.includes(' ')) {
        const re = new RegExp(w.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
        const matches = t.match(re);
        if (matches) score += matches.length;
      } else {
        const re = new RegExp(`\\b${w.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'g');
        const matches = t.match(re);
        if (matches) score += matches.length;
      }
    }
    scores[emotion] = score;
  }
  // Light normalization: if all zeros, return zeros; else scale to 0..1 by dividing by max
  const max = Math.max(0, ...Object.values(scores));
  const normalized = {};
  for (const [k, v] of Object.entries(scores)) {
    normalized[k] = max > 0 ? Number((v / max).toFixed(3)) : 0;
  }
  const top_emotions = Object.entries(normalized)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k]) => k);
  return { scores: normalized, top_emotions };
}

router.post('/', (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Missing text' });
    }

    const scores = vader.SentimentIntensityAnalyzer.polarity_scores(text);
    const crisis = detectCrisis(text);
    const { scores: emotions, top_emotions } = scoreEmotions(text);

    // Map to the structure your client expects
    const sentimentLabel = crisis ? 'concerning' : labelFromCompound(scores.compound);
    const response = {
      raw: scores, // { neg, neu, pos, compound }
      sentiment: sentimentLabel,
      crisis_level: crisis ? 'emergency' : (scores.compound <= -0.4 ? 'medium' : 'low'),
      emergency_keywords_detected: crisis,
      supportive_response_needed: crisis || scores.compound < 0,
      emotions,
      top_emotions,
    };

    return res.json(response);
  } catch (err) {
    console.error('Sentiment error:', err);
    return res.status(500).json({ error: 'Sentiment analysis failed' });
  }
});

module.exports = router;
