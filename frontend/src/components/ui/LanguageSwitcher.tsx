import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const isUz = i18n.language === 'uz';

  const toggle = () => {
    const next = isUz ? 'ru' : 'uz';
    i18n.changeLanguage(next);
    localStorage.setItem('language', next);
  };

  return (
    <button
      onClick={toggle}
      className="on-red-btn press h-10 px-3 rounded-full flex items-center gap-1 text-[12px] font-bold"
      aria-label="Change language"
    >
      <span className={isUz ? 'opacity-100' : 'opacity-50'}>UZ</span>
      <span className="opacity-40">/</span>
      <span className={!isUz ? 'opacity-100' : 'opacity-50'}>RU</span>
    </button>
  );
}