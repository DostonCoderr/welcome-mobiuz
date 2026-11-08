import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import './i18n';
import HomePage from './pages/HomePage';
import SectionPage from './pages/SectionPage';
import FeedbackPage from './pages/FeedbackPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import HelpPage from './pages/HelpPage';
import NewsPage from './pages/NewsPage';
import BottomNav from './components/layout/BottomNav';
import Snowfall from './components/ui/Snowfall';
import { useThemeStore } from './store/themeStore';
import {
  getEmployeeByTelegramId,
  getEmployeeByDocumentId,
  type Employee,
} from './services/api';

const BOT_USERNAME = 'mobiuz_welcome_bot';

// ==================== AUTH CHECK ====================
const saveEmployee = (e: Employee) => {
  localStorage.setItem(
    'employee',
    JSON.stringify({
      _id: e._id,
      documentId: e._id, // Mongo'da documentId = _id
      department: e.department || null,
      position: e.position || null,
    })
  );
};

const checkAuth = async (): Promise<boolean> => {
  // 1. Token orqali (Bot bergan havola)
  const token = new URLSearchParams(window.location.search).get('token');
  if (token) {
    try {
      const [documentId] = atob(token).split(':');
      const emp = await getEmployeeByDocumentId(documentId);
      if (emp) {
        saveEmployee(emp);
        window.history.replaceState({}, '', window.location.pathname);
        return true;
      }
    } catch (e) {
      console.error('❌ Token xatosi:', e);
    }
  }

  // 2. Telegram ID orqali (ENG ISHONCHLI USUL)
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  console.log('Telegram user:', tgUser); // Tekshirish uchun
  
  if (tgUser) {
    const emp = await getEmployeeByTelegramId(String(tgUser.id));
    if (emp) {
      saveEmployee(emp);
      return true;
    }
  }

  // 3. LocalStorage orqali
  try {
    const stored = JSON.parse(localStorage.getItem('employee') || 'null');
    if (stored?.documentId) {
      const emp = await getEmployeeByDocumentId(stored.documentId);
      if (emp) {
        saveEmployee(emp);
        return true;
      }
    }
  } catch {
    /* ignore */
  }

  localStorage.removeItem('employee');
  return false;
};

// ==================== REQUIRE AUTH ====================
function RequireAuth() {
  const [status, setStatus] = useState<'loading' | 'ok' | 'denied'>('loading');

  useEffect(() => {
    (async () => {
      const ok = await checkAuth();
      setStatus(ok ? 'ok' : 'denied');
    })();
  }, []);

  if (status === 'loading') {
    return (
      <div className="hero-gradient min-h-dvh flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm">Ma'lumotlar tekshirilmoqda...</p>
        </div>
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <div className="hero-gradient min-h-dvh flex items-center justify-center px-4">
        <div className="text-center text-white max-w-sm card p-6 shadow-xl">
          <h1 className="text-[20px] font-bold mb-2">⚠️ Tizimga kiring</h1>
          <p className="text-white/80 text-[13px] mb-6">
            Iltimos, ushbu sahifani faqat Telegram bot orqali oching. Bot sizning ma'lumotlaringizni tasdiqlaydi.
          </p>
          <a
            href={`https://t.me/${BOT_USERNAME}`}
            className="inline-block px-6 py-3 bg-white text-red-600 rounded-xl font-bold w-full"
          >
            🤖 Telegram Botga O'tish
          </a>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

// ==================== LAYOUT ====================
function Layout() {
  const { theme } = useThemeStore();
  const { pathname } = useLocation();
  const isDark = theme === 'dark';
  const showNav = ['/', '/news', '/feedback', '/notifications', '/profile'].includes(pathname);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="relative h-dvh overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
      <Snowfall
        className="fixed inset-0 w-full h-full pointer-events-none z-0"
        count={26}
        color={isDark ? '255,255,255' : '130,150,180'}
        opacity={isDark ? 0.3 : 0.45}
      />

      <div
        id="scroll-container"
        className="relative z-10 h-full overflow-y-auto"
        style={{
          paddingBottom: showNav ? '90px' : '0',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <Outlet />
      </div>

      {showNav && <BottomNav />}
    </div>
  );
}

// ==================== APP ====================
function App() {
  const { initTheme, theme } = useThemeStore();
  const { i18n } = useTranslation();

  useEffect(() => {
    initTheme();

    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get('lang');
    if (urlLang === 'uz' || urlLang === 'ru') {
      i18n.changeLanguage(urlLang);
      localStorage.setItem('language', urlLang);
    }
  }, []);

  const isDark = theme === 'dark';

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RequireAuth />}>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/section/:id" element={<SectionPage />} />
            <Route path="/feedback" element={<FeedbackPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/help" element={<HelpPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Toaster
        position="top-center"
        theme={isDark ? 'dark' : 'light'}
        richColors
        closeButton
        duration={3000}
        toastOptions={{
          style: {
            borderRadius: '14px',
            fontSize: '13px',
            fontWeight: '600',
            padding: '12px 14px',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 10px 24px -12px var(--shadow-color)',
          },
        }}
      />
    </BrowserRouter>
  );
}

export default App;