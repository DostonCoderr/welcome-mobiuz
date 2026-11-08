import type { Lang } from '../hooks/useLang';

const CYR: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'j', з: 'z', и: 'i',
  й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't',
  у: 'u', ф: 'f', х: 'x', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sh', ъ: '', ы: 'i', ь: '',
  э: 'e', ю: 'yu', я: 'ya', ў: 'o', қ: 'q', ғ: 'g', ҳ: 'h',
};

/** "Call Center" → "call-center", "Бухгалтерия" → "buxgalteriya" */
export const slugify = (s: string): string =>
  s
    .toLowerCase()
    .split('')
    .map((c) => CYR[c] ?? c)
    .join('')
    .replace(/[ʻʼ'’‘`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** Mongo (_id) yoki SQL (id) — qaysi biri bo'lsa, stringga aylantiradi */
export const idOf = (x: any): string => String(x?._id ?? x?.id ?? '');

/** Bog'langan obyekt (populated) yoki oddiy id — ikkalasidan id olish */
export const refId = (ref: any): string =>
  ref && typeof ref === 'object' ? idOf(ref) : ref ? String(ref) : '';

/** Bog'lanishni ro'yxatdan topib, to'liq obyektga aylantirish */
export const resolveRef = (list: any[], ref: any): any => {
  if (!ref) return null;
  if (typeof ref === 'object') return ref;
  return list.find((x) => idOf(x) === String(ref)) ?? null;
};

/** { name_uz, name_ru } dan joriy tildagi nomni olish */
export const nm = (o: any, lang: Lang): string =>
  lang === 'ru'
    ? o?.name_ru || o?.name_uz || o?.name || ''
    : o?.name_uz || o?.name_ru || o?.name || '';

export const initials = (s?: string): string =>
  (s || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?';

export const toDateInput = (v?: string): string => (v ? String(v).slice(0, 10) : '');

export const isValidUrl = (s: string): boolean => /^(https?:\/\/\S+|\/\S*)$/i.test(s.trim());

// ---------- Sana ----------
const MONTHS: Record<Lang, string[]> = {
  uz: ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'],
  ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
};
const WEEKDAYS: Record<Lang, string[]> = {
  uz: ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'],
  ru: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
};

/** "2026-11-05" ni mahalliy sana sifatida o'qiydi (vaqt zonasi siljimasligi uchun) */
export const parseDate = (v?: string | Date | null): Date | null => {
  if (!v) return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v).slice(0, 10));
  const d = m && String(v).length <= 10 ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(v);
  return isNaN(d.getTime()) ? null : d;
};

export const fmtDate = (v: string | Date | null | undefined, lang: Lang): string => {
  const d = parseDate(v);
  return d ? `${d.getDate()} ${MONTHS[lang][d.getMonth()]} ${d.getFullYear()}` : '—';
};

/** "Payshanba, 5 noyabr 2026" — tilga mos */
export const fmtDateLong = (d: Date, lang: Lang): string =>
  `${WEEKDAYS[lang][d.getDay()]}, ${d.getDate()} ${MONTHS[lang][d.getMonth()]} ${d.getFullYear()}`;

export const ageFrom = (v?: string): number | null => {
  const d = parseDate(v);
  if (!d) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const beforeBirthday =
    now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate());
  if (beforeBirthday) age--;
  return age >= 0 && age < 130 ? age : null;
};

/** "3 daqiqa oldin" / "3 мин. назад" */
export const relTime = (v: string | undefined, lang: Lang): string => {
  const d = parseDate(v);
  if (!d) return '';
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  const ru = lang === 'ru';
  if (mins < 1) return ru ? 'только что' : 'hozirgina';
  if (mins < 60) return ru ? `${mins} мин. назад` : `${mins} daqiqa oldin`;
  const h = Math.floor(mins / 60);
  if (h < 24) return ru ? `${h} ч. назад` : `${h} soat oldin`;
  const days = Math.floor(h / 24);
  if (days < 7) return ru ? `${days} дн. назад` : `${days} kun oldin`;
  return fmtDate(d, lang);
};

/** Yaratilgan sana maydoni turlicha nomlanishi mumkin */
export const createdOf = (x: any): string | undefined =>
  x?.createdAt || x?.created_at || x?.publishedAt || undefined;

export const copyText = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};