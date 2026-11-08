import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import {
  Users, FileText, Image as ImageIcon, Building2, Briefcase, MessageSquare, Bell, Star,
  Plus, RefreshCw, Activity, Server, Search, Download, Send, Command as CommandIcon,
  Sparkles, Snowflake, Inbox, CheckCircle2, Zap, Cake, Layers, XCircle, SlidersHorizontal,
 Settings as SettingsIcon, ChevronRight, RotateCcw,
  type LucideIcon,
} from 'lucide-react';
import {
  getEmployees, getSections, getBanners, getDepartments, getPositions, getFeedbacks,
  getNotifications,
} from '../api';
import SpotlightCard from '../components/SpotlightCard';
import StatCard, { type Accent } from '../components/StatCard';
import AnimatedNumber from '../components/AnimatedNumber';
import Magnetic from '../components/Magnetic';
import Drawer from '../components/ui/Drawer';
import { Avatar, Switch } from '../components/ui/Kit';
import { Donut, Ring, type Segment } from '../components/Charts';
import { useToast } from '../components/Toast';
import { useNow } from '../hooks/useNow';
import { useLang, type Lang } from '../hooks/useLang';
import { useHotkey } from '../hooks/useHotkey';
import { downloadCSV, formatSeconds, formatTime } from '../utils/format';
import {
  idOf, refId, resolveRef, nm, parseDate, fmtDateLong, relTime, createdOf,
} from '../utils/text';

// ==================== TARJIMALAR ====================
const T = {
  uz: {
    greet: { night: 'Xayrli tun', morning: 'Xayrli tong', day: 'Xayrli kun', evening: 'Xayrli kech' },
    live: 'Jonli',
    heroLine: (e: number, s: number, u: number) =>
      `Bugungi holat: ${e} xodim, ${s} maqola, ${u} ta o'qilmagan fikr.`,
    btn: { addEmployee: "Xodim qo'shish", search: 'Tezkor qidiruv', customize: 'Sozlash' },
    labels: {
      employees: 'Xodimlar', departments: "Bo'limlar", positions: 'Lavozimlar',
      sections: 'Maqolalar', banners: 'Yangiliklar', feedbacks: 'Fikrlar',
    },
    bot: { title: 'Botga ulanish', sub: 'Telegram orqali tasdiqlanganlar', linked: 'Ulangan', pending: 'Kutilmoqda', open: 'Botni ochish' },
    attention: {
      title: 'Diqqat talab qiladi',
      sub: "Hal qilinishi kerak bo'lgan masalalar",
      allGood: 'Hammasi joyida',
      allGoodText: "Hozircha e'tibor talab qiladigan narsa yo'q.",
      unread: (n: number) => `${n} ta o'qilmagan fikr`,
      unlinked: (n: number) => `${n} xodim botga ulanmagan`,
      noPosition: (n: number) => `${n} xodimga lavozim biriktirilmagan`,
      noDept: (n: number) => `${n} xodimga bo'lim biriktirilmagan`,
      uncovered: (n: number) => `${n} ta lavozimda maxsus maqola yo'q`,
      inactiveSections: (n: number) => `${n} ta maqola nofaol`,
      inactiveBanners: (n: number) => `${n} ta banner nofaol`,
      bdayToday: (n: number) => `Bugun ${n} xodimning tug'ilgan kuni`,
    },
    weekly: { title: 'Oxirgi 7 kun', sub: 'Yangi xodimlar va fikrlar', employees: 'Xodimlar', feedbacks: 'Fikrlar', days: ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'] },
    charts: {
      dept: "Bo'limlar bo'yicha xodimlar", deptSub: 'Taqsimot va ulushlar', noDept: "Xodimlarga bo'lim biriktirilmagan",
      others: 'Boshqalar', people: 'xodim', ratings: 'Baholar taqsimoti', avg: "O'rtacha baho",
      basedOn: (n: number) => `${n} ta fikr asosida`, all: 'Barchasi',
    },
    coverage: {
      title: 'Lavozimlar qamrovi',
      sub: 'Har bir lavozim uchun maxsus maqolalar',
      employees: 'Xodim', sections: 'Maqola', ok: 'Yetarli', gap: "Maqola yo'q",
      hint: "Maxsus maqolasi yo'q lavozimdagi xodimlar faqat umumiy maqolalarni ko'radi.",
      empty: "Lavozimlar yo'q",
    },
    birthdays: {
      title: "Tug'ilgan kunlar", sub: 'Keyingi 30 kun', today: 'Bugun', tomorrow: 'Ertaga',
      inDays: (n: number) => `${n} kundan keyin`, turns: (n: number) => `${n} yosh`, empty: "Yaqin 30 kunda tug'ilgan kun yo'q",
    },
    activity: {
      title: "So'nggi harakatlar", sub: 'Tizimdagi yangiliklar', empty: "Hali harakat yo'q",
      employee: (p: string) => `Yangi xodim: ${p}`,
      feedback: (r: number) => `Yangi fikr · ${r}★`,
      section: (n: string) => `Yangi maqola: ${n}`,
      banner: (n: string) => `Yangi banner: ${n}`,
      notification: (n: string) => `Yangi bildirishnoma: ${n}`,
    },
    search: {
      title: 'Xodimni topish', sub: "Passport, ism, lavozim yoki bo'lim bo'yicha",
      ph: 'AA1234567, Buxgalter, Call Center…', empty: 'Hech kim topilmadi',
      bot: 'Bot', noBot: "Yo'q", noPosition: "Lavozim yo'q",
    },
    quick: {
      title: 'Tezkor amallar', sub: "Eng ko'p ishlatiladiganlar",
      employee: "Xodim qo'shish", section: 'Maqola yozish', banner: "Yangilik qo'shish",
      department: "Bo'lim qo'shish", notification: 'Bildirishnoma', settings: 'Sozlamalar',
    },
    status: {
      title: 'Tizim holati', updated: 'Yangilandi', api: 'Admin API', online: 'Online',
      partial: 'Qisman', offline: 'Ulanmagan', auto: 'Avto-yangilash',
      autoOn: 'Avto-yangilash yoqildi (30 soniya)', autoOff: "Avto-yangilash o'chirildi",
      refreshed: "Ma'lumotlar yangilandi", refreshError: (n: number) => `${n} ta so'rov xato berdi`,
      export: 'Eksport', exportEmployees: 'Xodimlar (CSV)', exportFeedbacks: 'Fikrlar (CSV)',
      exportReport: 'Umumiy hisobot (CSV)', exported: 'CSV yuklab olindi', nothing: "Eksport uchun ma'lumot yo'q",
      keyK: 'qidiruv', keyB: 'sidebar', keyR: 'yangilash',
    },
    customize: {
      title: 'Dashboardni sozlash', text: "Kerakli bloklarni yoqing yoki o'chiring. Tanlov saqlanadi.",
      reset: 'Standart holat',
      widgets: {
        bot: 'Botga ulanish', attention: 'Diqqat talab qiladi', weekly: 'Oxirgi 7 kun',
        charts: 'Diagrammalar', coverage: 'Lavozimlar qamrovi', birthdays: "Tug'ilgan kunlar",
        activity: "So'nggi harakatlar", search: 'Xodimni topish', quick: 'Tezkor amallar', status: 'Tizim holati',
      },
    },
    csv: {
      id: 'ID', passport: 'Passport', name: 'Ism', birth: "Tug'ilgan sana", dept: "Bo'lim", position: 'Lavozim',
      telegram: 'Telegram', linked: 'Ulangan', notLinked: 'Ulanmagan', rating: 'Baho', category: 'Kategoriya',
      comment: 'Izoh', read: "O'qilgan", date: 'Sana', yes: 'Ha', no: "Yo'q", metric: "Ko'rsatkich", value: 'Qiymat',
      linkedPct: 'Botga ulanish (%)', avg: "O'rtacha baho", unread: "O'qilmagan fikrlar", bdays: "30 kunda tug'ilganlar", attention: 'Diqqat talab qiladigan masalalar',
    },
  },
  ru: {
    greet: { night: 'Доброй ночи', morning: 'Доброе утро', day: 'Добрый день', evening: 'Добрый вечер' },
    live: 'В эфире',
    heroLine: (e: number, s: number, u: number) =>
      `Сегодня: сотрудников — ${e}, статей — ${s}, непрочитанных отзывов — ${u}.`,
    btn: { addEmployee: 'Добавить сотрудника', search: 'Быстрый поиск', customize: 'Настроить' },
    labels: {
      employees: 'Сотрудники', departments: 'Отделы', positions: 'Должности',
      sections: 'Статьи', banners: 'Новости', feedbacks: 'Отзывы',
    },
    bot: { title: 'Подключение к боту', sub: 'Подтверждены через Telegram', linked: 'Подключены', pending: 'Ожидают', open: 'Открыть бота' },
    attention: {
      title: 'Требует внимания',
      sub: 'Вопросы, которые нужно решить',
      allGood: 'Всё в порядке',
      allGoodText: 'Сейчас ничего не требует внимания.',
      unread: (n: number) => `Непрочитанных отзывов: ${n}`,
      unlinked: (n: number) => `Сотрудников без бота: ${n}`,
      noPosition: (n: number) => `Сотрудников без должности: ${n}`,
      noDept: (n: number) => `Сотрудников без отдела: ${n}`,
      uncovered: (n: number) => `Должностей без специальных статей: ${n}`,
      inactiveSections: (n: number) => `Неактивных статей: ${n}`,
      inactiveBanners: (n: number) => `Неактивных баннеров: ${n}`,
      bdayToday: (n: number) => `Сегодня день рождения у сотрудников: ${n}`,
    },
    weekly: { title: 'Последние 7 дней', sub: 'Новые сотрудники и отзывы', employees: 'Сотрудники', feedbacks: 'Отзывы', days: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'] },
    charts: {
      dept: 'Сотрудники по отделам', deptSub: 'Распределение и доли', noDept: 'Сотрудникам не назначены отделы',
      others: 'Остальные', people: 'сотр.', ratings: 'Распределение оценок', avg: 'Средняя оценка',
      basedOn: (n: number) => `На основе отзывов: ${n}`, all: 'Все',
    },
    coverage: {
      title: 'Покрытие должностей',
      sub: 'Специальные статьи для каждой должности',
      employees: 'Сотр.', sections: 'Статей', ok: 'Достаточно', gap: 'Нет статей',
      hint: 'Сотрудники должностей без специальных статей видят только общие статьи.',
      empty: 'Должностей нет',
    },
    birthdays: {
      title: 'Дни рождения', sub: 'Ближайшие 30 дней', today: 'Сегодня', tomorrow: 'Завтра',
      inDays: (n: number) => `Через ${n} дн.`, turns: (n: number) => `Исполняется ${n}`, empty: 'В ближайшие 30 дней дней рождения нет',
    },
    activity: {
      title: 'Последние события', sub: 'Новое в системе', empty: 'Событий пока нет',
      employee: (p: string) => `Новый сотрудник: ${p}`,
      feedback: (r: number) => `Новый отзыв · ${r}★`,
      section: (n: string) => `Новая статья: ${n}`,
      banner: (n: string) => `Новый баннер: ${n}`,
      notification: (n: string) => `Новое уведомление: ${n}`,
    },
    search: {
      title: 'Найти сотрудника', sub: 'По паспорту, имени, должности или отделу',
      ph: 'AA1234567, Бухгалтер, Call Center…', empty: 'Никого не найдено',
      bot: 'Бот', noBot: 'Нет', noPosition: 'Без должности',
    },
    quick: {
      title: 'Быстрые действия', sub: 'Самые частые',
      employee: 'Добавить сотрудника', section: 'Написать статью', banner: 'Добавить новость',
      department: 'Добавить отдел', notification: 'Уведомление', settings: 'Настройки',
    },
    status: {
      title: 'Состояние системы', updated: 'Обновлено', api: 'Admin API', online: 'Online',
      partial: 'Частично', offline: 'Нет связи', auto: 'Автообновление',
      autoOn: 'Автообновление включено (30 секунд)', autoOff: 'Автообновление выключено',
      refreshed: 'Данные обновлены', refreshError: (n: number) => `Запросов с ошибкой: ${n}`,
      export: 'Экспорт', exportEmployees: 'Сотрудники (CSV)', exportFeedbacks: 'Отзывы (CSV)',
      exportReport: 'Общий отчёт (CSV)', exported: 'CSV загружен', nothing: 'Нет данных для экспорта',
      keyK: 'поиск', keyB: 'меню', keyR: 'обновить',
    },
    customize: {
      title: 'Настройка дашборда', text: 'Включайте и отключайте нужные блоки. Выбор сохраняется.',
      reset: 'Сбросить',
      widgets: {
        bot: 'Подключение к боту', attention: 'Требует внимания', weekly: 'Последние 7 дней',
        charts: 'Диаграммы', coverage: 'Покрытие должностей', birthdays: 'Дни рождения',
        activity: 'Последние события', search: 'Найти сотрудника', quick: 'Быстрые действия', status: 'Состояние системы',
      },
    },
    csv: {
      id: 'ID', passport: 'Паспорт', name: 'Имя', birth: 'Дата рождения', dept: 'Отдел', position: 'Должность',
      telegram: 'Telegram', linked: 'Подключён', notLinked: 'Не подключён', rating: 'Оценка', category: 'Категория',
      comment: 'Комментарий', read: 'Прочитано', date: 'Дата', yes: 'Да', no: 'Нет', metric: 'Показатель', value: 'Значение',
      linkedPct: 'Подключено к боту (%)', avg: 'Средняя оценка', unread: 'Непрочитанные отзывы', bdays: 'Именинники за 30 дней', attention: 'Вопросов, требующих внимания',
    },
  },
};

// ==================== TURLAR ====================
type AnyList = any[];

interface Data {
  employees: AnyList;
  sections: AnyList;
  banners: AnyList;
  departments: AnyList;
  positions: AnyList;
  feedbacks: AnyList;
  notifications: AnyList;
}

const EMPTY: Data = {
  employees: [], sections: [], banners: [], departments: [],
  positions: [], feedbacks: [], notifications: [],
};

type WidgetKey =
  | 'bot' | 'attention' | 'weekly' | 'charts' | 'coverage'
  | 'birthdays' | 'activity' | 'search' | 'quick' | 'status';

const WIDGET_KEYS: WidgetKey[] = [
  'bot', 'attention', 'weekly', 'charts', 'coverage', 'birthdays', 'activity', 'search', 'quick', 'status',
];
const LS_WIDGETS = 'admin_dash_widgets';

const readWidgets = (): Record<WidgetKey, boolean> => {
  const def = Object.fromEntries(WIDGET_KEYS.map((k) => [k, true])) as Record<WidgetKey, boolean>;
  try {
    const raw = JSON.parse(localStorage.getItem(LS_WIDGETS) || 'null');
    if (raw) WIDGET_KEYS.forEach((k) => typeof raw[k] === 'boolean' && (def[k] = raw[k]));
  } catch {
    /* jim */
  }
  return def;
};

interface Bday { e: any; days: number; age: number }
interface AttentionItem { id: string; tone: keyof typeof TONES; icon: LucideIcon; text: string; count: number; to: string }
interface Ev { id: string; ts: number; icon: LucideIcon; tone: string; text: string }

const TONES = {
  red: 'bg-rose-500/10 text-rose-400',
  amber: 'bg-amber-500/10 text-amber-400',
  blue: 'bg-sky-500/10 text-sky-400',
  pink: 'bg-fuchsia-500/10 text-fuchsia-400',
  violet: 'bg-violet-500/10 text-violet-400',
};

const PALETTE = ['#ff2b3a', '#7c5cff', '#22d3ee', '#fbbf24', '#34d399', '#f472b6'];
const BOT_URL = 'https://t.me/mobiuz_welcome_book_bot';

const toArr = (v: any): any[] => (Array.isArray(v) ? v : v ? [v] : []);
const posIds = (s: any): string[] => toArr(s.visible_positions).map(refId).filter(Boolean);

const getAdminName = (): string => {
  try {
    return JSON.parse(localStorage.getItem('admin_user') || '{}').name || 'Admin';
  } catch {
    return 'Admin';
  }
};

const greetKey = (): 'night' | 'morning' | 'day' | 'evening' => {
  const h = new Date().getHours();
  if (h < 5) return 'night';
  if (h < 12) return 'morning';
  if (h < 18) return 'day';
  return 'evening';
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

function DateLine({ lang }: { lang: Lang }) {
  return <>{fmtDateLong(new Date(), lang)}</>;
}

export default function DashboardPage() {
  const { lang } = useLang();
  const t = T[lang];
  const toast = useToast();
  const root = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<Data>(EMPTY);
  const [failed, setFailed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [auto, setAuto] = useState(false);
  const [q, setQ] = useState('');
  const [widgets, setWidgets] = useState<Record<WidgetKey, boolean>>(readWidgets);
  const [customizeOpen, setCustomizeOpen] = useState(false);

  // ---------- Ma'lumot yuklash ----------
  const load = useCallback(
    async (mode: 'initial' | 'silent' | 'manual' = 'initial') => {
      if (mode === 'initial') setLoading(true);
      else setRefreshing(true);

      const results = await Promise.allSettled([
        getEmployees(), getSections(), getBanners(), getDepartments(),
        getPositions(), getFeedbacks(), getNotifications(),
      ]);
      const pick = (i: number): AnyList => {
        const r = results[i];
        return r.status === 'fulfilled' && Array.isArray(r.value) ? r.value : [];
      };
      const bad = results.filter((r) => r.status === 'rejected').length;

      setData({
        employees: pick(0), sections: pick(1), banners: pick(2), departments: pick(3),
        positions: pick(4), feedbacks: pick(5), notifications: pick(6),
      });
      setFailed(bad);
      setUpdatedAt(new Date());
      setLoading(false);
      setRefreshing(false);

      if (mode === 'manual') {
        const tt = T[(localStorage.getItem('admin_lang') as Lang) === 'ru' ? 'ru' : 'uz'];
        bad === 0 ? toast.success(tt.status.refreshed) : toast.error(tt.status.refreshError(bad));
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

  useHotkey('r', () => load('manual'));

  // ---------- GSAP animatsiyalari ----------
  useEffect(() => {
    if (loading || !root.current) return;
    const ctx = gsap.context(() => {
      gsap.from('[data-reveal]', {
        y: 40, opacity: 0, duration: 0.9, stagger: 0.06, ease: 'power3.out', clearProps: 'transform,opacity',
      });
      gsap.from('.hero-word', { yPercent: 120, duration: 1, stagger: 0.07, ease: 'power4.out', delay: 0.15 });
      gsap.to('[data-float]', {
        y: 'random(-16, 16)', x: 'random(-10, 10)', rotation: 'random(-10, 10)',
        duration: 'random(3, 5)', repeat: -1, yoyo: true, ease: 'sine.inOut', stagger: 0.4,
      });
    }, root);
    return () => ctx.revert();
  }, [loading]);

  // ---------- Hisoblangan qiymatlar ----------
  const emps = data.employees;
  const linked = useMemo(() => emps.filter((e) => !!e.telegram_id).length, [emps]);
  const linkedPct = emps.length ? Math.round((linked / emps.length) * 100) : 0;

  const avgRating = useMemo(() => {
    const rated = data.feedbacks.filter((f) => typeof f.rating === 'number');
    return rated.length ? rated.reduce((s, f) => s + f.rating, 0) / rated.length : null;
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

  const deptSegments = useMemo<Segment[]>(() => {
    const map = new Map<string, number>();
    emps.forEach((e) => {
      const d = resolveRef(data.departments, e.department);
      const name = nm(d, lang);
      if (name) map.set(name, (map.get(name) || 0) + 1);
    });
    const rows = [...map.entries()].sort((a, b) => b[1] - a[1]);
    const segs: Segment[] = rows.slice(0, 5).map(([label, value], i) => ({ label, value, color: PALETTE[i] }));
    const rest = rows.slice(5).reduce((s, r) => s + r[1], 0);
    if (rest > 0) segs.push({ label: t.charts.others, value: rest, color: PALETTE[5] });
    return segs;
  }, [emps, data.departments, lang, t.charts.others]);

  // Lavozimlar qamrovi: har bir lavozim uchun maxsus (maxfiy) maqolalar soni
  const coverage = useMemo(() => {
    const secCount = new Map<string, number>();
    data.sections
      .filter((s) => s.is_public === false && s.is_active !== false)
      .forEach((s) => posIds(s).forEach((id) => secCount.set(id, (secCount.get(id) || 0) + 1)));

    const empCount = new Map<string, number>();
    emps.forEach((e) => {
      const id = refId(e.position);
      if (id) empCount.set(id, (empCount.get(id) || 0) + 1);
    });

    const rows = data.positions
      .map((p) => ({ p, emps: empCount.get(idOf(p)) || 0, secs: secCount.get(idOf(p)) || 0 }))
      .sort((a, b) => b.emps - a.emps || nm(a.p, lang).localeCompare(nm(b.p, lang)));

    return { rows, uncovered: rows.filter((r) => r.emps > 0 && r.secs === 0).length };
  }, [data.sections, data.positions, emps, lang]);

  // Yaqin 30 kundagi tug'ilgan kunlar
  const birthdays = useMemo<Bday[]>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const out: Bday[] = [];
    emps.forEach((e) => {
      const b = parseDate(e.birth_date);
      if (!b) return;
      let next = new Date(today.getFullYear(), b.getMonth(), b.getDate());
      if (next < today) next = new Date(today.getFullYear() + 1, b.getMonth(), b.getDate());
      const days = Math.round((next.getTime() - today.getTime()) / 86400000);
      if (days <= 30) out.push({ e, days, age: next.getFullYear() - b.getFullYear() });
    });
    return out.sort((a, b) => a.days - b.days);
  }, [emps]);

  // "Diqqat talab qiladi" ro'yxati
  const attention = useMemo<AttentionItem[]>(() => {
    const noPos = emps.filter((e) => !refId(e.position)).length;
    const noDep = emps.filter((e) => !refId(e.department)).length;
    const list: AttentionItem[] = [
      { id: 'unread', tone: 'red', icon: MessageSquare, text: t.attention.unread(unread), count: unread, to: '/feedbacks' },
      { id: 'bday', tone: 'pink', icon: Cake, text: t.attention.bdayToday(birthdays.filter((b) => b.days === 0).length), count: birthdays.filter((b) => b.days === 0).length, to: '/employees' },
      { id: 'unlinked', tone: 'amber', icon: Send, text: t.attention.unlinked(emps.length - linked), count: emps.length - linked, to: '/employees' },
      { id: 'nopos', tone: 'violet', icon: Briefcase, text: t.attention.noPosition(noPos), count: noPos, to: '/employees' },
      { id: 'nodep', tone: 'blue', icon: Building2, text: t.attention.noDept(noDep), count: noDep, to: '/employees' },
      { id: 'uncovered', tone: 'amber', icon: Layers, text: t.attention.uncovered(coverage.uncovered), count: coverage.uncovered, to: '/sections' },
      { id: 'insec', tone: 'red', icon: XCircle, text: t.attention.inactiveSections(data.sections.filter((s) => s.is_active === false).length), count: data.sections.filter((s) => s.is_active === false).length, to: '/sections' },
      { id: 'inban', tone: 'red', icon: XCircle, text: t.attention.inactiveBanners(data.banners.filter((b) => b.is_active === false).length), count: data.banners.filter((b) => b.is_active === false).length, to: '/banners' },
    ];
    return list.filter((x) => x.count > 0);
  }, [emps, linked, unread, birthdays, coverage.uncovered, data.sections, data.banners, t]);

  // Oxirgi 7 kun statistikasi
  const week = useMemo(() => {
    const days: Date[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      days.push(d);
    }
    const countBy = (list: AnyList) => {
      const map = new Map<string, number>();
      list.forEach((x) => {
        const d = parseDate(createdOf(x));
        if (d) map.set(d.toDateString(), (map.get(d.toDateString()) || 0) + 1);
      });
      return days.map((d) => map.get(d.toDateString()) || 0);
    };
    const e = countBy(emps);
    const f = countBy(data.feedbacks);
    return {
      days,
      emps: e,
      fbs: f,
      max: Math.max(1, ...e, ...f),
      totalE: e.reduce((s, x) => s + x, 0),
      totalF: f.reduce((s, x) => s + x, 0),
    };
  }, [emps, data.feedbacks]);

  // So'nggi harakatlar (barcha obyektlarning yaratilish vaqti bo'yicha)
  const events = useMemo<Ev[]>(() => {
    const out: Ev[] = [];
    const push = (list: AnyList, kind: string, icon: LucideIcon, tone: string, text: (x: any) => string) =>
      list.forEach((x) => {
        const c = createdOf(x);
        const ts = c ? new Date(c).getTime() : 0;
        if (ts) out.push({ id: `${kind}-${idOf(x)}`, ts, icon, tone, text: text(x) });
      });
    const title = (x: any) => (lang === 'ru' ? x.title_ru || x.title_uz : x.title_uz || x.title_ru) || '';

    push(emps, 'e', Users, 'bg-sky-500/10 text-sky-400', (x) => t.activity.employee(x.full_name || x.passport));
    push(data.feedbacks, 'f', MessageSquare, 'bg-fuchsia-500/10 text-fuchsia-400', (x) => t.activity.feedback(Math.round(Number(x.rating) || 0)));
    push(data.sections, 's', FileText, 'bg-rose-500/10 text-rose-400', (x) => t.activity.section(title(x)));
    push(data.banners, 'b', ImageIcon, 'bg-amber-500/10 text-amber-400', (x) => t.activity.banner(title(x)));
    push(data.notifications, 'n', Bell, 'bg-violet-500/10 text-violet-400', (x) => t.activity.notification(title(x)));
    return out.sort((a, b) => b.ts - a.ts).slice(0, 8);
  }, [emps, data.feedbacks, data.sections, data.banners, data.notifications, lang, t]);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    const rows = emps.map((e) => ({
      e,
      pos: resolveRef(data.positions, e.position),
      dep: resolveRef(data.departments, e.department),
    }));
    if (!s) return rows.slice(0, 5);
    return rows
      .filter(({ e, pos, dep }) =>
        [e.passport, e.full_name, pos?.name_uz, pos?.name_ru, dep?.name_uz, dep?.name_ru]
          .filter(Boolean).join(' ').toLowerCase().includes(s)
      )
      .slice(0, 6);
  }, [q, emps, data.positions, data.departments]);

  const cards: { icon: LucideIcon; label: string; value: number; accent: Accent; to: string }[] = [
    { icon: Users, label: t.labels.employees, value: emps.length, accent: 'blue', to: '/employees' },
    { icon: Building2, label: t.labels.departments, value: data.departments.length, accent: 'green', to: '/departments' },
    { icon: Briefcase, label: t.labels.positions, value: data.positions.length, accent: 'purple', to: '/positions' },
    { icon: FileText, label: t.labels.sections, value: data.sections.length, accent: 'red', to: '/sections' },
    { icon: ImageIcon, label: t.labels.banners, value: data.banners.length, accent: 'orange', to: '/banners' },
    { icon: MessageSquare, label: t.labels.feedbacks, value: data.feedbacks.length, accent: 'pink', to: '/feedbacks' },
  ];
  const maxCard = Math.max(1, ...cards.map((c) => c.value));

  const apiStatus =
    failed === 0
      ? { text: t.status.online, dot: 'bg-emerald-400', color: 'text-emerald-400' }
      : failed < 7
      ? { text: t.status.partial, dot: 'bg-amber-400', color: 'text-amber-400' }
      : { text: t.status.offline, dot: 'bg-rose-400', color: 'text-rose-400' };

  // ---------- Vidjetlarni sozlash ----------
  const setWidget = (k: WidgetKey, v: boolean) =>
    setWidgets((w) => {
      const next = { ...w, [k]: v };
      try {
        localStorage.setItem(LS_WIDGETS, JSON.stringify(next));
      } catch {
        /* jim */
      }
      return next;
    });

  const resetWidgets = () => {
    const def = Object.fromEntries(WIDGET_KEYS.map((k) => [k, true])) as Record<WidgetKey, boolean>;
    setWidgets(def);
    try {
      localStorage.removeItem(LS_WIDGETS);
    } catch {
      /* jim */
    }
  };

  // ---------- Eksport ----------
  const stamp = new Date().toISOString().slice(0, 10);

  const exportEmployees = () => {
    const ok = downloadCSV(
      `employees-${stamp}.csv`,
      emps.map((e) => ({
        [t.csv.id]: idOf(e),
        [t.csv.passport]: e.passport,
        [t.csv.name]: e.full_name || '',
        [t.csv.birth]: e.birth_date ? String(e.birth_date).slice(0, 10) : '',
        [t.csv.dept]: nm(resolveRef(data.departments, e.department), lang),
        [t.csv.position]: nm(resolveRef(data.positions, e.position), lang),
        [t.csv.telegram]: e.telegram_id ? t.csv.linked : t.csv.notLinked,
      }))
    );
    ok ? toast.success(t.status.exported) : toast.info(t.status.nothing);
  };

  const exportFeedbacks = () => {
    const ok = downloadCSV(
      `feedbacks-${stamp}.csv`,
      data.feedbacks.map((f) => ({
        [t.csv.id]: idOf(f),
        [t.csv.rating]: f.rating ?? '',
        [t.csv.category]: f.category ?? '',
        [t.csv.comment]: f.comment ?? '',
        [t.csv.read]: f.is_read ? t.csv.yes : t.csv.no,
        [t.csv.date]: createdOf(f) || '',
      }))
    );
    ok ? toast.success(t.status.exported) : toast.info(t.status.nothing);
  };

  const exportReport = () => {
    const rows: [string, string | number][] = [
      [t.labels.employees, emps.length],
      [t.bot.linked, linked],
      [t.csv.linkedPct, linkedPct],
      [t.labels.departments, data.departments.length],
      [t.labels.positions, data.positions.length],
      [t.labels.sections, data.sections.length],
      [t.labels.banners, data.banners.length],
      [t.labels.feedbacks, data.feedbacks.length],
      [t.csv.unread, unread],
      [t.csv.avg, avgRating !== null ? avgRating.toFixed(2) : ''],
      [t.csv.bdays, birthdays.length],
      [t.csv.attention, attention.length],
    ];
    const ok = downloadCSV(
      `report-${stamp}.csv`,
      rows.map(([m, v]) => ({ [t.csv.metric]: m, [t.csv.value]: v }))
    );
    ok ? toast.success(t.status.exported) : toast.info(t.status.nothing);
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
          {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton h-[150px]" />)}
        </div>
        <div className="grid gap-5 lg:grid-cols-12">
          <div className="skeleton h-80 lg:col-span-5" />
          <div className="skeleton h-80 lg:col-span-7" />
        </div>
      </div>
    );
  }

  const heroText = `${t.greet[greetKey()]}, ${getAdminName()}`;
  const totalDept = deptSegments.reduce((s, x) => s + x.value, 0);

  const dayLabel = (d: Date) => t.weekly.days[d.getDay()];

  // ==================== RENDER ====================
  return (
    <div ref={root} className="space-y-5">
      {/* ================= HERO + BOT ================= */}
      <div className="grid gap-5 lg:grid-cols-12">
        <SpotlightCard
          data-reveal
          className={`hero-mesh min-h-[340px] p-6 text-white md:p-9 ${widgets.bot ? 'lg:col-span-8' : 'lg:col-span-12'}`}
        >
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-black/20 px-3.5 py-1.5 text-xs font-bold backdrop-blur">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
                </span>
                {t.live} · <DateLine lang={lang} />
              </span>
              <button
                onClick={() => setCustomizeOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-black/20 px-3.5 py-2 text-xs font-extrabold backdrop-blur transition hover:bg-black/35"
              >
                <SlidersHorizontal className="h-4 w-4" />
                {t.btn.customize}
              </button>
            </div>

            <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 key={lang} className="max-w-xl text-3xl font-black leading-[1.05] tracking-tight md:text-5xl">
                  {heroText.split(' ').map((w, i) => (
                    <span key={i} className="mr-[0.25em] inline-block overflow-hidden align-bottom">
                      <span className="hero-word inline-block">{w}</span>
                    </span>
                  ))}
                  <span className="inline-block origin-[70%_70%] animate-pulse">👋</span>
                </h1>
                <p className="mt-3 max-w-md text-sm text-white/80 md:text-[15px]">
                  {t.heroLine(emps.length, data.sections.length, unread)}
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Magnetic>
                    <Link
                      to="/employees"
                      className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-[#b00410] shadow-[0_14px_34px_-10px_rgba(0,0,0,0.6)]"
                    >
                      <Plus className="h-4 w-4" />
                      {t.btn.addEmployee}
                    </Link>
                  </Magnetic>
                  <Magnetic>
                    <button
                      onClick={() => window.dispatchEvent(new Event('app:palette'))}
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-extrabold backdrop-blur transition hover:bg-white/20"
                    >
                      <CommandIcon className="h-4 w-4" />
                      {t.btn.search}
                      <span className="kbd !border-white/25 !bg-black/20 !text-white">Ctrl K</span>
                    </button>
                  </Magnetic>
                </div>
              </div>
              <Clock />
            </div>
          </div>
        </SpotlightCard>

        {widgets.bot && (
          <SpotlightCard data-reveal className="flex flex-col items-center justify-between p-6 text-center lg:col-span-4">
            <div className="flex w-full items-center justify-between">
              <div className="text-left">
                <h3 className="font-extrabold text-white">{t.bot.title}</h3>
                <p className="mt-0.5 text-xs text-zinc-500">{t.bot.sub}</p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10">
                <Send className="h-[18px] w-[18px] text-sky-400" />
              </span>
            </div>

            <Ring value={linkedPct} size={180} thickness={16}>
              <p className="text-5xl font-black tracking-tight text-white">
                <AnimatedNumber value={linkedPct} suffix="%" />
              </p>
              <p className="mt-1 text-xs font-semibold text-zinc-500">{t.bot.linked}</p>
            </Ring>

            <div className="w-full space-y-3">
              <div className="grid grid-cols-2 gap-2.5 text-left">
                <div className="rounded-2xl bg-white/[0.04] p-3">
                  <p className="text-xl font-black text-white">{linked}</p>
                  <p className="text-[11px] text-zinc-500">{t.bot.linked}</p>
                </div>
                <div className="rounded-2xl bg-white/[0.04] p-3">
                  <p className="text-xl font-black text-white">{emps.length - linked}</p>
                  <p className="text-[11px] text-zinc-500">{t.bot.pending}</p>
                </div>
              </div>
              <a href={BOT_URL} target="_blank" rel="noopener noreferrer" className="btn btn-ghost w-full">
                <Send className="h-4 w-4" />
                {t.bot.open}
              </a>
            </div>
          </SpotlightCard>
        )}
      </div>

      {/* ================= STATISTIKA ================= */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => (
          <StatCard key={c.label} {...c} share={(c.value / maxCard) * 100} />
        ))}
      </div>

      {/* ================= DIQQAT + 7 KUN ================= */}
      {(widgets.attention || widgets.weekly) && (
        <div className="grid gap-5 lg:grid-cols-12">
          {widgets.attention && (
            <SpotlightCard data-reveal className={`p-6 ${widgets.weekly ? 'lg:col-span-5' : 'lg:col-span-12'}`}>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-white">{t.attention.title}</h3>
                  <p className="mt-0.5 text-xs text-zinc-500">{t.attention.sub}</p>
                </div>
                {attention.length > 0 && (
                  <span className="badge bg-[#ff2b3a]/15 text-[#ff6b75]">{attention.length}</span>
                )}
              </div>

              {attention.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10">
                    <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                  </div>
                  <p className="font-extrabold text-white">{t.attention.allGood}</p>
                  <p className="mt-1 text-sm text-zinc-500">{t.attention.allGoodText}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {attention.map((a, i) => {
                    const Icon = a.icon;
                    return (
                      <motion.div
                        key={a.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + i * 0.05 }}
                      >
                        <Link
                          to={a.to}
                          className="group flex items-center gap-3 rounded-2xl bg-white/[0.04] p-3 transition hover:bg-white/[0.08]"
                        >
                          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${TONES[a.tone]}`}>
                            <Icon className="h-[18px] w-[18px]" />
                          </span>
                          <span className="flex-1 text-sm font-semibold text-zinc-200">{a.text}</span>
                          <ChevronRight className="h-4 w-4 text-zinc-600 transition group-hover:translate-x-0.5 group-hover:text-white" />
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </SpotlightCard>
          )}

          {widgets.weekly && (
            <SpotlightCard data-reveal className={`p-6 ${widgets.attention ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-white">{t.weekly.title}</h3>
                  <p className="mt-0.5 text-xs text-zinc-500">{t.weekly.sub}</p>
                </div>
                <div className="flex gap-4 text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-sky-300">
                    <span className="h-2.5 w-2.5 rounded-full bg-sky-400" /> {t.weekly.employees}: {week.totalE}
                  </span>
                  <span className="flex items-center gap-1.5 text-fuchsia-300">
                    <span className="h-2.5 w-2.5 rounded-full bg-fuchsia-400" /> {t.weekly.feedbacks}: {week.totalF}
                  </span>
                </div>
              </div>

              <div className="flex h-44 items-end justify-between gap-2 sm:gap-4">
                {week.days.map((d, i) => (
                  <div key={d.toDateString()} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                    <div className="flex h-full w-full items-end justify-center gap-1">
                      {[
                        { v: week.emps[i], cls: 'from-sky-500 to-sky-300' },
                        { v: week.fbs[i], cls: 'from-fuchsia-500 to-fuchsia-300' },
                      ].map((bar, k) => (
                        <div key={k} className="group relative flex h-full w-full max-w-[22px] flex-col items-center justify-end">
                          <span className="mb-1 text-[10px] font-black text-zinc-400 opacity-0 transition group-hover:opacity-100">
                            {bar.v}
                          </span>
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.max((bar.v / week.max) * 100, bar.v > 0 ? 6 : 2)}%` }}
                            transition={{ delay: 0.2 + i * 0.05, duration: 0.7, ease: 'easeOut' }}
                            className={`w-full rounded-t-lg bg-gradient-to-t ${bar.v > 0 ? bar.cls : 'from-white/10 to-white/10'}`}
                          />
                        </div>
                      ))}
                    </div>
                    <span className={`text-[11px] font-bold ${d.toDateString() === new Date().toDateString() ? 'text-white' : 'text-zinc-500'}`}>
                      {dayLabel(d)}
                    </span>
                  </div>
                ))}
              </div>
            </SpotlightCard>
          )}
        </div>
      )}

      {/* ================= DIAGRAMMALAR ================= */}
      {widgets.charts && (
        <div className="grid gap-5 lg:grid-cols-12">
          <SpotlightCard data-reveal className="p-6 lg:col-span-7">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-white">{t.charts.dept}</h3>
                <p className="mt-0.5 text-xs text-zinc-500">{t.charts.deptSub}</p>
              </div>
              <Link to="/departments" className="text-xs font-bold text-[#ff6b75] hover:underline">
                {t.charts.all} →
              </Link>
            </div>

            {deptSegments.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <Inbox className="mb-2 h-10 w-10 text-zinc-700" />
                <p className="text-sm text-zinc-500">{t.charts.noDept}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-8 md:flex-row">
                <Donut segments={deptSegments} size={200} thickness={24}>
                  <p className="text-4xl font-black text-white"><AnimatedNumber value={totalDept} /></p>
                  <p className="text-xs font-semibold text-zinc-500">{t.charts.people}</p>
                </Donut>
                <div className="w-full flex-1 space-y-2.5">
                  {deptSegments.map((s, i) => (
                    <motion.div
                      key={s.label}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.07 }}
                      className="flex items-center gap-3 rounded-2xl bg-white/[0.04] px-4 py-3"
                    >
                      <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: s.color }} />
                      <span className="flex-1 truncate text-sm font-semibold text-zinc-200">{s.label}</span>
                      <span className="text-sm font-black tabular-nums text-white">{s.value}</span>
                      <span className="w-10 text-right text-xs font-bold text-zinc-500">
                        {Math.round((s.value / totalDept) * 100)}%
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </SpotlightCard>

          <SpotlightCard data-reveal className="p-6 lg:col-span-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-white">{t.charts.ratings}</h3>
                <p className="mt-0.5 text-xs text-zinc-500">{t.charts.basedOn(data.feedbacks.length)}</p>
              </div>
              <div className="text-right">
                <p className="flex items-center justify-end gap-1.5 text-3xl font-black text-white">
                  {avgRating !== null ? <AnimatedNumber value={avgRating} decimals={1} /> : '–'}
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                </p>
                <p className="text-[11px] text-zinc-500">{t.charts.avg}</p>
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
                        transition={{ delay: 0.3 + idx * 0.08, duration: 0.8, ease: 'easeOut' }}
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
      )}

      {/* ================= QAMROV + TUG'ILGAN KUNLAR ================= */}
      {(widgets.coverage || widgets.birthdays) && (
        <div className="grid gap-5 lg:grid-cols-12">
          {widgets.coverage && (
            <SpotlightCard data-reveal className={`p-6 ${widgets.birthdays ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
              <div className="mb-4">
                <h3 className="font-extrabold text-white">{t.coverage.title}</h3>
                <p className="mt-0.5 text-xs text-zinc-500">{t.coverage.sub}</p>
              </div>

              {coverage.rows.length === 0 ? (
                <p className="py-8 text-center text-sm text-zinc-500">{t.coverage.empty}</p>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-[1fr_64px_64px_104px] gap-2 px-3 text-[10px] font-extrabold uppercase tracking-wider text-zinc-600">
                    <span />
                    <span className="text-center">{t.coverage.employees}</span>
                    <span className="text-center">{t.coverage.sections}</span>
                    <span className="text-right" />
                  </div>
                  {coverage.rows.slice(0, 7).map((r, i) => {
                    const gap = r.emps > 0 && r.secs === 0;
                    return (
                      <motion.div
                        key={idOf(r.p)}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.04 }}
                        className={`grid grid-cols-[1fr_64px_64px_104px] items-center gap-2 rounded-2xl px-3 py-2.5 ${gap ? 'bg-amber-500/[0.08]' : 'bg-white/[0.04]'}`}
                      >
                        <span className="flex min-w-0 items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/15">
                            <Briefcase className="h-4 w-4 text-violet-300" />
                          </span>
                          <span className="truncate text-sm font-bold text-zinc-200">{nm(r.p, lang)}</span>
                        </span>
                        <span className="text-center text-sm font-black tabular-nums text-white">{r.emps}</span>
                        <span className="text-center text-sm font-black tabular-nums text-white">{r.secs}</span>
                        <span className="text-right">
                          {r.emps === 0 ? (
                            <span className="text-zinc-700">—</span>
                          ) : gap ? (
                            <span className="badge bg-amber-500/15 text-amber-400">{t.coverage.gap}</span>
                          ) : (
                            <span className="badge bg-emerald-500/15 text-emerald-400">
                              <CheckCircle2 className="h-3 w-3" /> {t.coverage.ok}
                            </span>
                          )}
                        </span>
                      </motion.div>
                    );
                  })}
                  <p className="px-1 pt-2 text-xs text-zinc-500">{t.coverage.hint}</p>
                </div>
              )}
            </SpotlightCard>
          )}

          {widgets.birthdays && (
            <SpotlightCard data-reveal className={`p-6 ${widgets.coverage ? 'lg:col-span-5' : 'lg:col-span-12'}`}>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-white">{t.birthdays.title}</h3>
                  <p className="mt-0.5 text-xs text-zinc-500">{t.birthdays.sub}</p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-fuchsia-500/10">
                  <Cake className="h-[18px] w-[18px] text-fuchsia-400" />
                </span>
              </div>

              {birthdays.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <Cake className="mb-2 h-9 w-9 text-zinc-700" />
                  <p className="text-sm text-zinc-500">{t.birthdays.empty}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {birthdays.slice(0, 6).map((b, i) => (
                    <motion.div
                      key={idOf(b.e)}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                      className={`flex items-center gap-3 rounded-2xl p-3 ${b.days === 0 ? 'bg-fuchsia-500/[0.12] ring-1 ring-fuchsia-500/30' : 'bg-white/[0.04]'}`}
                    >
                      <Avatar text={b.e.full_name || b.e.passport || '?'} size={40} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-extrabold text-white">{b.e.full_name || b.e.passport}</p>
                        <p className="text-xs text-zinc-500">{t.birthdays.turns(b.age)}</p>
                      </div>
                      <span className={`badge ${b.days === 0 ? 'bg-fuchsia-500/25 text-fuchsia-200' : 'bg-white/10 text-zinc-300'}`}>
                        {b.days === 0 ? `🎂 ${t.birthdays.today}` : b.days === 1 ? t.birthdays.tomorrow : t.birthdays.inDays(b.days)}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </SpotlightCard>
          )}
        </div>
      )}

      {/* ================= HARAKATLAR + QIDIRUV ================= */}
      {(widgets.activity || widgets.search) && (
        <div className="grid gap-5 lg:grid-cols-12">
          {widgets.activity && (
            <SpotlightCard data-reveal className={`p-6 ${widgets.search ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
              <div className="mb-4">
                <h3 className="font-extrabold text-white">{t.activity.title}</h3>
                <p className="mt-0.5 text-xs text-zinc-500">{t.activity.sub}</p>
              </div>

              {events.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <Inbox className="mb-2 h-10 w-10 text-zinc-700" />
                  <p className="text-sm text-zinc-500">{t.activity.empty}</p>
                </div>
              ) : (
                <div className="relative space-y-1">
                  <span className="absolute bottom-3 left-[19px] top-3 w-px bg-white/[0.08]" />
                  {events.map((ev, i) => {
                    const Icon = ev.icon;
                    return (
                      <motion.div
                        key={ev.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + i * 0.045 }}
                        className="relative flex items-center gap-3 rounded-xl py-2 pr-2 transition hover:bg-white/[0.04]"
                      >
                        <span className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-4 ring-[#0e1014] ${ev.tone}`}>
                          <Icon className="h-[18px] w-[18px]" />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-200">{ev.text}</span>
                        <span className="shrink-0 text-xs text-zinc-500">{relTime(new Date(ev.ts).toISOString(), lang)}</span>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </SpotlightCard>
          )}

          {widgets.search && (
            <SpotlightCard data-reveal className={`p-6 ${widgets.activity ? 'lg:col-span-5' : 'lg:col-span-12'}`}>
              <h3 className="font-extrabold text-white">{t.search.title}</h3>
              <p className="mt-0.5 text-xs text-zinc-500">{t.search.sub}</p>

              <div className="relative mt-4">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-zinc-500" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t.search.ph}
                  className="input py-3 pl-12"
                />
              </div>

              <div className="mt-4 space-y-2">
                {results.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-center">
                    <Inbox className="mb-2 h-9 w-9 text-zinc-700" />
                    <p className="text-sm text-zinc-500">{t.search.empty}</p>
                  </div>
                ) : (
                  results.map(({ e, pos, dep }, i) => (
                    <motion.div
                      key={idOf(e) || i}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 rounded-2xl bg-white/[0.04] p-3"
                    >
                      <Avatar text={e.full_name || e.passport || '?'} size={40} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-sm font-bold text-white">{e.passport}</p>
                        <p className="truncate text-xs text-zinc-500">
                          {nm(pos, lang) || t.search.noPosition}
                          {dep ? ` · ${nm(dep, lang)}` : ''}
                        </p>
                      </div>
                      {e.telegram_id ? (
                        <span className="badge bg-emerald-500/15 text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" /> {t.search.bot}
                        </span>
                      ) : (
                        <span className="badge bg-zinc-500/15 text-zinc-500">{t.search.noBot}</span>
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            </SpotlightCard>
          )}
        </div>
      )}

      {/* ================= TEZKOR AMALLAR + HOLAT ================= */}
      {(widgets.quick || widgets.status) && (
        <div className="grid gap-5 lg:grid-cols-12">
          {widgets.quick && (
            <SpotlightCard data-reveal className={`p-6 ${widgets.status ? 'lg:col-span-5' : 'lg:col-span-12'}`}>
              <h3 className="font-extrabold text-white">{t.quick.title}</h3>
              <p className="mt-0.5 text-xs text-zinc-500">{t.quick.sub}</p>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  { to: '/employees', icon: Users, label: t.quick.employee, tone: 'text-sky-400 bg-sky-500/10' },
                  { to: '/sections', icon: FileText, label: t.quick.section, tone: 'text-rose-400 bg-rose-500/10' },
                  { to: '/banners', icon: ImageIcon, label: t.quick.banner, tone: 'text-amber-400 bg-amber-500/10' },
                  { to: '/departments', icon: Building2, label: t.quick.department, tone: 'text-emerald-400 bg-emerald-500/10' },
                  { to: '/notifications', icon: Bell, label: t.quick.notification, tone: 'text-violet-400 bg-violet-500/10' },
                  { to: '/settings', icon: SettingsIcon, label: t.quick.settings, tone: 'text-zinc-300 bg-white/10' },
                ].map(({ to, icon: Icon, label, tone }) => (
                  <Link
                    key={to}
                    to={to}
                    className="group flex flex-col items-start gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 transition-all hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.07]"
                  >
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110 group-hover:rotate-6 ${tone}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-[13px] font-extrabold text-zinc-200">{label}</span>
                  </Link>
                ))}
              </div>
            </SpotlightCard>
          )}

          {widgets.status && (
            <SpotlightCard data-reveal className={`p-6 ${widgets.quick ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10">
                    <Activity className="h-5 w-5 text-emerald-400" />
                  </span>
                  <div>
                    <h3 className="font-extrabold text-white">{t.status.title}</h3>
                    <p className="text-xs text-zinc-500">
                      {updatedAt ? `${t.status.updated}: ${formatTime(updatedAt)}` : ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => load('manual')}
                  disabled={refreshing}
                  className="btn btn-ghost !px-3 !py-2.5"
                  aria-label="Refresh"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] p-3.5">
                  <div className="flex items-center gap-2.5">
                    <Server className="h-4 w-4 text-zinc-500" />
                    <span className="text-sm font-semibold text-zinc-300">{t.status.api}</span>
                  </div>
                  <span className={`flex items-center gap-2 text-xs font-extrabold ${apiStatus.color}`}>
                    <span className={`h-2 w-2 animate-pulse rounded-full ${apiStatus.dot}`} />
                    {apiStatus.text}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] p-3.5">
                  <span className="text-sm font-semibold text-zinc-300">{t.status.auto}</span>
                  <Switch
                    checked={auto}
                    onChange={(v) => {
                      setAuto(v);
                      toast.info(v ? t.status.autoOn : t.status.autoOff);
                    }}
                    label={t.status.auto}
                  />
                </div>
              </div>

              <div className="mt-5">
                <p className="label">{t.status.export}</p>
                <div className="grid gap-2.5 sm:grid-cols-3">
                  <button onClick={exportEmployees} className="btn btn-ghost justify-start !text-xs">
                    <Download className="h-4 w-4 text-sky-400" /> {t.status.exportEmployees}
                  </button>
                  <button onClick={exportFeedbacks} className="btn btn-ghost justify-start !text-xs">
                    <Download className="h-4 w-4 text-fuchsia-400" /> {t.status.exportFeedbacks}
                  </button>
                  <button onClick={exportReport} className="btn btn-ghost justify-start !text-xs">
                    <Sparkles className="h-4 w-4 text-amber-400" /> {t.status.exportReport}
                  </button>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-zinc-500">
                <span className="flex items-center gap-1.5"><span className="kbd">Ctrl</span><span className="kbd">K</span> {t.status.keyK}</span>
                <span className="flex items-center gap-1.5"><span className="kbd">Ctrl</span><span className="kbd">B</span> {t.status.keyB}</span>
                <span className="flex items-center gap-1.5"><span className="kbd">R</span> {t.status.keyR}</span>
              </div>
            </SpotlightCard>
          )}
        </div>
      )}

      {/* ================= SOZLASH PANELI ================= */}
      <Drawer
        open={customizeOpen}
        onClose={() => setCustomizeOpen(false)}
        title={t.customize.title}
        footer={
          <button onClick={resetWidgets} className="btn btn-ghost w-full">
            <RotateCcw className="h-4 w-4" /> {t.customize.reset}
          </button>
        }
      >
        <p className="mb-5 text-sm text-zinc-400">{t.customize.text}</p>
        <div className="space-y-2.5">
          {WIDGET_KEYS.map((k) => (
            <div key={k} className="flex items-center justify-between rounded-2xl bg-white/[0.04] px-4 py-3.5">
              <span className="text-sm font-extrabold text-white">{t.customize.widgets[k]}</span>
              <Switch checked={widgets[k]} onChange={(v) => setWidget(k, v)} label={t.customize.widgets[k]} />
            </div>
          ))}
        </div>
      </Drawer>
    </div>
  );
}