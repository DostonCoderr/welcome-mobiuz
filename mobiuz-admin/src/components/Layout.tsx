import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import gsap from 'gsap';
import {
  Users, Building2, Briefcase, FileText, Image as ImageIcon, MessageSquare, Bell, Settings,
  LayoutDashboard, LogOut, Menu, X, ShieldCheck, Search, PanelLeftClose,
  PanelLeftOpen, RefreshCw, Send, Globe, type LucideIcon,
} from 'lucide-react';
import Aurora from './Aurora';
import Snowfall from './Snowfall';
import CommandPalette, { type Command } from './CommandPalette';
import NotificationBell from './NotificationBell';
import { useNow } from '../hooks/useNow';
import { formatTime, formatUzDate } from '../utils/format';
import { useT } from '../hooks/useT';

interface NavItem {
  path: string;
  icon: LucideIcon;
  label: string;
  desc: string;
}

const BOT_URL = 'https://t.me/mobiuz_welcome_bot';
const LS_COLLAPSED = 'admin_sb_collapsed';

const getAdminUser = (): { name?: string; email?: string; avatar?: string } => {
  try {
    return JSON.parse(localStorage.getItem('admin_user') || '{}');
  } catch {
    return {};
  }
};

/** Alohida komponent — har soniyada faqat soat qayta chiziladi */
function TopClock() {
  const now = useNow(1000);
  return (
    <div className="hidden items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 md:flex">
      <span className="font-mono text-sm font-bold tabular-nums text-white">{formatTime(now)}</span>
      <span className="h-3 w-px bg-white/15" />
      <span className="text-xs font-medium text-zinc-400">{formatUzDate(now)}</span>
    </div>
  );
}

interface LayoutProps {
  onLogout?: () => void;
}

export default function Layout({ onLogout }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const asideRef = useRef<HTMLElement>(null);
  const { t, lang, setLang } = useT();

  // ⚡ Dinamik menyular
  const NAV_GROUPS: { title: string; items: NavItem[] }[] = useMemo(() => [
    {
      title: t.nav.groups.main,
      items: [
        { path: '/', icon: LayoutDashboard, label: t.nav.items.dashboard.label, desc: t.nav.items.dashboard.desc },
        { path: '/settings', icon: Settings, label: t.settings.title, desc: t.settings.subtitle }, // ⚡ Sozlamalar
      ],
    },
    {
      title: t.nav.groups.team,
      items: [
        { path: '/employees', icon: Users, label: t.nav.items.employees.label, desc: t.nav.items.employees.desc },
        { path: '/departments', icon: Building2, label: t.nav.items.departments.label, desc: t.nav.items.departments.desc },
        { path: '/positions', icon: Briefcase, label: t.nav.items.positions.label, desc: t.nav.items.positions.desc },
      ],
    },
    {
      title: t.nav.groups.content,
      items: [
        { path: '/sections', icon: FileText, label: t.nav.items.sections.label, desc: t.nav.items.sections.desc },
        { path: '/banners', icon: ImageIcon, label: t.nav.items.banners.label, desc: t.nav.items.banners.desc },
      ],
    },
    {
      title: t.nav.groups.comms,
      items: [
        { path: '/feedbacks', icon: MessageSquare, label: t.nav.items.feedbacks.label, desc: t.nav.items.feedbacks.desc },
        { path: '/notifications', icon: Bell, label: t.notifications.title, desc: t.notifications.title }, // ⚡ Bildirishnomalar
      ],
    },
  ], [t]);

  const ALL_ITEMS = useMemo(() => NAV_GROUPS.flatMap((g) => g.items), [NAV_GROUPS]);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(LS_COLLAPSED) === '1';
    } catch {
      return false;
    }
  });

  // ⚡ Avatar dinamik bo'lishi uchun state
  const [user, setUser] = useState(getAdminUser());
  const initial = (user.name || 'A').charAt(0).toUpperCase();
  const current = ALL_ITEMS.find((i) => i.path === location.pathname) ?? ALL_ITEMS[0];

  // ⚡ localStorage o'zgarganda userni yangilash
  useEffect(() => {
    const sync = () => setUser(getAdminUser());
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(LS_COLLAPSED, next ? '1' : '0');
      } catch {
        /* jim */
      }
      return next;
    });
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    onLogout?.();
    navigate('/login', { replace: true });
  }, [navigate, onLogout]);

  // Sahifa almashganda mobil menyuni yopamiz
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Klaviatura: Ctrl/⌘+K — palitra, Ctrl/⌘+B — sidebar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const k = e.key.toLowerCase();
      if (k === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      } else if (k === 'b') {
        e.preventDefault();
        toggleCollapsed();
      }
    };
    const openPalette = () => setPaletteOpen(true);

    window.addEventListener('keydown', onKey);
    window.addEventListener('app:palette', openPalette);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('app:palette', openPalette);
    };
  }, [toggleCollapsed]);

  // GSAP: sidebar elementlari birin-ketin chiqadi
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('[data-nav]', {
        x: -20,
        opacity: 0,
        duration: 0.55,
        stagger: 0.05,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
      });
    }, asideRef);
    return () => ctx.revert();
  }, []);

  const commands = useMemo<Command[]>(
    () => [
      ...ALL_ITEMS.map((i) => ({
        id: `nav-${i.path}`,
        label: i.label,
        group: t.nav.goto,
        icon: i.icon,
        keywords: i.desc,
        run: () => navigate(i.path),
      })),
      {
        id: 'refresh',
        label: t.nav.refresh,
        group: t.nav.actions,
        icon: RefreshCw,
        keywords: 'refresh yangilash reload',
        run: () => window.dispatchEvent(new Event('app:refresh')),
      },
      {
        id: 'sidebar',
        label: collapsed ? t.nav.sidebarOpen : t.nav.sidebarCollapse,
        group: t.nav.actions,
        icon: collapsed ? PanelLeftOpen : PanelLeftClose,
        keywords: 'sidebar menyu',
        run: toggleCollapsed,
      },
      {
        id: 'bot',
        label: t.nav.openBot,
        group: t.nav.actions,
        icon: Send,
        keywords: 'telegram bot',
        run: () => window.open(BOT_URL, '_blank', 'noopener'),
      },
      {
        id: 'logout',
        label: t.nav.logout,
        group: t.nav.actions,
        icon: LogOut,
        keywords: 'logout chiqish',
        run: handleLogout,
      },
    ],
    [navigate, collapsed, toggleCollapsed, handleLogout, ALL_ITEMS, t]
  );

  return (
    <div className="relative flex h-screen overflow-hidden">
      <Aurora />
      <Snowfall />
      <div className="bg-grid pointer-events-none fixed inset-0 z-0" />

      {/* Mobil overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* ================= SIDEBAR ================= */}
      <aside
        ref={asideRef}
        style={{ '--sbw': collapsed ? '92px' : '288px' } as CSSProperties}
        className={`fixed inset-y-0 left-0 z-50 flex w-[288px] flex-col border-r border-white/[0.07] bg-[#090a0d]/90 backdrop-blur-2xl transition-[width,transform] duration-300 lg:static lg:w-[var(--sbw)] lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Logo */}
        <div className={`flex items-center justify-between px-5 py-6 ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}>
          <div data-nav className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff2b3a] to-[#9d0410] shadow-[0_10px_34px_-8px_rgba(255,43,58,0.7)]">
              <ShieldCheck className="h-6 w-6 text-white" />
              <span className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/25" />
            </div>
            <div className={`leading-tight ${collapsed ? 'lg:hidden' : ''}`}>
              <h1 className="text-[18px] font-black tracking-tight text-white">Mobiuz</h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">{t.nav.brandSub}</p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white lg:hidden"
            aria-label={t.nav.close}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Menyu */}
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <p
                className={`mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[0.18em] text-zinc-600 ${collapsed ? 'lg:hidden' : ''
                  }`}
              >
                {group.title}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === '/'}
                      title={collapsed ? item.label : undefined}
                      className="relative block"
                    >
                      {({ isActive }) => (
                        <div
                          data-nav
                          className={`relative flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-bold transition-colors ${collapsed ? 'lg:justify-center lg:px-0' : ''
                            } ${isActive ? 'text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
                        >
                          {isActive && (
                            <motion.span
                              layoutId="nav-pill"
                              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                              className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#ff2b3a] to-[#b00410] shadow-[0_10px_30px_-10px_rgba(255,43,58,0.75)]"
                            />
                          )}
                          <Icon className="relative z-10 h-[19px] w-[19px] shrink-0" />
                          <span className={`relative z-10 ${collapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
                        </div>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Pastki qism */}
        <div className="space-y-2 border-t border-white/[0.07] p-3">
          <button
            data-nav
            onClick={() => setPaletteOpen(true)}
            className={`flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm font-semibold text-zinc-400 transition hover:bg-white/[0.08] hover:text-white ${collapsed ? 'lg:justify-center lg:px-0' : ''
              }`}
          >
            <Search className="h-[18px] w-[18px] shrink-0" />
            <span className={`flex-1 text-left ${collapsed ? 'lg:hidden' : ''}`}>{t.nav.searchDots}</span>
            <span className={`flex gap-1 ${collapsed ? 'lg:hidden' : ''}`}>
              <span className="kbd">Ctrl</span>
              <span className="kbd">K</span>
            </span>
          </button>

          <div
            data-nav
            className={`flex items-center gap-3 rounded-2xl bg-white/[0.04] p-3 ${collapsed ? 'lg:flex-col lg:p-2' : ''}`}
          >

            {/* ⚡ Avatar (rasm yoki harf) */}
            {user.avatar ? (
              <img
                src={
                  user.avatar.startsWith('http')
                    ? user.avatar
                    : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${user.avatar}`
                }
                alt={user.name || 'Admin'}
                className="h-10 w-10 shrink-0 rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff2b3a] to-[#9d0410] font-black text-white">
                {initial}
              </div>
            )}

            <div className={`min-w-0 flex-1 ${collapsed ? 'lg:hidden' : ''}`}>
              <p className="truncate text-sm font-extrabold text-white">{user.name || 'Admin'}</p>
              <p className="truncate text-xs text-zinc-500">{user.email || 'admin@mobiuz.uz'}</p>
            </div>
            <button
              onClick={handleLogout}
              title={t.nav.logout}
              aria-label={t.nav.logout}
              className="rounded-lg p-2 text-zinc-500 transition hover:bg-rose-500/10 hover:text-rose-400"
            >
              <LogOut className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </aside>

      {/* ================= ASOSIY QISM ================= */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <header className="relative z-50 flex items-center justify-between gap-3 border-b border-white/[0.07] bg-[#07080b]/60 px-4 py-3.5 backdrop-blur-xl md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-white lg:hidden"
              aria-label={t.nav.menu}
            >
              <Menu className="h-5 w-5" />
            </button>
            <button
              onClick={toggleCollapsed}
              className="hidden rounded-xl border border-white/10 bg-white/5 p-2.5 text-zinc-400 transition hover:bg-white/10 hover:text-white lg:block"
              aria-label={t.nav.sidebarCollapse}
              title="Ctrl + B"
            >
              {collapsed ? <PanelLeftOpen className="h-[18px] w-[18px]" /> : <PanelLeftClose className="h-[18px] w-[18px]" />}
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold text-white">{current?.label}</p>
              <p className="hidden truncate text-xs text-zinc-500 sm:block">{current?.desc}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setPaletteOpen(true)}
              className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs font-semibold text-zinc-400 transition hover:bg-white/10 hover:text-white xl:flex"
            >
              <Search className="h-4 w-4" />
              {t.nav.search}
              <span className="kbd ml-2">Ctrl K</span>
            </button>
            <TopClock />
            <button
              onClick={() => setLang(lang === 'uz' ? 'ru' : 'uz')}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-white/10"
              title="Tilni o'zgartirish"
            >
              <Globe className="h-4 w-4" />
              {lang.toUpperCase()}
            </button>
            <NotificationBell />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="mx-auto max-w-[1400px]"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} commands={commands} />
    </div>
  );
}