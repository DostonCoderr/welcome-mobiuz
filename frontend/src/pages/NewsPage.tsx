import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Search, Calendar, ExternalLink, Newspaper, Sparkles } from 'lucide-react';
import { getBanners, type Banner } from '../services/api';
import { useTelegram } from '../hooks/useTelegram';
import PageHeader from '../components/layout/PageHeader';
import { getMediaUrl } from '../utils/media';

export default function NewsPage() {
  const { i18n } = useTranslation();
  const { hapticFeedback, openLink } = useTelegram();
  const isUz = i18n.language === 'uz';

  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setBanners(await getBanners());
      } catch (e) {
        console.error('Load news error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return banners;
    return banners.filter((b) => {
      const title = (isUz ? b.title_uz : b.title_ru) || '';
      const desc = (isUz ? b.description_uz : b.description_ru) || '';
      return title.toLowerCase().includes(q) || desc.toLowerCase().includes(q);
    });
  }, [banners, query, isUz]);

  const formatDate = (date?: string) => {
    if (!date) return '';
    try {
      return new Date(date).toLocaleDateString(isUz ? 'uz-UZ' : 'ru-RU', {
        day: '2-digit',
        month: 'short',
      });
    } catch {
      return '';
    }
  };

  const open = (link?: string) => {
    if (!link) return;
    hapticFeedback('light');
    openLink(link);
  };

  const Card = ({ news, i, featured }: { news: Banner; i: number; featured?: boolean }) => {
    const img = news.image ? getMediaUrl(typeof news.image === 'string' ? news.image : news.image.url) : '';
    const title = isUz ? news.title_uz : news.title_ru;
    const desc = isUz ? news.description_uz : news.description_ru;

    return (
      <motion.button
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: Math.min(i, 8) * 0.04, duration: 0.3 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => open(news.link)}
        className={`hero-gradient relative overflow-hidden text-left text-white w-full ${
          featured ? 'col-span-2 sm:col-span-3 aspect-[16/9]' : 'aspect-square'
        }`}
        style={{
          borderRadius: 18,
          boxShadow: '0 10px 24px -14px var(--shadow-color)',
        }}
      >
        {img ? (
          <img
            src={img}
            alt={title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <Newspaper
            className="absolute right-3 top-3 w-10 h-10 text-white/20"
            strokeWidth={1.5}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

        {news.link && (
          <span className="on-red-btn absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center">
            <ExternalLink className="w-3.5 h-3.5" />
          </span>
        )}

        <div className="absolute bottom-0 inset-x-0 p-3">
          {news.publishedAt && (
            <div className="flex items-center gap-1 text-[10px] text-white/75 mb-1">
              <Calendar className="w-3 h-3" />
              {formatDate(news.publishedAt)}
            </div>
          )}
          <h3
            className={`font-extrabold leading-tight ${
              featured ? 'text-[17px] line-clamp-2' : 'text-[13px] line-clamp-2'
            }`}
          >
            {title}
          </h3>
          {desc && (
            <p
              className={`text-white/80 mt-1 leading-snug ${
                featured ? 'text-[12px] line-clamp-2' : 'text-[10px] line-clamp-1'
              }`}
            >
              {desc}
            </p>
          )}
        </div>
      </motion.button>
    );
  };

  return (
    <div className="min-h-dvh pb-24">
      <PageHeader
        title={isUz ? 'Yangiliklar' : 'Новости'}
        subtitle={
          banners.length > 0
            ? `${banners.length} ${isUz ? 'ta yangilik' : 'новостей'}`
            : undefined
        }
      />

      <motion.main
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 px-4 -mt-5 space-y-3"
      >
        <div className="card flex items-center gap-2.5 px-4 h-12" style={{ borderRadius: 16 }}>
          <Search
            className="w-[18px] h-[18px] flex-shrink-0"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isUz ? 'Yangilik qidirish...' : 'Поиск новостей...'}
            className="flex-1 min-w-0 bg-transparent outline-none text-[14px]"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>

        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-mobiuz-600" />
              <span
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                {isUz ? "Eng so'nggi" : 'Последние'}
              </span>
            </div>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-bold"
              style={{ background: 'var(--red-soft)', color: '#e30613' }}
            >
              {filtered.length}
            </span>
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="skeleton col-span-2 sm:col-span-3 aspect-[16/9]" />
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton aspect-square" />
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="card p-10 text-center">
            <Newspaper
              className="w-12 h-12 mx-auto mb-3"
              style={{ color: 'var(--text-muted)' }}
            />
            <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
              {query
                ? isUz
                  ? 'Hech narsa topilmadi'
                  : 'Ничего не найдено'
                : isUz
                ? "Hozircha yangilik yo'q"
                : 'Пока нет новостей'}
            </p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {filtered.map((news, i) => (
              <Card key={news._id} news={news} i={i} featured={i === 0 && !query} />
            ))}
          </div>
        )}
      </motion.main>
    </div>
  );
}