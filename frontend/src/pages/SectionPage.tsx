import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Snowflake } from 'lucide-react';
import {
  getSectionById,
  getSectionsForEmployee,
  type Section,
  type Employee,
} from '../services/api';
import SectionHero from '../components/sections/SectionHero';
import SectionMeta from '../components/sections/SectionMeta';
import SectionContent from '../components/sections/SectionContent';
import RelatedSections from '../components/sections/RelatedSections';
import SectionShare from '../components/sections/SectionShare';
import { blocksToHtml, blocksToText } from '../utils/blocks';
import { useTelegram } from '../hooks/useTelegram';

export default function SectionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { hapticFeedback } = useTelegram();
  const isUz = i18n.language === 'uz';

  const [section, setSection] = useState<Section | null>(null);
  const [related, setRelated] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  const employee: Employee | null = useMemo(() => {
    try {
      const str = localStorage.getItem('employee');
      return str ? JSON.parse(str) : null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        setLoading(true);

        // Asosiy section
        const sectionData = await getSectionById(id);
        setSection(sectionData);

        // Related sections
        const allSections = await getSectionsForEmployee(employee);
        const all = [...allSections.public, ...allSections.private];
        
        const sameDept = all.filter(
          (s) =>
            s._id !== id && 
            s.department?._id === sectionData.department?._id
        );

        const others = all.filter(
          (s) =>
            s._id !== id && 
            s.department?._id !== sectionData.department?._id
        );

        setRelated([...sameDept, ...others].slice(0, 3));
      } catch (e) {
        console.error('Load section error:', e);
        setSection(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, employee]);

  const html = useMemo(
    () =>
      section
        ? blocksToHtml(isUz ? section.content_uz : section.content_ru)
        : '',
    [section, isUz]
  );

  const preview = useMemo(() => {
    if (!section) return '';
    const text = blocksToText(isUz ? section.content_uz : section.content_ru);
    return text.length > 100 ? text.substring(0, 100) + '...' : text;
  }, [section, isUz]);

  if (loading) {
    return (
      <div className="min-h-dvh pb-10">
        <div className="hero-gradient relative overflow-hidden safe-top pb-12">
          <div className="px-4 pt-3.5">
            <div className="w-10 h-10 rounded-full bg-white/20 mb-6" />
            <div className="h-6 w-2/3 bg-white/20 rounded mb-3" />
            <div className="h-4 w-1/2 bg-white/15 rounded" />
          </div>
        </div>
        <div className="relative z-10 px-4 -mt-5 space-y-3">
          <div className="skeleton h-12" />
          <div className="card p-5 space-y-3">
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!section) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-4">
        <div className="card p-8 text-center w-full max-w-sm">
          <Snowflake
            className="w-12 h-12 mx-auto mb-3"
            style={{ color: 'var(--text-muted)' }}
          />
          <p
            className="text-[14px] mb-4"
            style={{ color: 'var(--text-secondary)' }}
          >
            {t('common.error')}
          </p>
          <button
            onClick={() => {
              hapticFeedback('light');
              navigate('/');
            }}
            className="btn-primary"
            style={{ width: 'auto', display: 'inline-flex', padding: '.7rem 1.4rem' }}
          >
            {t('common.back')}
          </button>
        </div>
      </div>
    );
  }

  const title = isUz ? section.title_uz : section.title_ru;
  const department = isUz
    ? section.department?.name_uz
    : section.department?.name_ru;

  const textLength = blocksToText(
    isUz ? section.content_uz : section.content_ru
  ).length;
  const readTime = `${Math.max(1, Math.ceil(textLength / 1000))} ${
    isUz ? 'daq' : 'мин'
  }`;

  return (
    <div className="min-h-dvh pb-10">
      <SectionHero
        title={title}
        subtitle={preview}
        department={department}
        readTime={readTime}
        image={section.images?.[0]?.url}
      />

      <motion.main
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 px-4 -mt-5 space-y-3"
      >
        <SectionMeta
          publishedAt={section.publishedAt}
          isUz={isUz}
        />

        <SectionContent html={html} isUz={isUz} />

        <SectionShare title={title} isUz={isUz} />

        {related.length > 0 && (
          <RelatedSections sections={related} isUz={isUz} />
        )}
      </motion.main>
    </div>
  );
}