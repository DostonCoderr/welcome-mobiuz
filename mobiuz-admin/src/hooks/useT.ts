import { useLang } from './useLang';
import { D } from '../i18n/dict';

/** Tanlangan tilga mos tarjima lug'ati: const { t, lang } = useT(); */
export function useT() {
  const { lang, setLang } = useLang();
  return { t: D[lang], lang, setLang };
}