import type { ReactNode } from 'react';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Snowfall from '../ui/Snowfall';
import SnowDrift from '../ui/SnowDrift';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
  showMenu?: boolean;
  onMenuClick?: () => void;
}

export default function PageHeader({
  title,
  subtitle,
  back,
  right,
  showMenu,
  onMenuClick,
}: PageHeaderProps) {
  const navigate = useNavigate();

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <header className="hero-gradient relative overflow-hidden safe-top text-white pb-10">
      {/* Snowfall animatsiyasi */}
      <Snowfall count={22} />

      {/* Dekorativ shakllar */}
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }}
      />
      <div
        className="absolute bottom-0 left-0 w-24 h-24 rounded-full opacity-15 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }}
      />

      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative z-10 flex items-center gap-3 px-4 pt-3.5"
      >
        {/* Back tugmasi */}
        {back && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={goBack}
            className="on-red-btn press w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
        )}

        {/* Sarlavha va tavsif */}
        <div className="min-w-0 flex-1">
          <h1 className="text-[19px] font-extrabold leading-tight tracking-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-[12px] text-white/80 mt-0.5 truncate"
            >
              {subtitle}
            </motion.p>
          )}
        </div>

        {/* O'ng tomon */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {right}
          {showMenu && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onMenuClick}
              className="on-red-btn press w-10 h-10 rounded-full flex items-center justify-center"
              aria-label="Menu"
            >
              <MoreVertical className="w-5 h-5" />
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Snow drift (pastdagi to'lqin) */}
      <SnowDrift />
    </header>
  );
}