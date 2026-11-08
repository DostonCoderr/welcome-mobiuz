import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, CornerDownLeft, type LucideIcon } from 'lucide-react';

export interface Command {
  id: string;
  label: string;
  group: string;
  icon: LucideIcon;
  keywords?: string;
  run: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  commands: Command[];
}

export default function CommandPalette({ open, onClose, commands }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) =>
      `${c.label} ${c.keywords ?? ''} ${c.group}`.toLowerCase().includes(q)
    );
  }, [query, commands]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      const t = setTimeout(() => inputRef.current?.focus(), 40);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-idx="${active}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const run = (c: Command) => {
    onClose();
    c.run();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const c = filtered[active];
      if (c) run(c);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[150] flex items-start justify-center bg-black/70 px-4 pt-[14vh] backdrop-blur-sm"
          onMouseDown={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 460, damping: 34 }}
            onMouseDown={(e) => e.stopPropagation()}
            className="glass w-full max-w-xl overflow-hidden rounded-3xl"
          >
            <div className="flex items-center gap-3 border-b border-white/[0.07] px-5 py-4">
              <Search className="h-5 w-5 text-zinc-500" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Sahifa yoki amalni qidiring…"
                className="flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-zinc-600"
              />
              <span className="kbd">Esc</span>
            </div>

            <div ref={listRef} className="max-h-[48vh] overflow-y-auto p-2">
              {filtered.length === 0 && (
                <p className="py-10 text-center text-sm text-zinc-500">Hech narsa topilmadi</p>
              )}

              {filtered.map((c, i) => {
                const Icon = c.icon;
                const showGroup = i === 0 || filtered[i - 1].group !== c.group;
                return (
                  <div key={c.id}>
                    {showGroup && (
                      <p className="px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600">
                        {c.group}
                      </p>
                    )}
                    <button
                      data-idx={i}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => run(c)}
                      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                        i === active ? 'bg-white/10 text-white' : 'text-zinc-400'
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                          i === active ? 'bg-[#ff2b3a]/20 text-[#ff6b75]' : 'bg-white/5'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="flex-1">{c.label}</span>
                      {i === active && <CornerDownLeft className="h-4 w-4 text-zinc-500" />}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-4 border-t border-white/[0.07] px-5 py-3 text-[11px] text-zinc-500">
              <span className="flex items-center gap-1.5"><span className="kbd">↑</span><span className="kbd">↓</span> tanlash</span>
              <span className="flex items-center gap-1.5"><span className="kbd">Enter</span> ochish</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}