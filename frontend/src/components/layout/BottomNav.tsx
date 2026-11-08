import { Home, MessageSquare, User, Bell, Newspaper } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTelegram } from '../../hooks/useTelegram';
import { useEffect, useState, useCallback } from 'react';
import {
  getNotificationsForEmployee,
  type Employee,
} from '../../services/api';

export default function BottomNav() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { hapticFeedback } = useTelegram();

  const [unreadCount, setUnreadCount] = useState(0);

  // ==================== BADGE ====================
  const loadUnreadCount = useCallback(async () => {
    try {
      const employeeStr = localStorage.getItem('employee');
      const employee: Employee | null = employeeStr
        ? JSON.parse(employeeStr)
        : null;

      const notifs = await getNotificationsForEmployee(employee);
      const readIds: string[] = JSON.parse(
        localStorage.getItem('readNotifications') || '[]'
      );

      // ⚡ DIQQAT: n.id emas, n._id bo'lishi kerak!
      const unread = notifs.filter((n) => !readIds.includes(n._id)).length;
      setUnreadCount(unread);
    } catch (e) {
      console.error('Badge load error:', e);
    }
  }, []);

  useEffect(() => {
    loadUnreadCount();

    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [loadUnreadCount]);

  useEffect(() => {
    const handleUpdate = () => loadUnreadCount();

    window.addEventListener('notifications-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('notifications-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [loadUnreadCount]);

  useEffect(() => {
    loadUnreadCount();
  }, [pathname, loadUnreadCount]);

  // ==================== TABS ====================
  const tabs = [
    { path: '/', icon: Home, key: 'nav.home' },
    { path: '/news', icon: Newspaper, key: 'nav.news' },
    { path: '/feedback', icon: MessageSquare, key: 'nav.feedback' },
    {
      path: '/notifications',
      icon: Bell,
      key: 'nav.notifications',
      badge: unreadCount,
    },
    { path: '/profile', icon: User, key: 'nav.profile' },
  ];

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 px-4 pointer-events-none"
      style={{
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 10px)',
      }}
    >
      <div
        className="glass pointer-events-auto mx-auto max-w-md rounded-full p-1.5 flex relative"
        style={{ boxShadow: '0 16px 32px -12px var(--shadow-color)' }}
      >
        {tabs.map(({ path, icon: Icon, key, badge }) => {
          const active = pathname === path;
          const label = t(key);

          return (
            <button
              key={path}
              onClick={() => {
                hapticFeedback('light');
                navigate(path);
              }}
              className="relative flex-1 h-[54px] rounded-full flex flex-col items-center justify-center gap-0.5 overflow-visible"
              style={{ color: active ? '#fff' : 'var(--text-muted)' }}
              aria-label={label}
            >
              {active && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-full"
                  style={{
                    background:
                      'linear-gradient(160deg, #f5222f 0%, #e30613 55%, #b00410 100%)',
                    boxShadow: '0 8px 16px -8px rgba(227,6,19,.8)',
                  }}
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}

              <div className="relative">
                <Icon
                  className="relative w-[19px] h-[19px] transition-transform"
                  strokeWidth={active ? 2.4 : 2}
                  style={{ transform: active ? 'scale(1.1)' : 'scale(1)' }}
                />

                {badge !== undefined && badge > 0 && (
                  <motion.span
                    key={badge}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-bold flex items-center justify-center"
                    style={{
                      background: active ? '#fff' : '#e30613',
                      color: active ? '#e30613' : '#fff',
                      boxShadow: '0 2px 6px rgba(0,0,0,.15)',
                    }}
                  >
                    {badge > 99 ? '99+' : badge}
                  </motion.span>
                )}
              </div>

              <span
                className={`relative text-[10px] leading-none ${active ? 'font-bold' : 'font-medium'
                  }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}