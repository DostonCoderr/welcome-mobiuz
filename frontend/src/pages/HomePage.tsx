import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronRight, FileText, Building2, Calendar, Users, Gift, Target,
  Phone, HelpCircle, Home, Zap, Search, Snowflake, TrendingUp, Award, Heart,
  Briefcase, Star,
  type LucideIcon,
} from 'lucide-react';
import {
  getSectionsForEmployee,
  getBanners,
  type Section,
  type Banner,
  type Employee,
} from '../services/api';
import { useTelegram } from '../hooks/useTelegram';
import ThemeToggle from '../components/ui/ThemeToggle';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';
import Snowfall from '../components/ui/Snowfall';
import SnowDrift from '../components/ui/SnowDrift';
import { blocksToText } from '../utils/blocks';
import { getMediaUrl } from '../utils/media';

const iconMap: Record<string, LucideIcon> = {
  home: Home, info: Building2, calendar: Calendar, users: Users,
  gift: Gift, target: Target, phone: Phone, 'help-circle': HelpCircle,
  default: FileText,
};

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const { user, hapticFeedback } = useTelegram();
  const navigate = useNavigate();

  const [sections, setSections] = useState<Section[]>([]);
  const [privateSections, setPrivateSections] = useState<Section[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const isUz = i18n.language === 'uz';

  // Xodimni localStorage dan olish
  const employee: Employee | null = useMemo(() => {
    try {
      const str = localStorage.getItem('employee');
      return str ? JSON.parse(str) : null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        const [sectionsData, bannersData] = await Promise.all([
          getSectionsForEmployee(employee),
          getBanners(),
        ]);

        setSections(sectionsData.public);
        setPrivateSections(sectionsData.private);
        setBanners(bannersData);
      } catch (e) {
        console.error('Load error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [employee]);

  // Qidiruv
  const filteredPublic = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;
    return sections.filter((s) => {
      const title = isUz ? s.title_uz : s.title_ru;
      const text = blocksToText(isUz ? s.content_uz : s.content_ru);
      return title?.toLowerCase().includes(q) || text.toLowerCase().includes(q);
    });
  }, [sections, query, isUz]);

  const filteredPrivate = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return privateSections;
    return privateSections.filter((s) => {
      const title = isUz ? s.title_uz : s.title_ru;
      const text = blocksToText(isUz ? s.content_uz : s.content_ru);
      return title?.toLowerCase().includes(q) || text.toLowerCase().includes(q);
    });
  }, [privateSections, query, isUz]);

  const greeting = user
    ? `${isUz ? 'Salom' : 'Привет'}, ${user.first_name}! 👋`
    : t('app.subtitle');

  const stats = [
    {
      icon: TrendingUp,
      value: String(sections.length + privateSections.length),
      label: isUz ? "Bo'limlar" : 'Разделов',
    },
    { icon: Award, value: '90', label: isUz ? 'Kun' : 'Дней' },
    { icon: Heart, value: '24/7', label: isUz ? 'Yordam' : 'Помощь' },
  ];

  // Section kartochkasi
  const SectionCard = ({ section, index }: { section: Section; index: number }) => {
    const Icon = iconMap[section.icon] || iconMap.default;
    const title = isUz ? section.title_uz : section.title_ru;
    const text = blocksToText(isUz ? section.content_uz : section.content_ru);

    return (
      <motion.button
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: Math.min(index, 8) * 0.04, duration: 0.3 }}
        onClick={() => {
          hapticFeedback('medium');
          navigate(`/section/${section.document_id}`)
        }}
        className="card press w-full flex items-center gap-3 p-3 text-left"
        style={{ borderRadius: 18 }}
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(160deg, #f5222f 0%, #e30613 55%, #b00410 100%)',
            boxShadow: '0 8px 16px -8px rgba(227,6,19,.7)',
          }}
        >
          <Icon className="w-[22px] h-[22px] text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h4
            className="font-bold text-[15px] leading-tight truncate"
            style={{ color: 'var(--text-primary)' }}
          >
            {title}
          </h4>
          <p
            className="text-[12px] mt-1 line-clamp-2 leading-snug"
            style={{ color: 'var(--text-secondary)' }}
          >
            {text || (isUz ? 'Batafsil...' : 'Подробнее...')}
          </p>
        </div>
        <ChevronRight
          className="w-5 h-5 flex-shrink-0"
          style={{ color: 'var(--text-muted)' }}
        />
      </motion.button>
    );
  };

  return (
    <main className="pb-32">
      {/* ================= HERO ================= */}
      <section className="hero-gradient relative overflow-hidden safe-top text-white pb-16">
        <Snowfall count={55} />
        <Snowflake
          className="drift-slow absolute -right-12 -top-8 w-52 h-52 text-white/10 pointer-events-none"
          strokeWidth={1}
        />

        <div className="relative z-10 px-4 pt-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-black/20">
                <Zap
                  className="w-[22px] h-[22px] text-mobiuz-600"
                  fill="currentColor"
                />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-white/80 truncate">{greeting}</p>
                <h1 className="text-[15px] font-extrabold truncate leading-tight">
                  {t('app.title')}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <ThemeToggle />
              <LanguageSwitcher />
            </div>
          </div>

          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="mt-7"
          >
            <h2 className="text-[27px] font-extrabold leading-[1.12] tracking-tight max-w-[88%]">
              {t('welcome.title')}
            </h2>
            <p className="mt-2 text-[13px] text-white/85 leading-snug max-w-[82%]">
              {t('welcome.subtitle')}
            </p>
          </motion.div>
        </div>
        <SnowDrift />
      </section>

      {/* ================= QIDIRUV ================= */}
      <div className="relative z-20 -mt-7 px-4">
        <div
          className="card flex items-center gap-2.5 px-4 h-12"
          style={{ borderRadius: 16 }}
        >
          <Search
            className="w-[18px] h-[18px] flex-shrink-0"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isUz ? "Bo'lim qidirish..." : 'Поиск по разделам...'}
            className="flex-1 min-w-0 bg-transparent outline-none text-[15px]"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      {/* ================= STATISTIKA ================= */}
      <div className="px-4 mt-4 grid grid-cols-3 gap-2.5">
        {stats.map(({ icon: Icon, value, label }) => (
          <div key={label} className="card p-3" style={{ borderRadius: 16 }}>
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center mb-2"
              style={{ background: 'var(--red-soft)' }}
            >
              <Icon className="w-4 h-4 text-mobiuz-600" />
            </div>
            <div
              className="text-[18px] font-extrabold leading-none"
              style={{ color: 'var(--text-primary)' }}
            >
              {loading && label.startsWith(isUz ? "Bo'" : 'Раз') ? '–' : value}
            </div>
            <div
              className="text-[11px] mt-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* ================= YANGILIKLAR ================= */}
      {banners.length > 0 && (
        <section className="mt-5">
          {/* Sarlavha + "Hammasi →" */}
          <div className="flex items-center justify-between px-4 mb-2">
            <h3
              className="text-[14px] font-extrabold"
              style={{ color: 'var(--text-primary)' }}
            >
              {isUz ? 'Yangiliklar' : 'Новости'}
            </h3>
            <button
              onClick={() => {
                hapticFeedback('light');
                navigate('/news');
              }}
              className="text-[11px] font-bold flex items-center gap-0.5 active:opacity-60"
              style={{ color: '#e30613' }}
            >
              {isUz ? 'Hammasi' : 'Все'}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Bannerlar */}
          <div className="flex gap-2.5 overflow-x-auto px-4 pb-1 scrollbar-hide snap-x snap-mandatory">
            {banners.map((b) => {
              const img = b.image ? getMediaUrl(typeof b.image === 'string' ? b.image : b.image.url) : '';
              const title = isUz ? b.title_uz : b.title_ru;
              const desc = isUz ? b.description_uz : b.description_ru;

              return (
                <button
                  key={b.id}
                  onClick={() => {
                    if (b.link) {
                      hapticFeedback('light');
                      window.open(b.link, '_blank');
                    } else {
                      hapticFeedback('light');
                      navigate('/news');
                    }
                  }}
                  className="press snap-start flex-shrink-0 w-[62%] max-w-[240px] h-28 rounded-2xl overflow-hidden relative text-left text-white hero-gradient"
                >
                  {img && (
                    <img
                      src={img}
                      alt={title}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                  <div className="absolute bottom-0 p-2.5">
                    <h4 className="text-[12px] font-extrabold leading-tight line-clamp-1">
                      {title}
                    </h4>
                    {desc && (
                      <p className="text-[10px] text-white/80 mt-0.5 line-clamp-1 leading-snug">
                        {desc}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ================= UMUMIY BO'LIMLAR ================= */}
      <section className="px-4 mt-6">
        <div className="flex items-center justify-between mb-2.5">
          <h3
            className="text-[16px] font-extrabold flex items-center gap-2"
            style={{ color: 'var(--text-primary)' }}
          >
            <FileText className="w-4 h-4 text-mobiuz-600" />
            {isUz ? 'Umumiy' : 'Общее'}
          </h3>
          <span
            className="text-[12px] font-bold px-2.5 py-0.5 rounded-full"
            style={{ background: 'var(--red-soft)', color: '#e30613' }}
          >
            {filteredPublic.length}
          </span>
        </div>

        {loading ? (
          <div className="space-y-2.5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-[76px]" />
            ))}
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredPublic.map((section, i) => (
              <SectionCard key={section.id} section={section} index={i} />
            ))}

            {filteredPublic.length === 0 && (
              <div className="text-center py-10">
                <Snowflake
                  className="w-10 h-10 mx-auto mb-2"
                  style={{ color: 'var(--text-muted)' }}
                />
                <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                  {query
                    ? isUz
                      ? "Hech narsa topilmadi"
                      : 'Ничего не найдено'
                    : isUz
                    ? "Hozircha bo'limlar yo'q"
                    : 'Разделов пока нет'}
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ================= BO'LIMGA XOS (faqat sizga) ================= */}
      {filteredPrivate.length > 0 && (
        <>
          {/* CHIZIQ (divider) */}
          <div className="px-4 my-6">
            <div
              className="h-px w-full"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, var(--border-color) 20%, var(--border-color) 80%, transparent 100%)',
              }}
            />
          </div>

          <section className="px-4">
            <div className="flex items-center justify-between mb-2.5">
              <h3
                className="text-[16px] font-extrabold flex items-center gap-2"
                style={{ color: 'var(--text-primary)' }}
              >
                <Briefcase className="w-4 h-4 text-mobiuz-600" />
                {isUz
                  ? employee?.position?.name_uz || 'Sizning bo\'limingiz'
                  : employee?.position?.name_ru || 'Ваш отдел'}
              </h3>
              <span
                className="text-[12px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1"
                style={{ background: 'var(--red-soft)', color: '#e30613' }}
              >
                <Star className="w-3 h-3" fill="currentColor" />
                {filteredPrivate.length}
              </span>
            </div>

            <div className="space-y-2.5">
              {filteredPrivate.map((section, i) => (
                <SectionCard key={section.id} section={section} index={i} />
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}