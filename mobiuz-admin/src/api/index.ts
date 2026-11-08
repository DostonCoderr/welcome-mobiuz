
import axios from "axios";

// ==================== AXIOS ====================

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});



// ==================== TYPES ====================

export interface LoginResponse {
  token: string;
  [key: string]: unknown;
}

export interface EmployeePayload {
  passport: string;
  birth_date: string;
  full_name: string;
  telegram_id?: string;
  [key: string]: unknown;
}

export interface DepartmentPayload {
  name_uz: string;
  name_ru: string;
  slug: string;
  icon?: string;
}

export interface PositionPayload {
  name_uz: string;
  name_ru: string;
  slug: string;
}

export interface SectionPayload {
  title_uz: string;
  title_ru: string;
  content_uz: string;
  content_ru: string;
  icon?: string;
  order?: number;
  is_public?: boolean;
}

export interface BannerPayload {
  title_uz: string;
  title_ru: string;
  description_uz?: string;
  description_ru?: string;
  link?: string;
  image?: string;
  order?: number;
  is_active?: boolean;
}

export interface FeedbackPayload {
  rating: number;
  comment: string;
  category?: string;
}

export interface ApiEntity {
  id: string | number;
  [key: string]: unknown;
}


// ==================== EMPLOYEES ====================

export const getEmployees = async () => {
  const { data } = await api.get("/employees");
  return data;
};

export const createEmployee = async (payload: EmployeePayload) => {
  const { data } = await api.post("/employees", payload);
  return data;
};

export const updateEmployee = async (
  id: string,
  payload: Partial<EmployeePayload>
) => {
  const { data } = await api.put(`/employees/${id}`, payload);
  return data;
};

export const deleteEmployee = async (id: string) => {
  const { data } = await api.delete(`/employees/${id}`);
  return data;
};

// ==================== DEPARTMENTS ====================

export const getDepartments = async () => {
  const { data } = await api.get("/departments");
  return data;
};

export const createDepartment = async (
  payload: DepartmentPayload
) => {
  const { data } = await api.post("/departments", payload);
  return data;
};

export const updateDepartment = async (
  id: string,
  payload: Partial<DepartmentPayload>
) => {
  const { data } = await api.put(`/departments/${id}`, payload);
  return data;
};

export const deleteDepartment = async (id: string) => {
  const { data } = await api.delete(`/departments/${id}`);
  return data;
};

// ==================== POSITIONS ====================

export const getPositions = async () => {
  const { data } = await api.get("/positions");
  return data;
};

export const createPosition = async (payload: PositionPayload) => {
  const { data } = await api.post("/positions", payload);
  return data;
};

export const updatePosition = async (
  id: string,
  payload: Partial<PositionPayload>
) => {
  const { data } = await api.put(`/positions/${id}`, payload);
  return data;
};

export const deletePosition = async (id: string) => {
  const { data } = await api.delete(`/positions/${id}`);
  return data;
};

// ==================== SECTIONS ====================

export const getSections = async () => {
  const { data } = await api.get("/sections");
  return data;
};

export const createSection = async (payload: SectionPayload) => {
  const { data } = await api.post("/sections", payload);
  return data;
};

export const updateSection = async (
  id: string,
  payload: Partial<SectionPayload>
) => {
  const { data } = await api.put(`/sections/${id}`, payload);
  return data;
};

export const deleteSection = async (id: string) => {
  const { data } = await api.delete(`/sections/${id}`);
  return data;
};

// ==================== BANNERS ====================

export const getBanners = async () => {
  const { data } = await api.get("/banners");
  return data;
};

export const createBanner = async (payload: BannerPayload) => {
  const { data } = await api.post("/banners", payload);
  return data;
};

export const updateBanner = async (
  id: string,
  payload: Partial<BannerPayload>
) => {
  const { data } = await api.put(`/banners/${id}`, payload);
  return data;
};

export const deleteBanner = async (id: string) => {
  const { data } = await api.delete(`/banners/${id}`);
  return data;
};

// ==================== FEEDBACKS ====================

export const getFeedbacks = async () => {
  const { data } = await api.get("/feedbacks");
  return data;
};

export const createFeedback = async (payload: FeedbackPayload) => {
  const { data } = await api.post("/feedbacks", payload);
  return data;
};

export const markFeedbackAsRead = async (id: string) => {
  const { data } = await api.patch(`/feedbacks/${id}/read`);
  return data;
};

export const deleteFeedback = async (id: string) => {
  const { data } = await api.delete(`/feedbacks/${id}`);
  return data;
};


// Notifications
export const getNotifications = () => api.get('/notifications').then(res => res.data);
export const getActiveNotifications = () => api.get('/notifications/active').then(res => res.data);
export const createNotification = (data: any) => api.post('/notifications', data).then(res => res.data);
export const updateNotification = (id: string, data: any) => api.put(`/notifications/${id}`, data).then(res => res.data);
export const deleteNotification = (id: string) => api.delete(`/notifications/${id}`);



// ==================== PROFILE ====================

// Profilni olish
export const getMe = () => api.get('/auth/me').then(res => res.data);

// Profilni yangilash
export const updateProfile = (data: { name?: string; phone?: string; avatar?: string }) =>
  api.put('/auth/profile', data).then(res => res.data);

// Parolni o'zgartirish
export const changePassword = (data: { oldPassword: string; newPassword: string }) =>
  api.put('/auth/password', data).then(res => res.data);

// ==================== ADMINS ====================

// Barcha adminlar
export const getAdmins = () => api.get('/auth/users').then(res => res.data);

// Yangi admin qo'shish
export const createAdmin = (data: { name: string; email: string; password: string; role: string; phone?: string }) =>
  api.post('/auth/create-admin', data).then(res => res.data);

// Adminni o'chirish
export const deleteAdmin = (id: string) => api.delete(`/auth/users/${id}`);



export const markFeedbackRead = async (id: string) => {
  const token = localStorage.getItem('admin_token');
  const res = await fetch(`${API_URL}/feedbacks/${id}/read`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
  });
  if (!res.ok) throw new Error('Xatolik yuz berdi');
  return res.json();
};