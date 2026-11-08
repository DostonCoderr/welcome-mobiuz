import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Plus, Trash2, Pencil, Users, Download, Copy, Eye, Briefcase, Building2, Cake,
  UserCheck, Clock, Hash, CalendarPlus, Send,
} from 'lucide-react';
import {
  getEmployees, deleteEmployee, createEmployee, updateEmployee,
  getDepartments, getPositions,
} from '../api';
import PageHeader from '../components/PageHeader';
import Modal from '../components/ui/Modal';
import Drawer from '../components/ui/Drawer';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import {
  SearchBox, Segmented, Pagination, EmptyState, ErrorState, Avatar,
  StatPill, PageSkeleton, Field, selectCls,
} from '../components/ui/Kit';
import SpotlightCard from '../components/SpotlightCard';
import AnimatedNumber from '../components/AnimatedNumber';
import { Ring } from '../components/Charts';
import { useToast } from '../components/Toast';
import { useT } from '../hooks/useT';
import { useHotkey } from '../hooks/useHotkey';
import { downloadCSV } from '../utils/format';
import {
  idOf, refId, resolveRef, nm, toDateInput, ageFrom, parseDate, fmtDate, createdOf, copyText,
} from '../utils/text';

// ==================== TARJIMALAR (shu sahifa uchun) ====================
const T = {
  uz: {
    eyebrow: 'Jamoa',
    add: 'Yangi xodim',
    searchPh: "Passport, ism, bo'lim yoki lavozim…",
    stats: { total: 'Jami xodimlar', linked: 'Botga ulangan', unlinked: 'Kutilmoqda', birthdays: "Bu oy tug'ilganlar" },
    filters: { all: 'Hammasi', linked: 'Ulangan', unlinked: 'Ulanmagan' },
    allDepartments: "Barcha bo'limlar",
    sort: {
      newest: 'Eng yangilari',
      passportAsc: 'Passport A→Z',
      passportDesc: 'Passport Z→A',
      birthAsc: "Tug'ilgan sana ↑",
      birthDesc: "Tug'ilgan sana ↓",
    },
    cols: { employee: 'Xodim', birth: "Tug'ilgan sana", job: "Lavozim / Bo'lim", telegram: 'Telegram', actions: 'Amallar' },
    linked: 'Ulangan',
    pending: 'Kutilmoqda',
    noJob: 'Biriktirilmagan',
    years: (n: number) => `${n} yosh`,
    analytics: {
      bot: 'Bot orqali ulanish',
      botText: 'Telegram orqali tasdiqlanganlar',
      dept: "Bo'limlar bo'yicha xodimlar",
      deptHint: 'Bosib filtrlang',
      noDept: "Xodimlarga bo'lim biriktirilmagan",
    },
    modal: {
      createTitle: 'Yangi xodim',
      editTitle: 'Xodimni tahrirlash',
      subtitle: "Passport va tug'ilgan sana bot orqali tasdiqlash uchun ishlatiladi",
      passport: 'Passport',
      passportErr: 'Format: 2 ta harf + 7 ta raqam (AA1234567)',
      passportDup: 'Bu passport allaqachon mavjud',
      birth: "Tug'ilgan sana",
      birthErr: "Sana noto'g'ri",
      fullName: "To'liq ism",
      fullNamePh: 'Masalan: Aliyev Vali',
      department: "Bo'lim",
      position: 'Lavozim',
      positionHint: 'Lavozimga qarab xodimga maxsus maqolalar ochiladi',
      telegram: 'Telegram ID',
      telegramHint: "Odatda bot o'zi to'ldiradi",
    },
    drawer: {
      title: 'Xodim kartasi',
      passport: 'Passport',
      birth: "Tug'ilgan sana",
      age: 'Yosh',
      telegram: 'Telegram ID',
      notLinked: 'Ulanmagan',
      department: "Bo'lim",
      position: 'Lavozim',
      created: "Qo'shilgan sana",
    },
    del: {
      title: "Xodimni o'chirasizmi?",
      text: (p: string) => `${p} raqamli xodim butunlay o'chiriladi.`,
      bulkTitle: (n: number) => `${n} ta xodimni o'chirasizmi?`,
      bulkText: "Tanlangan xodimlar butunlay o'chiriladi.",
      done: (n: number) => `${n} ta xodim o'chirildi`,
    },
    bulk: { remove: "O'chirish", export: 'Eksport' },
    empty: { title: "Hali xodim yo'q", text: "Birinchi xodimni qo'shing — u bot orqali tizimga kira oladi." },
    csv: { id: 'ID', passport: 'Passport', name: 'Ism', birth: "Tug'ilgan sana", age: 'Yosh', dept: "Bo'lim", position: 'Lavozim', telegram: 'Telegram' },
  },
  ru: {
    eyebrow: 'Команда',
    add: 'Новый сотрудник',
    searchPh: 'Паспорт, имя, отдел или должность…',
    stats: { total: 'Всего сотрудников', linked: 'Подключены к боту', unlinked: 'Ожидают', birthdays: 'Именинники месяца' },
    filters: { all: 'Все', linked: 'Подключены', unlinked: 'Не подключены' },
    allDepartments: 'Все отделы',
    sort: {
      newest: 'Сначала новые',
      passportAsc: 'Паспорт А→Я',
      passportDesc: 'Паспорт Я→А',
      birthAsc: 'Дата рождения ↑',
      birthDesc: 'Дата рождения ↓',
    },
    cols: { employee: 'Сотрудник', birth: 'Дата рождения', job: 'Должность / Отдел', telegram: 'Telegram', actions: 'Действия' },
    linked: 'Подключён',
    pending: 'Ожидает',
    noJob: 'Не назначено',
    years: (n: number) => `${n} л.`,
    analytics: {
      bot: 'Подключение к боту',
      botText: 'Подтверждены через Telegram',
      dept: 'Сотрудники по отделам',
      deptHint: 'Нажмите для фильтра',
      noDept: 'Сотрудникам не назначены отделы',
    },
    modal: {
      createTitle: 'Новый сотрудник',
      editTitle: 'Редактирование сотрудника',
      subtitle: 'Паспорт и дата рождения используются для подтверждения через бота',
      passport: 'Паспорт',
      passportErr: 'Формат: 2 буквы + 7 цифр (AA1234567)',
      passportDup: 'Такой паспорт уже существует',
      birth: 'Дата рождения',
      birthErr: 'Неверная дата',
      fullName: 'Полное имя',
      fullNamePh: 'Например: Алиев Вали',
      department: 'Отдел',
      position: 'Должность',
      positionHint: 'По должности сотруднику открываются специальные статьи',
      telegram: 'Telegram ID',
      telegramHint: 'Обычно бот заполняет сам',
    },
    drawer: {
      title: 'Карточка сотрудника',
      passport: 'Паспорт',
      birth: 'Дата рождения',
      age: 'Возраст',
      telegram: 'Telegram ID',
      notLinked: 'Не подключён',
      department: 'Отдел',
      position: 'Должность',
      created: 'Дата добавления',
    },
    del: {
      title: 'Удалить сотрудника?',
      text: (p: string) => `Сотрудник с паспортом ${p} будет удалён навсегда.`,
      bulkTitle: (n: number) => `Удалить сотрудников: ${n}?`,
      bulkText: 'Выбранные сотрудники будут удалены навсегда.',
      done: (n: number) => `Удалено сотрудников: ${n}`,
    },
    bulk: { remove: 'Удалить', export: 'Экспорт' },
    empty: { title: 'Сотрудников пока нет', text: 'Добавьте первого сотрудника — он сможет войти через бота.' },
    csv: { id: 'ID', passport: 'Паспорт', name: 'Имя', birth: 'Дата рождения', age: 'Возраст', dept: 'Отдел', position: 'Должность', telegram: 'Telegram' },
  },
};

type Status = 'all' | 'linked' | 'unlinked';
type SortKey = 'newest' | 'passportAsc' | 'passportDesc' | 'birthAsc' | 'birthDesc';

interface Row {
  raw: any;
  id: string;
  dep: any;
  pos: any;
  created?: string;
}

interface FormState {
  passport: string;
  birth_date: string;
  full_name: string;
  telegram_id: string;
  department: string;
  position: string;
}

const EMPTY_FORM: FormState = {
  passport: '', birth_date: '', full_name: '', telegram_id: '', department: '', position: '',
};

const BAR_COLORS = ['#ff2b3a', '#7c5cff', '#22d3ee', '#fbbf24', '#34d399'];
const time = (v?: string) => (v ? new Date(v).getTime() || 0 : 0);

export default function EmployeesPage() {
  const { t: g, lang } = useT();
  const t = T[lang];
  const toast = useToast();

  const [items, setItems] = useState<any[]>([]);
  const [deps, setDeps] = useState<any[]>([]);
  const [poss, setPoss] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState(false);

  const [q, setQ] = useState('');
  const [status, setStatus] = useState<Status>('all');
  const [dept, setDept] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sel, setSel] = useState<Set<string>>(new Set());

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [detail, setDetail] = useState<Row | null>(null);
  const [confirmIds, setConfirmIds] = useState<string[] | null>(null);
  const [deleting, setDeleting] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);

  // ---------- Ma'lumot yuklash ----------
  const load = useCallback(async () => {
    setLoading(true);
    setLoadErr(false);
    const [e, d, p] = await Promise.allSettled([getEmployees(), getDepartments(), getPositions()]);
    if (e.status === 'fulfilled') setItems(Array.isArray(e.value) ? e.value : []);
    else setLoadErr(true);
    if (d.status === 'fulfilled') setDeps(Array.isArray(d.value) ? d.value : []);
    if (p.status === 'fulfilled') setPoss(Array.isArray(p.value) ? p.value : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ---------- Hisoblangan ro'yxatlar ----------
  const rows = useMemo<Row[]>(
    () =>
      items.map((e) => ({
        raw: e,
        id: idOf(e),
        dep: resolveRef(deps, e.department),
        pos: resolveRef(poss, e.position),
        created: createdOf(e),
      })),
    [items, deps, poss]
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = rows.filter((r) => {
      if (status === 'linked' && !r.raw.telegram_id) return false;
      if (status === 'unlinked' && r.raw.telegram_id) return false;
      if (dept && idOf(r.dep) !== dept) return false;
      if (!s) return true;
      const hay = [
        r.raw.passport, r.raw.full_name,
        r.dep?.name_uz, r.dep?.name_ru, r.pos?.name_uz, r.pos?.name_ru,
      ].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(s);
    });

    const pass = (r: Row) => String(r.raw.passport || '');
    const birth = (r: Row) => String(r.raw.birth_date || '');
    const sorters: Record<SortKey, (a: Row, b: Row) => number> = {
      newest: (a, b) => time(b.created) - time(a.created),
      passportAsc: (a, b) => pass(a).localeCompare(pass(b)),
      passportDesc: (a, b) => pass(b).localeCompare(pass(a)),
      birthAsc: (a, b) => birth(a).localeCompare(birth(b)),
      birthDesc: (a, b) => birth(b).localeCompare(birth(a)),
    };
    return [...list].sort(sorters[sort]);
  }, [rows, q, status, dept, sort]);

  const pageRows = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize]
  );

  // Filtr o'zgarsa — 1-sahifa va tanlov tozalanadi
  useEffect(() => {
    setPage(1);
    setSel(new Set());
  }, [q, status, dept, sort, pageSize]);

  const linked = useMemo(() => rows.filter((r) => r.raw.telegram_id).length, [rows]);
  const linkedPct = rows.length ? Math.round((linked / rows.length) * 100) : 0;
  const birthdays = useMemo(() => {
    const m = new Date().getMonth();
    return rows.filter((r) => parseDate(r.raw.birth_date)?.getMonth() === m).length;
  }, [rows]);

  const deptBars = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number }>();
    rows.forEach((r) => {
      if (!r.dep) return;
      const id = idOf(r.dep);
      const cur = map.get(id) ?? { id, name: nm(r.dep, lang), count: 0 };
      cur.count++;
      map.set(id, cur);
    });
    const list = [...map.values()].sort((a, b) => b.count - a.count).slice(0, 5);
    const max = Math.max(1, ...list.map((x) => x.count));
    return list.map((x) => ({ ...x, pct: (x.count / max) * 100 }));
  }, [rows, lang]);

  const hasFilters = !!(q || status !== 'all' || dept);

  // ---------- Tanlash ----------
  const allOnPage = pageRows.length > 0 && pageRows.every((r) => sel.has(r.id));
  const toggleOne = (id: string) =>
    setSel((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const toggleAll = () =>
    setSel((s) => {
      const n = new Set(s);
      pageRows.forEach((r) => (allOnPage ? n.delete(r.id) : n.add(r.id)));
      return n;
    });

  // ---------- Forma ----------
  const openCreate = useCallback(() => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrs({});
    setModalOpen(true);
  }, []);

  const openEdit = (r: Row) => {
    setEditing(r.raw);
    setForm({
      passport: r.raw.passport || '',
      birth_date: toDateInput(r.raw.birth_date),
      full_name: r.raw.full_name || '',
      telegram_id: r.raw.telegram_id || '',
      department: refId(r.raw.department),
      position: refId(r.raw.position),
    });
    setErrs({});
    setDetail(null);
    setModalOpen(true);
  };

  useHotkey('n', openCreate, !modalOpen && !confirmIds);
  useHotkey('/', () => searchRef.current?.focus());

  const validate = () => {
    const e: Record<string, string> = {};
    const p = form.passport.trim();
    if (!/^[A-Z]{2}\d{7}$/.test(p)) e.passport = t.modal.passportErr;
    else if (items.some((x) => x.passport === p && idOf(x) !== idOf(editing))) e.passport = t.modal.passportDup;
    const d = parseDate(form.birth_date);
    if (!form.birth_date || !d || d > new Date() || d.getFullYear() < 1900) e.birth = t.modal.birthErr;
    return e;
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrs(e);
    if (Object.keys(e).length) return;

    setSaving(true);
    const payload = {
      ...form,
      passport: form.passport.trim(),
      department: form.department || null,
      position: form.position || null,
    };
    try {
      if (editing) await updateEmployee(idOf(editing), payload);
      else await createEmployee(payload);
      toast.success(editing ? g.common.updated : g.common.created);
      setModalOpen(false);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || g.common.saveError);
    } finally {
      setSaving(false);
    }
  };

  // ---------- O'chirish ----------
  const confirmDelete = async () => {
    if (!confirmIds) return;
    setDeleting(true);
    const res = await Promise.allSettled(confirmIds.map((id) => deleteEmployee(id)));
    const ok = res.filter((r) => r.status === 'fulfilled').length;
    setDeleting(false);
    setConfirmIds(null);
    setDetail(null);
    setSel(new Set());
    ok > 0 ? toast.success(t.del.done(ok)) : toast.error(g.common.deleteError);
    if (ok < confirmIds.length && ok > 0) toast.error(g.common.deleteError);
    load();
  };

  // ---------- Eksport / nusxalash ----------
  const doExport = (list: Row[]) => {
    const ok = downloadCSV(
      `employees-${new Date().toISOString().slice(0, 10)}.csv`,
      list.map((r) => ({
        [t.csv.id]: r.id,
        [t.csv.passport]: r.raw.passport,
        [t.csv.name]: r.raw.full_name || '',
        [t.csv.birth]: toDateInput(r.raw.birth_date),
        [t.csv.age]: ageFrom(r.raw.birth_date) ?? '',
        [t.csv.dept]: nm(r.dep, lang),
        [t.csv.position]: nm(r.pos, lang),
        [t.csv.telegram]: r.raw.telegram_id || '',
      }))
    );
    ok ? toast.success(g.common.exported) : toast.info(g.common.nothingToExport);
  };

  const copy = async (text: string) => {
    (await copyText(text)) ? toast.success(g.common.copied) : toast.error(g.common.error);
  };

  const selectedRows = rows.filter((r) => sel.has(r.id));

  // ==================== RENDER ====================
  return (
    <div>
      <PageHeader
        eyebrow={t.eyebrow}
        title={g.nav.items.employees.label}
        subtitle={g.common.total(items.length)}
        icon={Users}
        actions={
          <>
            <button onClick={() => doExport(filtered)} className="btn btn-ghost">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">{g.common.export}</span>
            </button>
            <button onClick={openCreate} className="btn btn-primary">
              <Plus className="h-4 w-4" />
              {t.add}
              <span className="kbd hidden !border-white/25 !bg-black/20 !text-white md:inline-flex">N</span>
            </button>
          </>
        }
      />

      {loading ? (
        <PageSkeleton />
      ) : loadErr && items.length === 0 ? (
        <ErrorState onRetry={load} />
      ) : (
        <div className="space-y-5">
          {/* Statistika */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatPill icon={Users} tone="blue" label={t.stats.total} value={rows.length} />
            <StatPill icon={UserCheck} tone="green" label={t.stats.linked} value={linked} />
            <StatPill icon={Clock} tone="amber" label={t.stats.unlinked} value={rows.length - linked} />
            <StatPill icon={Cake} tone="pink" label={t.stats.birthdays} value={birthdays} />
          </div>

          {/* Analitika */}
          <div className="grid gap-5 lg:grid-cols-12">
            <SpotlightCard className="flex items-center gap-6 p-6 lg:col-span-5">
              <Ring value={linkedPct} size={140} thickness={13}>
                <p className="text-3xl font-black text-white">
                  <AnimatedNumber value={linkedPct} suffix="%" />
                </p>
              </Ring>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4 text-sky-400" />
                  <h3 className="font-extrabold text-white">{t.analytics.bot}</h3>
                </div>
                <p className="mt-1 text-xs text-zinc-500">{t.analytics.botText}</p>
                <p className="mt-3 text-sm text-zinc-400">
                  <b className="text-white">{linked}</b> / {rows.length}
                </p>
              </div>
            </SpotlightCard>

            <SpotlightCard className="p-6 lg:col-span-7">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-extrabold text-white">{t.analytics.dept}</h3>
                <span className="text-[11px] text-zinc-500">{t.analytics.deptHint}</span>
              </div>
              {deptBars.length === 0 ? (
                <p className="py-6 text-center text-sm text-zinc-500">{t.analytics.noDept}</p>
              ) : (
                <div className="space-y-3">
                  {deptBars.map((b, i) => {
                    const active = dept === b.id;
                    return (
                      <button
                        key={b.id}
                        onClick={() => setDept(active ? '' : b.id)}
                        className={`block w-full rounded-xl p-2 text-left transition ${active ? 'bg-white/[0.07]' : 'hover:bg-white/[0.04]'}`}
                      >
                        <div className="mb-1.5 flex items-center justify-between text-sm">
                          <span className="font-semibold text-zinc-200">{b.name}</span>
                          <span className="font-black tabular-nums text-white">{b.count}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${b.pct}%` }}
                            transition={{ delay: 0.2 + i * 0.07, duration: 0.7, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{ background: BAR_COLORS[i % BAR_COLORS.length] }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </SpotlightCard>
          </div>

          {/* Asboblar paneli */}
          <div className="card space-y-3 p-4">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
              <SearchBox ref={searchRef} value={q} onChange={setQ} placeholder={t.searchPh} />
              <Segmented
                value={status}
                onChange={setStatus}
                options={[
                  { id: 'all', label: t.filters.all, count: rows.length },
                  { id: 'linked', label: t.filters.linked, count: linked },
                  { id: 'unlinked', label: t.filters.unlinked, count: rows.length - linked },
                ]}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
              <select value={dept} onChange={(e) => setDept(e.target.value)} className={selectCls}>
                <option value="">{t.allDepartments}</option>
                {deps.map((d) => (
                  <option key={idOf(d)} value={idOf(d)}>{nm(d, lang)}</option>
                ))}
              </select>
              <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={selectCls}>
                {(Object.keys(t.sort) as SortKey[]).map((k) => (
                  <option key={k} value={k}>{t.sort[k]}</option>
                ))}
              </select>
              {hasFilters && (
                <button
                  onClick={() => { setQ(''); setStatus('all'); setDept(''); }}
                  className="btn btn-danger"
                >
                  {g.common.clear}
                </button>
              )}
            </div>
          </div>

          {/* Ommaviy amallar */}
          <AnimatePresence>
            {sel.size > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#ff2b3a]/30 bg-[#ff2b3a]/10 px-5 py-3">
                  <p className="text-sm font-extrabold text-white">{g.common.selected(sel.size)}</p>
                  <div className="flex gap-2">
                    <button onClick={() => doExport(selectedRows)} className="btn btn-ghost !py-2">
                      <Download className="h-4 w-4" /> {t.bulk.export}
                    </button>
                    <button onClick={() => setConfirmIds([...sel])} className="btn btn-danger !py-2">
                      <Trash2 className="h-4 w-4" /> {t.bulk.remove}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Jadval */}
          <div className="card overflow-hidden">
            {filtered.length === 0 ? (
              hasFilters ? (
                <EmptyState icon={Users} title={g.common.noResults} text={g.common.noResultsText} />
              ) : (
                <EmptyState
                  icon={Users}
                  title={t.empty.title}
                  text={t.empty.text}
                  action={
                    <button onClick={openCreate} className="btn btn-primary">
                      <Plus className="h-4 w-4" /> {t.add}
                    </button>
                  }
                />
              )
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.07] bg-white/[0.03] text-left text-[11px] font-extrabold uppercase tracking-wider text-zinc-500">
                      <th className="w-12 p-4">
                        <input
                          type="checkbox"
                          checked={allOnPage}
                          onChange={toggleAll}
                          className="h-4 w-4 cursor-pointer accent-[#ff2b3a]"
                          aria-label="Select all"
                        />
                      </th>
                      <th className="p-4">{t.cols.employee}</th>
                      <th className="p-4">{t.cols.birth}</th>
                      <th className="p-4">{t.cols.job}</th>
                      <th className="p-4">{t.cols.telegram}</th>
                      <th className="p-4 text-right">{t.cols.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((r, i) => {
                      const age = ageFrom(r.raw.birth_date);
                      const checked = sel.has(r.id);
                      return (
                        <motion.tr
                          key={r.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(i, 10) * 0.025 }}
                          className={`group border-b border-white/[0.05] transition-colors last:border-0 ${
                            checked ? 'bg-[#ff2b3a]/[0.06]' : 'hover:bg-white/[0.04]'
                          }`}
                        >
                          <td className="p-4">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleOne(r.id)}
                              className="h-4 w-4 cursor-pointer accent-[#ff2b3a]"
                              aria-label="Select"
                            />
                          </td>
                          <td className="p-4">
                            <button onClick={() => setDetail(r)} className="flex items-center gap-3 text-left">
                              <Avatar text={r.raw.full_name || r.raw.passport || '?'} size={42} />
                              <div className="min-w-0">
                                <p className="truncate font-mono text-sm font-extrabold text-white">{r.raw.passport}</p>
                                <p className="truncate text-xs text-zinc-500">{r.raw.full_name || '—'}</p>
                              </div>
                            </button>
                          </td>
                          <td className="p-4">
                            <p className="font-semibold text-zinc-200">{fmtDate(r.raw.birth_date, lang)}</p>
                            {age !== null && <p className="text-xs text-zinc-500">{t.years(age)}</p>}
                          </td>
                          <td className="p-4">
                            {r.pos || r.dep ? (
                              <div className="space-y-1">
                                {r.pos && (
                                  <p className="flex items-center gap-1.5 font-semibold text-violet-300">
                                    <Briefcase className="h-3.5 w-3.5" /> {nm(r.pos, lang)}
                                  </p>
                                )}
                                {r.dep && (
                                  <p className="flex items-center gap-1.5 text-xs text-sky-300">
                                    <Building2 className="h-3.5 w-3.5" /> {nm(r.dep, lang)}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-zinc-600">{t.noJob}</span>
                            )}
                          </td>
                          <td className="p-4">
                            {r.raw.telegram_id ? (
                              <span className="badge bg-emerald-500/15 text-emerald-400">
                                <UserCheck className="h-3 w-3" /> {t.linked}
                              </span>
                            ) : (
                              <span className="badge bg-amber-500/15 text-amber-400">
                                <Clock className="h-3 w-3" /> {t.pending}
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-end gap-1 opacity-100 transition lg:opacity-0 lg:group-hover:opacity-100">
                              <button onClick={() => setDetail(r)} title={t.drawer.title} className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white">
                                <Eye className="h-4 w-4" />
                              </button>
                              <button onClick={() => openEdit(r)} title={g.common.edit} className="rounded-lg p-2 text-sky-400 hover:bg-sky-500/10">
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button onClick={() => setConfirmIds([r.id])} title={g.common.delete} className="rounded-lg p-2 text-rose-400 hover:bg-rose-500/10">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <Pagination
            page={page}
            pageSize={pageSize}
            total={filtered.length}
            onPage={setPage}
            onPageSize={setPageSize}
          />
        </div>
      )}

      {/* ============ Yaratish / tahrirlash ============ */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? t.modal.editTitle : t.modal.createTitle}
        subtitle={t.modal.subtitle}
        icon={Users}
        size="md"
        footer={
          <>
            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-ghost">
              {g.common.cancel}
            </button>
            <button type="submit" form="emp-form" disabled={saving} className="btn btn-primary">
              {saving ? g.common.saving : g.common.save}
            </button>
          </>
        }
      >
        <form id="emp-form" onSubmit={submit} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.modal.passport} required error={errs.passport}>
              <input
                value={form.passport}
                onChange={(e) => setForm({ ...form, passport: e.target.value.toUpperCase() })}
                placeholder="AA1234567"
                maxLength={9}
                autoFocus
                className={`input font-mono ${errs.passport ? 'border-rose-500/60' : ''}`}
              />
            </Field>
            <Field label={t.modal.birth} required error={errs.birth}>
              <input
                type="date"
                value={form.birth_date}
                onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
                className={`input ${errs.birth ? 'border-rose-500/60' : ''}`}
              />
            </Field>
          </div>

          <Field label={`${t.modal.fullName} (${g.common.optional})`}>
            <input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder={t.modal.fullNamePh}
              className="input"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.modal.department}>
              <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className={selectCls}>
                <option value="">{g.common.choose}</option>
                {deps.map((d) => (
                  <option key={idOf(d)} value={idOf(d)}>{nm(d, lang)}</option>
                ))}
              </select>
            </Field>
            <Field label={t.modal.position} hint={t.modal.positionHint}>
              <select value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className={selectCls}>
                <option value="">{g.common.choose}</option>
                {poss.map((p) => (
                  <option key={idOf(p)} value={idOf(p)}>{nm(p, lang)}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label={`${t.modal.telegram} (${g.common.optional})`} hint={t.modal.telegramHint}>
            <input
              value={form.telegram_id}
              onChange={(e) => setForm({ ...form, telegram_id: e.target.value.replace(/\D/g, '') })}
              placeholder="5480822681"
              inputMode="numeric"
              className="input font-mono"
            />
          </Field>
        </form>
      </Modal>

      {/* ============ Xodim kartasi (drawer) ============ */}
      <Drawer
        open={!!detail}
        onClose={() => setDetail(null)}
        title={t.drawer.title}
        footer={
          detail && (
            <>
              <button onClick={() => openEdit(detail)} className="btn btn-ghost flex-1">
                <Pencil className="h-4 w-4" /> {g.common.edit}
              </button>
              <button onClick={() => setConfirmIds([detail.id])} className="btn btn-danger flex-1">
                <Trash2 className="h-4 w-4" /> {g.common.delete}
              </button>
            </>
          )
        }
      >
        {detail && (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center">
              <Avatar text={detail.raw.full_name || detail.raw.passport || '?'} size={88} className="!rounded-3xl" />
              <p className="mt-4 text-xl font-black text-white">{detail.raw.full_name || detail.raw.passport}</p>
              <button
                onClick={() => copy(detail.raw.passport)}
                className="mt-1 flex items-center gap-1.5 font-mono text-sm text-zinc-400 hover:text-white"
              >
                {detail.raw.passport} <Copy className="h-3.5 w-3.5" />
              </button>
              <div className="mt-3">
                {detail.raw.telegram_id ? (
                  <span className="badge bg-emerald-500/15 text-emerald-400"><UserCheck className="h-3 w-3" /> {t.linked}</span>
                ) : (
                  <span className="badge bg-amber-500/15 text-amber-400"><Clock className="h-3 w-3" /> {t.pending}</span>
                )}
              </div>
            </div>

            <div className="divide-y divide-white/[0.06] rounded-2xl bg-white/[0.04]">
              {[
                { icon: Hash, label: t.drawer.passport, value: detail.raw.passport, mono: true },
                { icon: Cake, label: t.drawer.birth, value: fmtDate(detail.raw.birth_date, lang) },
                { icon: Users, label: t.drawer.age, value: ageFrom(detail.raw.birth_date) !== null ? t.years(ageFrom(detail.raw.birth_date) as number) : '—' },
                { icon: Building2, label: t.drawer.department, value: nm(detail.dep, lang) || '—' },
                { icon: Briefcase, label: t.drawer.position, value: nm(detail.pos, lang) || '—' },
                { icon: Send, label: t.drawer.telegram, value: detail.raw.telegram_id || t.drawer.notLinked, mono: true },
                { icon: CalendarPlus, label: t.drawer.created, value: fmtDate(detail.created, lang) },
              ].map(({ icon: Icon, label, value, mono }) => (
                <div key={label} className="flex items-center gap-3 px-4 py-3.5">
                  <Icon className="h-4 w-4 shrink-0 text-zinc-500" />
                  <span className="flex-1 text-sm text-zinc-400">{label}</span>
                  <span className={`text-sm font-bold text-white ${mono ? 'font-mono' : ''}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Drawer>

      {/* ============ O'chirishni tasdiqlash ============ */}
      <ConfirmDialog
        open={!!confirmIds}
        loading={deleting}
        title={confirmIds && confirmIds.length > 1 ? t.del.bulkTitle(confirmIds.length) : t.del.title}
        message={
          confirmIds && confirmIds.length > 1
            ? t.del.bulkText
            : t.del.text(rows.find((r) => r.id === confirmIds?.[0])?.raw.passport || '')
        }
        onConfirm={confirmDelete}
        onCancel={() => setConfirmIds(null)}
      />
    </div>
  );
}