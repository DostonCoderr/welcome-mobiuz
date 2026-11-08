import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** O'ng tomondan chiqadigan panel (batafsil ma'lumot uchun) */
export default function Drawer({ open, onClose, title, children, footer }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="drawer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={onClose}
          className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-[2px]"
        >
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-label={title}
            className="glass absolute inset-y-0 right-0 flex w-full max-w-md flex-col rounded-l-[28px]"
          >
            <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-5">
              <h2 className="text-lg font-black tracking-tight text-white">{title}</h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className="rounded-xl p-2 text-zinc-500 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
            {footer && <div className="flex gap-3 border-t border-white/[0.07] px-6 py-4">{footer}</div>}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}