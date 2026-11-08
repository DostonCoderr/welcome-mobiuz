import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Trash2, Pencil, Bell, Download, Info, Gift, Calendar, FileText, Globe, Lock,
  Layers, CheckCircle2, XCircle, ExternalLink, Building2, AlertTriangle, Clock,
  type LucideIcon,
} from 'lucide-react';
import {
  getNotifications, deleteNotification, createNotification, updateNotification,
  getDepartments, getPositions,
} from '../api';
import PageHeader from '../components/PageHeader';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import LangTabs from '../components/ui/LangTabs';
import MultiSelectChips from '../components/ui/MultiSelectChips';
import {
  SearchBox, Segmented, Switch, EmptyState, ErrorState, StatPill, PageSkeleton, Field, selectCls,
} from '../components/ui/Kit';
import SpotlightCard from '../components/SpotlightCard';
import { useToast } from '../components/Toast';
import { useT } from '../hooks/useT';
import { useHotkey } from '../hooks/useHotkey';
import type { Lang } from '../hooks/useLang';
import { downloadCSV } from '../utils/format';
import { idOf, refId, resolveRef, nm, isValidUrl, relTime, createdOf } from '../utils/text';

// ==================== TARJIMALAR ====================
const T = {
  uz: {
    eyebrow: 'Aloqa',
    add: 'Yangi bildirishnoma',
    searchPh: "Sarlavha yoki xabar bo'yicha…",
    status: { all: 'Hammasi', active: 'Faol', inactive: 'Nofaol' },
    types: { info: "Ma'lumot", section: 'Maqola', event: 'Tadbir', gift: "Sovg'a" },
    allTypes: 'Barcha turlar',
    stats: { total: 'Jami', active: 'Faol', inactive: 'Nofaol', private: 'Lavozimga xos' },
    badges: { public: 'Hamma', private: 'Maxfiy' },
    toggleOn: 'Bildirishnoma faollashtirildi',
    toggleOff: "Bildirishnoma o'chirib qo'yildi",
    positionsCount: (n: number) => `${n} ta lavozim`,
    modal: {
      createTitle: 'Yangi bildirishnoma',
      editTitle: 'Bildirishnomani tahrirlash',
      subtitle: "Ilovada xodimlarga ko'rsatiladi",
      langUz: "O'zbekcha",
      langRu: 'Русский',
      titleLabel: 'Sarlavha',
      message: 'Xabar',
      type: 'Turi',
      link: 'Havola',
      linkHint: 'Masalan: /news yoki https://…',
      linkErr: "Havola noto'g'ri",
      order: 'Tartib raqami',
      department: "Bo'lim",
      isPublic: 'Hamma ko‘radimi?',
      isPublicHint: "O'chirilsa — faqat tanlangan lavozimlar ko'radi",
      positions: "Qaysi lavozimlar ko'radi",
      positionsWarn: "Lavozim tanlanmasa, bildirishnomani hech kim ko'rmaydi",
      noPositions: "Hali lavozim yo'q",
      isActive: 'Faol',
      isActiveHint: "Nofaol bildirishnoma ilovada ko'rinmaydi",
      preview: "Ilovadagi ko'rinishi",
      fixTabs: "Ikkala tilda ham sarlavha va xabar kiriting",
    },
    del: { title: "Bildirishnomani o'chirasizmi?", text: (n: string) => `"${n}" bildirishnomasi o'chiriladi.` },
    empty: { title: "Hali bildirishnoma yo'q", text: "Xodimlarga birinchi bildirishnomani yuboring." },
    csv: { id: 'ID', ru: 'Sarlavha (RU)', uz: 'Sarlavha (UZ)', mru: 'Xabar (RU)', muz: 'Xabar (UZ)', type: 'Turi', link: 'Havola', order: 'Tartib', active: 'Faol', public: 'Hamma uchun' },
  },
  ru: {
    eyebrow: 'Связь',
    add: 'Новое уведомление',
    searchPh: 'По заголовку или сообщению…',
    status: { all: 'Все', active: 'Активные', inactive: 'Неактивные' },
    types: { info: 'Инфо', section: 'Статья', event: 'Событие', gift: 'Подарок' },
    allTypes: 'Все типы',
    stats: { total: 'Всего', active: 'Активные', inactive: 'Неактивные', private: 'Для должности' },
    badges: { public: 'Все', private: 'Скрыто' },
    toggleOn: 'Уведомление активировано',
    toggleOff: 'Уведомление отключено',
    positionsCount: (n: number) => `Должностей: ${n}`,
    modal: {
      createTitle: 'Новое уведомление',
      editTitle: 'Редактирование уведомления',
      subtitle: 'Показывается сотрудникам в приложении',
      langUz: "O'zbekcha",
      langRu: 'Русский',
      titleLabel: 'Заголовок',
      message: 'Сообщение',
      type: 'Тип',
      link: 'Ссылка',
      linkHint: 'Например: /news или https://…',
      linkErr: 'Неверная ссылка',
      order: 'Порядковый номер',
      department: 'Отдел',
      isPublic: 'Видно всем?',
      isPublicHint: 'Если выключить — увидят только выбранные должности',
      positions: 'Какие должности видят',
      positionsWarn: 'Если не выбрать должности, уведомление никто не увидит',
      noPositions: 'Должностей пока нет',
      isActive: 'Активно',
      isActiveHint: 'Неактивное уведомление не отображается в приложении',
      preview: 'Вид в приложении',
      fixTabs: 'Введите заголовок и сообщение на обоих языках',
    },
    del: { title: 'Удалить уведомление?', text: (n: string) => `Уведомление «${n}» будет удалено.` },
    empty: { title: 'Уведомлений пока нет', text: 'Отправьте сотрудникам первое уведомление.' },
    csv: { id: 'ID', ru: 'Заголовок (RU)', uz: 'Заголовок (UZ)', mru: 'Сообщение (RU)', muz: 'Сообщение (UZ)', type: 'Тип', link: 'Ссылка', order: 'Порядок', active: 'Активно', public: 'Для всех' },
  },
};

type NType = 'info' | 'section' | 'event' | 'gift';
const TYPES: NType[] = ['info', 'section', 'event', 'gift'];

const TYPE_META: Record<NType, { icon: LucideIcon; color: string }> = {
  info: { icon: Info, color: '#3b82f6' },
  section: { icon: FileText, color: '#ff2b3a' },
  event: { icon: Calendar, color: '#f59e0b' },
  gift: { icon: Gift, color: '#ec4899' },
};

type Status = 'all' | 'active' | 'inactive';
type TypeFilter = 'all' | NType;

interface FormState {
  title_uz: string;
  title_ru: string;
  message_uz: string;
  message_ru: string;
  type: NType;
  link: string;
  order: number;
  is_active: boolean;
  is_public: boolean;
  department: string;
  positions: string[];
}

const toArr = (v: any): any[] => (Array.isArray(v) ? v : v ? [v] : []);
const posIds = (n: any): string[] => toArr(n.visible_positions).map(refId).filter(Boolean);
const normType = (v: any): NType => (TYPES.includes(v) ? v : 'info');

const emptyForm = (order: number): FormState => ({
  title_uz: '', title_ru: '', message_uz: '', message_ru: '',
  type: 'info', link: '', order, is_active: true, is_public: true, department: '', positions: [],
});

/** Backend modeliga mos payload (mavjud bildirishnomadan) */
const toPayload = (n: any, over: Record<string, unknown> = {}) => ({
  title_uz: n.title_uz,
  title_ru: n.title_ru,
  message_uz: n.message_uz,
  message_ru: n.message_ru,
  type: n.type || 'info',
  icon: n.icon || 'bell',
  link: n.link || '',
  order: n.order,
  is_active: n.is_active ?? true,
  is_public: n.is_public ?? true,
  department: refId(n.department) || null,
  visible_positions: posIds(n),
  ...over,
});

export default function NotificationsPage() {
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
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm(1));
  const [tab, setTab] = useState<Lang>(lang);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [confirm, setConfirm] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadErr(false);
    const [n, d, p] = await Promise.allSettled([getNotifications(), getDepartments(), getPositions()]);
    if (n.status === 'fulfilled') setItems(Array.isArray(n.value) ? n.value : []);
    else setLoadErr(true);
    if (d.status === 'fulfilled') setDeps(Array.isArray(d.value) ? d.value : []);
    if (p.status === 'fulfilled') setPoss(Array.isArray(p.value) ? p.value : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ---------- Yordamchilar ----------
  const titleOf = (n: any) => (lang === 'ru' ? n.title_ru || n.title_uz : n.title_uz || n.title_ru) || '';
  const messageOf = (n: any) => (lang === 'ru' ? n.message_ru || n.message_uz : n.message_uz || n.message_ru) || '';

  const activeCount = items.filter((n) => n.is_active !== false).length;
  const privateCount = items.filter((n) => n.is_public === false).length;

  const typeCounts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    TYPES.forEach((tp) => (c[tp] = items.filter((n) => normType(n.type) === tp).length));
    return c;
  }, [items]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return items
      .filter((n) => {
        const active = n.is_active !== false;
        if (status === 'active' && !active) return false;
        if (status === 'inactive' && active) return false;
        if (typeFilter !== 'all' && normType(n.type) !== typeFilter) return false;
        if (!s) return true;
        return [n.title_uz, n.title_ru, n.message_uz, n.message_ru]
          .filter(Boolean).join(' ').toLowerCase().includes(s);
      })
      .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
  }, [items, q, status, typeFilter]);

  // ---------- Forma ----------
  const openCreate = useCallback(() => {
    setEditing(null);
    setForm(emptyForm(Math.max(0, ...items.map((n) => Number(n.order) || 0)) + 1));
    setTab(lang);
    setErrs({});
    setModalOpen(true);
  }, [items, lang]);

  const openEdit = (n: any) => {
    setEditing(n);
    setForm({
      title_uz: n.title_uz || '',
      title_ru: n.title_ru || '',
      message_uz: n.message_uz || '',
      message_ru: n.message_ru || '',
      type: normType(n.type),
      link: n.link || '',
      order: Number(n.order) || 1,
      is_active: n.is_active ?? true,
      is_public: n.is_public ?? true,
      department: refId(n.department),
      positions: posIds(n),
    });
    setTab(lang);
    setErrs({});
    setModalOpen(true);
  };

  useHotkey('n', openCreate, !modalOpen && !confirm);
  useHotkey('/', () => searchRef.current?.focus());

  const titleKey = tab === 'uz' ? 'title_uz' : 'title_ru';
  const messageKey = tab === 'uz' ? 'message_uz' : 'message_ru';

  const filled: Record<Lang, boolean> = {
    uz: !!form.title_uz.trim() && !!form.message_uz.trim(),
    ru: !!form.title_ru.trim() && !!form.message_ru.trim(),
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    const e: Record<string, string> = {};
    (['title_uz', 'title_ru', 'message_uz', 'message_ru'] as const).forEach((k) => {
      if (!form[k].trim()) e[k] = g.common.required;
    });
    if (form.link.trim() && !isValidUrl(form.link)) e.link = t.modal.linkErr;
    setErrs(e);

    if (Object.keys(e).some((k) => k !== 'link')) {
      const uzBad = !!(e.title_uz || e.message_uz);
      setTab(uzBad ? 'uz' : 'ru');
      toast.error(t.modal.fixTabs);
      return;
    }
    if (e.link) return;

    setSaving(true);
    const payload = {
      title_uz: form.title_uz.trim(),
      title_ru: form.title_ru.trim(),
      message_uz: form.message_uz.trim(),
      message_ru: form.message_ru.trim(),
      type: form.type,
      icon: editing?.icon || 'bell',
      link: form.link.trim(),
      order: form.order,
      is_active: form.is_active,
      is_public: form.is_public,
      department: form.department || null,
      visible_positions: form.is_public ? [] : form.positions,
    };
    try {
      if (editing) await updateNotification(idOf(editing), payload);
      else await createNotification(payload);
      toast.success(editing ? g.common.updated : g.common.created);
      setModalOpen(false);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || g.common.saveError);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (n: any, value: boolean) => {
    setItems((all) => all.map((x) => (idOf(x) === idOf(n) ? { ...x, is_active: value } : x)));
    try {
      await updateNotification(idOf(n), toPayload(n, { is_active: value }));
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
      await deleteNotification(idOf(confirm));
      toast.success(g.common.updated);
      setConfirm(null);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || g.common.deleteError);
    } finally {
      setDeleting(false);
    }
  };

  const doExport = () => {
    const ok = downloadCSV(
      `notifications-${new Date().toISOString().slice(0, 10)}.csv`,
      list.map((n) => ({
        [t.csv.id]: idOf(n),
        [t.csv.ru]: n.title_ru,
        [t.csv.uz]: n.title_uz,
        [t.csv.mru]: n.message_ru,
        [t.csv.muz]: n.message_uz,
        [t.csv.type]: t.types[normType(n.type)],
        [t.csv.link]: n.link || '',
        [t.csv.order]: n.order,
        [t.csv.active]: n.is_active !== false ? 'TRUE' : 'FALSE',
        [t.csv.public]: n.is_public !== false ? 'TRUE' : 'FALSE',
      }))
    );
    ok ? toast.success(g.common.exported) : toast.info(g.common.nothingToExport);
  };

  const hasFilters = !!(q || status !== 'all' || typeFilter !== 'all');

  // ==================== RENDER ====================
  return (
    <div>
      <PageHeader
        eyebrow={t.eyebrow}
        title={g.notifications.title}
        subtitle={g.common.total(items.length)}
        icon={Bell}
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
            <StatPill icon={Layers} tone="blue" label={t.stats.total} value={items.length} />
            <StatPill icon={CheckCircle2} tone="green" label={t.stats.active} value={activeCount} />
            <StatPill icon={XCircle} tone="red" label={t.stats.inactive} value={items.length - activeCount} />
            <StatPill icon={Lock} tone="amber" label={t.stats.private} value={privateCount} />
          </div>

          <div className="card space-y-3 p-4">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
              <SearchBox ref={searchRef} value={q} onChange={setQ} placeholder={t.searchPh} />
              <Segmented
                value={status}
                onChange={setStatus}
                options={[
                  { id: 'all', label: t.status.all, count: items.length },
                  { id: 'active', label: t.status.active, count: activeCount },
                  { id: 'inactive', label: t.status.inactive, count: items.length - activeCount },
                ]}
              />
            </div>
            <Segmented
              value={typeFilter}
              onChange={setTypeFilter}
              options={[
                { id: 'all' as TypeFilter, label: t.allTypes, count: typeCounts.all },
                ...TYPES.map((tp) => ({ id: tp as TypeFilter, label: t.types[tp], count: typeCounts[tp] })),
              ]}
            />
          </div>

          {list.length === 0 ? (
            <div className="card">
              {hasFilters ? (
                <EmptyState icon={Bell} title={g.common.noResults} text={g.common.noResultsText} />
              ) : (
                <EmptyState
                  icon={Bell}
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
          ) : (
            <div className="space-y-3">
              {list.map((n, i) => {
                const meta = TYPE_META[normType(n.type)];
                const Icon = meta.icon;
                const active = n.is_active !== false;
                const dept = nm(resolveRef(deps, n.department), lang);
                const created = createdOf(n);

                return (
                  <motion.div
                    key={idOf(n)}
                    layout
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i, 9) * 0.035 }}
                  >
                    <SpotlightCard className={`group p-4 ${active ? '' : 'opacity-60'}`}>
                      <span className="absolute inset-y-0 left-0 w-1" style={{ background: meta.color }} />
                      <div className="relative z-10 flex items-start gap-4 pl-2">
                        <div
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                          style={{ background: `${meta.color}22` }}
                        >
                          <Icon className="h-6 w-6" style={{ color: meta.color }} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate font-extrabold text-white">{titleOf(n)}</h3>
                            <span className="badge" style={{ background: `${meta.color}22`, color: meta.color }}>
                              {t.types[normType(n.type)]}
                            </span>
                            {n.is_public === false ? (
                              <span className="badge bg-amber-500/15 text-amber-400">
                                <Lock className="h-3 w-3" /> {t.badges.private}
                                {posIds(n).length > 0 && <span className="opacity-70">· {posIds(n).length}</span>}
                              </span>
                            ) : (
                              <span className="badge bg-emerald-500/15 text-emerald-400">
                                <Globe className="h-3 w-3" /> {t.badges.public}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 line-clamp-2 text-sm leading-snug text-zinc-400">{messageOf(n)}</p>
                          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
                            <span className="font-black text-zinc-400">#{n.order}</span>
                            {dept && (
                              <span className="flex items-center gap-1 text-sky-300">
                                <Building2 className="h-3 w-3" /> {dept}
                              </span>
                            )}
                            {n.link && (
                              <a href={n.link} target="_blank" rel="noopener noreferrer" className="flex max-w-[200px] items-center gap-1 truncate font-mono text-sky-300 hover:underline">
                                <ExternalLink className="h-3 w-3 shrink-0" /> {n.link}
                              </a>
                            )}
                            {created && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {relTime(created, lang)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                          <Switch checked={active} onChange={(v) => toggleActive(n, v)} label={t.modal.isActive} />
                          <button onClick={() => openEdit(n)} title={g.common.edit} className="rounded-lg p-2 text-sky-400 hover:bg-sky-500/10"><Pencil className="h-4 w-4" /></button>
                          <button onClick={() => setConfirm(n)} title={g.common.delete} className="rounded-lg p-2 text-rose-400 hover:bg-rose-500/10"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    </SpotlightCard>
                  </motion.div>
                );
              })}
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
        icon={Bell}
        size="xl"
        footer={
          <>
            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-ghost">
              {g.common.cancel}
            </button>
            <button type="submit" form="notif-form" disabled={saving} className="btn btn-primary">
              {saving ? g.common.saving : g.common.save}
            </button>
          </>
        }
      >
        <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
          <form id="notif-form" onSubmit={submit} noValidate className="space-y-5">
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

            <Field label={t.modal.message} required error={errs[messageKey]}>
              <textarea
                key={`m-${tab}`}
                value={form[messageKey]}
                onChange={(e) => setForm({ ...form, [messageKey]: e.target.value })}
                rows={4}
                className={`input resize-y ${errs[messageKey] ? 'border-rose-500/60' : ''}`}
              />
            </Field>

            <Field label={t.modal.type}>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {TYPES.map((tp) => {
                  const m = TYPE_META[tp];
                  const Icon = m.icon;
                  const active = form.type === tp;
                  return (
                    <button
                      key={tp}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setForm({ ...form, type: tp })}
                      className={`flex flex-col items-center gap-2 rounded-2xl border p-3 transition ${
                        active ? 'bg-white/[0.07]' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.07]'
                      }`}
                      style={active ? { borderColor: m.color, boxShadow: `0 0 0 3px ${m.color}22` } : undefined}
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${m.color}22` }}>
                        <Icon className="h-5 w-5" style={{ color: m.color }} />
                      </span>
                      <span className="text-xs font-extrabold text-white">{t.types[tp]}</span>
                    </button>
                  );
                })}
              </div>
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label={t.modal.link} hint={t.modal.linkHint} error={errs.link}>
                <input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="/" className={`input font-mono ${errs.link ? 'border-rose-500/60' : ''}`} />
              </Field>
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
                const m = TYPE_META[form.type];
                const Icon = m.icon;
                const title = tab === 'uz' ? form.title_uz : form.title_ru;
                const msg = tab === 'uz' ? form.message_uz : form.message_ru;
                return (
                  <div className="flex items-start gap-3 rounded-[18px] border border-white/[0.07] bg-white/[0.05] p-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: `${m.color}22` }}>
                      <Icon className="h-5 w-5" style={{ color: m.color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="line-clamp-1 text-[14px] font-black leading-tight text-white">{title || '—'}</h4>
                      <p className="mt-1 line-clamp-3 text-xs leading-snug text-zinc-400">{msg || '—'}</p>
                      <p className="mt-2 text-[10px] font-extrabold uppercase tracking-wider" style={{ color: m.color }}>
                        {t.types[form.type]}
                      </p>
                    </div>
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