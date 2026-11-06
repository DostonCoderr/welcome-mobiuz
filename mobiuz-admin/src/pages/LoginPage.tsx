import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import gsap from 'gsap';
import {
  Lock, Mail, Loader2, Eye, EyeOff, AlertCircle, ShieldCheck, Users,
  FileText, MessageSquare, ArrowRight, ArrowUp, Sparkles, Check,
  CheckCircle2, HelpCircle,
} from 'lucide-react';
import { login } from '../api';
import Aurora from '../components/Aurora';
import Snowfall from '../components/Snowfall';
import Magnetic from '../components/Magnetic';
import { useLang, type Lang } from '../hooks/useLang';

interface LoginPageProps {
  onLogin?: () => void;
}

// ==================== TARJIMALAR ====================
const T = {
  uz: {
    pageTitle: 'Kirish · Mobiuz Admin',
    brandSub: 'Control Center',
    badge: 'HR boshqaruv tizimi',
    headline: "Welcome Book'ni boshqaring.",
    sub: 'Xodimlar, maqolalar, yangiliklar va fikr-mulohazalar — hammasi bitta jonli panelda.',
    chips: ['Xodimlar', 'Maqolalar', 'Fikrlar'],
    title: 'Xush kelibsiz',
    subtitle: 'Davom etish uchun hisobingizga kiring',
    email: 'Email',
    emailPh: 'admin@mobiuz.uz',
    password: 'Parol',
    remember: 'Meni eslab qol',
    forgot: 'Parolni unutdingizmi?',
    forgotText: 'Parolni tiklash uchun tizim administratoriga murojaat qiling.',
    submit: 'Kirish',
    submitting: 'Kirilmoqda…',
    success: 'Muvaffaqiyatli!',
    caps: 'Caps Lock yoqilgan',
    showPass: "Parolni ko'rsatish",
    hidePass: 'Parolni yashirish',
    emailInvalid: "Email manzilini to'g'ri kiriting",
    passEmpty: 'Parolni kiriting',
    errors: {
      invalid: 'Email yoki parol xato',
      tooMany: "Juda ko'p urinish. Birozdan so'ng qayta urinib ko'ring",
      network: "Serverga ulanib bo'lmadi. Internetni tekshiring",
      generic: "Xatolik yuz berdi. Qayta urinib ko'ring",
    },
  },
  ru: {
    pageTitle: 'Вход · Mobiuz Admin',
    brandSub: 'Control Center',
    badge: 'Система управления HR',
    headline: 'Управляйте Welcome Book.',
    sub: 'Сотрудники, статьи, новости и отзывы — всё в одной живой панели.',
    chips: ['Сотрудники', 'Статьи', 'Отзывы'],
    title: 'Добро пожаловать',
    subtitle: 'Войдите в аккаунт, чтобы продолжить',
    email: 'Email',
    emailPh: 'admin@mobiuz.uz',
    password: 'Пароль',
    remember: 'Запомнить меня',
    forgot: 'Забыли пароль?',
    forgotText: 'Для сброса пароля обратитесь к системному администратору.',
    submit: 'Войти',
    submitting: 'Входим…',
    success: 'Успешно!',
    caps: 'Включён Caps Lock',
    showPass: 'Показать пароль',
    hidePass: 'Скрыть пароль',
    emailInvalid: 'Введите корректный email',
    passEmpty: 'Введите пароль',
    errors: {
      invalid: 'Неверный email или пароль',
      tooMany: 'Слишком много попыток. Повторите позже',
      network: 'Не удалось подключиться к серверу. Проверьте интернет',
      generic: 'Произошла ошибка. Повторите попытку',
    },
  },
} as const;

type ErrKey = keyof (typeof T)['uz']['errors'];

const FLOATERS = [
  { icon: Users, cls: 'left-[4%] top-[58%]' },
  { icon: FileText, cls: 'left-[38%] top-[72%]' },
  { icon: MessageSquare, cls: 'left-[18%] top-[84%]' },
];

const LS_EMAIL = 'admin_remember_email';
const readEmail = (): string => {
  try {
    return localStorage.getItem(LS_EMAIL) || '';
  } catch {
    return '';
  }
};

// ==================== TIL ALMASHTIRGICH ====================
function LangSwitch({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  const options: { id: Lang; label: string }[] = [
    { id: 'uz', label: "O'zbekcha" },
    { id: 'ru', label: 'Русский' },
  ];

  return (
    <div
      role="group"
      aria-label="Language"
      className="glass flex rounded-2xl p-1"
    >
      {options.map((o) => {
        const active = lang === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => setLang(o.id)}
            aria-pressed={active}
            className={`relative rounded-xl px-3.5 py-2 text-xs font-extrabold transition-colors ${
              active ? 'text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {active && (
              <motion.span
                layoutId="lang-pill"
                transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#ff2b3a] to-[#b00410] shadow-[0_8px_24px_-8px_rgba(255,43,58,0.8)]"
              />
            )}
            <span className="relative z-10">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ==================== SAHIFA ====================
export default function LoginPage({ onLogin }: LoginPageProps) {
  const { lang, setLang } = useLang();
  const t = T[lang];
  const navigate = useNavigate();

  const [email, setEmail] = useState(readEmail);
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(() => readEmail() !== '');
  const [showPass, setShowPass] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [caps, setCaps] = useState(false);
  const [emailErr, setEmailErr] = useState(false);
  const [passErr, setPassErr] = useState(false);
  const [errKey, setErrKey] = useState<ErrKey | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const root = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const hadEmail = useRef(email !== '');
  const prevLang = useRef<Lang>(lang);

  // Sahifa sarlavhasi tilga qarab
  useEffect(() => {
    document.title = t.pageTitle;
  }, [t.pageTitle]);

  // ---------- GSAP: kirish animatsiyasi ----------
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
      tl.from('.lg-word', { yPercent: 120, duration: 1, stagger: 0.08 })
        .from('.lg-fade', { y: 24, opacity: 0, duration: 0.8, stagger: 0.1 }, '-=0.6')
        .from('.lg-chip', { scale: 0.6, opacity: 0, duration: 0.8, stagger: 0.12, ease: 'back.out(1.8)' }, '-=0.7')
        .from(cardRef.current, { y: 50, opacity: 0, scale: 0.94, duration: 1 }, 0.15)
        .from('.lg-field', { y: 18, opacity: 0, duration: 0.6, stagger: 0.09 }, '-=0.6');

      gsap.to('.lg-chip', {
        y: 'random(-14, 14)',
        x: 'random(-8, 8)',
        rotation: 'random(-5, 5)',
        duration: 'random(3, 5)',
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        stagger: 0.3,
      });
    }, root);
    return () => ctx.revert();
  }, []);

  // ---------- Til almashganda matnlar qayta animatsiya qiladi ----------
  useEffect(() => {
    if (prevLang.current === lang) return;
    prevLang.current = lang;

    const ctx = gsap.context(() => {
      gsap.from('.lg-word', { yPercent: 120, duration: 0.8, stagger: 0.07, ease: 'power4.out' });
      gsap.from('.lg-i18n', {
        y: 10,
        opacity: 0,
        duration: 0.5,
        stagger: 0.04,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
      });
    }, root);
    return () => ctx.revert();
  }, [lang]);

  const shake = () => {
    if (!cardRef.current) return;
    gsap.fromTo(cardRef.current, { x: -14 }, { x: 0, duration: 0.7, ease: 'elastic.out(1, 0.25)' });
  };

  const playExit = () =>
    new Promise<void>((resolve) => {
      if (!cardRef.current) return resolve();
      gsap.to(root.current, { opacity: 0, duration: 0.4, delay: 0.15 });
      gsap.to(cardRef.current, {
        scale: 0.95,
        y: -24,
        opacity: 0,
        duration: 0.5,
        ease: 'power3.in',
        onComplete: () => resolve(),
      });
    });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading || success) return;

    const okEmail = /^\S+@\S+\.\S+$/.test(email.trim());
    const okPass = password.length > 0;
    setEmailErr(!okEmail);
    setPassErr(!okPass);
    setErrKey(null);

    if (!okEmail || !okPass) {
      shake();
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);

      try {
        if (remember) localStorage.setItem(LS_EMAIL, email.trim());
        else localStorage.removeItem(LS_EMAIL);
      } catch {
        /* jim */
      }

      setSuccess(true);
      await playExit();
      onLogin?.();
      navigate('/');
    } catch (err: any) {
      const status: number | undefined = err?.response?.status;
      setErrKey(
        !err?.response ? 'network' : status === 429 ? 'tooMany' : status && status >= 500 ? 'generic' : 'invalid'
      );
      shake();
    } finally {
      setLoading(false);
    }
  };

  const onPassKey = (e: KeyboardEvent<HTMLInputElement>) => {
    setCaps(e.getModifierState('CapsLock'));
  };

  return (
    <div ref={root} className="relative min-h-screen overflow-hidden">
      <Aurora />
      <Snowfall />
      <div className="bg-grid pointer-events-none absolute inset-0 z-0" />

      {/* Til almashtirgich */}
      <div className="absolute right-4 top-4 z-30 sm:right-6 sm:top-6">
        <LangSwitch lang={lang} setLang={setLang} />
      </div>

      <div className="relative z-10 grid min-h-screen lg:grid-cols-[1.15fr_1fr]">
        {/* ============ CHAP: sahna ============ */}
        <div className="relative hidden flex-col justify-between p-12 lg:flex xl:p-16">
          <div className="lg-fade flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff2b3a] to-[#9d0410] shadow-[0_14px_40px_-10px_rgba(255,43,58,0.8)]">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div className="leading-tight">
              <p className="text-xl font-black tracking-tight text-white">Mobiuz</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">{t.brandSub}</p>
            </div>
          </div>

          <div className="max-w-2xl">
            <div className="lg-fade lg-i18n mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-zinc-300 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-[#ff6b75]" />
              {t.badge}
            </div>

            <h1 key={lang} className="text-[56px] font-black leading-[1.02] tracking-tight xl:text-[72px]">
              {t.headline.split(' ').map((w, i) => (
                <span key={i} className="mr-[0.22em] inline-block overflow-hidden align-bottom">
                  <span className={`lg-word inline-block ${i > 0 ? 'text-grad' : 'text-white'}`}>{w}</span>
                </span>
              ))}
            </h1>

            <p className="lg-fade lg-i18n mt-6 max-w-lg text-base leading-relaxed text-zinc-400">{t.sub}</p>
          </div>

          {/* Suzuvchi chiplar */}
          <div className="pointer-events-none absolute inset-0">
            {FLOATERS.map(({ icon: Icon, cls }, i) => (
              <div
                key={i}
                className={`lg-chip glass absolute flex items-center gap-2.5 rounded-2xl px-4 py-3 ${cls}`}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ff2b3a]/15">
                  <Icon className="h-4 w-4 text-[#ff6b75]" />
                </span>
                <span className="lg-i18n text-sm font-bold text-white">{t.chips[i]}</span>
              </div>
            ))}
          </div>

          <p className="lg-fade text-xs text-zinc-600">© {new Date().getFullYear()} Mobiuz</p>
        </div>

        {/* ============ O'NG: forma ============ */}
        <div className="flex items-center justify-center p-5 pt-20 sm:p-8 sm:pt-24 lg:pt-8">
          <div ref={cardRef} className="glass w-full max-w-[440px] rounded-[32px] p-7 sm:p-10">
            {/* Mobil logo */}
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff2b3a] to-[#9d0410]">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
              <p className="text-lg font-black text-white">Mobiuz</p>
            </div>

            <div className="lg-field mb-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ff2b3a]/10">
                <Lock className="h-6 w-6 text-[#ff6b75]" />
              </div>
              <h2 className="lg-i18n text-3xl font-black tracking-tight text-white">{t.title}</h2>
              <p className="lg-i18n mt-1.5 text-sm text-zinc-400">{t.subtitle}</p>
            </div>

            <AnimatePresence>
              {errKey && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-start gap-2.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-sm text-rose-300">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{t.errors[errKey]}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Email */}
              <div className="lg-field">
                <label className="label lg-i18n" htmlFor="email">{t.email}</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-zinc-500" />
                  <input
                    id="email"
                    type="email"
                    autoFocus={!hadEmail.current}
                    autoComplete="username"
                    placeholder={t.emailPh}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailErr) setEmailErr(false);
                    }}
                    aria-invalid={emailErr}
                    className={`input py-3.5 pl-12 ${emailErr ? 'border-rose-500/60' : ''}`}
                  />
                </div>
                {emailErr && <p className="mt-2 text-xs font-semibold text-rose-400">{t.emailInvalid}</p>}
              </div>

              {/* Parol */}
              <div className="lg-field">
                <label className="label lg-i18n" htmlFor="password">{t.password}</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-zinc-500" />
                  <input
                    id="password"
                    type={showPass ? 'text' : 'password'}
                    autoFocus={hadEmail.current}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passErr) setPassErr(false);
                    }}
                    onKeyUp={onPassKey}
                    onKeyDown={onPassKey}
                    aria-invalid={passErr}
                    className={`input py-3.5 pl-12 pr-12 ${passErr ? 'border-rose-500/60' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-zinc-500 hover:text-white"
                    aria-label={showPass ? t.hidePass : t.showPass}
                  >
                    {showPass ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                  </button>
                </div>
                {passErr && <p className="mt-2 text-xs font-semibold text-rose-400">{t.passEmpty}</p>}
                {caps && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                    <ArrowUp className="h-3.5 w-3.5" />
                    {t.caps}
                  </p>
                )}
              </div>

              {/* Eslab qolish + parolni unutdim */}
              <div className="lg-field">
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={remember}
                    onClick={() => setRemember((v) => !v)}
                    className="flex items-center gap-2.5 text-[13px] font-semibold text-zinc-400 transition-colors hover:text-white"
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all ${
                        remember ? 'border-[#ff2b3a] bg-[#ff2b3a]' : 'border-white/20 bg-white/5'
                      }`}
                    >
                      {remember && (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 600, damping: 24 }}>
                          <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                        </motion.span>
                      )}
                    </span>
                    <span className="lg-i18n">{t.remember}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowForgot((v) => !v)}
                    aria-expanded={showForgot}
                    className="flex items-center gap-1.5 text-[13px] font-semibold text-[#ff6b75] transition-colors hover:text-[#ff8a93]"
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                    <span className="lg-i18n">{t.forgot}</span>
                  </button>
                </div>

                <AnimatePresence initial={false}>
                  {showForgot && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 text-xs leading-relaxed text-zinc-400">
                        {t.forgotText}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Kirish tugmasi */}
              <div className="lg-field pt-1">
                <Magnetic className="block w-full" strength={0.12}>
                  <button
                    type="submit"
                    disabled={loading || success}
                    className="btn btn-primary w-full py-4 text-[15px]"
                  >
                    {success ? (
                      <>
                        <CheckCircle2 className="h-5 w-5" />
                        {t.success}
                      </>
                    ) : loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {t.submitting}
                      </>
                    ) : (
                      <>
                        {t.submit}
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </Magnetic>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}