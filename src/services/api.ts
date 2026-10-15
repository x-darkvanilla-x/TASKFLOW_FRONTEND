import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token and workspace owner header
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('taskmanager_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      const activeOwnerId = localStorage.getItem('followup_active_workspace_owner_id');
      if (activeOwnerId) {
        config.headers['x-workspace-owner-id'] = activeOwnerId;
      }
      const activeWsId = localStorage.getItem('followup_active_workspace_id');
      if (activeWsId) {
        config.headers['x-workspace-id'] = activeWsId;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor to unwrap { success, data } envelope
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('taskmanager_token');
        localStorage.removeItem('taskmanager_user');
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
