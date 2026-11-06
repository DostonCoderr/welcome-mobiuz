import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import gsap from 'gsap';
import {
  Users, Building2, Briefcase, FileText, Image as ImageIcon, MessageSquare,
  LayoutDashboard, LogOut, Menu, X, ShieldCheck, Search, PanelLeftClose,
  PanelLeftOpen, RefreshCw, Send, type LucideIcon,
} from 'lucide-react';
import Aurora from './Aurora';
import Snowfall from './Snowfall';
import CommandPalette, { type Command } from './CommandPalette';
import NotificationBell from './NotificationBell';
import { useNow } from '../hooks/useNow';
import { formatTime, formatUzDate } from '../utils/format';

interface NavItem {
  path: string;
  icon: LucideIcon;
  label: string;
  desc: string;
}

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Asosiy',
    items: [{ path: '/', icon: LayoutDashboard, label: 'Dashboard', desc: "Umumiy ko'rinish" }],
  },
  {
    title: 'Jamoa',
    items: [
      { path: '/employees', icon: Users, label: 'Xodimlar', desc: "Xodimlar ro'yxati" },
      { path: '/departments', icon: Building2, label: "Bo'limlar", desc: 'Tashkiliy tuzilma' },
      { path: '/positions', icon: Briefcase, label: 'Lavozimlar', desc: 'Lavozimlar boshqaruvi' },
    ],
  },
  {
    title: 'Kontent',
    items: [
      { path: '/sections', icon: FileText, label: 'Maqolalar', desc: "Welcome Book bo'limlari" },
      { path: '/banners', icon: ImageIcon, label: 'Yangiliklar', desc: 'Bannerlar va yangiliklar' },
    ],
  },
  {
    title: 'Aloqa',
    items: [{ path: '/feedbacks', icon: MessageSquare, label: 'Fikrlar', desc: 'Xodimlar fikr-mulohazalari' }],
  },
];

const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items);
const BOT_URL = 'https://t.me/mobiuz_welcome_bot';
const LS_COLLAPSED = 'admin_sb_collapsed';

const getAdminUser = (): { name?: string; email?: string } => {
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

  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(LS_COLLAPSED) === '1';
    } catch {
      return false;
    }
  });

  const user = getAdminUser();
  const initial = (user.name || 'A').charAt(0).toUpperCase();
  const current = ALL_ITEMS.find((i) => i.path === location.pathname) ?? ALL_ITEMS[0];

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
        group: "O'tish",
        icon: i.icon,
        keywords: i.desc,
        run: () => navigate(i.path),
      })),
      {
        id: 'refresh',
        label: "Ma'lumotlarni yangilash",
        group: 'Amallar',
        icon: RefreshCw,
        keywords: 'refresh yangilash reload',
        run: () => window.dispatchEvent(new Event('app:refresh')),
      },
      {
        id: 'sidebar',
        label: collapsed ? 'Sidebarni ochish' : "Sidebarni yig'ish",
        group: 'Amallar',
        icon: collapsed ? PanelLeftOpen : PanelLeftClose,
        keywords: 'sidebar menyu',
        run: toggleCollapsed,
      },
      {
        id: 'bot',
        label: 'Telegram botni ochish',
        group: 'Amallar',
        icon: Send,
        keywords: 'telegram bot',
        run: () => window.open(BOT_URL, '_blank', 'noopener'),
      },
      {
        id: 'logout',
        label: 'Tizimdan chiqish',
        group: 'Amallar',
        icon: LogOut,
        keywords: 'logout chiqish',
        run: handleLogout,
      },
    ],
    [navigate, collapsed, toggleCollapsed, handleLogout]
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
        className={`fixed inset-y-0 left-0 z-50 flex w-[288px] flex-col border-r border-white/[0.07] bg-[#090a0d]/90 backdrop-blur-2xl transition-[width,transform] duration-300 lg:static lg:w-[var(--sbw)] lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
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
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Control Center</p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white lg:hidden"
            aria-label="Yopish"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Menyu */}
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <p
                className={`mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[0.18em] text-zinc-600 ${
                  collapsed ? 'lg:hidden' : ''
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
                          className={`relative flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-bold transition-colors ${
                            collapsed ? 'lg:justify-center lg:px-0' : ''
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
            className={`flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm font-semibold text-zinc-400 transition hover:bg-white/[0.08] hover:text-white ${
              collapsed ? 'lg:justify-center lg:px-0' : ''
            }`}
          >
            <Search className="h-[18px] w-[18px] shrink-0" />
            <span className={`flex-1 text-left ${collapsed ? 'lg:hidden' : ''}`}>Qidirish…</span>
            <span className={`flex gap-1 ${collapsed ? 'lg:hidden' : ''}`}>
              <span className="kbd">Ctrl</span>
              <span className="kbd">K</span>
            </span>
          </button>

          <div
            data-nav
            className={`flex items-center gap-3 rounded-2xl bg-white/[0.04] p-3 ${
              collapsed ? 'lg:flex-col lg:p-2' : ''
            }`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff2b3a] to-[#9d0410] font-black text-white">
              {initial}
            </div>
            <div className={`min-w-0 flex-1 ${collapsed ? 'lg:hidden' : ''}`}>
              <p className="truncate text-sm font-extrabold text-white">{user.name || 'Admin'}</p>
              <p className="truncate text-xs text-zinc-500">{user.email || 'admin@mobiuz.uz'}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Tizimdan chiqish"
              aria-label="Tizimdan chiqish"
              className="rounded-lg p-2 text-zinc-500 transition hover:bg-rose-500/10 hover:text-rose-400"
            >
              <LogOut className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </aside>

      {/* ================= ASOSIY QISM ================= */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-white/[0.07] bg-[#07080b]/60 px-4 py-3.5 backdrop-blur-xl md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-white lg:hidden"
              aria-label="Menyu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <button
              onClick={toggleCollapsed}
              className="hidden rounded-xl border border-white/10 bg-white/5 p-2.5 text-zinc-400 transition hover:bg-white/10 hover:text-white lg:block"
              aria-label="Sidebarni yig'ish"
              title="Ctrl + B"
            >
              {collapsed ? <PanelLeftOpen className="h-[18px] w-[18px]" /> : <PanelLeftClose className="h-[18px] w-[18px]" />}
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold text-white">{current.label}</p>
              <p className="hidden truncate text-xs text-zinc-500 sm:block">{current.desc}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setPaletteOpen(true)}
              className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs font-semibold text-zinc-400 transition hover:bg-white/10 hover:text-white xl:flex"
            >
              <Search className="h-4 w-4" />
              Qidirish
              <span className="kbd ml-2">Ctrl K</span>
            </button>
            <TopClock />
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