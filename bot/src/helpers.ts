// bot/src/helpers.ts
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { Lang } from './translations';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

const EMP_SELECT = '*, position:positions(*), department:departments(*)';

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

export const getEmployeeByTelegramId = async (tgId: number) => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select(EMP_SELECT)
      .eq('telegram_id', String(tgId))
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return { ...data, documentId: data.document_id };
  } catch (e) {
    console.error('getEmployeeByTelegramId xatosi:', e);
    return null;
  }
};

export const getEmployeeByPassport = async (passport: string, isoDate: string) => {
  try {
    const cleanPassport = passport.trim().toUpperCase();
    const { data, error } = await supabase
      .from('employees')
      .select(EMP_SELECT)
      .eq('passport', cleanPassport)
      .maybeSingle();

    if (error) {
      console.error('❌ Supabase qidiruv xatosi:', error.message);
      return null;
    }
    if (!data) {
      console.log(`❌ Passport topilmadi: ${cleanPassport}`);
      return null;
    }

    const dbDateClean = data.birth_date ? String(data.birth_date).split('T')[0] : null;
    if (dbDateClean !== isoDate) {
      console.log(`❌ Sana mos kelmadi: baza=${dbDateClean}, kiritilgan=${isoDate}`);
      return null;
    }

    return { ...data, documentId: data.document_id };
  } catch (e: any) {
    console.error('getEmployeeByPassport xatosi:', e.message);
    return null;
  }
};

/**
 * Telegram ID ni xodimga bog'laydi.
 * Avval shu Telegram ID boshqa xodimlarda bo'lsa, tozalaydi —
 * aks holda web app bitta Telegram ID uchun bir nechta xodim topib, adashadi.
 */
export const saveTelegramId = async (documentId: string, tgId: number) => {
  try {
    await supabase
      .from('employees')
      .update({ telegram_id: null })
      .eq('telegram_id', String(tgId))
      .neq('document_id', documentId);

    const { error } = await supabase
      .from('employees')
      .update({ telegram_id: String(tgId) })
      .eq('document_id', documentId);

    if (error) throw error;
    return true;
  } catch (e: any) {
    console.error('⚠️ Telegram ID saqlashda xatolik:', e.message);
    return false;
  }
};

// Tilni saqlash (employees jadvalida `language` ustuni bo'lsa)
export const saveLanguage = async (documentId: string, lang: Lang) => {
  try {
    const { error } = await supabase
      .from('employees')
      .update({ language: lang })
      .eq('document_id', documentId);
    if (error) throw error;
    return true;
  } catch (e: any) {
    console.error('⚠️ Tilni saqlashda xatolik:', e.message);
    return false;
  }
};