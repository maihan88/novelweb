import axios from 'axios';

// Create an Axios instance
const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Giữ nguyên URL đầy đủ của backend
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Interceptor để tự động thêm token xác thực vào mỗi request.
 * Đây là phần quan trọng để giải quyết lỗi 401.
 */
api.interceptors.request.use(config => {
  // Lấy thông tin người dùng từ localStorage
  const userString = localStorage.getItem('currentUser');
  if (userString) {
    const user = JSON.parse(userString);
    if (user && user.token) {
      // Gắn token vào header Authorization
      config.headers.Authorization = `Bearer ${user.token}`;
    }
  }
  return config;
}, error => {
  return Promise.reject(error);
});

export default api;