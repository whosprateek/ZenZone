import axios from 'axios';

// Determine API base:
// - If REACT_APP_API_BASE_URL is set, use it
// - If running on localhost without the env, use http://localhost:5000
// - Otherwise use same-origin
const inferredBase =
  typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : (typeof window !== 'undefined' ? window.location.origin : '');

const runtimeBase = (typeof window !== 'undefined' && (window.API_BASE_URL || window.__API_BASE_URL__)) || '';
const baseURL = process.env.REACT_APP_API_BASE_URL || runtimeBase || inferredBase;

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
