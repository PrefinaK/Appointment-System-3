import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle expired tokens
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getCurrentUser: () => api.get('/auth/me'),
};

// Appointments API
export const appointmentsAPI = {
  getBusinesses: () => api.get('/appointments/businesses'),
  createAppointment: (appointmentData) => api.post('/appointments', appointmentData),
  getMyAppointments: () => api.get('/appointments/my-appointments'),
  updateAppointment: (id, updates) => api.put(`/appointments/${id}`, updates),
  cancelAppointment: (id) => api.delete(`/appointments/${id}`),
};

// Admin API
export const adminAPI = {
  getAllAppointments: () => api.get('/admin/appointments'),
  updateAppointmentStatus: (id, status) => api.patch(`/admin/appointments/${id}/status`, { status }),
  getStats: () => api.get('/admin/stats'),
};

export default api;