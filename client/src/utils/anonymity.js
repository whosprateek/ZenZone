// Anonymity utilities for mental health app

// Internal adjective/animal lists for alias generation
const _ADJECTIVES = [
  'Quiet', 'Brave', 'Gentle', 'Strong', 'Peaceful', 'Thoughtful', 'Kind', 'Wise',
  'Calm', 'Bright', 'Hopeful', 'Serene', 'Patient', 'Caring', 'Mindful', 'Resilient',
  'Creative', 'Focused', 'Balanced', 'Steady', 'Curious', 'Open', 'Determined', 'Positive'
];

const _ANIMALS = [
  'Butterfly', 'Dove', 'Owl', 'Turtle', 'Deer', 'Swan', 'Robin', 'Panda',
  'Dolphin', 'Cat', 'Rabbit', 'Koala', 'Seal', 'Penguin', 'Fox', 'Wolf',
  'Bear', 'Eagle', 'Whale', 'Hummingbird', 'Otter', 'Squirrel', 'Hedgehog', 'Bee'
];

// Simple deterministic string hash (stable across sessions)
const _hashString = (str) => {
  const s = String(str || '');
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0; // 32-bit
  }
  return Math.abs(hash);
};

// Generate anonymous identifiers for students (random)
export const generateAnonymousId = () => {
  const randomAdjective = _ADJECTIVES[Math.floor(Math.random() * _ADJECTIVES.length)];
  const randomAnimal = _ANIMALS[Math.floor(Math.random() * _ANIMALS.length)];
  const randomNumber = Math.floor(Math.random() * 999) + 1;
  return `${randomAdjective}${randomAnimal}${randomNumber}`;
};

// Generate a deterministic, privacy-preserving display name from a stable seed (e.g. userId)
export const generateDeterministicDisplayName = (seed) => {
  const h = _hashString(seed || 'seed');
  const adj = _ADJECTIVES[h % _ADJECTIVES.length];
  const animal = _ANIMALS[(Math.floor(h / 7)) % _ANIMALS.length];
  const number = (h % 97) + 3; // 3..99
  return `${adj}${animal}${number}`;
};

// Backwards-compatible random anonymous display name
export const generateAnonymousDisplayName = () => {
  const themeList = [
    'Ocean', 'Mountain', 'Forest', 'Sky', 'Garden', 'River', 'Moon', 'Star',
    'Cloud', 'Rain', 'Sun', 'Wind', 'Earth', 'Fire', 'Light', 'Shadow',
    'Dawn', 'Dusk', 'Spring', 'Summer', 'Autumn', 'Winter', 'Dream', 'Hope'
  ];
  const colors = [
    'Blue', 'Green', 'Purple', 'Silver', 'Gold', 'Rose', 'Amber', 'Jade',
    'Coral', 'Pearl', 'Ruby', 'Sapphire', 'Emerald', 'Azure', 'Violet', 'Indigo'
  ];
  const theme = themeList[Math.floor(Math.random() * themeList.length)];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const number = Math.floor(Math.random() * 99) + 1;
  return `${color}${theme}${number}`;
};

// Safe base64 helper (no PII; used only to create simple client-side hash labels)
const _safeBtoa = (value) => {
  try {
    return btoa(String(value));
  } catch (_) {
    // Fallback for environments without btoa
    try {
      if (typeof Buffer !== 'undefined') {
        return Buffer.from(String(value), 'utf-8').toString('base64');
      }
    } catch {}
    // Last resort: hex encode
    return Array.from(String(value)).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
  }
};


// Generate anonymous session IDs
export const generateSessionId = () => {
  return 'session_' + Math.random().toString(36).substr(2, 16) + '_' + Date.now();
};

// Anonymize user data for psychiatrist view
export const anonymizeStudentData = (studentData) => {
  if (!studentData) return null;
  
  const anonymousId = generateAnonymousDisplayName();
  
  return {
    ...studentData,
    id: studentData._id || studentData.id,
    displayName: anonymousId,
    username: anonymousId,
    // Remove all personally identifiable information
    email: undefined,
    phone: undefined,
    address: undefined,
    realName: undefined,
    // Keep only essential non-identifying data
    college: studentData.college, // Keep college for matching
    role: studentData.role,
    // Add anonymous flags
    isAnonymous: true,
    anonymizedAt: new Date().toISOString()
  };
};

// Create anonymous appointment data
export const anonymizeAppointmentData = (appointment) => {
  if (!appointment) return null;
  
  return {
    ...appointment,
    userId: {
      ...appointment.userId,
      username: generateAnonymousDisplayName(),
      displayName: generateAnonymousDisplayName()
    },
    // Keep essential data but anonymize personal info
    studentDisplayName: generateAnonymousDisplayName(),
    isAnonymous: true
  };
};

// Generate anonymous color theme for user identification
export const generateAnonymousTheme = () => {
  const themes = [
    { primary: '#6366f1', secondary: '#818cf8', name: 'Ocean' },
    { primary: '#10b981', secondary: '#34d399', name: 'Forest' },
    { primary: '#f59e0b', secondary: '#fbbf24', name: 'Sunset' },
    { primary: '#ef4444', secondary: '#f87171', name: 'Rose' },
    { primary: '#8b5cf6', secondary: '#a78bfa', name: 'Lavender' },
    { primary: '#06b6d4', secondary: '#67e8f9', name: 'Sky' },
    { primary: '#84cc16', secondary: '#a3e635', name: 'Meadow' },
    { primary: '#f97316', secondary: '#fb923c', name: 'Amber' }
  ];
  
  return themes[Math.floor(Math.random() * themes.length)];
};

// Privacy-safe logging
export const createPrivacyLog = (action, userId, details = {}) => {
  return {
    timestamp: new Date().toISOString(),
    action,
    anonymousId: generateAnonymousId(),
    userId: hashUserId(userId), // Hash the real user ID
    details: sanitizeDetails(details),
    privacy: 'anonymous'
  };
};

// Hash user ID for privacy
const hashUserId = (userId) => {
  if (!userId) return null;
  // Simple hash for demo (client-side only)
  return 'hash_' + _safeBtoa(userId.toString()).substr(0, 8);
};

// Remove sensitive data from logs
const sanitizeDetails = (details) => {
  const sanitized = { ...details };
  
  // Remove PII
  delete sanitized.email;
  delete sanitized.phone;
  delete sanitized.address;
  delete sanitized.realName;
  delete sanitized.personalInfo;
  
  return sanitized;
};

// Generate anonymous avatar colors
export const getAnonymousAvatarColor = (anonymousId) => {
  const colors = [
    '#6366f1', '#8b5cf6', '#06b6d4', '#10b981',
    '#84cc16', '#f59e0b', '#f97316', '#ef4444'
  ];
  
  // Generate consistent color based on anonymous ID
  let hash = 0;
  for (let i = 0; i < anonymousId.length; i++) {
    hash = anonymousId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

// Anonymous messaging utilities
export const createAnonymousMessage = (content, senderId, recipientId) => {
  return {
    id: generateSessionId(),
    content,
    senderId: hashUserId(senderId),
    recipientId: hashUserId(recipientId),
    senderDisplayName: generateAnonymousDisplayName(),
    timestamp: new Date().toISOString(),
    isAnonymous: true,
    privacyLevel: 'high'
  };
};

// Check if user should remain anonymous (students always anonymous to psychiatrists)
export const shouldRemainAnonymous = (userRole, viewerRole) => {
  if (userRole === 'student' && viewerRole === 'psychiatrist') {
    return true;
  }
  return false;
};

// Privacy consent utilities
export const createPrivacyConsent = (userId, consentType) => {
  return {
    userId: hashUserId(userId),
    consentType, // 'anonymous_messaging', 'data_collection', 'analytics'
    granted: true,
    timestamp: new Date().toISOString(),
    version: '1.0'
  };
};

// Anonymous analytics data
export const createAnonymousAnalytics = (event, userId, data = {}) => {
  return {
    event,
    anonymousId: hashUserId(userId),
    timestamp: new Date().toISOString(),
    data: sanitizeDetails(data),
    sessionId: generateSessionId(),
    privacy: 'anonymous'
  };
};

export default {
  generateAnonymousId,
  generateAnonymousDisplayName,
  generateSessionId,
  anonymizeStudentData,
  anonymizeAppointmentData,
  generateAnonymousTheme,
  getAnonymousAvatarColor,
  createAnonymousMessage,
  shouldRemainAnonymous,
  createPrivacyConsent,
  createAnonymousAnalytics,
  createPrivacyLog
};