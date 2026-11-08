import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { getMediaUrl } from '../../utils/media';
import type { Banner } from '../../services/api';

interface Props {
  item: Banner;
  isUz: boolean;
  index: number;
  onClick: () => void;
}

export default function NewsCard({ item, isUz, index, onClick }: Props) {
  const img = item.image?.url ? getMediaUrl(item.image.url) : '';
  const title = isUz ? item.title_uz : item.title_ru;
  const desc = isUz ? item.description_uz : item.description_ru;

  return (
    <motion.button
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: Math.min(index, 8) * 0.04 }}
      onClick={onClick}
      className="press relative w-full aspect-square overflow-hidden text-left text-white hero-gradient"
      style={{ borderRadius: 16, boxShadow: '0 10px 24px -14px var(--shadow-color)' }}
    >
      {img && (
        <img
          src={img}
          alt={title}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      <div className="absolute bottom-0 inset-x-0 p-2.5">
        {item.publishedAt && (
          <div className="flex items-center gap-1 text-[10px] text-white/75 mb-1">
            <Calendar className="w-3 h-3" />
            {new Date(item.publishedAt).toLocaleDateString(isUz ? 'uz-UZ' : 'ru-RU', {
              day: '2-digit', month: 'short',
            })}
          </div>
        )}
        <h4 className="text-[13px] font-extrabold leading-tight line-clamp-2">{title}</h4>
        {desc && (
          <p className="text-[10px] text-white/80 mt-0.5 line-clamp-1">{desc}</p>
        )}
      </div>
    </motion.button>
  );
}