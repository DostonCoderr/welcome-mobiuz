import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Moon, Languages, LogOut, Briefcase, Building2, ChevronRight,
  Bell, HelpCircle, FileText, Award, TrendingUp, Star,
  CreditCard, Calendar, Shield, CheckCircle2, Settings,
} from 'lucide-react';
import { useTelegram } from '../hooks/useTelegram';
import { useThemeStore } from '../store/themeStore';
import PageHeader from '../components/layout/PageHeader';
import { showToast } from '../utils/toast';

const maskPassport = (p?: string) =>
  p && p.length >= 6 ? `${p.slice(0, 2)}•••${p.slice(-3)}` : p || '—';

const formatDate = (date?: string) => {
  if (!date) return '—';
  try {
    return new Date(date).toLocaleDateString('uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return date;
  }
};

export default function ProfilePage() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, hapticFeedback } = useTelegram();
  const { theme, setTheme } = useThemeStore();
  const isUz = i18n.language === 'uz';
  const isDark = theme === 'dark';

  const [notifications, setNotifications] = useState(
    () => localStorage.getItem('notifications') !== 'false'
  );

  const employee = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('employee') || 'null');
    } catch {
      return null;
    }
  }, []);

  const name = user?.first_name || (isUz ? 'Xodim' : 'Сотрудник');
  const lastName = user?.last_name || '';
  const photo = (user as any)?.photo_url as string | undefined;
  const initials = `${name.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  const setLang = (lng: 'uz' | 'ru') => {
    hapticFeedback('light');
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
    showToast.success(lng === 'uz' ? 'Til o\'zgartirildi' : 'Язык изменён');
  };

  const toggleNotifications = () => {
    hapticFeedback('light');
    const newValue = !notifications;
    setNotifications(newValue);
    localStorage.setItem('notifications', String(newValue));
    showToast.success(
      newValue
        ? isUz
          ? 'Bildirishnomalar yoniq'
          : 'Уведомления включены'
        : isUz
          ? 'Bildirishnomalar o\'chirildi'
          : 'Уведомления выключены'
    );
  };

  const logout = () => {
    hapticFeedback('medium');
    if (confirm(isUz ? 'Chiqishni tasdiqlaysizmi?' : 'Выйти из аккаунта?')) {
      localStorage.removeItem('employee');
      showToast.logoutSuccess();
      setTimeout(() => {
        navigate('/auth', { replace: true });
      }, 500);
    }
  };

  const stats = [
    { icon: FileText, value: '12', label: isUz ? "Bo'limlar" : 'Разделов', color: '#e30613' },
    { icon: Award, value: '90', label: isUz ? 'Kun' : 'Дней', color: '#10b981' },
    { icon: TrendingUp, value: '4.8', label: isUz ? 'Reyting' : 'Рейтинг', color: '#f59e0b' },
  ];

  return (
    <div className="min-h-dvh pb-32">
      <PageHeader title={isUz ? 'Profil' : 'Профиль'} />

      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 px-4 -mt-5 space-y-3"
      >
        <div className="card p-5 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 hero-gradient -mr-16 -mt-16" />

          <div className="relative flex items-center gap-4">
            {photo ? (
              <img
                src={photo}
                alt={name}
                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                style={{ borderColor: 'var(--bg-card)' }}
              />
            ) : (
              <div className="hero-gradient w-20 h-20 rounded-full flex items-center justify-center text-white text-[28px] font-extrabold shadow-lg flex-shrink-0">
                {initials}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h2
                className="text-[19px] font-extrabold truncate leading-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                {name} {lastName}
              </h2>
              {user?.username && (
                <p className="text-[13px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  @{user.username}
                </p>
              )}

              <div className="flex flex-wrap gap-1.5 mt-2">
                {employee?.position?.name_uz && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: 'var(--red-soft)', color: '#e30613' }}
                  >
                    <Briefcase className="w-3 h-3" />
                    {isUz ? employee.position.name_uz : employee.position.name_ru}
                  </span>
                )}
                {employee?.department?.name_uz && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                  >
                    <Building2 className="w-3 h-3" />
                    {isUz ? employee.department.name_uz : employee.department.name_ru}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--red-soft)' }}>
                <CreditCard className="w-4 h-4 text-mobiuz-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  {isUz ? 'Pasport' : 'Паспорт'}
                </p>
                <p className="text-[12px] font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                  {maskPassport(employee?.passport)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--red-soft)' }}>
                <Calendar className="w-4 h-4 text-mobiuz-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  {isUz ? "Tug'ilgan" : 'Рождение'}
                </p>
                <p className="text-[12px] font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                  {formatDate(employee?.birth_date)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {stats.map(({ icon: Icon, value, label, color }) => (
            <motion.div
              key={label}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="card p-3 text-center"
            >
              <div
                className="w-9 h-9 rounded-xl mx-auto flex items-center justify-center mb-1.5"
                style={{ background: `${color}15` }}
              >
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div className="text-[16px] font-extrabold" style={{ color: 'var(--text-primary)' }}>
                {value}
              </div>
              <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                {label}
              </div>
            </motion.div>
          ))}
        </div>

        <div>
          <h3 className="text-[12px] font-bold uppercase tracking-wider mb-2 px-1" style={{ color: 'var(--text-muted)' }}>
            {isUz ? 'Sozlamalar' : 'Настройки'}
          </h3>

          <div className="card divide-y" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--red-soft)' }}>
                  <Moon className="w-[18px] h-[18px] text-mobiuz-600" />
                </div>
                <span className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {isUz ? 'Tungi rejim' : 'Тёмная тема'}
                </span>
              </div>
              <button
                role="switch"
                aria-checked={isDark}
                onClick={() => {
                  hapticFeedback('light');
                  setTheme(isDark ? 'light' : 'dark');
                }}
                className="relative w-12 h-7 rounded-full transition-colors flex-shrink-0"
                style={{ background: isDark ? '#e30613' : 'var(--border-color)' }}
              >
                <motion.span
                  layout
                  transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                  className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow"
                  style={{ left: isDark ? 'calc(100% - 1.625rem)' : '0.125rem' }}
                />
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--red-soft)' }}>
                  <Languages className="w-[18px] h-[18px] text-mobiuz-600" />
                </div>
                <span className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {isUz ? 'Til' : 'Язык'}
                </span>
              </div>
              <div className="flex p-1 rounded-full flex-shrink-0" style={{ background: 'var(--bg-secondary)' }}>
                {(['uz', 'ru'] as const).map((lng) => {
                  const active = (lng === 'uz') === isUz;
                  return (
                    <button
                      key={lng}
                      onClick={() => setLang(lng)}
                      className="px-3.5 py-1 rounded-full text-[12px] font-bold transition-colors"
                      style={{
                        background: active ? '#e30613' : 'transparent',
                        color: active ? '#fff' : 'var(--text-secondary)',
                      }}
                    >
                      {lng.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--red-soft)' }}>
                  <Bell className="w-[18px] h-[18px] text-mobiuz-600" />
                </div>
                <span className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {isUz ? 'Bildirishnomalar' : 'Уведомления'}
                </span>
              </div>
              <button
                role="switch"
                aria-checked={notifications}
                onClick={toggleNotifications}
                className="relative w-12 h-7 rounded-full transition-colors flex-shrink-0"
                style={{ background: notifications ? '#e30613' : 'var(--border-color)' }}
              >
                <motion.span
                  layout
                  transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                  className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow"
                  style={{ left: notifications ? 'calc(100% - 1.625rem)' : '0.125rem' }}
                />
              </button>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-[12px] font-bold uppercase tracking-wider mb-2 px-1" style={{ color: 'var(--text-muted)' }}>
            {isUz ? 'Yordam' : 'Помощь'}
          </h3>

          <div className="card divide-y" style={{ borderColor: 'var(--border-color)' }}>
            <button
              onClick={() => {
                hapticFeedback('light');
                navigate('/help');
              }}
              className="w-full flex items-center justify-between gap-3 p-4 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--red-soft)' }}>
                  <HelpCircle className="w-[18px] h-[18px] text-mobiuz-600" />
                </div>
                <span className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {isUz ? 'Yordam markazi' : 'Центр помощи'}
                </span>
              </div>
              <ChevronRight className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
            </button>

            <button
              onClick={() => {
                hapticFeedback('light');
                navigate('/notifications');
              }}
              className="w-full flex items-center justify-between gap-3 p-4 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--red-soft)' }}>
                  <Bell className="w-[18px] h-[18px] text-mobiuz-600" />
                </div>
                <span className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {isUz ? 'Bildirishnomalar' : 'Уведомления'}
                </span>
              </div>
              <ChevronRight className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
            </button>

            <button
              onClick={() => {
                hapticFeedback('light');
                navigate('/feedback');
              }}
              className="w-full flex items-center justify-between gap-3 p-4 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--red-soft)' }}>
                  <Star className="w-[18px] h-[18px] text-mobiuz-600" />
                </div>
                <span className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {isUz ? 'Fikr qoldirish' : 'Оставить отзыв'}
                </span>
              </div>
              <ChevronRight className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-[12px] font-bold uppercase tracking-wider mb-2 px-1" style={{ color: 'var(--text-muted)' }}>
            {isUz ? 'Xavfsizlik' : 'Безопасность'}
          </h3>

          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#10b98120' }}>
                <Shield className="w-[18px] h-[18px]" style={{ color: '#10b981' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold" style={{ color: 'var(--text-primary)' }}>
                  {isUz ? 'Tasdiqlangan xodim' : 'Верифицированный сотрудник'}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  {isUz ? 'Ma\'lumotlar HR tomonidan tasdiqlangan' : 'Данные подтверждены HR'}
                </p>
              </div>
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: '#10b981' }} />
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="card press w-full flex items-center justify-center gap-2 p-4 text-[14px] font-bold"
          style={{ color: '#e30613' }}
        >
          <LogOut className="w-[18px] h-[18px]" />
          {isUz ? 'Chiqish' : 'Выйти'}
        </button>

        <p className="text-center text-[11px] pt-2" style={{ color: 'var(--text-muted)' }}>
          Mobiuz Welcome Book v1.0.0
        </p>
      </motion.div>
    </div>
  );
}