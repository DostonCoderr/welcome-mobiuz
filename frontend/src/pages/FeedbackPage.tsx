import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, Send, CheckCircle, Loader2, MessageSquare, AlertCircle,
  Lightbulb, Bug, Heart, Home, TrendingUp, Sparkles, X,
} from 'lucide-react';
import { createFeedback } from '../services/api';
import { useTelegram } from '../hooks/useTelegram';
import PageHeader from '../components/layout/PageHeader';
import { showToast } from '../utils/toast';

const MAX = 500;

type Category = 'general' | 'content' | 'ux' | 'bug';

const categories = [
  {
    id: 'general' as Category,
    icon: MessageSquare,
    label_uz: 'Umumiy',
    label_ru: 'Общее',
    color: '#6b7280',
  },
  {
    id: 'content' as Category,
    icon: Lightbulb,
    label_uz: 'Kontent',
    label_ru: 'Контент',
    color: '#f59e0b',
  },
  {
    id: 'ux' as Category,
    icon: Sparkles,
    label_uz: 'Dizayn',
    label_ru: 'Дизайн',
    color: '#8b5cf6',
  },
  {
    id: 'bug' as Category,
    icon: Bug,
    label_uz: 'Xatolik',
    label_ru: 'Ошибка',
    color: '#e30613',
  },
];

const ratingData = [
  { emoji: '😞', color: '#e30613', uz: 'Juda yomon', ru: 'Очень плохо' },
  { emoji: '😕', color: '#f59e0b', uz: 'Yomon', ru: 'Плохо' },
  { emoji: '😐', color: '#6b7280', uz: "O'rtacha", ru: 'Нормально' },
  { emoji: '🙂', color: '#10b981', uz: 'Yaxshi', ru: 'Хорошо' },
  { emoji: '😍', color: '#ec4899', uz: 'Ajoyib', ru: 'Отлично' },
];

export default function FeedbackPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { hapticFeedback, hapticNotification } = useTelegram();
  const isUz = i18n.language === 'uz';

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [category, setCategory] = useState<Category>('general');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);

  // Rating ma'lumotlari
  const currentRating = useMemo(() => {
    const idx = (hoveredRating || rating) - 1;
    return idx >= 0 ? ratingData[idx] : null;
  }, [rating, hoveredRating]);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (rating === 0 || loading) return;

  setLoading(true);
  setError('');

  const toastId = showToast.loading();

  try {
    await createFeedback({
      rating,
      comment: comment.trim(),
      category,
    });

    hapticNotification('success');

    showToast.loadingToSuccess(toastId, isUz ? 'Fikringiz yuborildi!' : 'Отзыв отправлен!');

    setSuccess(true);

    setTimeout(() => {
      navigate('/', { replace: true });
    }, 2500);
  } catch (err: any) {
    console.error('Feedback error:', err);
    setError(
      isUz
        ? 'Xatolik yuz berdi. Qayta urinib ko\'ring.'
        : 'Произошла ошибка. Попробуйте еще раз.'
    );
    hapticNotification('error');

    showToast.loadingToError(toastId);
  } finally {
    setLoading(false);
  }
};

  // ==================== SUCCESS ====================
  if (success) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className="card p-8 text-center w-full max-w-sm relative overflow-hidden"
        >
          {/* Dekorativ fon */}
          <div
            className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 hero-gradient -mr-16 -mt-16"
          />

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-24 h-24 rounded-full mx-auto mb-5 flex items-center justify-center relative"
            style={{ background: 'var(--red-soft)' }}
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-full"
              style={{ background: 'var(--red-soft)' }}
            />
            <CheckCircle className="w-12 h-12 text-mobiuz-600 relative z-10" />
          </motion.div>

          <motion.h2
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-[22px] font-extrabold mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            {isUz ? 'Rahmat!' : 'Спасибо!'}
          </motion.h2>

          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-[13px]"
            style={{ color: 'var(--text-secondary)' }}
          >
            {t('feedback.success')}
          </motion.p>

          {/* Yulduzchalar */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 }}
            className="flex justify-center gap-1 mt-4"
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className="w-5 h-5"
                style={{
                  color: star <= rating ? '#fbbf24' : 'var(--border-color)',
                  fill: star <= rating ? '#fbbf24' : 'transparent',
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // ==================== FORM ====================
  return (
    <div className="min-h-dvh pb-32">
      <PageHeader
        title={t('feedback.title')}
        subtitle={isUz ? 'Fikringizni bizga yuboring' : 'Отправьте нам свой отзыв'}
        back
      />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 px-4 -mt-5 space-y-3"
      >
        {/* ==================== RATING ==================== */}
        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="card p-5 relative overflow-hidden"
        >
          <label
            className="block text-[14px] font-extrabold mb-4 text-center"
            style={{ color: 'var(--text-primary)' }}
          >
            {t('feedback.rating')}
          </label>

          {/* Yulduzchalar */}
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => {
              const isActive = star <= (hoveredRating || rating);
              return (
                <motion.button
                  key={star}
                  type="button"
                  whileTap={{ scale: 0.8 }}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => {
                    hapticFeedback('light');
                    setRating(star);
                  }}
                  aria-label={`${star} ${isUz ? 'yulduz' : 'звезд'}`}
                  className="p-1 transition-transform"
                >
                  <motion.div
                    animate={
                      isActive && star === rating
                        ? { scale: [1, 1.3, 1] }
                        : { scale: 1 }
                    }
                    transition={{ duration: 0.3 }}
                  >
                    <Star
                      className="w-11 h-11 transition-colors"
                      strokeWidth={isActive ? 0 : 1.8}
                      style={{
                        color: isActive ? '#fbbf24' : 'var(--border-color)',
                        fill: isActive ? '#fbbf24' : 'transparent',
                        filter: isActive
                          ? 'drop-shadow(0 4px 8px rgba(251,191,36,.4))'
                          : 'none',
                      }}
                    />
                  </motion.div>
                </motion.button>
              );
            })}
          </div>

          {/* Rating label */}
          <div className="h-10 mt-3 text-center">
            <AnimatePresence mode="wait">
              {currentRating && (
                <motion.div
                  key={currentRating.uz}
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -8, opacity: 0 }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
                  style={{ background: `${currentRating.color}15` }}
                >
                  <span className="text-[20px]">{currentRating.emoji}</span>
                  <span
                    className="text-[13px] font-bold"
                    style={{ color: currentRating.color }}
                  >
                    {isUz ? currentRating.uz : currentRating.ru}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ==================== CATEGORY ==================== */}
        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="card p-4"
        >
          <label
            className="block text-[13px] font-bold mb-3"
            style={{ color: 'var(--text-primary)' }}
          >
            {isUz ? 'Kategoriya' : 'Категория'}
          </label>

          <div className="grid grid-cols-2 gap-2">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const active = category === cat.id;
              return (
                <motion.button
                  key={cat.id}
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    hapticFeedback('light');
                    setCategory(cat.id);
                  }}
                  className="flex items-center gap-2 p-2.5 rounded-xl transition-all border"
                  style={{
                    background: active ? `${cat.color}15` : 'var(--bg-secondary)',
                    borderColor: active ? cat.color : 'transparent',
                    borderWidth: '1.5px',
                  }}
                >
                  <Icon
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: active ? cat.color : 'var(--text-muted)' }}
                  />
                  <span
                    className="text-[12px] font-bold truncate"
                    style={{ color: active ? cat.color : 'var(--text-primary)' }}
                  >
                    {isUz ? cat.label_uz : cat.label_ru}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* ==================== COMMENT ==================== */}
        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="card p-4"
        >
          <div className="flex items-center justify-between mb-2.5">
            <label
              className="text-[13px] font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              {t('feedback.comment')}
            </label>
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{
                background:
                  comment.length > MAX * 0.9
                    ? 'var(--red-soft)'
                    : 'var(--bg-secondary)',
                color:
                  comment.length > MAX * 0.9
                    ? '#e30613'
                    : 'var(--text-muted)',
              }}
            >
              {comment.length}/{MAX}
            </span>
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, MAX))}
            rows={4}
            placeholder={
              isUz
                ? 'Fikringizni yozing... (ixtiyoriy)'
                : 'Напишите свой отзыв... (необязательно)'
            }
            className="input resize-none"
            style={{ paddingLeft: '1rem', fontSize: '14px' }}
          />

          {/* Tezkor tugmalar */}
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {(isUz
              ? ['Ajoyib ish!', 'Yaxshilash kerak', 'Rahmat!']
              : ['Отличная работа!', 'Нужно улучшить', 'Спасибо!']
            ).map((quick) => (
              <button
                key={quick}
                type="button"
                onClick={() => {
                  hapticFeedback('light');
                  setComment((prev) =>
                    prev ? `${prev} ${quick}` : quick
                  );
                }}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors active:opacity-60"
                style={{
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)',
                }}
              >
                {quick}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ==================== ERROR ==================== */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              className="card p-3 flex items-center gap-2.5"
              style={{ borderColor: '#e30613', borderWidth: '1.5px' }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#e30613' }} />
              <span className="text-[12px] font-medium" style={{ color: '#e30613' }}>
                {error}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ==================== SUBMIT ==================== */}
        <motion.button
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          type="submit"
          disabled={rating === 0 || loading}
          whileTap={{ scale: 0.98 }}
          className="btn-primary relative overflow-hidden"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {isUz ? 'Yuborilmoqda...' : 'Отправка...'}
            </>
          ) : (
            <>
              <Send className="w-[18px] h-[18px]" />
              {t('feedback.submit')}
            </>
          )}
        </motion.button>

        {/* Eslatma */}
        <p
          className="text-center text-[11px] px-4 leading-snug"
          style={{ color: 'var(--text-muted)' }}
        >
          {isUz
            ? 'Fikringiz HR bo\'limiga yuboriladi va maxfiy saqlanadi.'
            : 'Ваш отзыв будет отправлен в HR-отдел и сохранён конфиденциально.'}
        </p>
      </form>
    </div>
  );
}