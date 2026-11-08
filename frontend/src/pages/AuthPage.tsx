import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Loader2, ShieldCheck, CreditCard, Calendar } from 'lucide-react';
import { verifyEmployee } from '../services/api';
import Snowfall from '../components/ui/Snowfall';
import { showToast } from '../utils/toast';
import { useTelegram } from '../hooks/useTelegram';

export default function AuthPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { hapticFeedback, hapticNotification } = useTelegram();

  const [passport, setPassport] = useState('');
  const [birthDate, setBirthDate] = useState('');  // ISO format: "1998-07-01"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isUz = i18n.language === 'uz';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!birthDate) {
      setError(isUz ? 'Sanani tanlang' : 'Выберите дату');
      return;
    }

    setLoading(true);
    hapticFeedback('light');

    try {
      console.log('🔍 Passport:', passport.toUpperCase());
      console.log('🔍 Birth Date (ISO):', birthDate);

      // ⚡ birthDate allaqachon "1998-07-01" formatida
      const employee = await verifyEmployee(passport.toUpperCase(), birthDate);

      if (employee) {
        localStorage.setItem('employee', JSON.stringify({
          id: employee.id,
    
          passport: employee.passport,
          birth_date: employee.birth_date,
          department: employee.department || null,
          position: employee.position || null,
        }));

        showToast.success(isUz ? 'Tizimga kirdingiz' : 'Вы вошли в систему');
        hapticNotification('success');

        setTimeout(() => navigate('/', { replace: true }), 500);
      } else {
        setError(t('auth.error'));
        hapticNotification('error');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(t('auth.error'));
      hapticNotification('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hero-gradient relative min-h-dvh w-full overflow-hidden flex items-center justify-center px-4 py-6 safe-top">
      <Snowfall count={70} />

      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-[340px]"
      >
        {/* HEADER */}
        <div className="text-center text-white mb-5">
          <div className="w-14 h-14 rounded-2xl bg-white mx-auto mb-3 flex items-center justify-center shadow-xl">
            <ShieldCheck className="w-7 h-7 text-mobiuz-600" />
          </div>
          <h1 className="text-[22px] font-extrabold">{t('auth.title')}</h1>
          <p className="text-[12px] text-white/80 mt-1">Mobiuz Welcome Book</p>
        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl p-5 space-y-3.5 shadow-2xl"
          style={{ background: 'var(--bg-card)' }}
        >
          {/* Passport */}
          <div>
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              {t('auth.passport')}
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={passport}
                onChange={(e) => setPassport(e.target.value.toUpperCase())}
                placeholder="AA1234567"
                maxLength={9}
                required
                autoComplete="off"
                className="w-full h-11 pl-10 pr-3 rounded-xl text-[15px] outline-none"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1.5px solid var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>

          {/* Birth Date — NATIVE */}
          <div>
            <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              {t('auth.birthDate')}
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none z-10" style={{ color: 'var(--text-muted)' }} />
              <input
                type="date"
                value={birthDate}
                onChange={(e) => {
                  console.log('🔍 Date input:', e.target.value);
                  setBirthDate(e.target.value);
                }}
                required
                max={new Date().toISOString().split('T')[0]}
                className="w-full h-11 pl-10 pr-3 rounded-xl text-[15px] outline-none"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1.5px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  WebkitAppearance: 'none',
                  appearance: 'none',
                }}
              />
            </div>
            <p className="text-[10px] mt-1 ml-1" style={{ color: 'var(--text-muted)' }}>
              {isUz ? 'Sanani tanlang' : 'Выберите дату'}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="p-2.5 rounded-xl text-[12px] font-medium text-mobiuz-700" style={{ background: 'var(--red-soft)' }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl flex items-center justify-center gap-2 text-[15px] font-bold text-white"
            style={{
              background: 'linear-gradient(160deg, #f5222f 0%, #e30613 50%, #b00410 100%)',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('common.loading')}
              </>
            ) : (
              t('auth.verify')
            )}
          </button>

          <p className="text-center text-[10px]" style={{ color: 'var(--text-muted)' }}>
            {t('auth.hrContact') || 'Ma\'lumotlar HR tomonidan tasdiqlangan'}
          </p>
        </form>
      </motion.div>
    </div>
  );
}