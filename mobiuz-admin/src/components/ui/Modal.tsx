import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, type LucideIcon } from 'lucide-react';

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
};

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children: ReactNode;
  footer?: ReactNode;
  size?: keyof typeof SIZES;
}

/**
 * Portal orqali <body> ga chiziladi — Layout'dagi transform/filter
 * "fixed" joylashuvni buzmasligi uchun.
 */
export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  icon: Icon,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onMouseDown={onClose}
          className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:items-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={`glass relative my-6 w-full ${SIZES[size]} rounded-[28px]`}
          >
            <div className="flex items-start gap-4 border-b border-white/[0.07] px-6 py-5">
              {Icon && (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff2b3a] to-[#9d0410] shadow-[0_10px_30px_-8px_rgba(255,43,58,0.7)]">
                  <Icon className="h-5 w-5 text-white" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-black tracking-tight text-white">{title}</h2>
                {subtitle && <p className="mt-0.5 text-sm text-zinc-400">{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="rounded-xl p-2 text-zinc-500 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-6">{children}</div>

            {footer && (
              <div className="flex flex-col-reverse gap-3 border-t border-white/[0.07] px-6 py-4 sm:flex-row sm:justify-end">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}