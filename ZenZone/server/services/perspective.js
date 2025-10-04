const axios = require('axios');

const DEFAULT_ATTRIBUTES = [
  'TOXICITY',
  'SEVERE_TOXICITY',
  'INSULT',
  'HARASSMENT',
  'PROFANITY',
  'IDENTITY_ATTACK',
  'THREAT',
  'SEXUALLY_EXPLICIT'
];

function isEnabled() {
  return Boolean(process.env.PERSPECTIVE_API_KEY);
}

function getThresholds() {
  // Defaults tuned conservatively; adjust via env as needed
  const BLOCK = Number(process.env.PERSPECTIVE_BLOCK_THRESHOLD || 0.9);
  const WARN = Number(process.env.PERSPECTIVE_WARN_THRESHOLD || 0.75);
  return { BLOCK, WARN };
}

async function analyzeText(text, {
  attributes = DEFAULT_ATTRIBUTES,
  languages = ['en'],
  doNotStore = true
} = {}) {
  if (!isEnabled()) {
    const err = new Error('Perspective API not configured');
    err.code = 'PERSPECTIVE_DISABLED';
    throw err;
  }
  const key = process.env.PERSPECTIVE_API_KEY;
  const endpoint = `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${encodeURIComponent(key)}`;

  const requestedAttributes = attributes.reduce((acc, a) => {
    acc[a] = {};
    return acc;
  }, {});

  const payload = {
    comment: { text: String(text || '') },
    requestedAttributes,
    languages,
    doNotStore,
  };

  const { data } = await axios.post(endpoint, payload, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 8000,
    validateStatus: () => true,
  });

  if (!data || data.error) {
    const err = new Error(data?.error?.message || 'Perspective API error');
    err.status = data?.error?.code || 502;
    throw err;
  }

  const scores = {};
  for (const [attr, obj] of Object.entries(data.attributeScores || {})) {
    const summary = obj?.summaryScore?.value;
    scores[attr] = typeof summary === 'number' ? summary : 0;
  }

  return {
    raw: data,
    scores,
  };
}

module.exports = {
  isEnabled,
  getThresholds,
  analyzeText,
  DEFAULT_ATTRIBUTES,
};
