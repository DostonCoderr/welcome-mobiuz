import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Star } from 'lucide-react';
import { getFeedbacks } from '../api';

/** O'qilmagan fikrlar uchun qo'ng'iroqcha */
export default function NotificationBell() {
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const list = await getFeedbacks();
      setItems(Array.isArray(list) ? list.filter((f: any) => f.is_read === false || f.is_read === null) : []);
    } catch {
      /* jim */
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 60000);
    window.addEventListener('app:refresh', load);
    return () => {
      clearInterval(id);
      window.removeEventListener('app:refresh', load);
    };
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/10 hover:text-white"
        aria-label="Bildirishnomalar"
      >
        <Bell className="h-[18px] w-[18px]" />
        {items.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#ff2b3a] px-1 text-[10px] font-extrabold text-white shadow-[0_0_12px_rgba(255,43,58,0.8)]">
            {items.length > 9 ? '9+' : items.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            className="glass absolute right-0 z-50 mt-3 w-80 origin-top-right overflow-hidden rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
              <p className="text-sm font-extrabold text-white">Yangi fikrlar</p>
              <span className="badge bg-[#ff2b3a]/15 text-[#ff6b75]">{items.length}</span>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {items.length === 0 ? (
                <p className="py-8 text-center text-sm text-zinc-500">Hammasi o'qilgan 🎉</p>
              ) : (
                items.slice(0, 6).map((f, i) => (
                  <Link
                    key={f.id ?? i}
                    to="/feedbacks"
                    onClick={() => setOpen(false)}
                    className="block rounded-xl p-3 transition hover:bg-white/5"
                  >
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={`h-3 w-3 ${n <= (f.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'}`}
                        />
                      ))}
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-[13px] text-zinc-300">
                      {f.comment || 'Izohsiz baho'}
                    </p>
                  </Link>
                ))
              )}
            </div>

            <Link
              to="/feedbacks"
              onClick={() => setOpen(false)}
              className="block border-t border-white/[0.07] py-3 text-center text-xs font-bold text-[#ff6b75] hover:bg-white/5"
            >
              Barchasini ko'rish
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}