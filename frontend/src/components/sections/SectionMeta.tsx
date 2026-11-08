import { motion } from 'framer-motion';
import { Calendar, Bookmark } from 'lucide-react';
import { useState } from 'react';

interface SectionMetaProps {
  publishedAt?: string;
  views?: number;
  isUz: boolean;
  onShare?: () => void;
}

export default function SectionMeta({
  publishedAt,
  views = 0,
  isUz,
  onShare,
}: SectionMetaProps) {
  const [saved, setSaved] = useState(false);

  const formatDate = (date?: string) => {
    if (!date) return '';
    try {
      return new Date(date).toLocaleDateString(isUz ? 'uz-UZ' : 'ru-RU', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <motion.div
      initial={{ y: 8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.15 }}
      className="card p-3 flex items-center justify-between gap-2"
    >
      {publishedAt && (
        <div className="flex items-center gap-1.5 min-w-0">
          <Calendar className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
          <span className="text-[11px] font-medium truncate" style={{ color: 'var(--text-secondary)' }}>
            {formatDate(publishedAt)}
          </span>
        </div>
      )}

      <div className="flex items-center gap-1">
        <button
          onClick={() => setSaved(!saved)}
          className="w-8 h-8 rounded-lg flex items-center justify-center active:bg-gray-100 dark:active:bg-gray-800 transition-colors"
          aria-label="Save"
        >
          <Bookmark
            className="w-4 h-4"
            fill={saved ? '#e30613' : 'transparent'}
            style={{ color: saved ? '#e30613' : 'var(--text-muted)' }}
          />
        </button>
      </div>
    </motion.div>
  );
}