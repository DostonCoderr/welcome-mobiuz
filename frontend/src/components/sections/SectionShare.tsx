import { Share2, Send, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useTelegram } from '../../hooks/useTelegram';
import { showToast } from '../../utils/toast';

interface SectionShareProps {
  title: string;
  url?: string;
  isUz: boolean;
}

export default function SectionShare({ title, url, isUz }: SectionShareProps) {
  const [showCopy, setShowCopy] = useState(false);
  const [copied, setCopied] = useState(false);
  const { openLink, hapticFeedback, tg } = useTelegram();

  const shareUrl = url || window.location.href;

  // ==================== SHARE ====================
  const handleShare = () => {
    hapticFeedback('light');

    // ⚡ 1. TELEGRAM NATIVE SHARE (asosiy)
    if (tg?.openTelegramLink) {
      const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(
        shareUrl
      )}&text=${encodeURIComponent(title)}`;
      
      tg.openTelegramLink(telegramUrl);
      showToast.success(isUz ? 'Telegram ochildi' : 'Telegram открыт');
      return;
    }

    // ⚡ 2. Fallback: openLink
    if (openLink) {
      const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(
        shareUrl
      )}&text=${encodeURIComponent(title)}`;
      
      openLink(telegramUrl);
      return;
    }

    // ⚡ 3. Fallback: Web Share API (mobil)
    if (navigator.share) {
      navigator
        .share({
          title,
          text: title,
          url: shareUrl,
        })
        .then(() => {
          hapticFeedback('medium');
          showToast.success(isUz ? 'Ulashildi!' : 'Поделились!');
        })
        .catch(() => {
          // Foydalanuvchi bekor qildi
        });
      return;
    }

    // ⚡ 4. Fallback: nusxalash
    setShowCopy(true);
  };

  // ==================== COPY ====================
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      hapticFeedback('medium');
      showToast.copied();
      setTimeout(() => {
        setCopied(false);
        setShowCopy(false);
      }, 1500);
    } catch {
      showToast.error();
    }
  };

  return (
    <>
      {/* ==================== SHARE BUTTON ==================== */}
      <motion.button
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleShare}
        className="card press w-full flex items-center justify-center gap-2 p-3 text-[13px] font-bold"
        style={{ color: '#e30613' }}
      >
        <Share2 className="w-4 h-4" />
        {isUz ? 'Ulashish' : 'Поделиться'}
      </motion.button>

      {/* ==================== COPY MODAL (faqat fallback uchun) ==================== */}
      <AnimatePresence>
        {showCopy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: 'rgba(0,0,0,.5)' }}
            onClick={() => setShowCopy(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-t-3xl p-5 space-y-2 safe-bottom"
              style={{ background: 'var(--bg-card)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3
                  className="text-[15px] font-extrabold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {isUz ? 'Ulashish' : 'Поделиться'}
                </h3>
                <button
                  onClick={() => setShowCopy(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center active:bg-black/5"
                >
                  <span
                    className="text-[20px] leading-none"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    ×
                  </span>
                </button>
              </div>

              {/* Telegram */}
              <button
                onClick={() => {
                  hapticFeedback('light');
                  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(
                    shareUrl
                  )}&text=${encodeURIComponent(title)}`;
                  openLink(telegramUrl);
                  setShowCopy(false);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl active:opacity-70"
                style={{ background: 'var(--bg-secondary)' }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: '#3b82f620' }}
                >
                  <Send className="w-4 h-4" style={{ color: '#3b82f6' }} />
                </div>
                <div className="flex-1 text-left">
                  <p
                    className="text-[13px] font-bold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Telegram
                  </p>
                </div>
              </button>

              {/* Copy */}
              <button
                onClick={copyToClipboard}
                className="w-full flex items-center gap-3 p-3 rounded-xl active:opacity-70"
                style={{ background: 'var(--bg-secondary)' }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: copied ? '#10b98120' : '#e3061320',
                  }}
                >
                  {copied ? (
                    <Check className="w-4 h-4" style={{ color: '#10b981' }} />
                  ) : (
                    <Copy className="w-4 h-4" style={{ color: '#e30613' }} />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p
                    className="text-[13px] font-bold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {copied
                      ? isUz
                        ? 'Nusxalandi!'
                        : 'Скопировано!'
                      : isUz
                      ? 'Havolani nusxalash'
                      : 'Скопировать ссылку'}
                  </p>
                </div>
              </button>

              {/* Cancel */}
              <button
                onClick={() => setShowCopy(false)}
                className="w-full p-3 rounded-xl text-[13px] font-bold"
                style={{ background: 'var(--red-soft)', color: '#e30613' }}
              >
                {isUz ? 'Bekor qilish' : 'Отмена'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}