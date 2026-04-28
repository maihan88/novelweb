import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
// Create an Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(config => {
  const userString = localStorage.getItem('currentUser');
  if (userString) {
    const user = JSON.parse(userString);
    if (user && user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Auto-logout when token expires
api.interceptors.response.use(
  response => response,
  error => {
    if (
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED'
    ) {
      localStorage.removeItem('currentUser');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export default api;