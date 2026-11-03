import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';

interface SectionContentProps {
  html: string;
  isUz: boolean;
}

export default function SectionContent({ html, isUz }: SectionContentProps) {
  return (
    <motion.article
      initial={{ y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="card p-4 sm:p-5 overflow-hidden"
    >
      {/* Sarlavha */}
      <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--red-soft)' }}
        >
          <FileText className="w-3.5 h-3.5 text-mobiuz-600" />
        </div>
        <h2 className="text-[13px] font-extrabold" style={{ color: 'var(--text-primary)' }}>
          {isUz ? 'Batafsil ma\'lumot' : 'Подробная информация'}
        </h2>
      </div>

      {/* Matn */}
      <div
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </motion.article>
  );
}