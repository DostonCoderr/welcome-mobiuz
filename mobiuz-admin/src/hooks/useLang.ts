import { useCallback, useEffect, useState } from 'react';

export type Lang = 'uz' | 'ru';

const KEY = 'admin_lang';

const read = (): Lang => {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'uz' || v === 'ru') return v;
  } catch {
    /* jim */
  }
  return navigator.language?.toLowerCase().startsWith('ru') ? 'ru' : 'uz';
};

/**
 * Admin panel tili (uz / ru). Tanlov localStorage'da saqlanadi
 * va boshqa sahifalarda ham xuddi shu hook bilan o'qiladi.
 */
export function useLang() {
  const [lang, setLangState] = useState<Lang>(read);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {
      /* jim */
    }
    window.dispatchEvent(new Event('app:lang'));
  }, []);

  // <html lang="..."> ni yangilab turamiz
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Boshqa komponent yoki tabda til o'zgarsa — sinxronlash
  useEffect(() => {
    const sync = () => setLangState(read());
    window.addEventListener('app:lang', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('app:lang', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return { lang, setLang };
}