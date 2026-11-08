import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Star, Check } from 'lucide-react';
import { getFeedbacks, markFeedbackRead } from '../api'; // markFeedbackRead ni import qilamiz
import { useT } from '../hooks/useT';

/** O'qilmagan fikrlar uchun qo'ng'iroqcha */
export default function NotificationBell() {
  const { t } = useT();
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

  // ⚡ Bitta fikrni o'qilgan qilish
  const handleMarkRead = async (id: string, e: React.MouseEvent) => {
    e.preventDefault(); // Link ochilishini to'xtatamiz
    e.stopPropagation();
    
    try {
      await markFeedbackRead(id);
      // Ro'yxatdan olib tashlaymiz
      setItems((prev) => prev.filter((item) => item._id !== id && item.id !== id));
      window.dispatchEvent(new Event('app:refresh')); // Boshqa joylarni ham yangilash
    } catch (error) {
      console.error("O'qilgan qilishda xato:", error);
    }
  };

  return (
    <div ref={wrapRef} className="relative z-[100]">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/10 hover:text-white"
        aria-label={t.bell.aria}
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
            className="glass absolute right-0 z-[999] mt-3 w-80 origin-top-right overflow-hidden rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
              <p className="text-sm font-extrabold text-white">{t.bell.title}</p>
              <span className="badge bg-[#ff2b3a]/15 text-[#ff6b75]">{items.length}</span>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {items.length === 0 ? (
                <p className="py-8 text-center text-sm text-zinc-500">{t.bell.empty}</p>
              ) : (
                items.slice(0, 6).map((f, i) => (
                  <div
                    key={f._id ?? f.id ?? i}
                    className="group flex items-start justify-between gap-2 rounded-xl p-3 transition hover:bg-white/5"
                  >
                    <Link
                      to="/feedbacks"
                      onClick={() => setOpen(false)}
                      className="flex-1 min-w-0"
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
                        {f.comment || t.bell.noComment}
                      </p>
                    </Link>
                    
                    {/* ⚡ O'qilgan qilish tugmasi */}
                    <button
                      onClick={(e) => handleMarkRead(f._id || f.id, e)}
                      title="O'qilgan deb belgilash"
                      className="shrink-0 rounded-lg p-1.5 text-zinc-500 hover:bg-green-500/20 hover:text-green-400 mt-1"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <Link
              to="/feedbacks"
              onClick={() => setOpen(false)}
              className="block border-t border-white/[0.07] py-3 text-center text-xs font-bold text-[#ff6b75] hover:bg-white/5"
            >
              {t.bell.viewAll}
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}