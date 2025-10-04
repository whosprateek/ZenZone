const express = require('express');
const router = express.Router();
const vader = require('vader-sentiment');

// Groq Chat Completions API (OpenAI-compatible)
// Docs: https://console.groq.com/docs/api-reference#chat-completions
const GROQ_API_KEY = (process.env.GROQ_API_KEY ? String(process.env.GROQ_API_KEY) : '').replace(/^[\"']|[\"']$/g, '').trim();
const GROQ_MODEL = (process.env.GROQ_MODEL && String(process.env.GROQ_MODEL).trim()) || 'llama-3.1-8b-instant';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Local-only safety helpers
const CRISIS_KEYWORDS = [
  'suicide', 'kill myself', 'end it', 'self harm', 'hurt myself', 'overdose',
  'end my life', 'die', 'want to die', 'no reason to live', 'cut myself'
];

function detectCrisis(text = '') {
  const t = String(text || '').toLowerCase();
  return CRISIS_KEYWORDS.some(k => t.includes(k));
}

function respondLocal(message = '', history = []) {
  const m = String(message || '');
  const t = m.toLowerCase();
  const crisis = detectCrisis(t);
  const sentiment = vader.SentimentIntensityAnalyzer.polarity_scores(m);

  if (crisis) {
    return [
      "I'm really glad you reached out — what you're feeling matters.",
      "If you feel you might harm yourself, please consider immediate support:",
      "• 988 — Suicide & Crisis Lifeline",
      "• Text HOME to 741741 — Crisis Text Line",
      "• If you're in danger now, call local emergency services",
      "I'm here to keep talking if you’d like. Would sharing what's most overwhelming right now feel okay?"
    ].join('\n');
  }

  if (sentiment.compound <= -0.4) {
    return [
      "Thank you for sharing — that took courage.",
      "A few gentle steps that can help right now:",
      "• Try 4-7-8 breathing (inhale 4, hold 7, exhale 8) for 3 cycles",
      "• Grounding: name one thing you can see, touch, and hear",
      "• Offer yourself kindness — your feelings are valid",
      "Would you like strategies for anxiety, sleep, or stress?"
    ].join('\n');
  }

  if (sentiment.pos > sentiment.neg) {
    return [
      "I'm hearing some strength and hope in what you shared.",
      "Would you like to build on what's helping — or explore supports for areas that still feel tough?"
    ].join('\n');
  }

  return [
    "I'm here to listen. What feels most important to talk about right now?",
    "I can share coping strategies, grounding exercises, and resources.",
    "If you ever feel unsafe, you can call 988 or text HOME to 741741."
  ].join('\n');
}

function buildMessages(message = '', history = []) {
  const systemPrompt = `You are ZenZone AI, a supportive, trauma-informed mental wellness assistant.
- Be empathetic, validating, and non-judgmental.
- Offer practical, gentle coping strategies.
- If the user expresses self-harm or imminent danger, provide crisis resources and suggest contacting local emergency services.
- Keep responses brief (3–7 short paragraphs max) and use simple Markdown for lists and emphasis.
- Avoid medical diagnosis. Encourage professional help when appropriate.`;

  const msgs = [
    { role: 'system', content: systemPrompt },
    ...[].concat(Array.isArray(history) ? history.slice(-6) : []).map(h => ({
      role: h.role === 'user' ? 'user' : 'assistant',
      content: String(h.content || '')
    })),
    { role: 'user', content: String(message || '') }
  ];
  return msgs;
}

async function chatWithGroq(message = '', history = []) {
  if (!GROQ_API_KEY) {
    const e = new Error('GROQ_API_KEY not set');
    e.code = 'NO_GROQ_KEY';
    throw e;
  }
  const resp = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: buildMessages(message, history),
      temperature: 0.6,
      max_tokens: 512
    })
  });
  let data = null;
  try { data = await resp.json(); } catch { data = null; }
  if (!resp.ok) {
    const msg = (data && (data.error?.message || data.message)) || `Groq error ${resp.status}`;
    const e = new Error(msg);
    e.status = resp.status;
    throw e;
  }
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('Empty Groq response');
  return text;
}

router.post('/', async (req, res) => {
  try {
    const { message, history = [] } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Missing message' });
    }

    try {
      const reply = await chatWithGroq(message, history);
      return res.json({ response: reply, provider: 'groq', model: GROQ_MODEL });
    } catch (e) {
      console.warn('Groq API failed or key missing:', e.message);
    }

    // Last-resort local response to avoid breaking UX
    const reply = respondLocal(message, Array.isArray(history) ? history : []);
    return res.json({ response: reply, provider: 'local' });
  } catch (err) {
    console.error('AI chat error:', err);
    return res.status(500).json({ error: 'AI chat failed' });
  }
});

// Health check (no secrets leaked)
router.get('/health', async (req, res) => {
  const hasToken = Boolean(GROQ_API_KEY);
  const tokenLen = GROQ_API_KEY ? GROQ_API_KEY.length : 0;
  const info = { hasToken, tokenLen, model: GROQ_MODEL, url: GROQ_URL };
  if (!hasToken) return res.json({ ...info, ok: false, reason: 'NO_TOKEN' });
  try {
    const resp = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: buildMessages('health check', []),
        max_tokens: 8,
        temperature: 0.2
      })
    });
    const status = resp.status;
    let data = null;
    try { data = await resp.json(); } catch {}
    const err = data && (data.error?.message || data.message);
    const ok = status >= 200 && status < 300;
    return res.json({ ...info, ok, status, error: ok ? null : err || `HTTP ${status}` });
  } catch (e) {
    return res.json({ ...info, ok: false, status: 0, error: e.message || 'request failed' });
  }
});

module.exports = router;
