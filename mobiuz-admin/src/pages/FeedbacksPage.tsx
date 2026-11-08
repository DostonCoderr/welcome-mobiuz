import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Star, MessageSquare, CheckCheck, Check, Clock, Download, Copy, ThumbsUp, Mail, X,
} from 'lucide-react';
import { api } from '../api';
import PageHeader from '../components/PageHeader';
import {
  SearchBox, Segmented, Pagination, EmptyState, ErrorState, Avatar, StatPill,
  PageSkeleton, selectCls,
} from '../components/ui/Kit';
import SpotlightCard from '../components/SpotlightCard';
import AnimatedNumber from '../components/AnimatedNumber';
import { useToast } from '../components/Toast';
import { useT } from '../hooks/useT';
import { useHotkey } from '../hooks/useHotkey';
import { downloadCSV } from '../utils/format';
import { idOf, relTime, fmtDate, createdOf, copyText } from '../utils/text';

// ==================== TARJIMALAR ====================
const T = {
  uz: {
    eyebrow: 'Aloqa',
    searchPh: 'Izoh, passport yoki kategoriya…',
    stats: { total: 'Jami fikrlar', unread: "O'qilmagan", avg: "O'rtacha baho", positive: 'Ijobiy (4–5★)' },
    filters: { all: 'Hammasi', unread: "O'qilmagan", read: "O'qilgan" },
    sort: { newest: 'Eng yangilari', oldest: 'Eng eskilari', high: 'Baho ↓', low: 'Baho ↑' },
    allCategories: 'Barcha kategoriyalar',
    ratings: 'Baholar taqsimoti',
    ratingsHint: 'Bosib filtrlang',
    clearRating: 'Bahoni tozalash',
    unknown: "Noma'lum xodim",
    noComment: 'Izohsiz baho',
    markRead: "O'qilgan deb belgilash",
    read: "O'qilgan",
    markAll: "Hammasini o'qilgan qilish",
    markedAll: (n: number) => `${n} ta fikr o'qilgan deb belgilandi`,
    marked: "O'qilgan deb belgilandi",
    more: "Ko'proq",
    less: 'Kamroq',
    isNew: 'Yangi',
    empty: { title: "Hali fikr yo'q", text: "Xodimlar fikr bildirganda shu yerda ko'rinadi." },
    csv: { id: 'ID', rating: 'Baho', category: 'Kategoriya', comment: 'Izoh', read: "O'qilgan", employee: 'Xodim', date: 'Sana' },
  },
  ru: {
    eyebrow: 'Связь',
    searchPh: 'Комментарий, паспорт или категория…',
    stats: { total: 'Всего отзывов', unread: 'Непрочитанные', avg: 'Средняя оценка', positive: 'Положительные (4–5★)' },
    filters: { all: 'Все', unread: 'Непрочитанные', read: 'Прочитанные' },
    sort: { newest: 'Сначала новые', oldest: 'Сначала старые', high: 'Оценка ↓', low: 'Оценка ↑' },
    allCategories: 'Все категории',
    ratings: 'Распределение оценок',
    ratingsHint: 'Нажмите для фильтра',
    clearRating: 'Сбросить оценку',
    unknown: 'Неизвестный сотрудник',
    noComment: 'Оценка без комментария',
    markRead: 'Отметить прочитанным',
    read: 'Прочитано',
    markAll: 'Отметить все прочитанными',
    markedAll: (n: number) => `Отмечено прочитанными: ${n}`,
    marked: 'Отмечено прочитанным',
    more: 'Больше',
    less: 'Меньше',
    isNew: 'Новый',
    empty: { title: 'Отзывов пока нет', text: 'Когда сотрудники оставят отзыв, он появится здесь.' },
    csv: { id: 'ID', rating: 'Оценка', category: 'Категория', comment: 'Комментарий', read: 'Прочитано', employee: 'Сотрудник', date: 'Дата' },
  },
};

type Status = 'all' | 'unread' | 'read';
type SortKey = 'newest' | 'oldest' | 'high' | 'low';

const LONG = 160;
const time = (v?: string) => (v ? new Date(v).getTime() || 0 : 0);
const isRead = (f: any) => !!f.is_read;

function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${value}/5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          style={{ width: size, height: size }}
          className={n <= value ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'}
        />
      ))}
    </div>
  );
}

export default function FeedbacksPage() {
  const { t: g, lang } = useT();
  const t = T[lang];
  const toast = useToast();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState(false);

  const [q, setQ] = useState('');
  const [status, setStatus] = useState<Status>('all');
  const [category, setCategory] = useState('');
  const [star, setStar] = useState<number | null>(null);
  const [sort, setSort] = useState<SortKey>('newest');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [markingAll, setMarkingAll] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadErr(false);
    try {
      const { data } = await api.get('/feedbacks');
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

  useHotkey('/', () => searchRef.current?.focus());

  // ---------- Hisob-kitoblar ----------
  const unread = useMemo(() => items.filter((f) => !isRead(f)).length, [items]);

  const avg = useMemo(() => {
    const rated = items.filter((f) => typeof f.rating === 'number');
    return rated.length ? rated.reduce((s, f) => s + f.rating, 0) / rated.length : 0;
  }, [items]);

  const dist = useMemo(() => {
    const c = [0, 0, 0, 0, 0];
    items.forEach((f) => {
      const r = Math.round(Number(f.rating));
      if (r >= 1 && r <= 5) c[r - 1]++;
    });
    return c;
  }, [items]);

  const positive = dist[3] + dist[4];

  const categories = useMemo(
    () => [...new Set(items.map((f) => f.category).filter(Boolean))] as string[],
    [items]
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = items.filter((f) => {
      if (status === 'unread' && isRead(f)) return false;
      if (status === 'read' && !isRead(f)) return false;
      if (category && f.category !== category) return false;
      if (star !== null && Math.round(Number(f.rating)) !== star) return false;
      if (!s) return true;
      return [f.comment, f.category, f.employee?.passport, f.employee?.full_name]
        .filter(Boolean).join(' ').toLowerCase().includes(s);
    });

    const cmp: Record<SortKey, (a: any, b: any) => number> = {
      newest: (a, b) => time(createdOf(b)) - time(createdOf(a)),
      oldest: (a, b) => time(createdOf(a)) - time(createdOf(b)),
      high: (a, b) => (b.rating || 0) - (a.rating || 0),
      low: (a, b) => (a.rating || 0) - (b.rating || 0),
    };
    return [...list].sort(cmp[sort]);
  }, [items, q, status, category, star, sort]);

  const pageRows = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize]
  );

  useEffect(() => {
    setPage(1);
  }, [q, status, category, star, sort, pageSize]);

  const hasFilters = !!(q || status !== 'all' || category || star !== null);

  // ---------- Amallar ----------
  const markRead = async (fb: any) => {
    const id = idOf(fb);
    setItems((list) => list.map((x) => (idOf(x) === id ? { ...x, is_read: true } : x)));
    try {
      await api.patch(`/feedbacks/${id}/read`);
      toast.success(t.marked);
    } catch {
      toast.error(g.common.saveError);
      load();
    }
  };

  const markAll = async () => {
    const targets = items.filter((f) => !isRead(f));
    if (!targets.length) return;
    setMarkingAll(true);
    const ids = new Set(targets.map(idOf));
    setItems((list) => list.map((x) => (ids.has(idOf(x)) ? { ...x, is_read: true } : x)));

    const res = await Promise.allSettled(targets.map((f) => api.patch(`/feedbacks/${idOf(f)}/read`)));
    const ok = res.filter((r) => r.status === 'fulfilled').length;
    setMarkingAll(false);
    if (ok > 0) toast.success(t.markedAll(ok));
    if (ok < targets.length) {
      toast.error(g.common.saveError);
      load();
    }
  };

  const toggleExpand = (id: string) =>
    setExpanded((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const copy = async (text: string) => {
    (await copyText(text)) ? toast.success(g.common.copied) : toast.error(g.common.error);
  };

  const doExport = () => {
    const ok = downloadCSV(
      `feedbacks-${new Date().toISOString().slice(0, 10)}.csv`,
      filtered.map((f) => ({
        [t.csv.id]: idOf(f),
        [t.csv.rating]: f.rating ?? '',
        [t.csv.category]: f.category ?? '',
        [t.csv.comment]: f.comment ?? '',
        [t.csv.read]: isRead(f) ? 'TRUE' : 'FALSE',
        [t.csv.employee]: f.employee?.passport || '',
        [t.csv.date]: createdOf(f) || '',
      }))
    );
    ok ? toast.success(g.common.exported) : toast.info(g.common.nothingToExport);
  };

  const maxDist = Math.max(1, ...dist);

  // ==================== RENDER ====================
  return (
    <div>
      <PageHeader
        eyebrow={t.eyebrow}
        title={g.nav.items.feedbacks.label}
        subtitle={g.common.total(items.length)}
        icon={MessageSquare}
        actions={
          <>
            <button onClick={doExport} className="btn btn-ghost">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">{g.common.export}</span>
            </button>
            <button onClick={markAll} disabled={unread === 0 || markingAll} className="btn btn-primary">
              <CheckCheck className="h-4 w-4" />
              <span className="hidden sm:inline">{t.markAll}</span>
              {unread > 0 && (
                <span className="rounded-md bg-black/25 px-1.5 text-[11px] font-black">{unread}</span>
              )}
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
            <StatPill icon={MessageSquare} tone="blue" label={t.stats.total} value={items.length} />
            <StatPill icon={Mail} tone="red" label={t.stats.unread} value={unread} />
            <StatPill icon={Star} tone="amber" label={t.stats.avg} value={avg} decimals={1} />
            <StatPill icon={ThumbsUp} tone="green" label={t.stats.positive} value={positive} />
          </div>

          <div className="grid gap-5 lg:grid-cols-12">
            {/* Baholar taqsimoti */}
            <SpotlightCard className="p-6 lg:col-span-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-white">{t.ratings}</h3>
                  <p className="mt-0.5 text-xs text-zinc-500">{t.ratingsHint}</p>
                </div>
                <div className="text-right">
                  <p className="flex items-center justify-end gap-1.5 text-3xl font-black text-white">
                    <AnimatedNumber value={avg} decimals={1} />
                    <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((n, idx) => {
                  const count = dist[n - 1];
                  const active = star === n;
                  return (
                    <button
                      key={n}
                      onClick={() => setStar(active ? null : n)}
                      aria-pressed={active}
                      className={`flex w-full items-center gap-3 rounded-xl px-2 py-1.5 transition ${
                        active ? 'bg-amber-400/10 ring-1 ring-amber-400/40' : 'hover:bg-white/[0.05]'
                      }`}
                    >
                      <span className="flex w-8 items-center gap-1 text-sm font-bold text-zinc-300">
                        {n}
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      </span>
                      <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(count / maxDist) * 100}%` }}
                          transition={{ delay: 0.15 + idx * 0.07, duration: 0.8, ease: 'easeOut' }}
                          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300"
                        />
                      </div>
                      <span className="w-8 text-right text-sm font-black tabular-nums text-white">{count}</span>
                    </button>
                  );
                })}
              </div>
            </SpotlightCard>

            {/* Asboblar paneli */}
            <div className="card space-y-3 p-4 lg:col-span-7">
              <SearchBox ref={searchRef} value={q} onChange={setQ} placeholder={t.searchPh} />
              <Segmented
                value={status}
                onChange={setStatus}
                options={[
                  { id: 'all', label: t.filters.all, count: items.length },
                  { id: 'unread', label: t.filters.unread, count: unread },
                  { id: 'read', label: t.filters.read, count: items.length - unread },
                ]}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectCls}>
                  <option value="">{t.allCategories}</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={selectCls}>
                  {(Object.keys(t.sort) as SortKey[]).map((k) => (
                    <option key={k} value={k}>{t.sort[k]}</option>
                  ))}
                </select>
              </div>

              {hasFilters && (
                <div className="flex flex-wrap items-center gap-2">
                  {star !== null && (
                    <button onClick={() => setStar(null)} className="badge bg-amber-400/15 text-amber-300">
                      {star}★ <X className="h-3 w-3" />
                      <span className="sr-only">{t.clearRating}</span>
                    </button>
                  )}
                  <button
                    onClick={() => { setQ(''); setStatus('all'); setCategory(''); setStar(null); }}
                    className="ml-auto text-xs font-bold text-rose-400 hover:text-rose-300"
                  >
                    {g.common.clear}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Fikrlar ro'yxati */}
          {filtered.length === 0 ? (
            <div className="card">
              {hasFilters ? (
                <EmptyState icon={MessageSquare} title={g.common.noResults} text={g.common.noResultsText} />
              ) : (
                <EmptyState icon={MessageSquare} title={t.empty.title} text={t.empty.text} />
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {pageRows.map((fb, i) => {
                const id = idOf(fb);
                const read = isRead(fb);
                const comment: string = fb.comment || '';
                const isLong = comment.length > LONG;
                const open = expanded.has(id);
                const who = fb.employee?.full_name || fb.employee?.passport || t.unknown;
                const created = createdOf(fb);

                return (
                  <motion.div
                    key={id}
                    layout
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i, 8) * 0.04 }}
                  >
                    <SpotlightCard className="p-5">
                      {!read && (
                        <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#ff2b3a] to-[#b00410]" />
                      )}
                      <div className="relative z-10">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <Avatar text={who} size={44} />
                            <div>
                              <p className="flex items-center gap-2 font-extrabold text-white">
                                {who}
                                {!read && <span className="badge bg-[#ff2b3a]/20 text-[#ff6b75]">{t.isNew}</span>}
                              </p>
                              <p className="flex items-center gap-1.5 text-xs text-zinc-500" title={fmtDate(created, lang)}>
                                <Clock className="h-3 w-3" />
                                {relTime(created, lang) || fmtDate(created, lang)}
                                {fb.employee?.full_name && fb.employee?.passport && (
                                  <span className="font-mono text-zinc-600">· {fb.employee.passport}</span>
                                )}
                              </p>
                            </div>
                          </div>
                          <Stars value={Math.round(Number(fb.rating) || 0)} />
                        </div>

                        <p className={`mt-4 text-sm leading-relaxed ${comment ? 'text-zinc-300' : 'italic text-zinc-600'}`}>
                          {comment
                            ? isLong && !open
                              ? `${comment.slice(0, LONG)}…`
                              : comment
                            : t.noComment}
                        </p>
                        {isLong && (
                          <button onClick={() => toggleExpand(id)} className="mt-1 text-xs font-bold text-[#ff6b75] hover:underline">
                            {open ? t.less : t.more}
                          </button>
                        )}

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
                          {fb.category ? (
                            <button
                              onClick={() => setCategory(category === fb.category ? '' : fb.category)}
                              className="rounded-full bg-white/[0.06] px-3 py-1 text-xs font-bold text-zinc-300 transition hover:bg-white/10"
                            >
                              {fb.category}
                            </button>
                          ) : (
                            <span />
                          )}

                          <div className="flex items-center gap-2">
                            {comment && (
                              <button
                                onClick={() => copy(comment)}
                                title={g.common.copy}
                                className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/10 hover:text-white"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                            )}
                            {read ? (
                              <span className="flex items-center gap-1.5 text-xs font-bold text-zinc-500">
                                <Check className="h-3.5 w-3.5" strokeWidth={3} /> {t.read}
                              </span>
                            ) : (
                              <button onClick={() => markRead(fb)} className="btn btn-ghost !py-2 !text-xs !text-emerald-400">
                                <Check className="h-3.5 w-3.5" strokeWidth={3} /> {t.markRead}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </SpotlightCard>
                  </motion.div>
                );
              })}
            </div>
          )}

          <Pagination
            page={page}
            pageSize={pageSize}
            total={filtered.length}
            onPage={setPage}
            onPageSize={setPageSize}
          />
        </div>
      )}
    </div>
  );
}