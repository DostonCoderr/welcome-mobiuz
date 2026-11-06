import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, type LucideIcon } from 'lucide-react';
import SpotlightCard from './SpotlightCard';
import AnimatedNumber from './AnimatedNumber';

export type Accent = 'blue' | 'green' | 'purple' | 'red' | 'orange' | 'pink';

// Tailwind dinamik class'larni tanimaydi, shuning uchun to'liq yozilgan
const ACCENTS: Record<Accent, { text: string; soft: string; bar: string }> = {
  blue: { text: 'text-sky-400', soft: 'bg-sky-500/10', bar: 'bg-sky-400' },
  green: { text: 'text-emerald-400', soft: 'bg-emerald-500/10', bar: 'bg-emerald-400' },
  purple: { text: 'text-violet-400', soft: 'bg-violet-500/10', bar: 'bg-violet-400' },
  red: { text: 'text-rose-400', soft: 'bg-rose-500/10', bar: 'bg-rose-400' },
  orange: { text: 'text-amber-400', soft: 'bg-amber-500/10', bar: 'bg-amber-400' },
  pink: { text: 'text-fuchsia-400', soft: 'bg-fuchsia-500/10', bar: 'bg-fuchsia-400' },
};

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  accent?: Accent;
  /** Eng kattasiga nisbatan ulush (0..100), pastdagi chiziq uchun */
  share?: number;
  /** Bosilganda o'tadigan sahifa */
  to?: string;
}

export default function StatCard({
  icon: Icon,
  label,
  value,
  accent = 'blue',
  share = 0,
  to,
}: StatCardProps) {
  const navigate = useNavigate();
  const a = ACCENTS[accent];

  return (
    <SpotlightCard
      tilt
      data-reveal
      onClick={to ? () => navigate(to) : undefined}
      className="group p-4 md:p-5"
    >
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-2xl ${a.soft} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}
          >
            <Icon className={`h-5 w-5 ${a.text}`} />
          </div>
          {to && (
            <ArrowUpRight className="h-4 w-4 text-zinc-600 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
          )}
        </div>

        <p className="mt-5 text-[34px] font-black leading-none tracking-tight text-white tabular-nums">
          <AnimatedNumber value={value} />
        </p>
        <p className="mt-2 text-[13px] font-semibold text-zinc-400">{label}</p>

        <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(share, value > 0 ? 6 : 0)}%` }}
            transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
            className={`h-full rounded-full ${a.bar}`}
          />
        </div>
      </div>
    </SpotlightCard>
  );
}