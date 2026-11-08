import { useId, type ReactNode } from 'react';
import { motion } from 'framer-motion';

export interface Segment {
  label: string;
  value: number;
  color: string;
}

interface DonutProps {
  segments: Segment[];
  size?: number;
  thickness?: number;
  children?: ReactNode;
}

/** Animatsiyali donut diagramma (markazga children qo'yiladi) */
export function Donut({ segments, size = 190, thickness = 22, children }: DonutProps) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const visible = segments.filter((s) => s.value > 0);
  const total = visible.reduce((sum, s) => sum + s.value, 0);
  const gap = visible.length > 1 ? 5 : 0;
  let acc = 0;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={thickness}
        />
        {total > 0 &&
          visible.map((s, i) => {
            const len = (s.value / total) * c;
            const dash = Math.max(len - gap, 0);
            const offset = -acc;
            acc += len;
            return (
              <motion.circle
                key={`${s.label}-${i}`}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={thickness}
                strokeDashoffset={offset}
                initial={{ strokeDasharray: `0 ${c}` }}
                animate={{ strokeDasharray: `${dash} ${c - dash}` }}
                transition={{ duration: 1, delay: 0.2 + i * 0.12, ease: 'easeOut' }}
              />
            );
          })}
      </svg>
      {children && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {children}
        </div>
      )}
    </div>
  );
}

interface RingProps {
  value: number; // 0..100
  size?: number;
  thickness?: number;
  from?: string;
  to?: string;
  children?: ReactNode;
}

/** Foizli progress halqa */
export function Ring({
  value,
  size = 160,
  thickness = 14,
  from = '#ff2b3a',
  to = '#ff9a5c',
  children,
}: RingProps) {
  const gid = useId().replace(/:/g, '');
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={thickness}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct / 100) }}
          transition={{ duration: 1.3, delay: 0.3, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 8px ${from}88)` }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {children}
        </div>
      )}
    </div>
  );
}