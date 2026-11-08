// frontend/src/utils/media.ts

// API manzilini olamiz (VITE_API_URL dan)
const getApiBaseUrl = (): string => {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    // Agar VITE_API_URL "https://.../api" bo'lsa, oxiridagi "/api" ni olib tashlaymiz
    return apiUrl.replace(/\/api$/, '');
  }
  // Zaxira (fallback) sifatida localhost
  return 'http://localhost:5000';
};

/**
 * Rasm manzilini (URL) to'g'ri formatga keltiradi.
 */
export const getMediaUrl = (path?: string | null): string => {
  if (!path) return '';
  
  // 1. Agar rasm to'liq URL bo'lsa (http yoki https bilan boshlansa), o'zini qaytaramiz
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // 2. API bazaviy manzilini olamiz
  const baseUrl = getApiBaseUrl();

  // 3. Yo'lni tozalaymiz
  let cleanPath = path;
  
  // Agar yo'l allaqachon /uploads/ bilan boshlansa
  if (!cleanPath.startsWith('/')) {
    cleanPath = `/${cleanPath}`;
  }

  // Natijani qaytaramiz
  return `${baseUrl}${cleanPath}`;
};