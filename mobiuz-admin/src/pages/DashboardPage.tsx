import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import {
  Users, FileText, Image as ImageIcon, Building2, Briefcase, MessageSquare,
  Star, Plus, RefreshCw, Activity, Server, Search, Download, Send,
  Command as CommandIcon, Sparkles, Snowflake, Inbox, CheckCircle2, Zap,
  type LucideIcon,
} from 'lucide-react';
import {
  getEmployees, getSections, getBanners, getDepartments,
  getPositions, getFeedbacks,
} from '../api';
import SpotlightCard from '../components/SpotlightCard';
import StatCard, { type Accent } from '../components/StatCard';
import AnimatedNumber from '../components/AnimatedNumber';
import Magnetic from '../components/Magnetic';
import { Donut, Ring, type Segment } from '../components/Charts';
import { useToast } from '../components/Toast';
import { useNow } from '../hooks/useNow';
import {
  downloadCSV, formatSeconds, formatTime, formatUzDate, greeting, nameOf,
} from '../utils/format';

type AnyList = any[];

interface Data {
  employees: AnyList;
  sections: AnyList;
  banners: AnyList;
  departments: AnyList;
  positions: AnyList;
  feedbacks: AnyList;
}

const EMPTY: Data = {
  employees: [], sections: [], banners: [],
  departments: [], positions: [], feedbacks: [],
};

const PALETTE = ['#ff2b3a', '#7c5cff', '#22d3ee', '#fbbf24', '#34d399', '#f472b6'];
const BOT_URL = 'https://t.me/mobiuz_welcome_bot';

const getAdminName = (): string => {
  try {
    return JSON.parse(localStorage.getItem('admin_user') || '{}').name || 'Admin';
  } catch {
    return 'Admin';
  }
};

/** Alohida komponent: har soniyada faqat soat qayta chiziladi */
function Clock() {
  const now = useNow(1000);
  return (
    <div className="font-mono font-bold leading-none tabular-nums">
      <span className="text-6xl md:text-8xl">{formatTime(now)}</span>
      <span className="ml-1.5 text-xl text-white/60 md:text-3xl">{formatSeconds(now)}</span>
    </div>
  );
}

const QUICK: { to: string; icon: LucideIcon; label: string; tone: string }[] = [
  { to: '/employees', icon: Users, label: "Xodim qo'shish", tone: 'text-sky-400 bg-sky-500/10' },
  { to: '/sections', icon: FileText, label: "Maqola yozish", tone: 'text-rose-400 bg-rose-500/10' },
  { to: '/banners', icon: ImageIcon, label: "Yangilik qo'shish", tone: 'text-amber-400 bg-amber-500/10' },
  { to: '/departments', icon: Building2, label: "Bo'lim qo'shish", tone: 'text-emerald-400 bg-emerald-500/10' },
];

export default function DashboardPage() {
  const toast = useToast();
  const root = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<Data>(EMPTY);
  const [failed, setFailed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [auto, setAuto] = useState(false);
  const [q, setQ] = useState('');

  // ---------- Ma'lumot yuklash ----------
  const load = useCallback(
    async (mode: 'initial' | 'silent' | 'manual' = 'initial') => {
      if (mode === 'initial') setLoading(true);
      else setRefreshing(true);

      const results = await Promise.allSettled([
        getEmployees(), getSections(), getBanners(),
        getDepartments(), getPositions(), getFeedbacks(),
      ]);

      const pick = (i: number): AnyList => {
        const r = results[i];
        return r.status === 'fulfilled' && Array.isArray(r.value) ? r.value : [];
      };

      const bad = results.filter((r) => r.status === 'rejected').length;
      setData({
        employees: pick(0), sections: pick(1), banners: pick(2),
        departments: pick(3), positions: pick(4), feedbacks: pick(5),
      });
      setFailed(bad);
      setUpdatedAt(new Date());
      setLoading(false);
      setRefreshing(false);

      if (mode === 'manual') {
        bad === 0 ? toast.success("Ma'lumotlar yangilandi") : toast.error(`${bad} ta so'rov xato berdi`);
      }
    },
    [toast]
  );

  useEffect(() => {
    load();
  }, [load]);

  // Palitradan "Yangilash" kelganda
  useEffect(() => {
    const h = () => load('manual');
    window.addEventListener('app:refresh', h);
    return () => window.removeEventListener('app:refresh', h);
  }, [load]);

  // Avto-yangilash (30 soniya)
  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => load('silent'), 30000);
    return () => clearInterval(id);
  }, [auto, load]);

  // ---------- GSAP: sahifa animatsiyalari ----------
  useEffect(() => {
    if (loading || !root.current) return;

    const ctx = gsap.context(() => {
      gsap.from('[data-reveal]', {
        y: 40,
        opacity: 0,
        duration: 0.9,
        stagger: 0.07,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
      });
      gsap.from('.hero-word', { yPercent: 120, duration: 1, stagger: 0.07, ease: 'power4.out', delay: 0.15 });
      gsap.to('[data-float]', {
        y: 'random(-16, 16)',
        x: 'random(-10, 10)',
        rotation: 'random(-10, 10)',
        duration: 'random(3, 5)',
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        stagger: 0.4,
      });
    }, root);

    return () => ctx.revert();
  }, [loading]);

  // ---------- Hisoblangan qiymatlar ----------
  const linked = useMemo(
    () => data.employees.filter((e) => !!e.telegram_id).length,
    [data.employees]
  );
  const linkedPct = data.employees.length ? Math.round((linked / data.employees.length) * 100) : 0;

  const avgRating = useMemo(() => {
    const rated = data.feedbacks.filter((f) => typeof f.rating === 'number');
    if (!rated.length) return null;
    return rated.reduce((s, f) => s + f.rating, 0) / rated.length;
  }, [data.feedbacks]);

  const ratingDist = useMemo(() => {
    const c = [0, 0, 0, 0, 0];
    data.feedbacks.forEach((f) => {
      const r = Math.round(Number(f.rating));
      if (r >= 1 && r <= 5) c[r - 1]++;
    });
    return c;
  }, [data.feedbacks]);

  const unread = useMemo(
    () => data.feedbacks.filter((f) => f.is_read === false || f.is_read === null).length,
    [data.feedbacks]
  );

  const latestFeedbacks = useMemo(() => {
    const ts = (f: any) => new Date(f.publishedAt || f.created_at || f.createdAt || 0).getTime();
    return [...data.feedbacks].sort((a, b) => ts(b) - ts(a)).slice(0, 4);
  }, [data.feedbacks]);

  const deptSegments = useMemo<Segment[]>(() => {
    const map = new Map<string, number>();
    data.employees.forEach((e) => {
      const n = nameOf(e.department);
      if (n) map.set(n, (map.get(n) || 0) + 1);
    });
    const rows = [...map.entries()].sort((a, b) => b[1] - a[1]);
    const segs: Segment[] = rows
      .slice(0, 5)
      .map(([label, value], i) => ({ label, value, color: PALETTE[i] }));
    const rest = rows.slice(5).reduce((s, r) => s + r[1], 0);
    if (rest > 0) segs.push({ label: 'Boshqalar', value: rest, color: PALETTE[5] });
    return segs;
  }, [data.employees]);

  const contentSegments = useMemo<Segment[]>(() => {
    const secs = data.sections;
    const inactive = secs.filter((s) => s.is_active === false).length;
    const active = secs.filter((s) => s.is_active !== false);
    const pub = active.filter((s) => s.is_public !== false).length;
    return [
      { label: 'Umumiy', value: pub, color: '#22d3ee' },
      { label: 'Lavozimga xos', value: active.length - pub, color: '#7c5cff' },
      { label: 'Nofaol', value: inactive, color: '#52525b' },
    ];
  }, [data.sections]);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return data.employees.slice(0, 5);
    return data.employees
      .filter((e) =>
        [e.passport, e.position?.name_uz, e.position?.name_ru, e.department?.name_uz, e.department?.name_ru]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(s)
      )
      .slice(0, 6);
  }, [q, data.employees]);

  const cards: { icon: LucideIcon; label: string; value: number; accent: Accent; to: string }[] = [
    { icon: Users, label: 'Xodimlar', value: data.employees.length, accent: 'blue', to: '/employees' },
    { icon: Building2, label: "Bo'limlar", value: data.departments.length, accent: 'green', to: '/departments' },
    { icon: Briefcase, label: 'Lavozimlar', value: data.positions.length, accent: 'purple', to: '/positions' },
    { icon: FileText, label: 'Maqolalar', value: data.sections.length, accent: 'red', to: '/sections' },
    { icon: ImageIcon, label: 'Yangiliklar', value: data.banners.length, accent: 'orange', to: '/banners' },
    { icon: MessageSquare, label: 'Fikrlar', value: data.feedbacks.length, accent: 'pink', to: '/feedbacks' },
  ];
  const maxCard = Math.max(1, ...cards.map((c) => c.value));

  const apiStatus =
    failed === 0
      ? { text: 'Online', dot: 'bg-emerald-400', color: 'text-emerald-400' }
      : failed < 6
      ? { text: 'Qisman', dot: 'bg-amber-400', color: 'text-amber-400' }
      : { text: 'Ulanmagan', dot: 'bg-rose-400', color: 'text-rose-400' };

  // ---------- Eksport ----------
  const stamp = new Date().toISOString().slice(0, 10);

  const exportEmployees = () => {
    const ok = downloadCSV(
      `xodimlar-${stamp}.csv`,
      data.employees.map((e) => ({
        ID: e.id,
        Passport: e.passport,
        'Tug\'ilgan sana': e.birth_date ?? '',
        "Bo'lim": nameOf(e.department),
        Lavozim: nameOf(e.position),
        Telegram: e.telegram_id ? 'Ulangan' : 'Ulanmagan',
      }))
    );
    ok ? toast.success('Xodimlar CSV yuklab olindi') : toast.info("Eksport uchun xodimlar yo'q");
  };

  const exportFeedbacks = () => {
    const ok = downloadCSV(
      `fikrlar-${stamp}.csv`,
      data.feedbacks.map((f) => ({
        ID: f.id,
        Baho: f.rating ?? '',
        Kategoriya: f.category ?? '',
        Izoh: f.comment ?? '',
        "O'qilgan": f.is_read ? 'Ha' : "Yo'q",
        Sana: f.publishedAt || f.created_at || f.createdAt || '',
      }))
    );
    ok ? toast.success('Fikrlar CSV yuklab olindi') : toast.info("Eksport uchun fikrlar yo'q");
  };

  // ---------- Yuklanmoqda ----------
  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-12">
          <div className="skeleton h-[340px] lg:col-span-8" />
          <div className="skeleton h-[340px] lg:col-span-4" />
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton h-[150px]" />
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-12">
          <div className="skeleton h-80 lg:col-span-7" />
          <div className="skeleton h-80 lg:col-span-5" />
        </div>
      </div>
    );
  }

  const heroText = `${greeting()}, ${getAdminName()}`;

  return (
    <div ref={root} className="space-y-5">
      {/* ================= HERO + BOT HALQASI ================= */}
      <div className="grid gap-5 lg:grid-cols-12">
        <SpotlightCard
          data-reveal
          className="hero-mesh min-h-[340px] p-6 text-white md:p-9 lg:col-span-8"
        >
          {/* Suzuvchi shakllar */}
          <div data-float className="pointer-events-none absolute right-10 top-8 hidden h-24 w-24 items-center justify-center rounded-3xl border border-white/20 bg-white/10 backdrop-blur md:flex">
            <Snowflake className="h-11 w-11 text-white/80" strokeWidth={1.5} />
          </div>
          <div data-float className="pointer-events-none absolute right-40 top-40 hidden h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur md:flex">
            <Star className="h-6 w-6 fill-amber-300 text-amber-300" />
          </div>
          <div data-float className="pointer-events-none absolute right-6 top-48 hidden h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur md:flex">
            <Zap className="h-5 w-5 text-white" />
          </div>

          <div className="relative z-10 flex h-full flex-col justify-between gap-10">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-black/20 px-3.5 py-1.5 text-xs font-bold backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
              </span>
              Jonli · {formatUzDate()}
            </span>

            <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="max-w-xl text-3xl font-black leading-[1.05] tracking-tight md:text-5xl">
                  {heroText.split(' ').map((w, i) => (
                    <span key={i} className="mr-[0.25em] inline-block overflow-hidden align-bottom">
                      <span className="hero-word inline-block">{w}</span>
                    </span>
                  ))}
                  <span className="inline-block origin-[70%_70%] animate-pulse">👋</span>
                </h1>
                <p className="mt-3 max-w-md text-sm text-white/80 md:text-[15px]">
                  Bugungi holat: <b>{data.employees.length}</b> xodim, <b>{data.sections.length}</b> maqola,{' '}
                  <b>{unread}</b> ta o'qilmagan fikr.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Magnetic>
                    <Link
                      to="/employees"
                      className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-[#b00410] shadow-[0_14px_34px_-10px_rgba(0,0,0,0.6)]"
                    >
                      <Plus className="h-4 w-4" />
                      Xodim qo'shish
                    </Link>
                  </Magnetic>
                  <Magnetic>
                    <button
                      onClick={() => window.dispatchEvent(new Event('app:palette'))}
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-extrabold backdrop-blur transition hover:bg-white/20"
                    >
                      <CommandIcon className="h-4 w-4" />
                      Tezkor qidiruv
                      <span className="kbd !border-white/25 !bg-black/20 !text-white">Ctrl K</span>
                    </button>
                  </Magnetic>
                </div>
              </div>

              <Clock />
            </div>
          </div>
        </SpotlightCard>

        {/* Bot halqasi */}
        <SpotlightCard data-reveal className="flex flex-col items-center justify-between p-6 text-center lg:col-span-4">
          <div className="flex w-full items-center justify-between">
            <div className="text-left">
              <h3 className="font-extrabold text-white">Botga ulanish</h3>
              <p className="mt-0.5 text-xs text-zinc-500">Telegram orqali tasdiqlanganlar</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10">
              <Send className="h-[18px] w-[18px] text-sky-400" />
            </span>
          </div>

          <Ring value={linkedPct} size={180} thickness={16}>
            <p className="text-5xl font-black tracking-tight text-white">
              <AnimatedNumber value={linkedPct} suffix="%" />
            </p>
            <p className="mt-1 text-xs font-semibold text-zinc-500">ulangan</p>
          </Ring>

          <div className="w-full space-y-3">
            <div className="grid grid-cols-2 gap-2.5 text-left">
              <div className="rounded-2xl bg-white/[0.04] p-3">
                <p className="text-xl font-black text-white">{linked}</p>
                <p className="text-[11px] text-zinc-500">Ulangan</p>
              </div>
              <div className="rounded-2xl bg-white/[0.04] p-3">
                <p className="text-xl font-black text-white">{data.employees.length - linked}</p>
                <p className="text-[11px] text-zinc-500">Kutilmoqda</p>
              </div>
            </div>
            <a
              href={BOT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost w-full"
            >
              <Send className="h-4 w-4" />
              Botni ochish
            </a>
          </div>
        </SpotlightCard>
      </div>

      {/* ================= STATISTIKA ================= */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => (
          <StatCard key={c.label} {...c} share={(c.value / maxCard) * 100} />
        ))}
      </div>

      {/* ================= DONUT + BAHOLAR ================= */}
      <div className="grid gap-5 lg:grid-cols-12">
        <SpotlightCard data-reveal className="p-6 lg:col-span-7">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-white">Bo'limlar bo'yicha xodimlar</h3>
              <p className="mt-0.5 text-xs text-zinc-500">Taqsimot va ulushlar</p>
            </div>
            <Link to="/departments" className="text-xs font-bold text-[#ff6b75] hover:underline">
              Barchasi →
            </Link>
          </div>

          {deptSegments.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <Inbox className="mb-2 h-10 w-10 text-zinc-700" />
              <p className="text-sm text-zinc-500">Xodimlarga bo'lim biriktirilmagan</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-8 md:flex-row">
              <Donut segments={deptSegments} size={200} thickness={24}>
                <p className="text-4xl font-black text-white">
                  <AnimatedNumber value={deptSegments.reduce((s, x) => s + x.value, 0)} />
                </p>
                <p className="text-xs font-semibold text-zinc-500">xodim</p>
              </Donut>

              <div className="w-full flex-1 space-y-2.5">
                {deptSegments.map((s, i) => {
                  const total = deptSegments.reduce((sum, x) => sum + x.value, 0);
                  return (
                    <motion.div
                      key={s.label}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.07 }}
                      className="flex items-center gap-3 rounded-2xl bg-white/[0.04] px-4 py-3"
                    >
                      <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: s.color }} />
                      <span className="flex-1 truncate text-sm font-semibold text-zinc-200">{s.label}</span>
                      <span className="text-sm font-black tabular-nums text-white">{s.value}</span>
                      <span className="w-10 text-right text-xs font-bold text-zinc-500">
                        {Math.round((s.value / total) * 100)}%
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </SpotlightCard>

        <SpotlightCard data-reveal className="p-6 lg:col-span-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-white">Baholar taqsimoti</h3>
              <p className="mt-0.5 text-xs text-zinc-500">{data.feedbacks.length} ta fikr asosida</p>
            </div>
            <div className="text-right">
              <p className="flex items-center justify-end gap-1.5 text-3xl font-black text-white">
                {avgRating !== null ? <AnimatedNumber value={avgRating} decimals={1} /> : '–'}
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
              </p>
              <p className="text-[11px] text-zinc-500">o'rtacha</p>
            </div>
          </div>

          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((star, idx) => {
              const count = ratingDist[star - 1];
              const max = Math.max(1, ...ratingDist);
              return (
                <div key={star} className="flex items-center gap-3">
                  <span className="flex w-8 items-center gap-1 text-sm font-bold text-zinc-300">
                    {star}
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  </span>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / max) * 100}%` }}
                      transition={{ delay: 0.4 + idx * 0.08, duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300"
                    />
                  </div>
                  <span className="w-7 text-right text-sm font-black tabular-nums text-white">{count}</span>
                </div>
              );
            })}
          </div>
        </SpotlightCard>
      </div>

      {/* ================= QIDIRUV + KONTENT + FIKRLAR ================= */}
      <div className="grid gap-5 lg:grid-cols-12">
        {/* Jonli qidiruv */}
        <SpotlightCard data-reveal className="p-6 lg:col-span-5">
          <h3 className="font-extrabold text-white">Xodimni topish</h3>
          <p className="mt-0.5 text-xs text-zinc-500">Passport, lavozim yoki bo'lim bo'yicha</p>

          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-zinc-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="AA1234567, Buxgalter, Call Center…"
              className="input py-3 pl-12"
            />
          </div>

          <div className="mt-4 space-y-2">
            {results.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <Inbox className="mb-2 h-9 w-9 text-zinc-700" />
                <p className="text-sm text-zinc-500">Hech kim topilmadi</p>
              </div>
            ) : (
              results.map((e, i) => (
                <motion.div
                  key={e.id ?? i}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 rounded-2xl bg-white/[0.04] p-3"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff2b3a]/30 to-[#7c5cff]/30 text-sm font-black text-white">
                    {String(e.passport || '?').slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-sm font-bold text-white">{e.passport}</p>
                    <p className="truncate text-xs text-zinc-500">
                      {nameOf(e.position) || 'Lavozimsiz'}
                      {nameOf(e.department) ? ` · ${nameOf(e.department)}` : ''}
                    </p>
                  </div>
                  {e.telegram_id ? (
                    <span className="badge bg-emerald-500/15 text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" /> Bot
                    </span>
                  ) : (
                    <span className="badge bg-zinc-500/15 text-zinc-500">Yo'q</span>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </SpotlightCard>

        {/* Kontent holati */}
        <SpotlightCard data-reveal className="p-6 lg:col-span-3">
          <h3 className="font-extrabold text-white">Kontent holati</h3>
          <p className="mt-0.5 text-xs text-zinc-500">Maqolalar turlari</p>

          <div className="mt-5 flex justify-center">
            <Donut segments={contentSegments} size={150} thickness={18}>
              <p className="text-3xl font-black text-white">
                <AnimatedNumber value={data.sections.length} />
              </p>
              <p className="text-[11px] font-semibold text-zinc-500">maqola</p>
            </Donut>
          </div>

          <div className="mt-5 space-y-2">
            {contentSegments.map((s) => (
              <div key={s.label} className="flex items-center gap-2.5 text-sm">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                <span className="flex-1 text-zinc-400">{s.label}</span>
                <span className="font-black tabular-nums text-white">{s.value}</span>
              </div>
            ))}
          </div>
        </SpotlightCard>

        {/* So'nggi fikrlar */}
        <SpotlightCard data-reveal className="p-6 lg:col-span-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-white">So'nggi fikrlar</h3>
              <p className="mt-0.5 text-xs text-zinc-500">
                {unread > 0 ? `${unread} ta o'qilmagan` : "Hammasi o'qilgan"}
              </p>
            </div>
            <Link to="/feedbacks" className="text-xs font-bold text-[#ff6b75] hover:underline">
              Barchasi →
            </Link>
          </div>

          <div className="mt-4 space-y-2.5">
            {latestFeedbacks.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <MessageSquare className="mb-2 h-9 w-9 text-zinc-700" />
                <p className="text-sm text-zinc-500">Hali fikr kelmagan</p>
              </div>
            ) : (
              latestFeedbacks.map((f, i) => (
                <div key={f.id ?? i} className="rounded-2xl bg-white/[0.04] p-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={`h-3.5 w-3.5 ${
                            n <= (f.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'
                          }`}
                        />
                      ))}
                    </div>
                    {f.is_read === false && (
                      <span className="badge bg-[#ff2b3a]/15 text-[#ff6b75]">Yangi</span>
                    )}
                  </div>
                  <p className="mt-2 line-clamp-2 text-[13px] leading-snug text-zinc-300">
                    {f.comment || 'Izohsiz baho'}
                  </p>
                </div>
              ))
            )}
          </div>
        </SpotlightCard>
      </div>

      {/* ================= TEZKOR AMALLAR + EKSPORT + HOLAT ================= */}
      <div className="grid gap-5 lg:grid-cols-12">
        <SpotlightCard data-reveal className="p-6 lg:col-span-5">
          <h3 className="font-extrabold text-white">Tezkor amallar</h3>
          <p className="mt-0.5 text-xs text-zinc-500">Eng ko'p ishlatiladiganlar</p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {QUICK.map(({ to, icon: Icon, label, tone }) => (
              <Link
                key={to}
                to={to}
                className="group flex flex-col items-start gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 transition-all hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.07]"
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110 group-hover:rotate-6 ${tone}`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-[13px] font-extrabold text-zinc-200">{label}</span>
              </Link>
            ))}
          </div>
        </SpotlightCard>

        <SpotlightCard data-reveal className="p-6 lg:col-span-3">
          <h3 className="font-extrabold text-white">Eksport</h3>
          <p className="mt-0.5 text-xs text-zinc-500">CSV (Excel uchun)</p>

          <div className="mt-5 space-y-3">
            <button onClick={exportEmployees} className="btn btn-ghost w-full justify-start">
              <Download className="h-4 w-4 text-sky-400" />
              Xodimlar
            </button>
            <button onClick={exportFeedbacks} className="btn btn-ghost w-full justify-start">
              <Download className="h-4 w-4 text-fuchsia-400" />
              Fikrlar
            </button>
          </div>

          <div className="mt-5 flex items-start gap-2.5 rounded-2xl bg-white/[0.04] p-3 text-xs text-zinc-500">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
            Fayl brauzerning o'zida yaratiladi, serverga hech narsa yuborilmaydi.
          </div>
        </SpotlightCard>

        <SpotlightCard data-reveal className="p-6 lg:col-span-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10">
                <Activity className="h-5 w-5 text-emerald-400" />
              </span>
              <div>
                <h3 className="font-extrabold text-white">Tizim holati</h3>
                <p className="text-xs text-zinc-500">
                  {updatedAt ? `Yangilandi: ${formatTime(updatedAt)}` : ''}
                </p>
              </div>
            </div>
            <button
              onClick={() => load('manual')}
              disabled={refreshing}
              className="btn btn-ghost !px-3 !py-2.5"
              aria-label="Yangilash"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="mt-5 flex items-center justify-between rounded-2xl bg-white/[0.04] p-3.5">
            <div className="flex items-center gap-2.5">
              <Server className="h-4 w-4 text-zinc-500" />
              <span className="text-sm font-semibold text-zinc-300">Admin API</span>
            </div>
            <span className={`flex items-center gap-2 text-xs font-extrabold ${apiStatus.color}`}>
              <span className={`h-2 w-2 animate-pulse rounded-full ${apiStatus.dot}`} />
              {apiStatus.text}
            </span>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={auto}
            onClick={() => {
              setAuto((a) => !a);
              toast.info(auto ? "Avto-yangilash o'chirildi" : 'Avto-yangilash yoqildi (30 soniya)');
            }}
            className="mt-3 flex w-full items-center justify-between rounded-2xl bg-white/[0.04] p-3.5 text-left"
          >
            <span className="text-sm font-semibold text-zinc-300">Avto-yangilash</span>
            <span
              className={`relative h-6 w-11 rounded-full transition-colors ${auto ? 'bg-[#ff2b3a]' : 'bg-zinc-700'}`}
            >
              <motion.span
                layout
                transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
                style={{ left: auto ? 22 : 2 }}
              />
            </span>
          </button>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-zinc-500">
            <span className="flex items-center gap-1.5"><span className="kbd">Ctrl</span><span className="kbd">K</span> qidiruv</span>
            <span className="flex items-center gap-1.5"><span className="kbd">Ctrl</span><span className="kbd">B</span> sidebar</span>
          </div>
        </SpotlightCard>
      </div>
    </div>
  );
}