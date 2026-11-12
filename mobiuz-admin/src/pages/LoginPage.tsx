import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Lock, Mail, Loader2, Eye, EyeOff, AlertCircle, ShieldCheck,
  ArrowRight, ArrowUp, Sparkles, Check,
  HelpCircle, KeyRound, ArrowLeft,
} from 'lucide-react';
import { useLang, type Lang } from '../hooks/useLang';
import Aurora from '../components/Aurora';
import Snowfall from '../components/Snowfall';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
    title: 'Xush kelibsiz',
    subtitle: 'Davom etish uchun hisobingizga kiring',
    email: 'Email',
    emailPh: 'admin@mobiuz.uz',
    password: 'Parol',
    remember: 'Meni eslab qol',
    forgot: 'Parolni unutdingizmi?',
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
      codeInvalid: 'Kod xato yoki muddati o\'tgan',
    },
    codeTitle: 'Tasdiqlash kodi',
    codeSub: 'Telegramingizga yuborilgan 6 xonali kodni kiriting',
    codeLabel: 'Kod',
    codePh: '000000',
    verify: 'Tasdiqlash',
    verifying: 'Tekshirilmoqda...',
    backToLogin: 'Orqaga qaytish',
    // Forgot password
    forgotTitle: 'Parolni tiklash',
    forgotSub: 'Emailingizni kiriting, biz Telegramingizga yangi kod yuboramiz',
    forgotSubmit: 'Kod yuborish',
    forgotCodeTitle: 'Yangi parol',
    forgotCodeSub: 'Telegramingizga kelgan kodni va yangi parolni kiriting',
    resetBtn: 'Parolni yangilash',
    resetSuccess: 'Parol muvaffaqiyatli o\'zgartirildi!',
  },
  ru: {
    pageTitle: 'Вход · Mobiuz Admin',
    brandSub: 'Control Center',
    badge: 'Система управления HR',
    headline: 'Управляйте Welcome Book.',
    sub: 'Сотрудники, статьи, новости и отзывы — всё в одной живой панели.',
    title: 'Добро пожаловать',
    subtitle: 'Войдите в аккаунт, чтобы продолжить',
    email: 'Email',
    emailPh: 'admin@mobiuz.uz',
    password: 'Пароль',
    remember: 'Запомнить меня',
    forgot: 'Забыли пароль?',
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
      codeInvalid: 'Неверный код или срок действия истёк',
    },
    codeTitle: 'Код подтверждения',
    codeSub: 'Введите 6-значный код, отправленный вам в Telegram',
    codeLabel: 'Код',
    codePh: '000000',
    verify: 'Подтвердить',
    verifying: 'Проверка...',
    backToLogin: 'Назад',
    // Forgot password
    forgotTitle: 'Восстановление пароля',
    forgotSub: 'Введите свой email, мы отправим новый код в ваш Telegram',
    forgotSubmit: 'Отправить код',
    forgotCodeTitle: 'Новый пароль',
    forgotCodeSub: 'Введите код из Telegram и новый пароль',
    resetBtn: 'Обновить пароль',
    resetSuccess: 'Пароль успешно изменён!',
  },
} as const;

type ErrKey = keyof (typeof T)['uz']['errors'];

const LS_EMAIL = 'admin_remember_email';
const readEmail = (): string => {
  try {
    return localStorage.getItem(LS_EMAIL) || '';
  } catch {
    return '';
  }
};

const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '').slice(0, 255);
};

function LangSwitch({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  const options: { id: Lang; label: string }[] = [
    { id: 'uz', label: "O'zbekcha" },
    { id: 'ru', label: 'Русский' },
  ];

  return (
    <div role="group" aria-label="Language" className="glass flex rounded-2xl p-1">
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

export default function LoginPage({ onLogin }: LoginPageProps) {
  const { lang, setLang } = useLang();
  const t = T[lang];
  const navigate = useNavigate();

  const [email, setEmail] = useState(readEmail);
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(() => readEmail() !== '');
  const [showPass, setShowPass] = useState(false);
  const [caps, setCaps] = useState(false);
  const [emailErr, setEmailErr] = useState(false);
  const [passErr, setPassErr] = useState(false);
  const [errKey, setErrKey] = useState<ErrKey | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [step, setStep] = useState<1 | 2>(1);
  const [userId, setUserId] = useState('');
  const [code, setCode] = useState('');
  const [codeErr, setCodeErr] = useState(false);

  const [forgotStep, setForgotStep] = useState<0 | 1 | 2>(0);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotUserId, setForgotUserId] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const onPassKey = (e: KeyboardEvent<HTMLInputElement>) => {
    setCaps(e.getModifierState('CapsLock'));
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (loading || success) return;

    const cleanEmail = sanitizeInput(email);
    const cleanPassword = password;
    const okEmail = /^\S+@\S+\.\S+$/.test(cleanEmail);
    const okPass = cleanPassword.length > 0;
    setEmailErr(!okEmail);
    setPassErr(!okPass);
    setErrKey(null);

    if (!okEmail || !okPass) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrKey(res.status === 400 ? 'generic' : 'invalid');
        return;
      }

      setUserId(data.userId);
      setStep(2);

      try {
        if (remember) localStorage.setItem(LS_EMAIL, cleanEmail);
        else localStorage.removeItem(LS_EMAIL);
      } catch {}
    } catch (err) {
      setErrKey('network');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: FormEvent) => {
    e.preventDefault();
    if (loading || success) return;

    const cleanCode = sanitizeInput(code);
    if (cleanCode.length !== 6) {
      setCodeErr(true);
      return;
    }

    setLoading(true);
    setCodeErr(false);
    setErrKey(null);

    try {
      const res = await fetch(`${API_URL}/auth/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code: cleanCode }),
        credentials: 'include',
      });
      const data = await res.json();

      if (!res.ok) {
        setErrKey('codeInvalid');
        setCodeErr(true);
        return;
      }

      localStorage.setItem('admin_user', JSON.stringify(data));
      setSuccess(true);
      onLogin?.();
      navigate('/');
    } catch (err) {
      setErrKey('network');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07080b]">
     
      <div className="absolute inset-0 bg-gradient-to-br from-[#07080b] to-[#1a0a0d]" />
      <div className="bg-grid pointer-events-none absolute inset-0 z-0 opacity-20" />

      <Aurora />

       <div className="pointer-events-none fixed inset-0 z-50">
         <Snowfall />
      </div>

      <div className="absolute right-4 top-4 z-30 sm:right-6 sm:top-6">
        <LangSwitch lang={lang} setLang={setLang} />
      </div>

      <div className="relative z-10 grid min-h-screen lg:grid-cols-[1.15fr_1fr]">
        <div className="relative hidden flex-col justify-between p-12 lg:flex xl:p-16">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff2b3a] to-[#9d0410] shadow-[0_14px_40px_-10px_rgba(255,43,58,0.8)]">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div className="leading-tight">
              <p className="text-xl font-black tracking-tight text-white">Mobiuz</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">{t.brandSub}</p>
            </div>
          </div>

          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-zinc-300 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-[#ff6b75]" />
              {t.badge}
            </div>

            <h1 className="text-[56px] font-black leading-[1.02] tracking-tight xl:text-[72px]">
              {t.headline.split(' ').map((w, i) => (
                <span key={i} className="mr-[0.22em] inline-block align-bottom">
                  <span className={`inline-block ${i > 0 ? 'text-grad' : 'text-white'}`}>{w}</span>
                </span>
              ))}
            </h1>

            <p className="mt-6 max-w-lg text-base leading-relaxed text-zinc-400">{t.sub}</p>
          </div>

          <p className="text-xs text-zinc-600">© {new Date().getFullYear()} Mobiuz</p>
        </div>

        <div className="flex items-center justify-center p-5 pt-20 sm:p-8 sm:pt-24 lg:pt-8">
          <div className="glass w-full max-w-[440px] rounded-[32px] p-7 sm:p-10 relative overflow-hidden">
            
            <AnimatePresence mode="wait">
              {forgotStep > 0 ? (
                <motion.div
                  key="forgot"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-5"
                >
                  <div className="mb-6">
                    <button
                      onClick={() => setForgotStep(0)}
                      className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white mb-4"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" /> Orqaga
                    </button>
                    <h2 className="text-2xl font-black text-white">
                      {forgotStep === 1 ? t.forgotTitle : t.forgotCodeTitle}
                    </h2>
                    <p className="mt-1 text-sm text-zinc-400">
                      {forgotStep === 1 ? t.forgotSub : t.forgotCodeSub}
                    </p>
                  </div>

                  {forgotStep === 1 && (
                    <>
                      <div>
                        <label className="label">Email</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-zinc-500" />
                          <input
                            type="email"
                            placeholder={t.emailPh}
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            className="input py-3.5 pl-12"
                          />
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          const cleanEmail = sanitizeInput(forgotEmail);
                          if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) return;
                          setForgotLoading(true);
                          try {
                            const res = await fetch(`${API_URL}/auth/forgot-password`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ email: cleanEmail }),
                            });
                            const data = await res.json();
                            if (res.ok) {
                              setForgotUserId(data.userId);
                              setForgotStep(2);
                            } else {
                              alert(data.error || 'Xatolik');
                            }
                          } catch { alert('Tarmoq xatosi'); }
                          finally { setForgotLoading(false); }
                        }}
                        disabled={forgotLoading}
                        className="btn btn-primary w-full py-4 mt-2"
                      >
                        {forgotLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : t.forgotSubmit}
                      </button>
                    </>
                  )}

                  {forgotStep === 2 && (
                    <>
                      <div>
                        <label className="label">{t.codeLabel}</label>
                        <div className="relative">
                          <KeyRound className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-zinc-500" />
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="000000"
                            value={forgotCode}
                            onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, ''))}
                            className="input py-3.5 pl-12 text-center tracking-[0.5em] font-mono text-xl"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="label">Yangi parol</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-zinc-500" />
                          <input
                            type="password"
                            placeholder="Kamida 6 belgi"
                            value={forgotNewPassword}
                            onChange={(e) => setForgotNewPassword(e.target.value)}
                            className="input py-3.5 pl-12"
                          />
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          const cleanCode = sanitizeInput(forgotCode);
                          if (cleanCode.length !== 6 || forgotNewPassword.length < 6) return;
                          setForgotLoading(true);
                          try {
                            const res = await fetch(`${API_URL}/auth/reset-password`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ userId: forgotUserId, code: cleanCode, newPassword: forgotNewPassword }),
                            });
                            const data = await res.json();
                            if (res.ok) {
                              alert(t.resetSuccess);
                              setForgotStep(0);
                              setForgotCode('');
                              setForgotNewPassword('');
                              setPassword('');
                              setStep(1);
                            } else { alert(data.error || 'Xatolik'); }
                          } catch { alert('Tarmoq xatosi'); }
                          finally { setForgotLoading(false); }
                        }}
                        disabled={forgotLoading}
                        className="btn btn-primary w-full py-4 mt-2"
                      >
                        {forgotLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : t.resetBtn}
                      </button>
                    </>
                  )}
                </motion.div>
              ) : step === 1 ? (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-8">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ff2b3a]/10">
                      <Lock className="h-6 w-6 text-[#ff6b75]" />
                    </div>
                    <h2 className="text-3xl font-black tracking-tight text-white">{t.title}</h2>
                    <p className="mt-1.5 text-sm text-zinc-400">{t.subtitle}</p>
                  </div>

                  {errKey && (
                    <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-sm text-rose-300">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{t.errors[errKey]}</span>
                    </div>
                  )}

                  <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                      <label className="label" htmlFor="email">{t.email}</label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-zinc-500" />
                        <input
                          id="email"
                          type="email"
                          autoComplete="username"
                          placeholder={t.emailPh}
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (emailErr) setEmailErr(false);
                          }}
                          className={`input py-3.5 pl-12 ${emailErr ? 'border-rose-500/60' : ''}`}
                        />
                      </div>
                      {emailErr && <p className="mt-2 text-xs font-semibold text-rose-400">{t.emailInvalid}</p>}
                    </div>

                    <div>
                      <label className="label" htmlFor="password">{t.password}</label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-zinc-500" />
                        <input
                          id="password"
                          type={showPass ? 'text' : 'password'}
                          autoComplete="current-password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (passErr) setPassErr(false);
                          }}
                          onKeyUp={onPassKey}
                          onKeyDown={onPassKey}
                          className={`input py-3.5 pl-12 pr-12 ${passErr ? 'border-rose-500/60' : ''}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-zinc-500 hover:text-white"
                        >
                          {showPass ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                        </button>
                      </div>
                      {passErr && <p className="mt-2 text-xs font-semibold text-rose-400">{t.passEmpty}</p>}
                      {caps && (
                        <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                          <ArrowUp className="h-3.5 w-3.5" /> {t.caps}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={remember}
                        onClick={() => setRemember((v) => !v)}
                        className="flex items-center gap-2.5 text-[13px] font-semibold text-zinc-400 transition-colors hover:text-white"
                      >
                        <span className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all ${remember ? 'border-[#ff2b3a] bg-[#ff2b3a]' : 'border-white/20 bg-white/5'}`}>
                          {remember && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                        </span>
                        {t.remember}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotStep(1);
                          setForgotEmail(email);
                        }}
                        className="flex items-center gap-1.5 text-[13px] font-semibold text-[#ff6b75]"
                      >
                        <HelpCircle className="h-3.5 w-3.5" /> {t.forgot}
                      </button>
                    </div>

                    <button type="submit" disabled={loading} className="btn btn-primary w-full py-4 text-[15px] mt-2">
                      {loading ? (
                        <><Loader2 className="h-5 w-5 animate-spin" /> {t.submitting}</>
                      ) : (
                        <>{t.submit} <ArrowRight className="h-4 w-4" /></>
                      )}
                    </button>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-8">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10">
                      <KeyRound className="h-6 w-6 text-emerald-400" />
                    </div>
                    <h2 className="text-3xl font-black tracking-tight text-white">{t.codeTitle}</h2>
                    <p className="mt-1.5 text-sm text-zinc-400">{t.codeSub}</p>
                  </div>

                  {errKey && (
                    <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-sm text-rose-300">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{t.errors[errKey]}</span>
                    </div>
                  )}

                  <form onSubmit={handleVerifyCode} className="space-y-5">
                    <div>
                      <label className="label" htmlFor="code">{t.codeLabel}</label>
                      <div className="relative">
                        <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-zinc-500" />
                        <input
                          id="code"
                          type="text"
                          maxLength={6}
                          autoFocus
                          placeholder={t.codePh}
                          value={code}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            setCode(val);
                            if (codeErr) setCodeErr(false);
                          }}
                          className={`input py-3.5 pl-12 text-center tracking-[0.5em] font-mono text-xl ${codeErr ? 'border-rose-500/60' : ''}`}
                        />
                      </div>
                    </div>

                    <button type="submit" disabled={loading || code.length !== 6} className="btn btn-primary w-full py-4 text-[15px] mt-2">
                      {loading ? (
                        <><Loader2 className="h-5 w-5 animate-spin" /> {t.verifying}</>
                      ) : (
                        <>{t.verify} <ArrowRight className="h-4 w-4" /></>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setStep(1);
                        setCode('');
                        setErrKey(null);
                        setCodeErr(false);
                      }}
                      className="w-full text-center text-sm font-semibold text-zinc-400 hover:text-white mt-4"
                    >
                      {t.backToLogin}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </div>
    </div>
  );
}
