import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  User, Lock, Upload, Star, Save, Shield, UserPlus, Plus, Trash2, Crown, Eye, EyeOff,
  Wand2, Copy, Check, Languages, Keyboard, Mail, Phone, Settings as SettingsIcon, X,
  KeyRound,
} from 'lucide-react';
import {
  getMe, updateProfile, changePassword, getAdmins, createAdmin, deleteAdmin,
} from '../api';
import PageHeader from '../components/PageHeader';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { Avatar, Field, SearchBox, Segmented, ErrorState, PageSkeleton } from '../components/ui/Kit';
import SpotlightCard from '../components/SpotlightCard';
import AnimatedNumber from '../components/AnimatedNumber';
import { Ring } from '../components/Charts';
import { useToast } from '../components/Toast';
import { useT } from '../hooks/useT';
import { idOf, copyText } from '../utils/text';
import type { Lang } from '../hooks/useLang';

const API_ORIGIN: string = (import.meta as any).env?.VITE_API_ORIGIN || 'http://localhost:5000';
const MAX_MB = 5;

const imgUrl = (img?: string): string => {
  if (!img) return '';
  return /^(https?:|data:|blob:)/i.test(img) ? img : `${API_ORIGIN}${img}`;
};

// ==================== TARJIMALAR ====================
const T = {
  uz: {
    eyebrow: 'Tizim',
    subtitle: 'Profil, xavfsizlik va adminlar',
    profile: {
      title: "Profil ma'lumotlari",
      name: 'Ism',
      phone: 'Telefon raqam',
      email: 'Email',
      emailLocked: "Emailni o'zgartirib bo'lmaydi",
      upload: 'Rasm yuklash',
      change: 'Rasmni almashtirish',
      remove: 'Olib tashlash',
      uploading: 'Yuklanmoqda…',
      save: 'Saqlash',
      saved: 'Profil saqlandi',
      uploadError: 'Rasm yuklashda xatolik',
      tooBig: `Rasm ${MAX_MB} MB dan katta`,
      notImage: 'Faqat rasm fayli yuklash mumkin',
      unsaved: "Saqlanmagan o'zgarishlar bor",
    },
    complete: {
      title: "Profil to'liqligi",
      done: "Profil to'liq to'ldirilgan 🎉",
      todo: (n: number) => `Yana ${n} ta maydonni to'ldiring`,
      name: 'Ism',
      phone: 'Telefon',
      avatar: 'Rasm',
    },
    rating: { title: 'Reyting', average: "O'rtacha baho" },
    security: {
      title: 'Xavfsizlik',
      text: 'Parolingizni muntazam yangilab turing',
      change: "Parolni o'zgartirish",
      old: 'Eski parol',
      new: 'Yangi parol',
      confirm: 'Parolni takrorlang',
      changed: "Parol o'zgartirildi",
      mismatch: 'Parollar mos kelmadi',
      short: 'Kamida 8 ta belgi bo‘lsin',
      same: 'Yangi parol eskisidan farq qilishi kerak',
      strength: ['Juda zaif', 'Zaif', "O'rtacha", 'Yaxshi', 'Kuchli'],
      show: "Ko'rsatish",
      hide: 'Yashirish',
    },
    language: { title: 'Interfeys tili', text: 'Admin panel qaysi tilda ko‘rsatilsin' },
    admins: {
      title: 'Adminlar',
      add: 'Yangi admin',
      addTitle: "Yangi admin qo'shish",
      addSubtitle: 'Yangi foydalanuvchi shu email va parol bilan kiradi',
      searchPh: 'Ism yoki email…',
      name: 'Ism',
      email: 'Email',
      password: 'Parol',
      phone: 'Telefon',
      role: 'Rol',
      hr: 'HR',
      admin: 'Admin',
      you: 'Siz',
      added: "Admin qo'shildi",
      deleted: "Admin o'chirildi",
      delTitle: "Adminni o'chirasizmi?",
      delText: (n: string) => `${n} tizimdan o'chiriladi.`,
      emailErr: "Email noto'g'ri",
      generate: 'Yaratish',
      empty: 'Hech kim topilmadi',
    },
    shortcuts: {
      title: 'Tezkor tugmalar',
      items: [
        ['Ctrl + K', 'Qidiruv paneli'],
        ['Ctrl + B', "Sidebarni yig'ish"],
        ['N', "Yangi element qo'shish"],
        ['/', "Qidiruvga o'tish"],
      ] as [string, string][],
    },
  },
  ru: {
    eyebrow: 'Система',
    subtitle: 'Профиль, безопасность и администраторы',
    profile: {
      title: 'Данные профиля',
      name: 'Имя',
      phone: 'Номер телефона',
      email: 'Email',
      emailLocked: 'Email изменить нельзя',
      upload: 'Загрузить фото',
      change: 'Заменить фото',
      remove: 'Убрать',
      uploading: 'Загрузка…',
      save: 'Сохранить',
      saved: 'Профиль сохранён',
      uploadError: 'Ошибка загрузки фото',
      tooBig: `Изображение больше ${MAX_MB} МБ`,
      notImage: 'Можно загружать только изображения',
      unsaved: 'Есть несохранённые изменения',
    },
    complete: {
      title: 'Заполненность профиля',
      done: 'Профиль заполнен полностью 🎉',
      todo: (n: number) => `Заполните ещё полей: ${n}`,
      name: 'Имя',
      phone: 'Телефон',
      avatar: 'Фото',
    },
    rating: { title: 'Рейтинг', average: 'Средняя оценка' },
    security: {
      title: 'Безопасность',
      text: 'Регулярно обновляйте пароль',
      change: 'Изменить пароль',
      old: 'Старый пароль',
      new: 'Новый пароль',
      confirm: 'Повторите пароль',
      changed: 'Пароль изменён',
      mismatch: 'Пароли не совпадают',
      short: 'Минимум 8 символов',
      same: 'Новый пароль должен отличаться от старого',
      strength: ['Очень слабый', 'Слабый', 'Средний', 'Хороший', 'Надёжный'],
      show: 'Показать',
      hide: 'Скрыть',
    },
    language: { title: 'Язык интерфейса', text: 'На каком языке показывать админ-панель' },
    admins: {
      title: 'Администраторы',
      add: 'Новый админ',
      addTitle: 'Добавить администратора',
      addSubtitle: 'Новый пользователь войдёт с этим email и паролем',
      searchPh: 'Имя или email…',
      name: 'Имя',
      email: 'Email',
      password: 'Пароль',
      phone: 'Телефон',
      role: 'Роль',
      hr: 'HR',
      admin: 'Админ',
      you: 'Вы',
      added: 'Администратор добавлен',
      deleted: 'Администратор удалён',
      delTitle: 'Удалить администратора?',
      delText: (n: string) => `${n} будет удалён из системы.`,
      emailErr: 'Неверный email',
      generate: 'Создать',
      empty: 'Никого не найдено',
    },
    shortcuts: {
      title: 'Горячие клавиши',
      items: [
        ['Ctrl + K', 'Панель поиска'],
        ['Ctrl + B', 'Свернуть меню'],
        ['N', 'Добавить элемент'],
        ['/', 'Перейти к поиску'],
      ] as [string, string][],
    },
  },
};

const LANGS: { id: Lang; label: string; sub: string }[] = [
  { id: 'uz', label: "O'zbekcha", sub: 'UZ' },
  { id: 'ru', label: 'Русский', sub: 'RU' },
];

// ==================== Yordamchilar ====================
const EMAIL_RE = /^\S+@\S+\.\S+$/;

const genPassword = (len = 14): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => chars[n % chars.length]).join('');
};

/** 0 (bo'sh) … 4 (kuchli) */
const strengthOf = (p: string): number => {
  if (!p) return 0;
  let s = 0;
  if (p.length >= 8) s++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  if (p.length < 6) s = Math.min(s, 1);
  return Math.max(1, s);
};

const STRENGTH_COLORS = ['', 'bg-rose-500', 'bg-amber-500', 'bg-sky-500', 'bg-emerald-500'];

export default function SettingsPage() {
  const { t: g, lang, setLang } = useT();
  const t = T[lang];
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [admins, setAdmins] = useState<any[]>([]);

  // Profil
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');
  const [uploading, setUploading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Parol
  const [passOpen, setPassOpen] = useState(false);
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [passErrs, setPassErrs] = useState<Record<string, string>>({});
  const [savingPass, setSavingPass] = useState(false);

  // Adminlar
  const [adminQ, setAdminQ] = useState('');
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '', role: 'hr', phone: '' });
  const [adminErrs, setAdminErrs] = useState<Record<string, string>>({});
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [adminPassCopied, setAdminPassCopied] = useState(false);
  const [delAdmin, setDelAdmin] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);


  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadErr(false);
    try {
      const [me, all] = await Promise.all([getMe(), getAdmins()]);
      setUser(me);
      setAdmins(Array.isArray(all) ? all : []);
      setName(me?.name || '');
      setPhone(me?.phone || '');
      setAvatar(me?.avatar || '');
    } catch {
      setLoadErr(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const isAdmin = user?.role === 'admin';
  const dirty = !!user && (name !== (user.name || '') || phone !== (user.phone || '') || avatar !== (user.avatar || ''));

  const completeness = useMemo(() => {
    const parts = [
      { key: 'name', label: t.complete.name, ok: !!name.trim() },
      { key: 'phone', label: t.complete.phone, ok: !!phone.trim() },
      { key: 'avatar', label: t.complete.avatar, ok: !!avatar },
    ];
    const done = parts.filter((p) => p.ok).length;
    return { parts, done, pct: Math.round((done / parts.length) * 100) };
  }, [name, phone, avatar, t.complete]);

  const shownAdmins = useMemo(() => {
    const s = adminQ.trim().toLowerCase();
    return admins.filter((a) => !s || `${a.name} ${a.email}`.toLowerCase().includes(s));
  }, [admins, adminQ]);

  // ---------- Rasm ----------
  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error(t.profile.notImage);
    if (file.size > MAX_MB * 1024 * 1024) return toast.error(t.profile.tooBig);

    setUploading(true);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const { data } = await axios.post(`${API_ORIGIN}/api/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAvatar(data.url);
    } catch {
      toast.error(t.profile.uploadError);
    } finally {
      setUploading(false);
    }
  };

  // ---------- Profilni saqlash ----------
  const saveProfile = async (ev: FormEvent) => {
    ev.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await updateProfile({ name, phone, avatar });
      try {
        const cur = JSON.parse(localStorage.getItem('admin_user') || '{}');
        localStorage.setItem(
          'admin_user',
          JSON.stringify({ ...cur, name: updated?.name ?? name, phone: updated?.phone ?? phone, avatar: updated?.avatar ?? avatar })
        );
        window.dispatchEvent(new Event('storage'));
      } catch {
        /* jim */
      }
      toast.success(t.profile.saved);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || g.common.saveError);
    } finally {
      setSavingProfile(false);
    }
  };

  // ---------- Parol ----------
  const openPass = () => {
    setOldPass('');
    setNewPass('');
    setConfirmPass('');
    setShowPass(false);
    setPassErrs({});
    setPassOpen(true);
  };

  const submitPass = async (ev: FormEvent) => {
    ev.preventDefault();
    const e: Record<string, string> = {};
    if (!oldPass) e.old = g.common.required;
    if (newPass.length < 8) e.new = t.security.short;
    else if (newPass === oldPass) e.new = t.security.same;
    if (confirmPass !== newPass) e.confirm = t.security.mismatch;
    setPassErrs(e);
    if (Object.keys(e).length) return;

    setSavingPass(true);
    try {
      await changePassword({ oldPassword: oldPass, newPassword: newPass });
      toast.success(t.security.changed);
      setPassOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || g.common.saveError);
    } finally {
      setSavingPass(false);
    }
  };

  // ---------- Adminlar ----------
  const openAdmin = () => {
    setAdminForm({ name: '', email: '', password: '', role: 'hr', phone: '' });
    setAdminErrs({});
    setAdminPassCopied(false);
    setAdminOpen(true);
  };

 const submitAdmin = async (ev: FormEvent) => {
  ev.preventDefault();
  const e: Record<string, string> = {};
  if (!adminForm.name.trim()) e.name = g.common.required;
  if (!EMAIL_RE.test(adminForm.email.trim())) e.email = t.admins.emailErr;
  if (adminForm.password.length < 8) e.password = t.security.short;
  setAdminErrs(e);
  if (Object.keys(e).length) return;

  setSavingAdmin(true);
  try {
    // ⚡ API'dan qaytgan javobni ushlab olamiz
    const res = await createAdmin({
      ...adminForm,
      email: adminForm.email.trim(),
      name: adminForm.name.trim(),
    });

    toast.success(t.admins.added);
    setAdminOpen(false);

    // ⚡ Agar API taklif kodi qaytargan bo'lsa, modalni ochamiz
    if (res && res.invite_code) {
      setInviteCode(res.invite_code);
      setShowInviteModal(true);
    }

    load();
  } catch (err: any) {
    toast.error(err?.response?.data?.error || g.common.saveError);
  } finally {
    setSavingAdmin(false);
  }
};

  const confirmDeleteAdmin = async () => {
    if (!delAdmin) return;
    setDeleting(true);
    try {
      await deleteAdmin(idOf(delAdmin));
      toast.success(t.admins.deleted);
      setDelAdmin(null);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || g.common.deleteError);
    } finally {
      setDeleting(false);
    }
  };

  const copyAdminPass = async () => {
    if (!adminForm.password) return;
    if (await copyText(adminForm.password)) {
      setAdminPassCopied(true);
      toast.success(g.common.copied);
      setTimeout(() => setAdminPassCopied(false), 2000);
    }
  };

  const strength = strengthOf(newPass);
  const adminStrength = strengthOf(adminForm.password);
  const rating = Number(user?.rating ?? 5);

  // ==================== RENDER ====================
  return (
    <div>
      <PageHeader
        eyebrow={t.eyebrow}
        title={g.settings.title}
        subtitle={t.subtitle}
        icon={SettingsIcon}
      />

      {loading ? (
        <PageSkeleton />
      ) : loadErr || !user ? (
        <ErrorState onRetry={load} />
      ) : (
        <div className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-3">
            {/* ============ PROFIL ============ */}
            <SpotlightCard className="p-6 lg:col-span-2">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10">
                  <User className="h-5 w-5 text-rose-400" />
                </div>
                <h3 className="font-extrabold text-white">{t.profile.title}</h3>
                {dirty && (
                  <span className="badge ml-auto bg-amber-500/15 text-amber-400">{t.profile.unsaved}</span>
                )}
              </div>

              <form onSubmit={saveProfile} className="space-y-5">
                <div className="flex flex-wrap items-center gap-5">
                  <Avatar text={name || user.email || 'A'} src={imgUrl(avatar)} size={88} className="!rounded-3xl" />
                  <div className="flex flex-wrap gap-2">
                    <label className="btn btn-ghost cursor-pointer">
                      <Upload className="h-4 w-4" />
                      {uploading ? t.profile.uploading : avatar ? t.profile.change : t.profile.upload}
                      <input type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
                    </label>
                    {avatar && (
                      <button type="button" onClick={() => setAvatar('')} className="btn btn-danger">
                        <X className="h-4 w-4" /> {t.profile.remove}
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label={t.profile.name}>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-zinc-500" />
                      <input value={name} onChange={(e) => setName(e.target.value)} className="input py-3 pl-11" />
                    </div>
                  </Field>
                  <Field label={t.profile.phone}>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-zinc-500" />
                      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 99 123 45 67" className="input py-3 pl-11" />
                    </div>
                  </Field>
                </div>

                <Field label={t.profile.email} hint={t.profile.emailLocked}>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-zinc-500" />
                    <input value={user.email || ''} disabled className="input cursor-not-allowed py-3 pl-11 opacity-60" />
                  </div>
                </Field>

                <button type="submit" disabled={!dirty || savingProfile} className="btn btn-primary">
                  <Save className="h-4 w-4" />
                  {savingProfile ? g.common.saving : t.profile.save}
                </button>
              </form>
            </SpotlightCard>

            {/* ============ O'NG USTUN ============ */}
            <div className="space-y-5">
              <SpotlightCard className="p-6">
                <h3 className="mb-4 font-extrabold text-white">{t.complete.title}</h3>
                <div className="flex items-center gap-5">
                  <Ring value={completeness.pct} size={104} thickness={11}>
                    <p className="text-xl font-black text-white">
                      <AnimatedNumber value={completeness.pct} suffix="%" />
                    </p>
                  </Ring>
                  <ul className="flex-1 space-y-2">
                    {completeness.parts.map((p) => (
                      <li key={p.key} className="flex items-center gap-2 text-sm">
                        <span className={`flex h-5 w-5 items-center justify-center rounded-full ${p.ok ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/[0.06] text-zinc-600'}`}>
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                        <span className={p.ok ? 'font-semibold text-zinc-200' : 'text-zinc-500'}>{p.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="mt-4 text-xs text-zinc-500">
                  {completeness.done === 3 ? t.complete.done : t.complete.todo(3 - completeness.done)}
                </p>
              </SpotlightCard>

              <SpotlightCard className="p-6">
                <h3 className="mb-3 flex items-center gap-2 font-extrabold text-white">
                  <Star className="h-5 w-5 text-amber-400" /> {t.rating.title}
                </h3>
                <div className="flex items-end gap-4">
                  <p className="text-5xl font-black leading-none text-white">
                    <AnimatedNumber value={rating} decimals={1} />
                  </p>
                  <div className="pb-1">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} className={`h-4 w-4 ${n <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'}`} />
                      ))}
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">{t.rating.average}</p>
                  </div>
                </div>
              </SpotlightCard>

              <SpotlightCard className="p-6">
                <h3 className="mb-1 flex items-center gap-2 font-extrabold text-white">
                  <Shield className="h-5 w-5 text-emerald-400" /> {t.security.title}
                </h3>
                <p className="mb-4 text-xs text-zinc-500">{t.security.text}</p>
                <button onClick={openPass} className="btn btn-ghost w-full">
                  <Lock className="h-4 w-4" /> {t.security.change}
                </button>
              </SpotlightCard>
            </div>
          </div>

          {/* ============ TIL + TUGMALAR ============ */}
          <div className="grid gap-5 md:grid-cols-2">
            <SpotlightCard className="p-6">
              <h3 className="mb-1 flex items-center gap-2 font-extrabold text-white">
                <Languages className="h-5 w-5 text-sky-400" /> {t.language.title}
              </h3>
              <p className="mb-4 text-xs text-zinc-500">{t.language.text}</p>
              <div className="grid grid-cols-2 gap-3">
                {LANGS.map((l) => {
                  const active = lang === l.id;
                  return (
                    <button
                      key={l.id}
                      onClick={() => setLang(l.id)}
                      aria-pressed={active}
                      className={`relative flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
                        active
                          ? 'border-[#ff2b3a]/60 bg-[#ff2b3a]/10 shadow-[0_0_0_3px_rgba(255,43,58,0.12)]'
                          : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.08]'
                      }`}
                    >
                      <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-xs font-black ${active ? 'bg-[#ff2b3a] text-white' : 'bg-white/10 text-zinc-300'}`}>
                        {l.sub}
                      </span>
                      <span className="font-extrabold text-white">{l.label}</span>
                      {active && <Check className="absolute right-3 top-3 h-4 w-4 text-[#ff6b75]" strokeWidth={3} />}
                    </button>
                  );
                })}
              </div>
            </SpotlightCard>

            <SpotlightCard className="p-6">
              <h3 className="mb-4 flex items-center gap-2 font-extrabold text-white">
                <Keyboard className="h-5 w-5 text-violet-400" /> {t.shortcuts.title}
              </h3>
              <ul className="space-y-2.5">
                {t.shortcuts.items.map(([keys, label]) => (
                  <li key={keys} className="flex items-center justify-between rounded-xl bg-white/[0.04] px-4 py-2.5 text-sm">
                    <span className="text-zinc-300">{label}</span>
                    <span className="flex gap-1">
                      {keys.split(' + ').map((k) => (
                        <span key={k} className="kbd">{k}</span>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </SpotlightCard>
          </div>

          {/* ============ ADMINLAR ============ */}
          <SpotlightCard className="p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 font-extrabold text-white">
                <Crown className="h-5 w-5 text-amber-400" /> {t.admins.title}
                <span className="badge bg-white/10 text-zinc-300">{admins.length}</span>
              </h3>
              <div className="flex flex-wrap items-center gap-3">
                <SearchBox value={adminQ} onChange={setAdminQ} placeholder={t.admins.searchPh} className="w-64" />
                {isAdmin && (
                  <button onClick={openAdmin} className="btn btn-primary">
                    <Plus className="h-4 w-4" /> {t.admins.add}
                  </button>
                )}
              </div>
            </div>

            {shownAdmins.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-500">{t.admins.empty}</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {shownAdmins.map((a, i) => {
                  const mine = idOf(a) === idOf(user);
                  return (
                    <motion.div
                      key={idOf(a)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i, 8) * 0.04 }}
                      className={`flex items-center gap-4 rounded-2xl border p-4 ${mine ? 'border-[#ff2b3a]/30 bg-[#ff2b3a]/[0.06]' : 'border-white/[0.06] bg-white/[0.03]'}`}
                    >
                      <Avatar text={a.name || a.email || 'A'} src={imgUrl(a.avatar)} size={46} />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 truncate font-extrabold text-white">
                          {a.name}
                          {mine && <span className="badge bg-[#ff2b3a]/20 text-[#ff6b75]">{t.admins.you}</span>}
                        </p>
                        <p className="truncate text-xs text-zinc-500">{a.email}</p>
                      </div>
                      <span className={`badge ${a.role === 'admin' ? 'bg-amber-500/15 text-amber-400' : 'bg-sky-500/15 text-sky-400'}`}>
                        {a.role === 'admin' ? <Crown className="h-3 w-3" /> : null}
                        {a.role === 'admin' ? t.admins.admin : t.admins.hr}
                      </span>
                      <span className="flex items-center gap-1 text-sm font-black text-white">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        {Number(a.rating ?? 5).toFixed(1)}
                      </span>
                      {isAdmin && !mine && (
                        <button onClick={() => setDelAdmin(a)} title={g.common.delete} className="rounded-lg p-2 text-rose-400 hover:bg-rose-500/10">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </SpotlightCard>
        </div>
      )}

      {/* ============ PAROLNI O'ZGARTIRISH ============ */}
      <Modal
        open={passOpen}
        onClose={() => setPassOpen(false)}
        title={t.security.change}
        icon={Lock}
        size="sm"
        footer={
          <>
            <button type="button" onClick={() => setPassOpen(false)} className="btn btn-ghost">{g.common.cancel}</button>
            <button type="submit" form="pass-form" disabled={savingPass} className="btn btn-primary">
              {savingPass ? g.common.saving : g.common.save}
            </button>
          </>
        }
      >
        <form id="pass-form" onSubmit={submitPass} noValidate className="space-y-4">
          <Field label={t.security.old} required error={passErrs.old}>
            <input type={showPass ? 'text' : 'password'} value={oldPass} onChange={(e) => setOldPass(e.target.value)} autoComplete="current-password" autoFocus className={`input ${passErrs.old ? 'border-rose-500/60' : ''}`} />
          </Field>

          <Field label={t.security.new} required error={passErrs.new}>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} value={newPass} onChange={(e) => setNewPass(e.target.value)} autoComplete="new-password" className={`input pr-12 ${passErrs.new ? 'border-rose-500/60' : ''}`} />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                aria-label={showPass ? t.security.hide : t.security.show}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-zinc-500 hover:text-white"
              >
                {showPass ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
              </button>
            </div>
            {newPass && (
              <div className="mt-2.5">
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className={`h-1.5 flex-1 rounded-full transition-colors ${n <= strength ? STRENGTH_COLORS[strength] : 'bg-white/10'}`} />
                  ))}
                </div>
                <p className="mt-1.5 text-xs font-semibold text-zinc-400">{t.security.strength[strength]}</p>
              </div>
            )}
          </Field>

          <Field label={t.security.confirm} required error={passErrs.confirm}>
            <input type={showPass ? 'text' : 'password'} value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} autoComplete="new-password" className={`input ${passErrs.confirm ? 'border-rose-500/60' : ''}`} />
          </Field>
        </form>
      </Modal>

      {/* ============ ADMIN QO'SHISH ============ */}
      <Modal
        open={adminOpen}
        onClose={() => setAdminOpen(false)}
        title={t.admins.addTitle}
        subtitle={t.admins.addSubtitle}
        icon={UserPlus}
        footer={
          <>
            <button type="button" onClick={() => setAdminOpen(false)} className="btn btn-ghost">{g.common.cancel}</button>
            <button type="submit" form="admin-form" disabled={savingAdmin} className="btn btn-primary">
              {savingAdmin ? g.common.saving : g.common.save}
            </button>
          </>
        }
      >
        <form id="admin-form" onSubmit={submitAdmin} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t.admins.name} required error={adminErrs.name}>
              <input value={adminForm.name} onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })} autoFocus className={`input ${adminErrs.name ? 'border-rose-500/60' : ''}`} />
            </Field>
            <Field label={t.admins.phone}>
              <input value={adminForm.phone} onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })} className="input" />
            </Field>
          </div>

          <Field label={t.admins.email} required error={adminErrs.email}>
            <input type="email" value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} className={`input ${adminErrs.email ? 'border-rose-500/60' : ''}`} />
          </Field>

          <Field label={t.admins.password} required error={adminErrs.password}>
            <div className="flex gap-2">
              <input value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} className={`input font-mono ${adminErrs.password ? 'border-rose-500/60' : ''}`} />
              <button type="button" onClick={() => setAdminForm({ ...adminForm, password: genPassword() })} title={t.admins.generate} className="btn btn-ghost shrink-0 !px-3.5">
                <Wand2 className="h-4 w-4" />
              </button>
              <button type="button" onClick={copyAdminPass} title={g.common.copy} className="btn btn-ghost shrink-0 !px-3.5">
                {adminPassCopied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            {adminForm.password && (
              <div className="mt-2.5 flex gap-1.5">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className={`h-1.5 flex-1 rounded-full transition-colors ${n <= adminStrength ? STRENGTH_COLORS[adminStrength] : 'bg-white/10'}`} />
                ))}
              </div>
            )}
          </Field>

          <Field label={t.admins.role} required>
            <Segmented
              value={adminForm.role as 'hr' | 'admin'}
              onChange={(v) => setAdminForm({ ...adminForm, role: v })}
              options={[
                { id: 'hr', label: t.admins.hr },
                { id: 'admin', label: t.admins.admin },
              ]}
            />
          </Field>
        </form>
      </Modal>

      {/* ============ ADMINNI O'CHIRISH ============ */}
      <ConfirmDialog
        open={!!delAdmin}
        loading={deleting}
        title={t.admins.delTitle}
        message={delAdmin ? t.admins.delText(delAdmin.name || delAdmin.email) : ''}
        onConfirm={confirmDeleteAdmin}
        onCancel={() => setDelAdmin(null)}
      />



      {/* ============ TAKLIF KODINI KO'RSATISH ============ */}
      <Modal
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Taklif kodi yaratildi!"
        icon={KeyRound}
        footer={
          <button onClick={() => setShowInviteModal(false)} className="btn btn-primary w-full">
            Tushundim
          </button>
        }
      >
        <div className="text-center space-y-4">
          <p className="text-sm text-zinc-400">
            Yangi HR ni botga ulash uchun quyidagi kodni bering:
          </p>
          <div className="bg-white/[0.05] p-6 rounded-2xl border border-white/10">
            <p className="text-4xl font-black text-[#ff6b75] tracking-widest font-mono">
              {inviteCode}
            </p>
          </div>
          <p className="text-xs text-zinc-500">
            Bu kod 24 soat amal qiladi. HR botga kirib, "Men adminman" tugmasini bosgach, shu kodni kiritishi kerak.
          </p>
        </div>
      </Modal>
    </div>

  );
}