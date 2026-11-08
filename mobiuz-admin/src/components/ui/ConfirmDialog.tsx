import type { ReactNode } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import Modal from './Modal';
import { useT } from '../../hooks/useT';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: ReactNode;
  warning?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  warning,
  loading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useT();

  return (
    <Modal
      open={open}
      onClose={loading ? () => undefined : onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="btn btn-ghost"
          >
            {t.common.cancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="btn bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow-[0_12px_30px_-10px_rgba(244,63,94,0.7)]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t.common.deleting}
              </>
            ) : (
              t.common.delete
            )}
          </button>
        </>
      }
    >
      <div className="flex gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10">
          <AlertTriangle className="h-6 w-6 text-rose-400" />
        </div>
        <div className="space-y-2 text-sm">
          <p className="text-zinc-300">{message}</p>
          {warning && (
            <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 font-semibold text-amber-300">
              {warning}
            </p>
          )}
          <p className="text-xs text-zinc-500">{t.common.irreversible}</p>
        </div>
      </div>
    </Modal>
  );
}