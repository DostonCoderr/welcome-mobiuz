import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, CheckCheck, FileText, Gift, Calendar, Info,
  ChevronRight, Sparkles, Filter, Trash2, X, Inbox,
  BellOff, RefreshCw, Check
} from 'lucide-react';
import { useTelegram } from '../hooks/useTelegram';
import PageHeader from '../components/layout/PageHeader';
import {
  getNotificationsForEmployee,
  type Notification,
  type Employee,
} from '../services/api';
import { showToast } from '../utils/toast';

const iconMap = {
  info: Info,
  section: FileText,
  event: Calendar,
  gift: Gift,
};

const colorMap = {
  info: '#3b82f6',
  section: '#e30613',
  event: '#f59e0b',
  gift: '#ec4899',
};

type FilterType = 'all' | 'unread' | 'info' | 'section' | 'event' | 'gift';

export default function NotificationsPage() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { hapticFeedback } = useTelegram();
  const isUz = i18n.language === 'uz';

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);

  const employee: Employee | null = useMemo(() => {
    try {
      const str = localStorage.getItem('employee');
      return str ? JSON.parse(str) : null;
    } catch {
      return null;
    }
  }, []);

  // LocalStorage dan o'qilgan ID larni yuklash
  useEffect(() => {
    const saved = localStorage.getItem('readNotifications');
    if (saved) {
      try {
        setReadIds(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await getNotificationsForEmployee(employee);
      setNotifications(data);
    } catch (e) {
      console.error('Load notifications error:', e);
      showToast.error();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [employee]);

  // O'qilganlarni saqlash
  const saveRead = (ids: string[]) => {
    localStorage.setItem('readNotifications', JSON.stringify(ids));
    setReadIds(ids);
  };

  // Bitta bildirishnomani o'qilgan qilish
  const markAsRead = (id: string) => {
    hapticFeedback('light');
    if (!readIds.includes(id)) {
      saveRead([...readIds, id]);
      window.dispatchEvent(new Event('notifications-updated'));
    }
  };

  // Hammasini o'qilgan qilish
  const markAllAsRead = () => {
    hapticFeedback('medium');
    const allIds = notifications.map((n) => n._id);
    saveRead(allIds);
    showToast.success(isUz ? 'Hammasi o\'qilgan' : 'Все прочитаны');
    window.dispatchEvent(new Event('notifications-updated'));
  };

  // Holatni birlashtirish (o'qilgan/o'qilmagan)
  const notificationsWithRead = useMemo(() => {
    return notifications.map((n) => ({
      ...n,
      is_read: readIds.includes(n._id),
    }));
  }, [notifications, readIds]);

  const unreadCount = notificationsWithRead.filter((n) => !n.is_read).length;

  const filtered = useMemo(() => {
    if (filter === 'all') return notificationsWithRead;
    if (filter === 'unread')
      return notificationsWithRead.filter((n) => !n.is_read);
    return notificationsWithRead.filter((n) => n.type === filter);
  }, [notificationsWithRead, filter]);

  const counts = useMemo(
    () => ({
      all: notificationsWithRead.length,
      unread: unreadCount,
      info: notificationsWithRead.filter((n) => n.type === 'info').length,
      section: notificationsWithRead.filter((n) => n.type === 'section').length,
      event: notificationsWithRead.filter((n) => n.type === 'event').length,
      gift: notificationsWithRead.filter((n) => n.type === 'gift').length,
    }),
    [notificationsWithRead, unreadCount]
  );

  const filterTabs: {
    id: FilterType;
    icon: any;
    label_uz: string;
    label_ru: string;
    count: number;
    color: string;
  }[] = [
    { id: 'all', icon: Bell, label_uz: 'Hammasi', label_ru: 'Все', count: counts.all, color: '#6b7280' },
    { id: 'unread', icon: Inbox, label_uz: 'O\'qilmagan', label_ru: 'Непрочитанные', count: counts.unread, color: '#e30613' },
    { id: 'section', icon: FileText, label_uz: 'Bo\'limlar', label_ru: 'Разделы', count: counts.section, color: '#e30613' },
    { id: 'event', icon: Calendar, label_uz: 'Voqealar', label_ru: 'События', count: counts.event, color: '#f59e0b' },
    { id: 'gift', icon: Gift, label_uz: 'Sovg\'alar', label_ru: 'Подарки', count: counts.gift, color: '#ec4899' },
    { id: 'info', icon: Info, label_uz: 'Xabarlar', label_ru: 'Инфо', count: counts.info, color: '#3b82f6' },
  ];

  if (loading) {
    return (
      <div className="min-h-dvh pb-10">
        <PageHeader title={isUz ? 'Bildirishnomalar' : 'Уведомления'} back />
        <div className="relative z-10 px-4 -mt-5 space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-20" />
          ))}
        </div>
      </div>
    );
  }

  if (notificationsWithRead.length === 0) {
    return (
      <div className="min-h-dvh pb-10">
        <PageHeader title={isUz ? 'Bildirishnomalar' : 'Уведомления'} back />
        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative z-10 px-4 -mt-5"
        >
          <div className="card p-10 text-center">
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <BellOff
                className="w-16 h-16 mx-auto mb-4"
                style={{ color: 'var(--text-muted)' }}
              />
            </motion.div>
            <h3
              className="text-[16px] font-extrabold mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              {isUz ? 'Bildirishnomalar yo\'q' : 'Нет уведомлений'}
            </h3>
            <p
              className="text-[13px] mb-5"
              style={{ color: 'var(--text-secondary)' }}
            >
              {isUz
                ? 'Yangi xabarlar shu yerda ko\'rinadi'
                : 'Новые сообщения появятся здесь'}
            </p>
            <button
              onClick={() => {
                hapticFeedback('light');
                navigate('/');
              }}
              className="btn-primary"
              style={{
                display: 'inline-flex',
                width: 'auto',
                padding: '.7rem 1.4rem',
              }}
            >
              {isUz ? 'Bosh sahifaga' : 'На главную'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh pb-10">
      <PageHeader
        title={isUz ? 'Bildirishnomalar' : 'Уведомления'}
        subtitle={
          unreadCount > 0
            ? `${unreadCount} ${isUz ? 'yangi' : 'новых'}`
            : undefined
        }
        back
        right={
          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="on-red-btn press px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                {isUz ? 'Hammasi' : 'Все'}
              </button>
            )}
            <button
              onClick={() => {
                hapticFeedback('light');
                setShowFilters(!showFilters);
              }}
              className="on-red-btn press w-8 h-8 rounded-full flex items-center justify-center"
              aria-label="Filters"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        }
      />

      <motion.main
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 px-4 -mt-5 space-y-2"
      >
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
                {filterTabs.map(
                  ({ id, icon: Icon, label_uz, label_ru, count, color }) => {
                    const active = filter === id;
                    return (
                      <button
                        key={id}
                        onClick={() => {
                          hapticFeedback('light');
                          setFilter(id);
                        }}
                        className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all border"
                        style={{
                          background: active
                            ? `${color}15`
                            : 'var(--bg-card)',
                          borderColor: active ? color : 'transparent',
                          borderWidth: '1.5px',
                        }}
                      >
                        <Icon
                          className="w-3.5 h-3.5 flex-shrink-0"
                          style={{
                            color: active ? color : 'var(--text-muted)',
                          }}
                        />
                        <span
                          className="text-[11px] font-bold whitespace-nowrap"
                          style={{
                            color: active ? color : 'var(--text-primary)',
                          }}
                        >
                          {isUz ? label_uz : label_ru}
                        </span>
                        {count > 0 && (
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
                            style={{
                              background: active
                                ? color
                                : 'var(--bg-secondary)',
                              color: active ? '#fff' : 'var(--text-muted)',
                            }}
                          >
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  }
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {filtered.length === 0 ? (
          <div className="card p-10 text-center">
            <Inbox
              className="w-12 h-12 mx-auto mb-3"
              style={{ color: 'var(--text-muted)' }}
            />
            <p
              className="text-[14px]"
              style={{ color: 'var(--text-secondary)' }}
            >
              {isUz
                ? 'Bu turdagi bildirishnomalar yo\'q'
                : 'Уведомлений этого типа нет'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {filtered.map((notif, i) => {
                const Icon = iconMap[notif.type] || Info;
                const color = colorMap[notif.type] || '#6b7280';
                const title = isUz ? notif.title_uz : notif.title_ru;
                const message = isUz ? notif.message_uz : notif.message_ru;

                return (
                  <motion.div
                    key={notif._id}
                    layout
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ x: -100, opacity: 0 }}
                    transition={{ delay: Math.min(i, 6) * 0.03 }}
                    className="card w-full flex items-start gap-3 p-3.5 text-left relative overflow-hidden"
                    style={{
                      background: notif.is_read
                        ? 'var(--bg-card)'
                        : 'var(--red-soft)',
                    }}
                  >
                    {/* O'qilmagan chizig'i */}
                    {!notif.is_read && (
                      <div
                        className="absolute top-0 left-0 w-1 h-full"
                        style={{ background: '#e30613' }}
                      />
                    )}

                    {/* Asosiy kontent (bosilganda o'qilgan bo'ladi) */}
                    <button
                      onClick={() => {
                        markAsRead(notif._id);
                        if (notif.link) {
                          hapticFeedback('medium');
                          window.open(notif.link, '_blank');
                        } else {
                          hapticFeedback('medium');
                        }
                      }}
                      className="flex-1 flex items-start gap-3 min-w-0 text-left"
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${color}18` }}
                      >
                        <Icon className="w-5 h-5" style={{ color }} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4
                            className="text-[13px] font-bold truncate"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {title}
                          </h4>
                          {!notif.is_read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-mobiuz-600 flex-shrink-0" />
                          )}
                        </div>
                        <p
                          className="text-[12px] line-clamp-2 leading-snug"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {message}
                        </p>
                        {notif.publishedAt && (
                          <p
                            className="text-[10px] mt-1 font-medium"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {new Date(notif.publishedAt).toLocaleDateString(
                              isUz ? 'uz-UZ' : 'ru-RU',
                              {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              }
                            )}
                          </p>
                        )}
                      </div>

                      {notif.link && (
                        <ChevronRight
                          className="w-4 h-4 flex-shrink-0 mt-2"
                          style={{ color: 'var(--text-muted)' }}
                        />
                      )}
                    </button>

                    {/* O'qilgan qilish tugmasi (Check) */}
                    {!notif.is_read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notif._id);
                        }}
                        title={isUz ? "O'qilgan qilish" : 'Отметить прочитанным'}
                        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-green-500 hover:bg-green-500/20 active:scale-95 transition-all mt-1"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Pastki tugmalar */}
        {notificationsWithRead.length > 0 && (
          <div className="flex gap-2 pt-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="card press flex-1 flex items-center justify-center gap-1.5 p-2.5 text-[12px] font-bold"
                style={{ color: '#10b981' }}
              >
                <CheckCheck className="w-3.5 h-3.5" />
                {isUz ? 'Hammasini o\'qilgan' : 'Все прочитаны'}
              </button>
            )}
            <button
              onClick={loadNotifications}
              className="card press flex-1 flex items-center justify-center gap-1.5 p-2.5 text-[12px] font-bold"
              style={{ color: '#3b82f6' }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {isUz ? 'Yangilash' : 'Обновить'}
            </button>
          </div>
        )}
      </motion.main>
    </div>
  );
}