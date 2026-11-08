// bot/src/helpers.ts
import dotenv from 'dotenv';
import { Lang } from './translations';

dotenv.config();

// Bazadagi API manzili (lokal test uchun yoki serverdagi manzil)
// DIQQAT: .env faylingizda API_URL bo'lishi shart!
const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const BOT_SECRET = process.env.BOT_SECRET || '';



const fetchWithBotAuth = async (url: string, options: RequestInit = {}) => {
  const headers = {
    ...options.headers,
    'x-bot-secret': BOT_SECRET,
  };
  return fetch(url, { ...options, headers });
};


// DD.MM.YYYY -> YYYY-MM-DD
export const convertDate = (text: string): string | null => {
  const match = text.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  const d = parseInt(day, 10);
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);
  if (d < 1 || d > 31 || m < 1 || m > 12 || y < 1900 || y > new Date().getFullYear()) return null;
  return `${year}-${month}-${day}`;
};

export const validatePassport = (text: string): boolean =>
  /^[A-Z]{2}\d{7}$/.test(text.trim().toUpperCase());

// Telegram ID bo'yicha xodimni olish (API orqali)
export const getEmployeeByTelegramId = async (tgId: number) => {
  try {
    const res = await fetchWithBotAuth(`${API_URL}/employees/telegram/${tgId}`);
    if (!res.ok) return null;
    const data = await res.json();
    
    if (!data) return null;
    // MongoDB `_id` ni ishlatadi, shuning uchun documentId ni shunga moslaymiz
    return { ...data, documentId: data._id || data.id };
  } catch (e) {
    console.error('getEmployeeByTelegramId xatosi:', e);
    return null;
  }
};

// Passport va sana bo'yicha xodimni olish (API'dagi verify orqali)
export const getEmployeeByPassport = async (passport: string, isoDate: string) => {
  try {
    const cleanPassport = passport.trim().toUpperCase();
    const url = `${API_URL}/employees/verify?passport=${cleanPassport}&birth_date=${isoDate}`;
    
    console.log(`🌐 Bot API'ga so'rov yubordi: ${url}`);
    
    const res = await fetchWithBotAuth(url);
    const text = await res.text(); // API javobini matn ko'rinishida o'qiymiz

    console.log(`📥 API javobi (Status: ${res.status}): ${text}`);

    if (!res.ok) {
      return null; // API xato qaytardi
    }

    const data = JSON.parse(text);
    return { ...data, documentId: data._id || data.id };

  } catch (e: any) {
    console.error('❌ getEmployeeByPassport xatosi:', e.message);
    return null;
  }
};

/**
 * Telegram ID ni xodimga bog'laydi.
 */
export const saveTelegramId = async (documentId: string, tgId: number) => {
  try {
    // 1. Avval shu Telegram ID ni boshqa xodimlardan tozalash
    const clearRes = await fetchWithBotAuth(`${API_URL}/employees/clear-telegram/${tgId}`, { method: 'PATCH' });
    console.log('🧹 Clear telegram response status:', clearRes.status);

    // 2. Yangi xodimga biriktirish
    const res = await fetchWithBotAuth(`${API_URL}/employees/${documentId}/telegram`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegram_id: String(tgId) })
    });

    console.log('📥 Save telegram response status:', res.status);
    const data = await res.text();
    console.log('📥 Save telegram response body:', data);

    if (!res.ok) throw new Error(`API xatosi: ${res.status}`);
    return true;
  } catch (e: any) {
    console.error('⚠️ Telegram ID saqlashda xatolik:', e.message);
    return false;
  }
};

// Tilni saqlash
export const saveLanguage = async (documentId: string, lang: Lang) => {
  try {
     const res = await fetchWithBotAuth(`${API_URL}/employees/${documentId}/language`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: lang })
    });

    if (!res.ok) throw new Error('API xatosi');
    return true;
  } catch (e: any) {
    console.error('⚠️ Tilni saqlashda xatolik:', e.message);
    return false;
  }
};