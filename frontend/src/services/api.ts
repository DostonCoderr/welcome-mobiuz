// frontend/src/services/api.ts

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const WEBAPP_SECRET = import.meta.env.VITE_WEBAPP_SECRET || '';

// ⚡ Barcha so'rovlarga WebApp maxfiy kalitini qo'shuvchi yordamchi funksiya
const fetchWithWebAppAuth = async (url: string, options: RequestInit = {}) => {
  const headers = {
    ...options.headers,
    'x-webapp-secret': WEBAPP_SECRET,
  };
  return fetch(url, { ...options, headers, credentials: 'include',  });
};

// ==================== TYPES ====================
export interface Department { _id: string; name_ru: string; name_uz: string; slug: string; icon: string; color: string; order: number; }
export interface Position { _id: string; name_ru: string; name_uz: string; slug: string; }
export interface Section { _id: string; title_ru: string; title_uz: string; content_ru: string; content_uz: string; icon: string; order: number; is_active: boolean; is_public: boolean; department?: Department; images?: any; publishedAt?: string; }
export interface Banner { _id: string; title_ru: string; title_uz: string; description_ru: string; description_uz: string; image: any; link: string; order: number; is_active: boolean; publishedAt?: string; }
export interface Employee { _id: string; passport: string; birth_date: string; department?: Department; position?: Position; }
export interface Notification { _id: string; title_ru: string; title_uz: string; message_ru: string; message_uz: string; type: 'info' | 'section' | 'event' | 'gift'; icon?: string; is_active: boolean; link?: string; order: number; is_public: boolean; department?: Department; publishedAt?: string; }
export interface Feedback { _id: string; rating: number; comment: string; category: string; is_read: boolean; publishedAt: string; }

// ==================== SECTIONS ====================

export const getPublicSections = async (): Promise<Section[]> => {
  const res = await fetchWithWebAppAuth(`${API_URL}/sections`);
  if (!res.ok) throw new Error('Sections error');
  const data = await res.json();
  return data.filter((s: any) => s.is_active && s.is_public);
};

export const getPrivateSections = async (positionId: string): Promise<Section[]> => {
  try {
    const res = await fetchWithWebAppAuth(`${API_URL}/sections`);
    if (!res.ok) throw new Error('Sections error');
    const data = await res.json();
    
    return data.filter((s: any) => 
      s.is_active && 
      !s.is_public && 
      s.visible_positions && 
      s.visible_positions.includes(positionId)
    );
  } catch (e) {
    console.error('getPrivateSections xatosi:', e);
    return [];
  }
};

export const getSectionsForEmployee = async (
  employee: Employee | null
): Promise<{ public: Section[]; private: Section[] }> => {
  let positionId = employee?.position?._id;
  const publicSections = await getPublicSections();
  const privateSections = positionId ? await getPrivateSections(positionId) : [];
  return { public: publicSections, private: privateSections };
};

export const getSectionById = async (id: string): Promise<Section> => {
  const res = await fetchWithWebAppAuth(`${API_URL}/sections/${id}`);
  if (!res.ok) throw new Error('Section topilmadi');
  return res.json();
};

export const getBanners = async (): Promise<Banner[]> => {
  const res = await fetchWithWebAppAuth(`${API_URL}/banners`);
  if (!res.ok) throw new Error('Banners error');
  const data = await res.json();
  return data.filter((b: any) => b.is_active);
};

// ==================== EMPLOYEES ====================

// WebApp uchun (x-webapp-secret bilan)
export const verifyEmployee = async (passport: string, birth_date: string): Promise<Employee | null> => {
  const res = await fetchWithWebAppAuth(`${API_URL}/employees/verify?passport=${passport}&birth_date=${birth_date}`);
  if (!res.ok) return null;
  return res.json();
};

// WebApp uchun (x-webapp-secret bilan)
export const getEmployeeByDocumentId = async (documentId: string): Promise<Employee | null> => {
  try {
    const res = await fetchWithWebAppAuth(`${API_URL}/employees/by-id/${documentId}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error('getEmployeeByDocumentId:', e);
    return null;
  }
};

// WebApp uchun (x-webapp-secret bilan)
export const getEmployeeByTelegramId = async (telegramId: string): Promise<Employee | null> => {
  try {
    const res = await fetchWithWebAppAuth(`${API_URL}/employees/telegram/${telegramId}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error('getEmployeeByTelegramId:', e);
    return null;
  }
};

// ==================== NOTIFICATIONS / FEEDBACK ====================

export const getNotificationsForEmployee = async (employee: Employee | null): Promise<Notification[]> => {
  const res = await fetchWithWebAppAuth(`${API_URL}/notifications`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.filter((n: any) => n.is_active && n.is_public);
};

export const createFeedback = async (data: { rating: number; comment?: string; category?: string }): Promise<Feedback> => {
  let employee_id = null;
  try {
    const stored = JSON.parse(localStorage.getItem('employee') || 'null');
    employee_id = stored?._id || null;
  } catch (e) {
    console.error('Employee ID olishda xato:', e);
  }

  const res = await fetchWithWebAppAuth(`${API_URL}/feedbacks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      employee_id,
      rating: data.rating,
      comment: data.comment || '',
      category: data.category || 'general',
    })
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error('Feedback API xatosi:', errorText);
    throw new Error('Feedback yuborishda xatolik');
  }
  
  return res.json();
};