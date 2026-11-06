import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const api = axios.create({ baseURL: API_URL });

// Har bir so'rovga tokenni qo'shish
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const login = async (email: string, password: string) => {
  const { data } = await api.post('/auth/login', { email, password });
  localStorage.setItem('admin_token', data.token);
  localStorage.setItem('admin_user', JSON.stringify(data));
  return data;
};

// Employees
export const getEmployees = () => api.get('/employees').then(res => res.data);
export const createEmployee = (data: any) => api.post('/employees', data).then(res => res.data);
export const updateEmployee = (id: string, data: any) => api.put(`/employees/${id}`, data).then(res => res.data);
export const deleteEmployee = (id: string) => api.delete(`/employees/${id}`);

// Departments
export const getDepartments = () => api.get('/departments').then(res => res.data);
export const createDepartment = (data: any) => api.post('/departments', data).then(res => res.data);
export const updateDepartment = (id: string, data: any) => api.put(`/departments/${id}`, data).then(res => res.data);
export const deleteDepartment = (id: string) => api.delete(`/departments/${id}`);

// Positions
export const getPositions = () => api.get('/positions').then(res => res.data);
export const createPosition = (data: any) => api.post('/positions', data).then(res => res.data);
export const updatePosition = (id: string, data: any) => api.put(`/positions/${id}`, data).then(res => res.data);
export const deletePosition = (id: string) => api.delete(`/positions/${id}`);

// Sections
export const getSections = () => api.get('/sections').then(res => res.data);
export const createSection = (data: any) => api.post('/sections', data).then(res => res.data);
export const updateSection = (id: string, data: any) => api.put(`/sections/${id}`, data).then(res => res.data);
export const deleteSection = (id: string) => api.delete(`/sections/${id}`);

// Banners
export const getBanners = () => api.get('/banners').then(res => res.data);
export const createBanner = (data: any) => api.post('/banners', data).then(res => res.data);
export const updateBanner = (id: string, data: any) => api.put(`/banners/${id}`, data).then(res => res.data);
export const deleteBanner = (id: string) => api.delete(`/banners/${id}`);


// Feedbacks
export const getFeedbacks = () => api.get('/feedbacks').then(res => res.data);
export const createFeedback = (data: any) => api.post('/feedbacks', data).then(res => res.data);
export const markFeedbackAsRead = (id: string) => api.patch(`/feedbacks/${id}/read`).then(res => res.data);
export const deleteFeedback = (id: string) => api.delete(`/feedbacks/${id}`);