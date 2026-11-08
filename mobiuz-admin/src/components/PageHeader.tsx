import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, type LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  icon?: LucideIcon;
  eyebrow?: string;
  actions?: ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  showBack,
  icon: Icon,
  eyebrow,
  actions,
}: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="mb-7 flex flex-col gap-4 md:mb-9 sm:flex-row sm:items-end sm:justify-between"
    >
      <div className="flex min-w-0 items-center gap-4">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
            aria-label="Orqaga"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}

        {Icon && (
          <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff2b3a] to-[#9d0410] shadow-[0_14px_40px_-10px_rgba(255,43,58,0.7)] sm:flex">
            <Icon className="h-7 w-7 text-white" />
          </div>
        )}

        <div className="min-w-0">
          {eyebrow && (
            <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#ff6b75]">
              {eyebrow}
            </p>
          )}
          <h1 className="truncate text-3xl font-black tracking-tight text-white md:text-4xl">{title}</h1>
          {subtitle && <p className="mt-1.5 truncate text-sm text-zinc-400">{subtitle}</p>}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 56 }}
            transition={{ delay: 0.25, duration: 0.6, ease: 'easeOut' }}
            className="mt-3 h-1 rounded-full bg-gradient-to-r from-[#ff2b3a] to-transparent"
          />
        </div>
      </div>

      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </motion.div>
  );
}