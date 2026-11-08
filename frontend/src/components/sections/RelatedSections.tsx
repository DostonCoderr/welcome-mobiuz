import { motion } from 'framer-motion';
import { ChevronRight, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Section } from '../../services/api';
import { blocksToText } from '../../utils/blocks';

interface RelatedSectionsProps {
  sections: Section[];
  isUz: boolean;
  onNavigate?: (documentId: string) => void;
}

export default function RelatedSections({
  sections,
  isUz,
  onNavigate,
}: RelatedSectionsProps) {
  const navigate = useNavigate();

  if (sections.length === 0) return null;

  return (
    <motion.section
      initial={{ y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <div className="flex items-center gap-2 mb-3 px-1">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--red-soft)' }}
        >
          <FileText className="w-3.5 h-3.5 text-mobiuz-600" />
        </div>
        <h3 className="text-[14px] font-extrabold" style={{ color: 'var(--text-primary)' }}>
          {isUz ? "O'xshash bo'limlar" : 'Похожие разделы'}
        </h3>
      </div>

      <div className="space-y-2">
        {sections.slice(0, 3).map((section, i) => {
          const title = isUz ? section.title_uz : section.title_ru;
          const text = blocksToText(isUz ? section.content_uz : section.content_ru);
          const preview =
            text.length > 70 ? text.substring(0, 70) + '...' : text;

          return (
            <motion.button
              key={section._id} // <-- MongoDB _id
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35 + i * 0.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (onNavigate) onNavigate(section._id); // <-- _id
                else navigate(`/section/${section._id}`); // <-- _id
              }}
              className="card press w-full flex items-center gap-3 p-3 text-left"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background:
                    'linear-gradient(160deg, #f5222f 0%, #e30613 55%, #b00410 100%)',
                }}
              >
                <FileText className="w-[18px] h-[18px] text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h4
                  className="font-bold text-[13px] leading-tight truncate mb-0.5"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {title}
                </h4>
                <p
                  className="text-[11px] line-clamp-1 leading-snug"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {preview || (isUz ? 'Batafsil...' : 'Подробнее...')}
                </p>
              </div>
              <ChevronRight
                className="w-4 h-4 flex-shrink-0"
                style={{ color: 'var(--text-muted)' }}
              />
            </motion.button>
          );
        })}
      </div>
    </motion.section>
  );
}