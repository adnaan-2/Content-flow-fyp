import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

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
  register: (userData: { name: string; email: string; password: string }) => {
    console.log('API call - register with data:', userData);
    return api.post('/auth/register', userData);
  },
  login: (credentials: { email: string; password: string }) => api.post('/auth/login', credentials),
  forgotPassword: (data: { email: string }) => {
    console.log('API call - forgot password with email:', data.email);
    return api.post('/auth/forgot-password', data);
  },
  verifyResetCode: (data: { email: string; verificationCode: string }) => {
    console.log('API call - verify reset code for email:', data.email);
    return api.post('/auth/verify-reset-code', data);
  },
  resetPassword: (data: { token: string; newPassword: string; confirmPassword: string }) => {
    console.log('API call - reset password with token:', data.token);
    return api.post('/auth/reset-password', data);
  },
  verifyEmail: (data: { userId: string; verificationCode: string }) => api.post('/auth/verify-email', data),
  resendVerification: (data: { userId: string }) => api.post('/auth/resend-verification', data),
  getProfile: () => api.get('/profile'),
  updateProfile: (profileData) => api.put('/profile/update', profileData),
  uploadProfileImage: (formData) => {
    return api.post('/profile/image', formData);
  },
  testProfileRoute: () => api.get('/profile/test'),
  changePassword: (passwordData) => api.put('/profile/change-password', passwordData),
};

// Media services
export const mediaService = {
  // Get all media files
  getAllMedia: () => api.get('/media'),
  
  // Upload media files
  uploadMedia: (formData, onUploadProgress) => api.post('/media/upload', formData, {
    onUploadProgress
  }),
  
  // Delete media file
  deleteMedia: (mediaId) => api.delete(`/media/${mediaId}`)
};

// Schedule services
export const scheduleService = {
  createSchedule: (scheduleData) => api.post('/schedule', scheduleData),
  getSchedules: () => api.get('/schedule'),
  getScheduleById: (id) => api.get(`/schedule/${id}`),
  updateSchedule: (id, scheduleData) => api.put(`/schedule/${id}`, scheduleData),
  deleteSchedule: (id) => api.delete(`/schedule/${id}`),
};

// Ad generation services
export const adService = {
  generateAd: (adData) => api.post('/ads/generate', adData),
  getPresets: () => api.get('/ads/presets'),
  getMyAds: (page = 1, limit = 12) => api.get(`/ads/my-ads?page=${page}&limit=${limit}`),
  deleteAd: (id) => api.delete(`/ads/${id}`),
};

// Post services for social media
export const postService = {
  // Post immediately to social media
  postNow: (postData) => api.post('/posts/now', postData),
  
  // Schedule a post
  schedulePost: (postData) => api.post('/posts/schedule', postData),
  
  // Get user's posts with filtering
  getUserPosts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/posts${query ? `?${query}` : ''}`);
  },
  
  // Get scheduled posts
  getScheduledPosts: () => api.get('/posts/scheduled'),
  
  // Cancel scheduled post
  cancelScheduledPost: (postId) => api.put(`/posts/${postId}/cancel`),
  
  // Delete post
  deletePost: (postId) => api.delete(`/posts/${postId}`),

  // Test Instagram posting
  testInstagramPosting: (testData) => api.post('/posts/test/instagram', testData),

  // Test X posting
  testXPosting: (testData) => api.post('/posts/test/x', testData)
};

export default api;