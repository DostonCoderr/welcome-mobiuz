import {
  createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type Kind = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  kind: Kind;
  text: string;
}

interface Ctx {
  push: (kind: Kind, text: string) => void;
}

const ToastContext = createContext<Ctx | null>(null);

const STYLES: Record<Kind, { icon: typeof Info; color: string; ring: string }> = {
  success: { icon: CheckCircle2, color: 'text-emerald-400', ring: 'border-emerald-500/30' },
  error: { icon: AlertCircle, color: 'text-rose-400', ring: 'border-rose-500/30' },
  info: { icon: Info, color: 'text-sky-400', ring: 'border-sky-500/30' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const remove = useCallback((id: number) => {
    setItems((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (kind: Kind, text: string) => {
      const id = ++counter.current;
      setItems((list) => [...list.slice(-3), { id, kind, text }]);
      setTimeout(() => remove(id), 3800);
    },
    [remove]
  );

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[200] flex w-[calc(100%-2.5rem)] max-w-sm flex-col gap-2.5">
        <AnimatePresence initial={false}>
          {items.map((t) => {
            const s = STYLES[t.kind];
            const Icon = s.icon;
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 24, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className={`glass pointer-events-auto flex items-center gap-3 rounded-2xl border p-3.5 ${s.ring}`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${s.color}`} />
                <p className="flex-1 text-sm font-semibold text-white">{t.text}</p>
                <button
                  onClick={() => remove(t.id)}
                  className="rounded-lg p-1 text-zinc-500 hover:bg-white/10 hover:text-white"
                  aria-label="Yopish"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast ToastProvider ichida ishlatilishi kerak');

  return useMemo(
    () => ({
      success: (text: string) => ctx.push('success', text),
      error: (text: string) => ctx.push('error', text),
      info: (text: string) => ctx.push('info', text),
    }),
    [ctx]
  );
}