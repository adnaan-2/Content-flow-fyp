import axios from 'axios';

const API_URL = 'http://localhost:5000';

// Create an axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // For multipart form data, remove Content-Type to let browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 errors (unauthorized) by redirecting to login
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication services
export const authService = {
  register: (userData) => api.post('/api/auth/register', userData),
  login: (credentials) => api.post('/api/auth/login', credentials),
  getProfile: () => api.get('/api/profile'),
  updateProfile: (profileData) => api.put('/api/profile/update', profileData),
  uploadProfileImage: (formData) => {
    return api.post('/api/profile/image', formData);
  },
  testProfileRoute: () => api.get('/api/profile/test'),
  changePassword: (passwordData) => api.put('/api/profile/change-password', passwordData),
};

// Media services
export const mediaService = {
  // Get all media files
  getAllMedia: () => api.get('/api/media'),
  
  // Upload media files
  uploadMedia: (formData, onUploadProgress) => api.post('/api/media/upload', formData, {
    onUploadProgress
  }),
  
  // Delete media file
  deleteMedia: (mediaId) => api.delete(`/api/media/${mediaId}`)
};

// Schedule services
export const scheduleService = {
  createSchedule: (scheduleData) => api.post('/api/schedule', scheduleData),
  getSchedules: () => api.get('/api/schedule'),
  getScheduleById: (id) => api.get(`/api/schedule/${id}`),
  updateSchedule: (id, scheduleData) => api.put(`/api/schedule/${id}`, scheduleData),
  deleteSchedule: (id) => api.delete(`/api/schedule/${id}`),
};

// Ad generation services
export const adService = {
  generateAd: (adData) => api.post('/api/ads/generate', adData),
  getPresets: () => api.get('/api/ads/presets'),
  getMyAds: (page = 1, limit = 12) => api.get(`/api/ads/my-ads?page=${page}&limit=${limit}`),
  deleteAd: (id) => api.delete(`/api/ads/${id}`),
};


export default api;