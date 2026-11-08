import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Trash2, Pencil, FileText, Download, Eye, Home, Building2, Calendar, Users, Gift,
  Target, Phone, HelpCircle, Globe, Lock, Layers, ChevronRight, AlertTriangle, Hash,
  type LucideIcon,
} from 'lucide-react';
import {
  getSections, deleteSection, createSection, updateSection, getDepartments, getPositions,
} from '../api';
import PageHeader from '../components/PageHeader';
import Modal from '../components/ui/Modal';
import Drawer from '../components/ui/Drawer';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import LangTabs from '../components/ui/LangTabs';
import MultiSelectChips from '../components/ui/MultiSelectChips';
import {
  SearchBox, Segmented, Switch, EmptyState, ErrorState, StatPill, PageSkeleton, Field,
  IconPicker, selectCls,
} from '../components/ui//Kit';
import SpotlightCard from '../components/SpotlightCard';
import { useToast } from '../components/Toast';
import { useT } from '../hooks/useT';
import { useHotkey } from '../hooks/useHotkey';
import type { Lang } from '../hooks/useLang';
import { downloadCSV } from '../utils/format';
import { idOf, refId, resolveRef, nm, createdOf } from '../utils/text';

// ==================== TARJIMALAR ====================
const T = {
  uz: {
    eyebrow: 'Kontent',
    add: 'Yangi maqola',
    searchPh: "Sarlavha, matn yoki ID bo'yicha…",
    filters: { all: 'Hammasi', public: 'Hamma uchun', private: 'Lavozimga xos', inactive: 'Nofaol' },
    view: { grid: 'Kartalar', list: "Ro'yxat" },
    sort: { order: "Tartib bo'yicha", title: 'Sarlavha A→Z', newest: 'Eng yangilari' },
    stats: { total: 'Jami maqolalar', public: 'Hamma uchun', private: 'Lavozimga xos', inactive: 'Nofaol' },
    badges: { public: 'Hamma', private: 'Maxfiy' },
    cols: { section: 'Maqola', dept: "Bo'lim", access: "Ko'rinishi", order: 'Tartib', active: 'Faol', actions: 'Amallar' },
    noText: "Matn yo'q",
    noDept: '—',
    positionsCount: (n: number) => `${n} ta lavozim`,
    toggleOn: 'Maqola faollashtirildi',
    toggleOff: "Maqola o'chirib qo'yildi",
    modal: {
      createTitle: 'Yangi maqola',
      editTitle: 'Maqolani tahrirlash',
      subtitle: "Ikki tilda to'ldiring — ilova tilga qarab ko'rsatadi",
      langUz: "O'zbekcha",
      langRu: 'Русский',
      titleLabel: 'Sarlavha',
      content: 'Matn',
      chars: (n: number) => `${n} belgi`,
      icon: 'Ikonka',
      order: 'Tartib raqami',
      docId: 'Hujjat ID',
      department: "Bo'lim",
      isPublic: 'Hamma ko‘radimi?',
      isPublicHint: "O'chirilsa — faqat tanlangan lavozimlar ko'radi",
      positions: "Qaysi lavozimlar ko'radi",
      positionsWarn: "Lavozim tanlanmasa, maqolani hech kim ko'rmaydi",
      noPositions: "Hali lavozim yo'q",
      isActive: 'Faol',
      isActiveHint: "Nofaol maqola ilovada ko'rinmaydi",
      preview: "Ilovadagi ko'rinishi",
      fixTabs: "Ikkala tilda ham sarlavha kiriting",
    },
    drawer: { dept: "Bo'lim", access: "Ko'rinishi", order: 'Tartib', docId: 'ID' },
    del: { title: "Maqolani o'chirasizmi?", text: (n: string) => `"${n}" maqolasi butunlay o'chiriladi.` },
    empty: { title: "Hali maqola yo'q", text: 'Welcome Book uchun birinchi maqolani yozing.' },
    csv: { id: 'ID', doc: 'Hujjat ID', ru: 'Sarlavha (RU)', uz: 'Sarlavha (UZ)', cru: 'Matn (RU)', cuz: 'Matn (UZ)', icon: 'Ikonka', order: 'Tartib', active: 'Faol', public: 'Hamma uchun', dept: "Bo'lim", positions: 'Lavozimlar' },
  },
  ru: {
    eyebrow: 'Контент',
    add: 'Новая статья',
    searchPh: 'По заголовку, тексту или ID…',
    filters: { all: 'Все', public: 'Для всех', private: 'Для должности', inactive: 'Неактивные' },
    view: { grid: 'Карточки', list: 'Список' },
    sort: { order: 'По порядку', title: 'Заголовок А→Я', newest: 'Сначала новые' },
    stats: { total: 'Всего статей', public: 'Для всех', private: 'Для должности', inactive: 'Неактивные' },
    badges: { public: 'Все', private: 'Скрыто' },
    cols: { section: 'Статья', dept: 'Отдел', access: 'Видимость', order: 'Порядок', active: 'Активна', actions: 'Действия' },
    noText: 'Нет текста',
    noDept: '—',
    positionsCount: (n: number) => `Должностей: ${n}`,
    toggleOn: 'Статья активирована',
    toggleOff: 'Статья отключена',
    modal: {
      createTitle: 'Новая статья',
      editTitle: 'Редактирование статьи',
      subtitle: 'Заполните на двух языках — приложение покажет нужный',
      langUz: "O'zbekcha",
      langRu: 'Русский',
      titleLabel: 'Заголовок',
      content: 'Текст',
      chars: (n: number) => `${n} симв.`,
      icon: 'Иконка',
      order: 'Порядковый номер',
      docId: 'ID документа',
      department: 'Отдел',
      isPublic: 'Видна всем?',
      isPublicHint: 'Если выключить — увидят только выбранные должности',
      positions: 'Какие должности видят',
      positionsWarn: 'Если не выбрать должности, статью никто не увидит',
      noPositions: 'Должностей пока нет',
      isActive: 'Активна',
      isActiveHint: 'Неактивная статья не отображается в приложении',
      preview: 'Вид в приложении',
      fixTabs: 'Введите заголовок на обоих языках',
    },
    drawer: { dept: 'Отдел', access: 'Видимость', order: 'Порядок', docId: 'ID' },
    del: { title: 'Удалить статью?', text: (n: string) => `Статья «${n}» будет удалена навсегда.` },
    empty: { title: 'Статей пока нет', text: 'Напишите первую статью для Welcome Book.' },
    csv: { id: 'ID', doc: 'ID документа', ru: 'Заголовок (RU)', uz: 'Заголовок (UZ)', cru: 'Текст (RU)', cuz: 'Текст (UZ)', icon: 'Иконка', order: 'Порядок', active: 'Активна', public: 'Для всех', dept: 'Отдел', positions: 'Должности' },
  },
};

// Veb-ilovadagi ikonka kalitlari bilan bir xil
const SECTION_ICONS: Record<string, LucideIcon> = {
  home: Home,
  info: Building2,
  calendar: Calendar,
  users: Users,
  gift: Gift,
  target: Target,
  phone: Phone,
  'help-circle': HelpCircle,
  file: FileText,
};

type Filter = 'all' | 'public' | 'private' | 'inactive';
type SortKey = 'order' | 'title' | 'newest';
type View = 'grid' | 'list';

interface FormState {
  document_id: string;
  title_uz: string;
  title_ru: string;
  content_uz: string;
  content_ru: string;
  icon: string;
  order: number;
  is_active: boolean;
  is_public: boolean;
  department: string;
  positions: string[];
  images: any;
}

const text = (v: any): string => (typeof v === 'string' ? v : '');
const toArr = (v: any): any[] => (Array.isArray(v) ? v : v ? [v] : []);
const posIds = (s: any): string[] => toArr(s.visible_positions).map(refId).filter(Boolean);
const time = (v?: string) => (v ? new Date(v).getTime() || 0 : 0);

const newDocId = () => `section_${Date.now()}`;

const emptyForm = (order: number): FormState => ({
  document_id: newDocId(),
  title_uz: '', title_ru: '', content_uz: '', content_ru: '',
  icon: 'file', order, is_active: true, is_public: true,
  department: '', positions: [], images: null,
});

/** Backend modeliga mos payload (mavjud maqoladan) */
const toPayload = (s: any, over: Record<string, unknown> = {}) => ({
  document_id: s.document_id || newDocId(),
  title_ru: s.title_ru,
  title_uz: s.title_uz,
  content_ru: s.content_ru,
  content_uz: s.content_uz,
  icon: s.icon,
  order: s.order,
  is_active: s.is_active ?? true,
  is_public: s.is_public ?? true,
  department: refId(s.department) || null,
  visible_positions: posIds(s),
  images: s.images ?? null,
  ...over,
});

export default function SectionsPage() {
  const { t: g, lang } = useT();
  const t = T[lang];
  const toast = useToast();

  const [items, setItems] = useState<any[]>([]);
  const [deps, setDeps] = useState<any[]>([]);
  const [poss, setPoss] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState(false);

  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<SortKey>('order');
  const [view, setView] = useState<View>('grid');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm(1));
  const [tab, setTab] = useState<Lang>(lang);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [preview, setPreview] = useState<any | null>(null);
  const [previewLang, setPreviewLang] = useState<Lang>(lang);

  const [confirm, setConfirm] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadErr(false);
    const [s, d, p] = await Promise.allSettled([getSections(), getDepartments(), getPositions()]);
    if (s.status === 'fulfilled') setItems(Array.isArray(s.value) ? s.value : []);
    else setLoadErr(true);
    if (d.status === 'fulfilled') setDeps(Array.isArray(d.value) ? d.value : []);
    if (p.status === 'fulfilled') setPoss(Array.isArray(p.value) ? p.value : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ---------- Yordamchilar ----------
  const titleOf = (s: any) => (lang === 'ru' ? s.title_ru || s.title_uz : s.title_uz || s.title_ru) || '';
  const bodyOf = (s: any, l: Lang = lang) =>
    text(l === 'ru' ? s.content_ru || s.content_uz : s.content_uz || s.content_ru);
  const deptName = (s: any) => nm(resolveRef(deps, s.department), lang) || t.noDept;

  const counts = useMemo(
    () => ({
      all: items.length,
      public: items.filter((s) => s.is_public !== false).length,
      private: items.filter((s) => s.is_public === false).length,
      inactive: items.filter((s) => s.is_active === false).length,
    }),
    [items]
  );

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    const filtered = items.filter((x) => {
      if (filter === 'public' && x.is_public === false) return false;
      if (filter === 'private' && x.is_public !== false) return false;
      if (filter === 'inactive' && x.is_active !== false) return false;
      if (!s) return true;
      return [x.title_uz, x.title_ru, text(x.content_uz), text(x.content_ru), x.document_id]
        .filter(Boolean).join(' ').toLowerCase().includes(s);
    });
    const cmp: Record<SortKey, (a: any, b: any) => number> = {
      order: (a, b) => (Number(a.order) || 0) - (Number(b.order) || 0),
      title: (a, b) => titleOf(a).localeCompare(titleOf(b)),
      newest: (a, b) => time(createdOf(b)) - time(createdOf(a)),
    };
    return [...filtered].sort(cmp[sort]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, q, filter, sort, lang]);

  // ---------- Forma ----------
  const openCreate = useCallback(() => {
    setEditing(null);
    setForm(emptyForm(Math.max(0, ...items.map((s) => Number(s.order) || 0)) + 1));
    setTab(lang);
    setErrs({});
    setModalOpen(true);
  }, [items, lang]);

  const openEdit = (s: any) => {
    setEditing(s);
    setForm({
      document_id: s.document_id || newDocId(),
      title_uz: s.title_uz || '',
      title_ru: s.title_ru || '',
      content_uz: text(s.content_uz),
      content_ru: text(s.content_ru),
      icon: s.icon || 'file',
      order: Number(s.order) || 1,
      is_active: s.is_active ?? true,
      is_public: s.is_public ?? true,
      department: refId(s.department),
      positions: posIds(s),
      images: s.images ?? null,
    });
    setTab(lang);
    setErrs({});
    setPreview(null);
    setModalOpen(true);
  };

  useHotkey('n', openCreate, !modalOpen && !confirm && !preview);
  useHotkey('/', () => searchRef.current?.focus());

  const titleKey = tab === 'uz' ? 'title_uz' : 'title_ru';
  const contentKey = tab === 'uz' ? 'content_uz' : 'content_ru';

  const filled: Record<Lang, boolean> = {
    uz: !!form.title_uz.trim() && !!form.content_uz.trim(),
    ru: !!form.title_ru.trim() && !!form.content_ru.trim(),
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    const e: Record<string, string> = {};
    if (!form.title_uz.trim()) e.title_uz = g.common.required;
    if (!form.title_ru.trim()) e.title_ru = g.common.required;
    setErrs(e);
    if (Object.keys(e).length) {
      setTab(e.title_uz ? 'uz' : 'ru');
      toast.error(t.modal.fixTabs);
      return;
    }

    setSaving(true);
    const payload = {
      document_id: form.document_id || newDocId(),
      title_ru: form.title_ru.trim(),
      title_uz: form.title_uz.trim(),
      content_ru: form.content_ru,
      content_uz: form.content_uz,
      icon: form.icon,
      order: form.order,
      is_active: form.is_active,
      is_public: form.is_public,
      department: form.department || null,
      visible_positions: form.is_public ? [] : form.positions,
      images: form.images,
    };
    try {
      if (editing) await updateSection(idOf(editing), payload);
      else await createSection(payload);
      toast.success(editing ? g.common.updated : g.common.created);
      setModalOpen(false);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || g.common.saveError);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (s: any, value: boolean) => {
    setItems((all) => all.map((x) => (idOf(x) === idOf(s) ? { ...x, is_active: value } : x)));
    try {
      await updateSection(idOf(s), toPayload(s, { is_active: value }));
      toast.success(value ? t.toggleOn : t.toggleOff);
    } catch {
      toast.error(g.common.saveError);
      load();
    }
  };

  const confirmDelete = async () => {
    if (!confirm) return;
    setDeleting(true);
    try {
      await deleteSection(idOf(confirm));
      toast.success(g.common.updated);
      setConfirm(null);
      setPreview(null);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || g.common.deleteError);
    } finally {
      setDeleting(false);
    }
  };

  const doExport = () => {
    const ok = downloadCSV(
      `sections-${new Date().toISOString().slice(0, 10)}.csv`,
      list.map((s) => ({
        [t.csv.id]: idOf(s),
        [t.csv.doc]: s.document_id || '',
        [t.csv.ru]: s.title_ru,
        [t.csv.uz]: s.title_uz,
        [t.csv.cru]: text(s.content_ru),
        [t.csv.cuz]: text(s.content_uz),
        [t.csv.icon]: s.icon,
        [t.csv.order]: s.order,
        [t.csv.active]: s.is_active !== false ? 'TRUE' : 'FALSE',
        [t.csv.public]: s.is_public !== false ? 'TRUE' : 'FALSE',
        [t.csv.dept]: nm(resolveRef(deps, s.department), lang),
        [t.csv.positions]: posIds(s).map((id) => nm(resolveRef(poss, id), lang)).join('; '),
      }))
    );
    ok ? toast.success(g.common.exported) : toast.info(g.common.nothingToExport);
  };

  const AccessBadge = ({ s }: { s: any }) =>
    s.is_public === false ? (
      <span className="badge bg-amber-500/15 text-amber-400">
        <Lock className="h-3 w-3" /> {t.badges.private}
        {posIds(s).length > 0 && <span className="opacity-70">· {posIds(s).length}</span>}
      </span>
    ) : (
      <span className="badge bg-emerald-500/15 text-emerald-400">
        <Globe className="h-3 w-3" /> {t.badges.public}
      </span>
    );

  // ==================== RENDER ====================
  return (
    <div>
      <PageHeader
        eyebrow={t.eyebrow}
        title={g.nav.items.sections.label}
        subtitle={g.common.total(items.length)}
        icon={FileText}
        actions={
          <>
            <button onClick={doExport} className="btn btn-ghost">
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
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatPill icon={Layers} tone="blue" label={t.stats.total} value={counts.all} />
            <StatPill icon={Globe} tone="green" label={t.stats.public} value={counts.public} />
            <StatPill icon={Lock} tone="amber" label={t.stats.private} value={counts.private} />
            <StatPill icon={AlertTriangle} tone="red" label={t.stats.inactive} value={counts.inactive} />
          </div>

          <div className="card space-y-3 p-4">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
              <SearchBox ref={searchRef} value={q} onChange={setQ} placeholder={t.searchPh} />
              <Segmented
                value={filter}
                onChange={setFilter}
                options={[
                  { id: 'all', label: t.filters.all, count: counts.all },
                  { id: 'public', label: t.filters.public, count: counts.public },
                  { id: 'private', label: t.filters.private, count: counts.private },
                  { id: 'inactive', label: t.filters.inactive, count: counts.inactive },
                ]}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={selectCls}>
                {(Object.keys(t.sort) as SortKey[]).map((k) => (
                  <option key={k} value={k}>{t.sort[k]}</option>
                ))}
              </select>
              <Segmented
                value={view}
                onChange={setView}
                options={[
                  { id: 'grid', label: t.view.grid },
                  { id: 'list', label: t.view.list },
                ]}
              />
            </div>
          </div>

          {list.length === 0 ? (
            <div className="card">
              {q || filter !== 'all' ? (
                <EmptyState icon={FileText} title={g.common.noResults} text={g.common.noResultsText} />
              ) : (
                <EmptyState
                  icon={FileText}
                  title={t.empty.title}
                  text={t.empty.text}
                  action={
                    <button onClick={openCreate} className="btn btn-primary">
                      <Plus className="h-4 w-4" /> {t.add}
                    </button>
                  }
                />
              )}
            </div>
          ) : view === 'grid' ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {list.map((s, i) => {
                const Icon = SECTION_ICONS[s.icon] || FileText;
                const active = s.is_active !== false;
                return (
                  <motion.div
                    key={idOf(s)}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i, 9) * 0.04 }}
                  >
                    <SpotlightCard className={`group p-5 ${active ? '' : 'opacity-60'}`}>
                      <div className="relative z-10">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff2b3a] to-[#9d0410] shadow-[0_10px_26px_-8px_rgba(255,43,58,0.7)]">
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <AccessBadge s={s} />
                            <span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[11px] font-black text-zinc-300">#{s.order}</span>
                          </div>
                        </div>

                        <button onClick={() => { setPreviewLang(lang); setPreview(s); }} className="mt-4 block w-full text-left">
                          <h3 className="line-clamp-1 text-lg font-black leading-tight text-white">{titleOf(s)}</h3>
                          <p className="mt-1.5 line-clamp-2 text-sm leading-snug text-zinc-400">
                            {bodyOf(s) || t.noText}
                          </p>
                        </button>

                        <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/[0.06] pt-4">
                          <span className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-sky-300">
                            <Building2 className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{deptName(s)}</span>
                          </span>
                          <div className="flex items-center gap-1">
                            <Switch checked={active} onChange={(v) => toggleActive(s, v)} label={t.cols.active} />
                            <button onClick={() => { setPreviewLang(lang); setPreview(s); }} title="Preview" className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white"><Eye className="h-4 w-4" /></button>
                            <button onClick={() => openEdit(s)} title={g.common.edit} className="rounded-lg p-2 text-sky-400 hover:bg-sky-500/10"><Pencil className="h-4 w-4" /></button>
                            <button onClick={() => setConfirm(s)} title={g.common.delete} className="rounded-lg p-2 text-rose-400 hover:bg-rose-500/10"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </div>
                      </div>
                    </SpotlightCard>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.07] bg-white/[0.03] text-left text-[11px] font-extrabold uppercase tracking-wider text-zinc-500">
                      <th className="p-4">{t.cols.section}</th>
                      <th className="p-4">{t.cols.dept}</th>
                      <th className="p-4">{t.cols.access}</th>
                      <th className="p-4">{t.cols.order}</th>
                      <th className="p-4">{t.cols.active}</th>
                      <th className="p-4 text-right">{t.cols.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((s, i) => {
                      const Icon = SECTION_ICONS[s.icon] || FileText;
                      const active = s.is_active !== false;
                      return (
                        <motion.tr
                          key={idOf(s)}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: Math.min(i, 10) * 0.025 }}
                          className="group border-b border-white/[0.05] last:border-0 hover:bg-white/[0.04]"
                        >
                          <td className="max-w-[340px] p-4">
                            <button onClick={() => { setPreviewLang(lang); setPreview(s); }} className="flex items-center gap-3 text-left">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff2b3a] to-[#9d0410]">
                                <Icon className="h-5 w-5 text-white" />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-extrabold text-white">{titleOf(s)}</p>
                                <p className="truncate text-xs text-zinc-500">{bodyOf(s) || t.noText}</p>
                              </div>
                            </button>
                          </td>
                          <td className="p-4 text-xs font-semibold text-sky-300">{deptName(s)}</td>
                          <td className="p-4"><AccessBadge s={s} /></td>
                          <td className="p-4 font-black tabular-nums text-white">{s.order}</td>
                          <td className="p-4"><Switch checked={active} onChange={(v) => toggleActive(s, v)} label={t.cols.active} /></td>
                          <td className="p-4">
                            <div className="flex justify-end gap-1">
                              <button onClick={() => openEdit(s)} className="rounded-lg p-2 text-sky-400 hover:bg-sky-500/10"><Pencil className="h-4 w-4" /></button>
                              <button onClick={() => setConfirm(s)} className="rounded-lg p-2 text-rose-400 hover:bg-rose-500/10"><Trash2 className="h-4 w-4" /></button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============ Yaratish / tahrirlash ============ */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? t.modal.editTitle : t.modal.createTitle}
        subtitle={t.modal.subtitle}
        icon={FileText}
        size="xl"
        footer={
          <>
            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-ghost">
              {g.common.cancel}
            </button>
            <button type="submit" form="sec-form" disabled={saving} className="btn btn-primary">
              {saving ? g.common.saving : g.common.save}
            </button>
          </>
        }
      >
        <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
          <form id="sec-form" onSubmit={submit} noValidate className="space-y-5">
            <LangTabs
              value={tab}
              onChange={setTab}
              filled={filled}
              labels={{ uz: t.modal.langUz, ru: t.modal.langRu }}
            />

            <Field label={t.modal.titleLabel} required error={errs[titleKey]}>
              <input
                key={`t-${tab}`}
                value={form[titleKey]}
                onChange={(e) => setForm({ ...form, [titleKey]: e.target.value })}
                autoFocus
                className={`input ${errs[titleKey] ? 'border-rose-500/60' : ''}`}
              />
            </Field>

            <Field label={t.modal.content}>
              <textarea
                key={`c-${tab}`}
                value={form[contentKey]}
                onChange={(e) => setForm({ ...form, [contentKey]: e.target.value })}
                rows={8}
                className="input resize-y"
              />
              <p className="mt-1.5 text-right text-xs text-zinc-500">{t.modal.chars(form[contentKey].length)}</p>
            </Field>

            <Field label={t.modal.icon}>
              <IconPicker icons={SECTION_ICONS} value={form.icon} onChange={(k) => setForm({ ...form, icon: k })} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label={t.modal.order}>
                <input type="number" min={1} value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} className="input" />
              </Field>
              <Field label={t.modal.department}>
                <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className={selectCls}>
                  <option value="">{g.common.choose}</option>
                  {deps.map((d) => (
                    <option key={idOf(d)} value={idOf(d)}>{nm(d, lang)}</option>
                  ))}
                </select>
              </Field>
              <Field label={t.modal.docId}>
                <div className="relative">
                  <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    value={form.document_id}
                    onChange={(e) => setForm({ ...form, document_id: e.target.value })}
                    readOnly={!!editing}
                    className={`input pl-9 font-mono text-xs ${editing ? 'opacity-60' : ''}`}
                  />
                </div>
              </Field>
            </div>

            <div className="space-y-3 rounded-2xl bg-white/[0.04] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-extrabold text-white">{t.modal.isPublic}</p>
                  <p className="text-xs text-zinc-500">{t.modal.isPublicHint}</p>
                </div>
                <Switch checked={form.is_public} onChange={(v) => setForm({ ...form, is_public: v })} label={t.modal.isPublic} />
              </div>

              {!form.is_public && (
                <div className="border-t border-white/[0.07] pt-3">
                  <p className="label">{t.modal.positions}</p>
                  <MultiSelectChips
                    options={poss.map((p) => ({ id: idOf(p), label: nm(p, lang) }))}
                    value={form.positions}
                    onChange={(v) => setForm({ ...form, positions: v })}
                    emptyText={t.modal.noPositions}
                  />
                  {form.positions.length === 0 && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                      <AlertTriangle className="h-3.5 w-3.5" /> {t.modal.positionsWarn}
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between gap-4 border-t border-white/[0.07] pt-3">
                <div>
                  <p className="text-sm font-extrabold text-white">{t.modal.isActive}</p>
                  <p className="text-xs text-zinc-500">{t.modal.isActiveHint}</p>
                </div>
                <Switch checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} label={t.modal.isActive} />
              </div>
            </div>
          </form>

          {/* Jonli ko'rinish */}
          <div className="lg:sticky lg:top-4 lg:self-start">
            <p className="label">{t.modal.preview}</p>
            <div className="rounded-[28px] border border-white/10 bg-gradient-to-b from-[#1a0507] to-[#0e1014] p-4">
              {(() => {
                const Icon = SECTION_ICONS[form.icon] || FileText;
                const title = tab === 'uz' ? form.title_uz : form.title_ru;
                const body = tab === 'uz' ? form.content_uz : form.content_ru;
                return (
                  <div className="flex items-center gap-3 rounded-[18px] border border-white/[0.07] bg-white/[0.05] p-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f5222f] to-[#b00410] shadow-[0_8px_16px_-8px_rgba(227,6,19,0.7)]">
                      <Icon className="h-[22px] w-[22px] text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-[15px] font-black leading-tight text-white">{title || '—'}</h4>
                      <p className="mt-1 line-clamp-2 text-xs leading-snug text-zinc-400">{body || t.noText}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-zinc-600" />
                  </div>
                );
              })()}
              <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500">
                <span>#{form.order}</span>
                <span className="flex items-center gap-1">
                  {form.is_public ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                  {form.is_public ? t.badges.public : t.badges.private}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* ============ Ko'rib chiqish (drawer) ============ */}
      <Drawer
        open={!!preview}
        onClose={() => setPreview(null)}
        title={preview ? titleOf(preview) : ''}
        footer={
          preview && (
            <>
              <button onClick={() => openEdit(preview)} className="btn btn-ghost flex-1">
                <Pencil className="h-4 w-4" /> {g.common.edit}
              </button>
              <button onClick={() => setConfirm(preview)} className="btn btn-danger flex-1">
                <Trash2 className="h-4 w-4" /> {g.common.delete}
              </button>
            </>
          )
        }
      >
        {preview && (
          <div className="space-y-5">
            <Segmented
              value={previewLang}
              onChange={setPreviewLang}
              options={[
                { id: 'uz', label: t.modal.langUz },
                { id: 'ru', label: t.modal.langRu },
              ]}
            />
            <h3 className="text-2xl font-black leading-tight text-white">
              {(previewLang === 'ru' ? preview.title_ru : preview.title_uz) || '—'}
            </h3>
            <div className="rounded-2xl bg-white/[0.04] p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                {text(previewLang === 'ru' ? preview.content_ru : preview.content_uz) || t.noText}
              </p>
            </div>
            <div className="divide-y divide-white/[0.06] rounded-2xl bg-white/[0.04] text-sm">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-zinc-400">{t.drawer.dept}</span>
                <span className="font-bold text-white">{deptName(preview)}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-zinc-400">{t.drawer.access}</span>
                <AccessBadge s={preview} />
              </div>
              {preview.is_public === false && posIds(preview).length > 0 && (
                <div className="flex flex-wrap gap-1.5 px-4 py-3">
                  {posIds(preview).map((id) => (
                    <span key={id} className="badge bg-violet-500/15 text-violet-300">
                      {nm(resolveRef(poss, id), lang) || id}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-zinc-400">{t.drawer.order}</span>
                <span className="font-black text-white">#{preview.order}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-zinc-400">{t.drawer.docId}</span>
                <span className="font-mono text-xs text-zinc-300">{preview.document_id || '—'}</span>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* ============ O'chirishni tasdiqlash ============ */}
      <ConfirmDialog
        open={!!confirm}
        loading={deleting}
        title={t.del.title}
        message={confirm ? t.del.text(titleOf(confirm)) : ''}
        onConfirm={confirmDelete}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}