import { forwardRef, useId, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  Search, X, ChevronLeft, ChevronRight, AlertTriangle, Inbox, type LucideIcon,
} from 'lucide-react';
import { useT } from '../../hooks/useT';
import AnimatedNumber from '../AnimatedNumber';
import SpotlightCard from '../SpotlightCard';

/** <select> uchun: qorong'i fon va oq matn */
export const selectCls = 'input py-3 [&>option]:bg-[#14161a] [&>option]:text-white';

// ==================== Qidiruv ====================
interface SearchBoxProps {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  className?: string;
}

export const SearchBox = forwardRef<HTMLInputElement, SearchBoxProps>(function SearchBox(
  { value, onChange, placeholder, className = '' },
  ref
) {
  const { t } = useT();
  return (
    <div className={`relative ${className}`}>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-zinc-500" />
      <input
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input py-3 pl-11 pr-12"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label={t.common.clear}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-zinc-500 hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      ) : (
        <span className="kbd absolute right-3 top-1/2 -translate-y-1/2">/</span>
      )}
    </div>
  );
});

// ==================== Segmented (filtr tugmalari) ====================
interface SegmentedProps<T extends string> {
  options: { id: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
}

export function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  const gid = useId();
  return (
    <div className="flex flex-wrap gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1">
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            aria-pressed={active}
            className={`relative rounded-xl px-3.5 py-2 text-xs font-extrabold transition-colors ${
              active ? 'text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {active && (
              <motion.span
                layoutId={`seg-${gid}`}
                transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#ff2b3a] to-[#b00410] shadow-[0_8px_24px_-8px_rgba(255,43,58,0.8)]"
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {o.label}
              {o.count !== undefined && (
                <span className={`rounded-md px-1.5 text-[10px] ${active ? 'bg-white/20' : 'bg-white/10'}`}>
                  {o.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ==================== Switch ====================
export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
        checked ? 'bg-[#ff2b3a]' : 'bg-zinc-700'
      }`}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
        style={{ left: checked ? 22 : 2 }}
      />
    </button>
  );
}

// ==================== Paginatsiya ====================
interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPage: (p: number) => void;
  onPageSize: (n: number) => void;
  sizes?: number[];
}

export function Pagination({
  page,
  pageSize,
  total,
  onPage,
  onPageSize,
  sizes = [10, 20, 50],
}: PaginationProps) {
  const { t } = useT();
  if (total === 0) return null;

  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  const nums: number[] = [];
  for (let i = start; i <= Math.min(pages, start + 4); i++) nums.push(i);

  const btn =
    'flex h-9 min-w-[36px] items-center justify-center rounded-xl px-2 text-xs font-extrabold transition disabled:opacity-40';

  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <div className="flex items-center gap-3 text-xs text-zinc-500">
        <span className="font-semibold text-zinc-400">{t.common.range(from, to, total)}</span>
        <label className="flex items-center gap-2">
          {t.common.rowsPerPage}
          <select
            value={pageSize}
            onChange={(e) => onPageSize(Number(e.target.value))}
            className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs font-bold text-white outline-none [&>option]:bg-[#14161a]"
          >
            {sizes.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          aria-label={t.common.prev}
          className={`${btn} border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10`}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {nums.map((n) => (
          <button
            key={n}
            onClick={() => onPage(n)}
            className={`${btn} ${
              n === page
                ? 'bg-gradient-to-br from-[#ff2b3a] to-[#b00410] text-white shadow-[0_8px_20px_-8px_rgba(255,43,58,0.8)]'
                : 'border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10'
            }`}
          >
            {n}
          </button>
        ))}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= pages}
          aria-label={t.common.next}
          className={`${btn} border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10`}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ==================== Bo'sh / xato holatlari ====================
export function EmptyState({
  icon: Icon = Inbox,
  title,
  text,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/[0.05]">
        <Icon className="h-8 w-8 text-zinc-600" />
      </div>
      <p className="text-lg font-extrabold text-white">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-zinc-500">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useT();
  return (
    <div className="card flex flex-col items-center px-6 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-500/10">
        <AlertTriangle className="h-8 w-8 text-rose-400" />
      </div>
      <p className="text-lg font-extrabold text-white">{t.common.loadError}</p>
      <p className="mt-1 text-sm text-zinc-500">{t.common.loadErrorText}</p>
      <button onClick={onRetry} className="btn btn-primary mt-5">{t.common.retry}</button>
    </div>
  );
}

// ==================== Avatar ====================
const GRADS = [
  'from-rose-500 to-red-700',
  'from-violet-500 to-indigo-700',
  'from-cyan-400 to-sky-600',
  'from-amber-400 to-orange-600',
  'from-emerald-400 to-teal-600',
  'from-fuchsia-500 to-pink-700',
];

export function Avatar({
  text,
  src,
  size = 40,
  className = '',
}: {
  text: string;
  src?: string;
  size?: number;
  className?: string;
}) {
  const idx = text.split('').reduce((s, c) => s + c.charCodeAt(0), 0) % GRADS.length;
  const label =
    text
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || '?';

  return src ? (
    <img
      src={src}
      alt={text}
      style={{ width: size, height: size }}
      className={`shrink-0 rounded-2xl object-cover ${className}`}
    />
  ) : (
    <div
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      className={`flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br font-black text-white ${GRADS[idx]} ${className}`}
    >
      {label}
    </div>
  );
}

// ==================== Statistika kartochkasi ====================
const TONES = {
  red: { soft: 'bg-rose-500/10', text: 'text-rose-400' },
  blue: { soft: 'bg-sky-500/10', text: 'text-sky-400' },
  green: { soft: 'bg-emerald-500/10', text: 'text-emerald-400' },
  purple: { soft: 'bg-violet-500/10', text: 'text-violet-400' },
  amber: { soft: 'bg-amber-500/10', text: 'text-amber-400' },
  pink: { soft: 'bg-fuchsia-500/10', text: 'text-fuchsia-400' },
};

export function StatPill({
  icon: Icon,
  label,
  value,
  tone = 'red',
  decimals = 0,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  tone?: keyof typeof TONES;
  decimals?: number;
}) {
  const c = TONES[tone];
  return (
    <SpotlightCard className="flex items-center gap-4 p-4">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${c.soft}`}>
        <Icon className={`h-6 w-6 ${c.text}`} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-black leading-none tracking-tight text-white tabular-nums">
          <AnimatedNumber value={value} decimals={decimals} />
        </p>
        <p className="mt-1.5 truncate text-xs font-semibold text-zinc-400">{label}</p>
      </div>
    </SpotlightCard>
  );
}

// ==================== Yuklanish skeleti ====================
export function PageSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-[84px]" />
        ))}
      </div>
      <div className="skeleton h-16" />
      <div className="skeleton h-[380px]" />
    </div>
  );
}

// ==================== Forma maydoni ====================
export function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="label">
        {label}
        {required && <span className="ml-1 text-[#ff6b75]">*</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs font-semibold text-rose-400">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-zinc-500">{hint}</p>
      ) : null}
    </div>
  );
}

// ==================== Ikonka tanlagich ====================
export function IconPicker({
  icons,
  value,
  onChange,
}: {
  icons: Record<string, LucideIcon>;
  value: string;
  onChange: (k: string) => void;
}) {
  return (
    <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
      {Object.entries(icons).map(([key, Icon]) => {
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            aria-pressed={active}
            title={key}
            className={`flex h-11 items-center justify-center rounded-xl border transition ${
              active
                ? 'border-[#ff2b3a] bg-[#ff2b3a]/15 text-[#ff6b75] shadow-[0_0_0_3px_rgba(255,43,58,0.15)]'
                : 'border-white/10 bg-white/[0.04] text-zinc-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Icon className="h-5 w-5" />
          </button>
        );
      })}
    </div>
  );
}