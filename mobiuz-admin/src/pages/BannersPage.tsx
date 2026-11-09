import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  Plus, Trash2, Pencil, Image as ImageIcon, Download, ExternalLink, Upload, X,
  ChevronUp, ChevronDown, CheckCircle2, XCircle, Layers, ChevronRight,
} from 'lucide-react';
import { getBanners, deleteBanner, createBanner, updateBanner } from '../api';
import PageHeader from '../components/PageHeader';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import {
  SearchBox, Segmented, Switch, EmptyState, ErrorState, StatPill, PageSkeleton, Field,
} from '../components/ui/Kit';
import SpotlightCard from '../components/SpotlightCard';
import { useToast } from '../components/Toast';
import { useT } from '../hooks/useT';
import { useHotkey } from '../hooks/useHotkey';
import { downloadCSV } from '../utils/format';
import { idOf, isValidUrl } from '../utils/text';

const API_ORIGIN: string = import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:5000';
const MAX_MB = 5;

const imgUrl = (img?: string): string => {
  if (!img) return '';
  return /^(https?:|data:|blob:)/i.test(img) ? img : `${API_ORIGIN}${img}`;
};

// ==================== TARJIMALAR ====================
const T = {
  uz: {
    eyebrow: 'Kontent',
    add: 'Yangi banner',
    searchPh: "Sarlavha yoki tavsif bo'yicha…",
    filters: { all: 'Hammasi', active: 'Faol', inactive: 'Nofaol' },
    view: { grid: 'Kartalar', list: "Ro'yxat" },
    stats: { total: 'Jami bannerlar', active: 'Faol', inactive: 'Nofaol', withImage: 'Rasmli' },
    cols: { banner: 'Banner', link: 'Havola', order: 'Tartib', active: 'Faol', actions: 'Amallar' },
    noImage: "Rasm yo'q",
    toggleOn: 'Banner faollashtirildi',
    toggleOff: "Banner o'chirib qo'yildi",
    moveUp: 'Yuqoriga',
    moveDown: 'Pastga',
    modal: {
      createTitle: 'Yangi banner',
      editTitle: 'Bannerni tahrirlash',
      subtitle: "Ilovaning bosh sahifasida ko'rinadi",
      titleUz: "Sarlavha (O'zbekcha)",
      titleRu: 'Sarlavha (Ruscha)',
      descUz: "Tavsif (O'zbekcha)",
      descRu: 'Tavsif (Ruscha)',
      image: 'Rasm',
      drop: 'Rasmni shu yerga tashlang yoki bosing',
      dropHint: (mb: number) => `PNG, JPG, WEBP · ${mb} MB gacha`,
      uploading: 'Yuklanmoqda…',
      remove: "Rasmni olib tashlash",
      tooBig: (mb: number) => `Rasm ${mb} MB dan katta`,
      notImage: 'Faqat rasm fayli yuklash mumkin',
      uploadError: 'Rasm yuklashda xatolik',
      imageBroken: 'Rasm yuklanmadi',
      link: 'Havola',
      linkHint: 'Masalan: /news yoki https://…',
      linkErr: "Havola noto'g'ri",
      order: 'Tartib raqami',
      isActive: 'Faol',
      isActiveHint: "Nofaol banner ilovada ko'rinmaydi",
      preview: "Ilovadagi ko'rinishi",
    },
    del: { title: "Bannerni o'chirasizmi?", text: (n: string) => `"${n}" banneri o'chiriladi.` },
    empty: { title: "Hali banner yo'q", text: "Birinchi yangilikni qo'shing." },
    csv: { id: 'ID', uz: 'Sarlavha (UZ)', ru: 'Sarlavha (RU)', descUz: 'Tavsif (UZ)', descRu: 'Tavsif (RU)', link: 'Havola', image: 'Rasm', order: 'Tartib', active: 'Faol' },
  },
  ru: {
    eyebrow: 'Контент',
    add: 'Новый баннер',
    searchPh: 'По заголовку или описанию…',
    filters: { all: 'Все', active: 'Активные', inactive: 'Неактивные' },
    view: { grid: 'Карточки', list: 'Список' },
    stats: { total: 'Всего баннеров', active: 'Активные', inactive: 'Неактивные', withImage: 'С изображением' },
    cols: { banner: 'Баннер', link: 'Ссылка', order: 'Порядок', active: 'Активен', actions: 'Действия' },
    noImage: 'Нет изображения',
    toggleOn: 'Баннер активирован',
    toggleOff: 'Баннер отключён',
    moveUp: 'Выше',
    moveDown: 'Ниже',
    modal: {
      createTitle: 'Новый баннер',
      editTitle: 'Редактирование баннера',
      subtitle: 'Отображается на главной странице приложения',
      titleUz: 'Заголовок (узбекский)',
      titleRu: 'Заголовок (русский)',
      descUz: 'Описание (узбекский)',
      descRu: 'Описание (русский)',
      image: 'Изображение',
      drop: 'Перетащите изображение сюда или нажмите',
      dropHint: (mb: number) => `PNG, JPG, WEBP · до ${mb} МБ`,
      uploading: 'Загрузка…',
      remove: 'Убрать изображение',
      tooBig: (mb: number) => `Изображение больше ${mb} МБ`,
      notImage: 'Можно загружать только изображения',
      uploadError: 'Ошибка загрузки изображения',
      imageBroken: 'Изображение не загрузилось',
      link: 'Ссылка',
      linkHint: 'Например: /news или https://…',
      linkErr: 'Неверная ссылка',
      order: 'Порядковый номер',
      isActive: 'Активен',
      isActiveHint: 'Неактивный баннер не отображается в приложении',
      preview: 'Вид в приложении',
    },
    del: { title: 'Удалить баннер?', text: (n: string) => `Баннер «${n}» будет удалён.` },
    empty: { title: 'Баннеров пока нет', text: 'Добавьте первую новость.' },
    csv: { id: 'ID', uz: 'Заголовок (UZ)', ru: 'Заголовок (RU)', descUz: 'Описание (UZ)', descRu: 'Описание (RU)', link: 'Ссылка', image: 'Изображение', order: 'Порядок', active: 'Активен' },
  },
};

type Filter = 'all' | 'active' | 'inactive';
type View = 'grid' | 'list';

interface FormState {
  title_uz: string;
  title_ru: string;
  description_uz: string;
  description_ru: string;
  link: string;
  image: string;
  order: number;
  is_active: boolean;
}

const emptyForm = (order: number): FormState => ({
  title_uz: '', title_ru: '', description_uz: '', description_ru: '',
  link: '/', image: '', order, is_active: true,
});

const byOrder = (a: any, b: any) => (Number(a.order) || 0) - (Number(b.order) || 0);

/** Rasm xato bo'lsa — chiroyli zaxira ko'rinishi */
function Thumb({ src, alt, className = '' }: { src?: string; alt: string; className?: string }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [src]);

  if (!src || broken) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-[#ff2b3a]/25 via-[#7c5cff]/15 to-transparent ${className}`}>
        <ImageIcon className="h-8 w-8 text-white/40" />
      </div>
    );
  }
  return <img src={src} alt={alt} loading="lazy" onError={() => setBroken(true)} className={`object-cover ${className}`} />;
}

export default function BannersPage() {
  const { t: g, lang } = useT();
  const t = T[lang];
  const toast = useToast();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState(false);

  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [view, setView] = useState<View>('grid');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm(1));
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const [confirm, setConfirm] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadErr(false);
    try {
      const data = await getBanners();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setLoadErr(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ---------- Hisob-kitoblar ----------
  const sorted = useMemo(() => [...items].sort(byOrder), [items]);
  const activeCount = items.filter((b) => b.is_active !== false).length;

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return sorted.filter((b) => {
      const isActive = b.is_active !== false;
      if (filter === 'active' && !isActive) return false;
      if (filter === 'inactive' && isActive) return false;
      if (!s) return true;
      return [b.title_uz, b.title_ru, b.description_uz, b.description_ru]
        .filter(Boolean).join(' ').toLowerCase().includes(s);
    });
  }, [sorted, q, filter]);

  const titleOf = (b: any) => (lang === 'ru' ? b.title_ru || b.title_uz : b.title_uz || b.title_ru) || '';
  const descOf = (b: any) =>
    (lang === 'ru' ? b.description_ru || b.description_uz : b.description_uz || b.description_ru) || '';

  // ---------- Forma ----------
  const openCreate = useCallback(() => {
    setEditing(null);
    setForm(emptyForm(Math.max(0, ...items.map((b) => Number(b.order) || 0)) + 1));
    setErrs({});
    setModalOpen(true);
  }, [items]);

  const openEdit = (b: any) => {
    setEditing(b);
    setForm({
      title_uz: b.title_uz || '',
      title_ru: b.title_ru || '',
      description_uz: b.description_uz || '',
      description_ru: b.description_ru || '',
      link: b.link || '/',
      image: b.image || '',
      order: Number(b.order) || 1,
      is_active: b.is_active ?? true,
    });
    setErrs({});
    setModalOpen(true);
  };

  useHotkey('n', openCreate, !modalOpen && !confirm);
  useHotkey('/', () => searchRef.current?.focus());

  // ---------- Rasm yuklash ----------
  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return toast.error(t.modal.notImage);
    if (file.size > MAX_MB * 1024 * 1024) return toast.error(t.modal.tooBig(MAX_MB));

    setUploading(true);
    setProgress(0);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const { data } = await axios.post(`${API_ORIGIN}/api/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
        },
      });
      setForm((f) => ({ ...f, image: data.url }));
    } catch {
      toast.error(t.modal.uploadError);
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  // ---------- Saqlash ----------
  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    const e: Record<string, string> = {};
    if (!form.title_uz.trim()) e.title_uz = g.common.required;
    if (!form.title_ru.trim()) e.title_ru = g.common.required;
    if (form.link.trim() && !isValidUrl(form.link)) e.link = t.modal.linkErr;
    setErrs(e);
    if (Object.keys(e).length) return;

    setSaving(true);
    try {
      if (editing) await updateBanner(idOf(editing), form);
      else await createBanner(form);
      toast.success(editing ? g.common.updated : g.common.created);
      setModalOpen(false);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || g.common.saveError);
    } finally {
      setSaving(false);
    }
  };

  // Tez yoqish / o'chirish (optimistik)
  const toggleActive = async (b: any, value: boolean) => {
    setItems((list) => list.map((x) => (idOf(x) === idOf(b) ? { ...x, is_active: value } : x)));
    try {
      await updateBanner(idOf(b), { ...b, is_active: value });
      toast.success(value ? t.toggleOn : t.toggleOff);
    } catch {
      toast.error(g.common.saveError);
      load();
    }
  };

  // Tartibni o'zgartirish: ro'yxatni qayta raqamlab, faqat o'zgarganlarini saqlaydi
  const move = async (b: any, dir: -1 | 1) => {
    const arr = [...sorted];
    const from = arr.findIndex((x) => idOf(x) === idOf(b));
    const to = from + dir;
    if (from < 0 || to < 0 || to >= arr.length) return;
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);

    const renumbered = arr.map((x, i) => ({ ...x, order: i + 1 }));
    const changed = renumbered.filter((x) => {
      const old = items.find((o) => idOf(o) === idOf(x));
      return Number(old?.order) !== x.order;
    });
    setItems(renumbered);

    const res = await Promise.allSettled(changed.map((x) => updateBanner(idOf(x), x)));
    if (res.some((r) => r.status === 'rejected')) {
      toast.error(g.common.saveError);
      load();
    }
  };

  const confirmDelete = async () => {
    if (!confirm) return;
    setDeleting(true);
    try {
      await deleteBanner(idOf(confirm));
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
      `banners-${new Date().toISOString().slice(0, 10)}.csv`,
      list.map((b) => ({
        [t.csv.id]: idOf(b),
        [t.csv.uz]: b.title_uz,
        [t.csv.ru]: b.title_ru,
        [t.csv.descUz]: b.description_uz || '',
        [t.csv.descRu]: b.description_ru || '',
        [t.csv.link]: b.link || '',
        [t.csv.image]: b.image || '',
        [t.csv.order]: b.order,
        [t.csv.active]: b.is_active !== false ? 'TRUE' : 'FALSE',
      }))
    );
    ok ? toast.success(g.common.exported) : toast.info(g.common.nothingToExport);
  };

  // ==================== RENDER ====================
  return (
    <div>
      <PageHeader
        eyebrow={t.eyebrow}
        title={g.nav.items.banners.label}
        subtitle={g.common.total(items.length)}
        icon={ImageIcon}
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
            <StatPill icon={ImageIcon} tone="purple" label={t.stats.withImage} value={items.filter((b) => b.image).length} />
          </div>

          <div className="card grid gap-3 p-4 lg:grid-cols-[1fr_auto_auto]">
            <SearchBox ref={searchRef} value={q} onChange={setQ} placeholder={t.searchPh} />
            <Segmented
              value={filter}
              onChange={setFilter}
              options={[
                { id: 'all', label: t.filters.all, count: items.length },
                { id: 'active', label: t.filters.active, count: activeCount },
                { id: 'inactive', label: t.filters.inactive, count: items.length - activeCount },
              ]}
            />
            <Segmented
              value={view}
              onChange={setView}
              options={[
                { id: 'grid', label: t.view.grid },
                { id: 'list', label: t.view.list },
              ]}
            />
          </div>

          {list.length === 0 ? (
            <div className="card">
              {q || filter !== 'all' ? (
                <EmptyState icon={ImageIcon} title={g.common.noResults} text={g.common.noResultsText} />
              ) : (
                <EmptyState
                  icon={ImageIcon}
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
              {list.map((b, i) => {
                const active = b.is_active !== false;
                return (
                  <motion.div
                    key={idOf(b)}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i, 9) * 0.04 }}
                  >
                    <SpotlightCard className="group !overflow-hidden">
                      <div className="relative h-48 overflow-hidden">
                        <Thumb
                          src={imgUrl(b.image)}
                          alt={titleOf(b)}
                          className={`h-full w-full transition-transform duration-700 group-hover:scale-105 ${active ? '' : 'grayscale'}`}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                        <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-black text-white backdrop-blur">
                          #{b.order}
                        </span>

                        <div className="absolute right-3 top-3 flex gap-1.5 opacity-100 transition lg:opacity-0 lg:group-hover:opacity-100">
                          <button onClick={() => openEdit(b)} title={g.common.edit} className="rounded-xl bg-black/60 p-2 text-sky-300 backdrop-blur hover:bg-sky-500 hover:text-white">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => setConfirm(b)} title={g.common.delete} className="rounded-xl bg-black/60 p-2 text-rose-300 backdrop-blur hover:bg-rose-500 hover:text-white">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="absolute inset-x-4 bottom-3">
                          <h3 className="line-clamp-1 text-lg font-black leading-tight text-white">{titleOf(b)}</h3>
                          <p className="mt-0.5 line-clamp-1 text-xs text-zinc-300">{descOf(b)}</p>
                        </div>
                      </div>

                      <div className="relative z-10 flex items-center justify-between gap-3 px-4 py-3">
                        {b.link ? (
                          <a href={b.link} target="_blank" rel="noopener noreferrer" className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-sky-300 hover:underline">
                            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate font-mono">{b.link}</span>
                          </a>
                        ) : (
                          <span className="text-xs text-zinc-600">—</span>
                        )}
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-extrabold ${active ? 'text-emerald-400' : 'text-zinc-500'}`}>
                            {active ? g.common.active : g.common.inactive}
                          </span>
                          <Switch checked={active} onChange={(v) => toggleActive(b, v)} label={t.cols.active} />
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
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.07] bg-white/[0.03] text-left text-[11px] font-extrabold uppercase tracking-wider text-zinc-500">
                      <th className="p-4">{t.cols.banner}</th>
                      <th className="p-4">{t.cols.link}</th>
                      <th className="p-4">{t.cols.order}</th>
                      <th className="p-4">{t.cols.active}</th>
                      <th className="p-4 text-right">{t.cols.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((b, i) => {
                      const active = b.is_active !== false;
                      const canMove = filter === 'all' && !q;
                      return (
                        <motion.tr
                          key={idOf(b)}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: Math.min(i, 10) * 0.025 }}
                          className="group border-b border-white/[0.05] last:border-0 hover:bg-white/[0.04]"
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <Thumb src={imgUrl(b.image)} alt={titleOf(b)} className="h-12 w-20 shrink-0 rounded-xl" />
                              <div className="min-w-0">
                                <p className="truncate font-extrabold text-white">{titleOf(b)}</p>
                                <p className="truncate text-xs text-zinc-500">{descOf(b) || '—'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="max-w-[180px] p-4">
                            {b.link ? (
                              <a href={b.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 truncate font-mono text-xs text-sky-300 hover:underline">
                                <ExternalLink className="h-3 w-3 shrink-0" /> {b.link}
                              </a>
                            ) : (
                              <span className="text-zinc-600">—</span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1.5">
                              <span className="w-6 font-black tabular-nums text-white">{b.order}</span>
                              {canMove && (
                                <div className="flex flex-col">
                                  <button onClick={() => move(b, -1)} title={t.moveUp} className="rounded p-0.5 text-zinc-500 hover:bg-white/10 hover:text-white"><ChevronUp className="h-3.5 w-3.5" /></button>
                                  <button onClick={() => move(b, 1)} title={t.moveDown} className="rounded p-0.5 text-zinc-500 hover:bg-white/10 hover:text-white"><ChevronDown className="h-3.5 w-3.5" /></button>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <Switch checked={active} onChange={(v) => toggleActive(b, v)} label={t.cols.active} />
                          </td>
                          <td className="p-4">
                            <div className="flex justify-end gap-1">
                              <button onClick={() => openEdit(b)} className="rounded-lg p-2 text-sky-400 hover:bg-sky-500/10"><Pencil className="h-4 w-4" /></button>
                              <button onClick={() => setConfirm(b)} className="rounded-lg p-2 text-rose-400 hover:bg-rose-500/10"><Trash2 className="h-4 w-4" /></button>
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
        icon={ImageIcon}
        size="xl"
        footer={
          <>
            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-ghost">
              {g.common.cancel}
            </button>
            <button type="submit" form="banner-form" disabled={saving || uploading} className="btn btn-primary">
              {saving ? g.common.saving : g.common.save}
            </button>
          </>
        }
      >
        <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          <form id="banner-form" onSubmit={submit} noValidate className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t.modal.titleUz} required error={errs.title_uz}>
                <input value={form.title_uz} onChange={(e) => setForm({ ...form, title_uz: e.target.value })} autoFocus className={`input ${errs.title_uz ? 'border-rose-500/60' : ''}`} />
              </Field>
              <Field label={t.modal.titleRu} required error={errs.title_ru}>
                <input value={form.title_ru} onChange={(e) => setForm({ ...form, title_ru: e.target.value })} className={`input ${errs.title_ru ? 'border-rose-500/60' : ''}`} />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t.modal.descUz}>
                <textarea value={form.description_uz} onChange={(e) => setForm({ ...form, description_uz: e.target.value })} rows={3} className="input resize-none" />
              </Field>
              <Field label={t.modal.descRu}>
                <textarea value={form.description_ru} onChange={(e) => setForm({ ...form, description_ru: e.target.value })} rows={3} className="input resize-none" />
              </Field>
            </div>

            {/* Rasm yuklash */}
            <Field label={t.modal.image}>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => !uploading && fileRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') fileRef.current?.click(); }}
                className={`relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed p-5 text-center transition ${
                  dragOver ? 'border-[#ff2b3a] bg-[#ff2b3a]/10' : 'border-white/15 bg-white/[0.03] hover:border-white/30'
                }`}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadFile(f);
                    e.target.value = '';
                  }}
                />
                <Upload className="mx-auto h-6 w-6 text-zinc-500" />
                <p className="mt-2 text-sm font-bold text-zinc-300">{uploading ? `${t.modal.uploading} ${progress}%` : t.modal.drop}</p>
                <p className="mt-0.5 text-xs text-zinc-500">{t.modal.dropHint(MAX_MB)}</p>
                {uploading && (
                  <div className="mx-auto mt-3 h-1.5 max-w-xs overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#ff2b3a] to-[#ff8a5c] transition-all" style={{ width: `${progress}%` }} />
                  </div>
                )}
              </div>
              {form.image && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, image: '' })}
                  className="mt-2 flex items-center gap-1.5 text-xs font-bold text-rose-400 hover:text-rose-300"
                >
                  <X className="h-3.5 w-3.5" /> {t.modal.remove}
                </button>
              )}
            </Field>

            <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr]">
              <Field label={t.modal.link} hint={t.modal.linkHint} error={errs.link}>
                <input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="/" className={`input font-mono ${errs.link ? 'border-rose-500/60' : ''}`} />
              </Field>
              <Field label={t.modal.order}>
                <input type="number" min={1} value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })} className="input" />
              </Field>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] p-4">
              <div>
                <p className="text-sm font-extrabold text-white">{t.modal.isActive}</p>
                <p className="text-xs text-zinc-500">{t.modal.isActiveHint}</p>
              </div>
              <Switch checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} label={t.modal.isActive} />
            </div>
          </form>

          {/* Jonli ko'rinish */}
          <div className="lg:sticky lg:top-4 lg:self-start">
            <p className="label">{t.modal.preview}</p>
            <div className="rounded-[28px] border border-white/10 bg-gradient-to-b from-[#1a0507] to-[#0e1014] p-4">
              <div className="relative h-36 overflow-hidden rounded-2xl">
                <Thumb src={imgUrl(form.image)} alt="preview" className="h-full w-full" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                <div className="absolute bottom-0 p-3">
                  <h4 className="line-clamp-1 text-[13px] font-black leading-tight text-white">
                    {(lang === 'ru' ? form.title_ru || form.title_uz : form.title_uz || form.title_ru) || '—'}
                  </h4>
                  <p className="mt-0.5 line-clamp-1 text-[11px] text-white/80">
                    {lang === 'ru' ? form.description_ru || form.description_uz : form.description_uz || form.description_ru}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500">
                <span className="font-mono">{form.link || '—'}</span>
                <ChevronRight className="h-3.5 w-3.5" />
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