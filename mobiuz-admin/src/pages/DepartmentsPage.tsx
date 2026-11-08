import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Trash2, Pencil, Building2, Users, Download, Phone, Headphones, Calculator,
  Laptop, Megaphone, ShieldCheck, Briefcase, Heart, Star, Target, UserX,
  type LucideIcon,
} from 'lucide-react';
import {
  getDepartments, deleteDepartment, createDepartment, updateDepartment, getEmployees,
} from '../api';
import PageHeader from '../components/PageHeader';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import {
  SearchBox, Segmented, EmptyState, ErrorState, StatPill, PageSkeleton, Field,
  IconPicker, selectCls,
} from '../components/ui/Kit';
import SpotlightCard from '../components/SpotlightCard';
import AnimatedNumber from '../components/AnimatedNumber';
import { Donut, type Segment } from '../components/Charts';
import { useToast } from '../components/Toast';
import { useT } from '../hooks/useT';
import { useHotkey } from '../hooks/useHotkey';
import { downloadCSV } from '../utils/format';
import { idOf, refId, nm, slugify, createdOf } from '../utils/text';

// ==================== TARJIMALAR ====================
const T = {
  uz: {
    eyebrow: 'Jamoa',
    add: "Yangi bo'lim",
    searchPh: "Bo'lim nomi yoki slug…",
    view: { grid: 'Kartalar', list: "Ro'yxat" },
    sort: { name: 'Nomi A→Z', size: 'Xodimlar soni ↓', newest: 'Eng yangilari' },
    stats: { total: "Jami bo'limlar", people: 'Biriktirilgan xodimlar', unassigned: "Bo'limsiz xodimlar", largest: 'Eng kattasi' },
    employees: (n: number) => `${n} xodim`,
    noEmployees: "Xodim yo'q",
    chart: { title: "Xodimlar taqsimoti", others: 'Boshqalar', people: 'xodim' },
    modal: {
      createTitle: "Yangi bo'lim",
      editTitle: "Bo'limni tahrirlash",
      subtitle: 'Nomi ikki tilda kiritiladi',
      nameUz: "Nomi (O'zbekcha)",
      nameRu: 'Nomi (Ruscha)',
      slug: 'Slug',
      slugHint: 'Lotin harflarida, nomdan avtomatik yaratiladi',
      slugDup: 'Bunday slug allaqachon mavjud',
      icon: 'Ikonka',
    },
    del: {
      title: "Bo'limni o'chirasizmi?",
      text: (n: string) => `"${n}" bo'limi o'chiriladi.`,
      used: (n: number) => `Diqqat: bu bo'limda ${n} ta xodim bor.`,
    },
    empty: { title: "Hali bo'lim yo'q", text: "Birinchi bo'limni qo'shing." },
    csv: { id: 'ID', uz: 'Nomi (UZ)', ru: 'Nomi (RU)', slug: 'Slug', employees: 'Xodimlar' },
  },
  ru: {
    eyebrow: 'Команда',
    add: 'Новый отдел',
    searchPh: 'Название отдела или slug…',
    view: { grid: 'Карточки', list: 'Список' },
    sort: { name: 'Название А→Я', size: 'Сотрудников ↓', newest: 'Сначала новые' },
    stats: { total: 'Всего отделов', people: 'Закреплено сотрудников', unassigned: 'Сотрудников без отдела', largest: 'Самый большой' },
    employees: (n: number) => `Сотрудников: ${n}`,
    noEmployees: 'Нет сотрудников',
    chart: { title: 'Распределение сотрудников', others: 'Остальные', people: 'сотр.' },
    modal: {
      createTitle: 'Новый отдел',
      editTitle: 'Редактирование отдела',
      subtitle: 'Название вводится на двух языках',
      nameUz: 'Название (узбекский)',
      nameRu: 'Название (русский)',
      slug: 'Slug',
      slugHint: 'Латиницей, создаётся автоматически из названия',
      slugDup: 'Такой slug уже существует',
      icon: 'Иконка',
    },
    del: {
      title: 'Удалить отдел?',
      text: (n: string) => `Отдел «${n}» будет удалён.`,
      used: (n: number) => `Внимание: в этом отделе сотрудников — ${n}.`,
    },
    empty: { title: 'Отделов пока нет', text: 'Добавьте первый отдел.' },
    csv: { id: 'ID', uz: 'Название (UZ)', ru: 'Название (RU)', slug: 'Slug', employees: 'Сотрудники' },
  },
};

const DEPT_ICONS: Record<string, LucideIcon> = {
  building: Building2,
  users: Users,
  phone: Phone,
  headset: Headphones,
  calculator: Calculator,
  laptop: Laptop,
  megaphone: Megaphone,
  shield: ShieldCheck,
  briefcase: Briefcase,
  heart: Heart,
  star: Star,
  target: Target,
};

const GRADS = [
  'from-rose-500 to-red-700',
  'from-violet-500 to-indigo-700',
  'from-cyan-400 to-sky-600',
  'from-amber-400 to-orange-600',
  'from-emerald-400 to-teal-600',
  'from-fuchsia-500 to-pink-700',
];
const PALETTE = ['#ff2b3a', '#7c5cff', '#22d3ee', '#fbbf24', '#34d399', '#f472b6'];

type SortKey = 'name' | 'size' | 'newest';
type View = 'grid' | 'list';

interface FormState {
  name_uz: string;
  name_ru: string;
  slug: string;
  icon: string;
}
const EMPTY_FORM: FormState = { name_uz: '', name_ru: '', slug: '', icon: 'building' };

export default function DepartmentsPage() {
  const { t: g, lang } = useT();
  const t = T[lang];
  const toast = useToast();

  const [deps, setDeps] = useState<any[]>([]);
  const [emps, setEmps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState(false);

  const [q, setQ] = useState('');
  const [sort, setSort] = useState<SortKey>('name');
  const [view, setView] = useState<View>('grid');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [confirm, setConfirm] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadErr(false);
    const [d, e] = await Promise.allSettled([getDepartments(), getEmployees()]);
    if (d.status === 'fulfilled') setDeps(Array.isArray(d.value) ? d.value : []);
    else setLoadErr(true);
    if (e.status === 'fulfilled') setEmps(Array.isArray(e.value) ? e.value : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ---------- Hisob-kitoblar ----------
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    emps.forEach((e) => {
      const id = refId(e.department);
      if (id) map.set(id, (map.get(id) || 0) + 1);
    });
    return map;
  }, [emps]);

  const assigned = useMemo(() => emps.filter((e) => refId(e.department)).length, [emps]);
  const maxCount = Math.max(1, ...deps.map((d) => counts.get(idOf(d)) || 0));

  const colorOf = (d: any) => {
    const i = deps.findIndex((x) => idOf(x) === idOf(d));
    return Math.max(i, 0) % GRADS.length;
  };

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    const filtered = deps.filter((d) =>
      !s || [d.name_uz, d.name_ru, d.slug].filter(Boolean).join(' ').toLowerCase().includes(s)
    );
    const cmp: Record<SortKey, (a: any, b: any) => number> = {
      name: (a, b) => nm(a, lang).localeCompare(nm(b, lang)),
      size: (a, b) => (counts.get(idOf(b)) || 0) - (counts.get(idOf(a)) || 0),
      newest: (a, b) =>
        (new Date(createdOf(b) || 0).getTime() || 0) - (new Date(createdOf(a) || 0).getTime() || 0),
    };
    return [...filtered].sort(cmp[sort]);
  }, [deps, q, sort, lang, counts]);

  const segments = useMemo<Segment[]>(() => {
    const rows = deps
      .map((d) => ({ label: nm(d, lang), value: counts.get(idOf(d)) || 0 }))
      .filter((r) => r.value > 0)
      .sort((a, b) => b.value - a.value);
    const segs: Segment[] = rows.slice(0, 5).map((r, i) => ({ ...r, color: PALETTE[i] }));
    const rest = rows.slice(5).reduce((s, r) => s + r.value, 0);
    if (rest > 0) segs.push({ label: t.chart.others, value: rest, color: PALETTE[5] });
    return segs;
  }, [deps, counts, lang, t.chart.others]);

  const largest = useMemo(() => {
    const top = [...deps].sort((a, b) => (counts.get(idOf(b)) || 0) - (counts.get(idOf(a)) || 0))[0];
    return top && (counts.get(idOf(top)) || 0) > 0 ? nm(top, lang) : '—';
  }, [deps, counts, lang]);

  // ---------- Forma ----------
  const openCreate = useCallback(() => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setSlugTouched(false);
    setErrs({});
    setModalOpen(true);
  }, []);

  const openEdit = (d: any) => {
    setEditing(d);
    setForm({
      name_uz: d.name_uz || '',
      name_ru: d.name_ru || '',
      slug: d.slug || '',
      icon: d.icon || 'building',
    });
    setSlugTouched(true);
    setErrs({});
    setModalOpen(true);
  };

  useHotkey('n', openCreate, !modalOpen && !confirm);
  useHotkey('/', () => searchRef.current?.focus());

  const setName = (key: 'name_uz' | 'name_ru', value: string) => {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (!slugTouched) next.slug = slugify(next.name_uz || next.name_ru);
      return next;
    });
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    const e: Record<string, string> = {};
    if (!form.name_uz.trim()) e.name_uz = g.common.required;
    if (!form.name_ru.trim()) e.name_ru = g.common.required;
    if (!form.slug.trim()) e.slug = g.common.required;
    else if (deps.some((d) => d.slug === form.slug.trim() && idOf(d) !== idOf(editing))) e.slug = t.modal.slugDup;
    setErrs(e);
    if (Object.keys(e).length) return;

    setSaving(true);
    const payload = { ...form, slug: form.slug.trim() };
    try {
      if (editing) await updateDepartment(idOf(editing), payload);
      else await createDepartment(payload);
      toast.success(editing ? g.common.updated : g.common.created);
      setModalOpen(false);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || g.common.saveError);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!confirm) return;
    setDeleting(true);
    try {
      await deleteDepartment(idOf(confirm));
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
      `departments-${new Date().toISOString().slice(0, 10)}.csv`,
      list.map((d) => ({
        [t.csv.id]: idOf(d),
        [t.csv.uz]: d.name_uz,
        [t.csv.ru]: d.name_ru,
        [t.csv.slug]: d.slug,
        [t.csv.employees]: counts.get(idOf(d)) || 0,
      }))
    );
    ok ? toast.success(g.common.exported) : toast.info(g.common.nothingToExport);
  };

  const usedCount = confirm ? counts.get(idOf(confirm)) || 0 : 0;

  // ==================== RENDER ====================
  return (
    <div>
      <PageHeader
        eyebrow={t.eyebrow}
        title={g.nav.items.departments.label}
        subtitle={g.common.total(deps.length)}
        icon={Building2}
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
      ) : loadErr && deps.length === 0 ? (
        <ErrorState onRetry={load} />
      ) : (
        <div className="space-y-5">
          {/* Statistika + donut */}
          <div className="grid gap-5 lg:grid-cols-12">
            <div className="grid grid-cols-2 gap-4 lg:col-span-7">
              <StatPill icon={Building2} tone="green" label={t.stats.total} value={deps.length} />
              <StatPill icon={Users} tone="blue" label={t.stats.people} value={assigned} />
              <StatPill icon={UserX} tone="amber" label={t.stats.unassigned} value={emps.length - assigned} />
              <SpotlightCard className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-500/10">
                  <Star className="h-6 w-6 text-violet-400" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-lg font-black leading-tight text-white">{largest}</p>
                  <p className="mt-1 text-xs font-semibold text-zinc-400">{t.stats.largest}</p>
                </div>
              </SpotlightCard>
            </div>

            <SpotlightCard className="flex items-center gap-6 p-6 lg:col-span-5">
              <Donut segments={segments} size={150} thickness={18}>
                <p className="text-3xl font-black text-white">
                  <AnimatedNumber value={assigned} />
                </p>
                <p className="text-[11px] font-semibold text-zinc-500">{t.chart.people}</p>
              </Donut>
              <div className="min-w-0 flex-1 space-y-2">
                <h3 className="mb-2 font-extrabold text-white">{t.chart.title}</h3>
                {segments.length === 0 && <p className="text-sm text-zinc-500">—</p>}
                {segments.map((s) => (
                  <div key={s.label} className="flex items-center gap-2.5 text-sm">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
                    <span className="flex-1 truncate text-zinc-400">{s.label}</span>
                    <span className="font-black tabular-nums text-white">{s.value}</span>
                  </div>
                ))}
              </div>
            </SpotlightCard>
          </div>

          {/* Asboblar */}
          <div className="card grid gap-3 p-4 lg:grid-cols-[1fr_auto_auto]">
            <SearchBox ref={searchRef} value={q} onChange={setQ} placeholder={t.searchPh} />
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

          {/* Natija */}
          {list.length === 0 ? (
            <div className="card">
              {q ? (
                <EmptyState icon={Building2} title={g.common.noResults} text={g.common.noResultsText} />
              ) : (
                <EmptyState
                  icon={Building2}
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
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {list.map((d, i) => {
                const Icon = DEPT_ICONS[d.icon] || Building2;
                const count = counts.get(idOf(d)) || 0;
                return (
                  <motion.div
                    key={idOf(d)}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i, 9) * 0.04 }}
                  >
                    <SpotlightCard tilt className="group p-5">
                      <div className="relative z-10">
                        <div className="flex items-start justify-between">
                          <div
                            className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg ${GRADS[colorOf(d)]}`}
                          >
                            <Icon className="h-7 w-7 text-white" />
                          </div>
                          <div className="flex gap-1 opacity-100 transition lg:opacity-0 lg:group-hover:opacity-100">
                            <button onClick={() => openEdit(d)} title={g.common.edit} className="rounded-lg p-2 text-sky-400 hover:bg-sky-500/10">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => setConfirm(d)} title={g.common.delete} className="rounded-lg p-2 text-rose-400 hover:bg-rose-500/10">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <h3 className="mt-4 text-lg font-black leading-tight text-white">{d.name_uz}</h3>
                        <p className="text-sm text-zinc-500">{d.name_ru}</p>

                        <div className="mt-4 flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1.5 font-semibold text-zinc-300">
                            <Users className="h-4 w-4 text-zinc-500" />
                            {count > 0 ? t.employees(count) : t.noEmployees}
                          </span>
                          <span className="rounded-full bg-white/[0.06] px-2.5 py-1 font-mono text-[11px] text-zinc-400">
                            {d.slug}
                          </span>
                        </div>
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(count / maxCount) * 100}%` }}
                            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                            className={`h-full rounded-full bg-gradient-to-r ${GRADS[colorOf(d)]}`}
                          />
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
                <table className="w-full min-w-[640px] text-sm">
                  <tbody>
                    {list.map((d, i) => {
                      const Icon = DEPT_ICONS[d.icon] || Building2;
                      const count = counts.get(idOf(d)) || 0;
                      return (
                        <motion.tr
                          key={idOf(d)}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: Math.min(i, 10) * 0.025 }}
                          className="group border-b border-white/[0.05] last:border-0 hover:bg-white/[0.04]"
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${GRADS[colorOf(d)]}`}>
                                <Icon className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <p className="font-extrabold text-white">{d.name_uz}</p>
                                <p className="text-xs text-zinc-500">{d.name_ru}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-mono text-xs text-zinc-500">{d.slug}</td>
                          <td className="w-48 p-4">
                            <p className="mb-1.5 text-xs font-bold text-zinc-300">{t.employees(count)}</p>
                            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                              <div
                                className={`h-full rounded-full bg-gradient-to-r ${GRADS[colorOf(d)]}`}
                                style={{ width: `${(count / maxCount) * 100}%` }}
                              />
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex justify-end gap-1">
                              <button onClick={() => openEdit(d)} className="rounded-lg p-2 text-sky-400 hover:bg-sky-500/10"><Pencil className="h-4 w-4" /></button>
                              <button onClick={() => setConfirm(d)} className="rounded-lg p-2 text-rose-400 hover:bg-rose-500/10"><Trash2 className="h-4 w-4" /></button>
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
        icon={Building2}
        footer={
          <>
            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-ghost">
              {g.common.cancel}
            </button>
            <button type="submit" form="dep-form" disabled={saving} className="btn btn-primary">
              {saving ? g.common.saving : g.common.save}
            </button>
          </>
        }
      >
        <form id="dep-form" onSubmit={submit} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.modal.nameUz} required error={errs.name_uz}>
              <input
                value={form.name_uz}
                onChange={(e) => setName('name_uz', e.target.value)}
                autoFocus
                className={`input ${errs.name_uz ? 'border-rose-500/60' : ''}`}
              />
            </Field>
            <Field label={t.modal.nameRu} required error={errs.name_ru}>
              <input
                value={form.name_ru}
                onChange={(e) => setName('name_ru', e.target.value)}
                className={`input ${errs.name_ru ? 'border-rose-500/60' : ''}`}
              />
            </Field>
          </div>

          <Field label={t.modal.slug} required hint={t.modal.slugHint} error={errs.slug}>
            <input
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setForm({ ...form, slug: slugify(e.target.value) });
              }}
              className={`input font-mono ${errs.slug ? 'border-rose-500/60' : ''}`}
            />
          </Field>

          <Field label={t.modal.icon}>
            <IconPicker icons={DEPT_ICONS} value={form.icon} onChange={(k) => setForm({ ...form, icon: k })} />
          </Field>
        </form>
      </Modal>

      {/* ============ O'chirishni tasdiqlash ============ */}
      <ConfirmDialog
        open={!!confirm}
        loading={deleting}
        title={t.del.title}
        message={confirm ? t.del.text(nm(confirm, lang)) : ''}
        warning={usedCount > 0 ? t.del.used(usedCount) : undefined}
        onConfirm={confirmDelete}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}