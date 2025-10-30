import axios from 'axios';

// Determine API base robustly across envs:
// Priority: REACT_APP_API_BASE_URL -> window.API_BASE_URL -> inferred (localhost -> 5000, else same-origin)
const inferredBase =
  typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : (typeof window !== 'undefined' ? window.location.origin : '');

const runtimeBase = (typeof window !== 'undefined' && (window.API_BASE_URL || window.__API_BASE_URL__)) || '';

// Avoid leaking localhost in production: if host is not localhost, ignore any localhost base.
const normalizeBase = (b) => {
  if (!b) return b;
  if (
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:|\/|$)/i.test(b)
  ) {
    return window.location.origin;
  }
  return b;
};

const baseURL = normalizeBase(process.env.REACT_APP_API_BASE_URL || runtimeBase || inferredBase);

export const api = axios.create({ baseURL });

// Attach token automatically if available
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {}
  return config;
});

// Socket base URL to use with socket.io-client
export const socketBaseURL = baseURL || (typeof window !== 'undefined' ? window.location.origin : '');
