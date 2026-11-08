import { useId } from 'react';
import { motion } from 'framer-motion';
import type { Lang } from '../../hooks/useLang';

interface LangTabsProps {
  value: Lang;
  onChange: (l: Lang) => void;
  /** Har bir til uchun maydonlar to'ldirilganmi (yashil / sariq nuqta) */
  filled: Record<Lang, boolean>;
  labels: Record<Lang, string>;
}

/** Ikki tilli forma uchun UZ | RU tablari */
export default function LangTabs({ value, onChange, filled, labels }: LangTabsProps) {
  const gid = useId();
  const langs: Lang[] = ['uz', 'ru'];

  return (
    <div className="inline-flex gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1">
      {langs.map((l) => {
        const active = value === l;
        return (
          <button
            key={l}
            type="button"
            onClick={() => onChange(l)}
            aria-pressed={active}
            className={`relative flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-extrabold transition-colors ${
              active ? 'text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {active && (
              <motion.span
                layoutId={`langtab-${gid}`}
                transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#ff2b3a] to-[#b00410] shadow-[0_8px_24px_-8px_rgba(255,43,58,0.8)]"
              />
            )}
            <span className="relative z-10">{labels[l]}</span>
            <span
              className={`relative z-10 h-2 w-2 rounded-full ${filled[l] ? 'bg-emerald-400' : 'bg-amber-400'}`}
            />
          </button>
        );
      })}
    </div>
  );
}