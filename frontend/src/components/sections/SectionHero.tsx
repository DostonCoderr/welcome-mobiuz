import { motion } from 'framer-motion';
import { ArrowLeft, Share2, Clock, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Snowfall from '../ui/Snowfall';
import SnowDrift from '../ui/SnowDrift';
import { getMediaUrl } from '../../utils/media';

interface SectionHeroProps {
  title: string;
  subtitle?: string;
  department?: string;
  readTime?: string;
  image?: string;
  onShare?: () => void;
}

export default function SectionHero({
  title,
  subtitle,
  department,
  readTime,
  image,
  onShare,
}: SectionHeroProps) {
  const navigate = useNavigate();

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  const bgImage = image ? getMediaUrl(image) : '';

  return (
    <header className="hero-gradient relative overflow-hidden safe-top text-white pb-12">
      {/* Fon rasmi */}
      {bgImage && (
        <>
          <img
            src={bgImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </>
      )}

      <Snowfall count={25} />

      {/* Dekorativ doiralar */}
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }}
      />

      {/* Content */}
      <div className="relative z-10 px-4 pt-3.5">
        {/* Tugmalar */}
        <div className="flex items-center justify-between gap-2 mb-6">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={goBack}
            className="on-red-btn press w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>

          {onShare && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onShare}
              className="on-red-btn press w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              aria-label="Share"
            >
              <Share2 className="w-5 h-5" />
            </motion.button>
          )}
        </div>

        {/* Meta ma'lumotlar */}
        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-wrap items-center gap-2 mb-3"
        >
          {department && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-wider">
              <Building2 className="w-3 h-3" />
              {department}
            </span>
          )}
          {readTime && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-wider">
              <Clock className="w-3 h-3" />
              {readTime}
            </span>
          )}
        </motion.div>

        {/* Sarlavha */}
        <motion.h1
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-[26px] font-extrabold leading-[1.15] tracking-tight max-w-[92%]"
        >
          {title}
        </motion.h1>

        {/* Subtitle */}
        {subtitle && (
          <motion.p
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-3 text-[13px] text-white/85 leading-snug max-w-[90%]"
          >
            {subtitle}
          </motion.p>
        )}
      </div>

      <SnowDrift />
    </header>
  );
}