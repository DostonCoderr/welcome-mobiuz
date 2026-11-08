// bot/src/bot.ts
import { Telegraf, Markup, Context } from 'telegraf';
import dotenv from 'dotenv';
import { translations, Lang } from './translations';
import {
  convertDate,
  validatePassport,
  getEmployeeByTelegramId,
  getEmployeeByPassport,
  saveTelegramId,
  saveLanguage,
} from './helpers';

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN!;
const WEBAPP_URL = process.env.WEBAPP_URL || 'http://localhost:5173';
const ADMIN_PANEL_URL = process.env.ADMIN_PANEL_URL || 'http://localhost:5173';
const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const HR_PHONE = process.env.HR_PHONE || '+998 XX XXX XX XX';

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN topilmadi!');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const HTML = { parse_mode: 'HTML' as const };

// ==================== XAVFSIZLIK ====================
interface SecurityRecord {
  attempts: number;
  blockedUntil: number | null;
}
const securityMap = new Map<number, SecurityRecord>();

const checkBruteForce = (tgId: number): { allowed: boolean; waitMinutes?: number } => {
  const record = securityMap.get(tgId) || { attempts: 0, blockedUntil: null };
  const now = Date.now();

  if (record.blockedUntil && record.blockedUntil > now) {
    const waitMinutes = Math.ceil((record.blockedUntil - now) / 60000);
    return { allowed: false, waitMinutes };
  }

  if (record.blockedUntil && record.blockedUntil <= now) {
    record.attempts = 0;
    record.blockedUntil = null;
  }

  return { allowed: true };
};

const registerFailedAttempt = (tgId: number): void => {
  const record = securityMap.get(tgId) || { attempts: 0, blockedUntil: null };
  record.attempts += 1;

  if (record.attempts >= 3) {
    record.blockedUntil = Date.now() + 5 * 60 * 1000;
    record.attempts = 0;
  }

  securityMap.set(tgId, record);
};

const clearSecurityRecord = (tgId: number): void => {
  securityMap.delete(tgId);
};

const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '').slice(0, 50);
};

// ==================== STATE ====================
interface UserState {
  step: 'choose_role' | 'passport' | 'birthdate' | 'done' | 'awaiting_admin_code';
  lang: Lang;
  attempts: number;
  passport?: string;
  docId?: string;
}

const states = new Map<number, UserState>();
const MAX_ATTEMPTS = 3;

const guessLang = (ctx: Context): Lang =>
  ctx.from?.language_code?.startsWith('ru') ? 'ru' : 'uz';

const buildWebAppUrl = (docId: string, lang: string) =>
  `${WEBAPP_URL}/?token=${Buffer.from(`${docId}:${Date.now()}`).toString('base64')}&lang=${lang}`;

async function resolveState(ctx: Context): Promise<UserState | undefined> {
  const tgId = ctx.from!.id;
  const cached = states.get(tgId);
  if (cached) return cached;

  const emp = await getEmployeeByTelegramId(tgId);
  if (!emp) return undefined;

  const lang: Lang = emp.language === 'ru' || emp.language === 'uz' ? emp.language : guessLang(ctx);
  const restored: UserState = { step: 'done', lang, attempts: 0, docId: emp.documentId };
  states.set(tgId, restored);
  return restored;
}

// ==================== KEYBOARDS ====================
const langKeyboard = () =>
  Markup.inlineKeyboard([
    [
      Markup.button.callback('🇺🇿 O\'zbekcha', 'start_lang_uz'),
      Markup.button.callback('🇷🇺 Русский', 'start_lang_ru'),
    ],
  ]);

const cancelKeyboard = (lang: Lang) =>
  Markup.inlineKeyboard([[Markup.button.callback(translations[lang].btnCancel, 'cancel')]]);

const mainKeyboard = (lang: Lang, docId: string) => {
  const t = translations[lang];
  return Markup.keyboard([
    [Markup.button.webApp(t.btnOpen, buildWebAppUrl(docId, lang))],
    [t.btnHelp, t.btnLang],
  ]).resize();
};

// ==================== /start ====================
bot.start(async (ctx) => {
  const tgId = ctx.from.id;
  const name = ctx.from.first_name || '';

  states.delete(tgId);
  clearSecurityRecord(tgId);

  // Rasmni yuborish (agar URL bo'lsa)
  const logoUrl = 'https://welcome-mobi.uz/logo.png'; // <-- O'zingizning rasm havolangiz
  
  try {
    await ctx.replyWithPhoto(logoUrl, {
      caption: `👋 <b>Assalomu alaykum, ${name}!</b>\n\n` +
               `<b>Mobiuz Welcome Book</b> — yangi xodimlar uchun qo'llanma.`,
      parse_mode: 'HTML'
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    await ctx.reply(
      `Davom etish uchun iltimos, tilni tanlang:`,
      {
        ...HTML,
        ...langKeyboard(),
      }
    );
  } catch (error) {
    await ctx.reply(
      `👋 <b>Assalomu alaykum, ${name}!</b>\n\n` +
      `<b>Mobiuz Welcome Book</b> — yangi xodimlar uchun qo'llanma.\n\n` +
      `Davom etish uchun iltimos, tilni tanlang:`,
      {
        ...HTML,
        ...langKeyboard(),
      }
    );
  }
});

// ==================== TIL TANLASH (START) ====================
bot.action(/^start_lang_(uz|ru)$/, async (ctx) => {
  const lang = ctx.match[1] as Lang;
  const tgId = ctx.from.id;
  await ctx.answerCbQuery();
  await ctx.deleteMessage().catch(() => {});

  states.set(tgId, { step: 'choose_role', lang, attempts: 0 });

  const msg = lang === 'uz'
    ? `👋 <b>Assalomu alaykum!</b>\n\nIltimos, tizimga qanday maqsadda kirganingizni tanlang:\n\n`
    : `👋 <b>Здравствуйте!</b>\n\nПожалуйста, выберите цель входа в систему:\n\n`;

  const btnEmployee = lang === 'uz' ? '👤 Men xodimman' : '👤 Я сотрудник';
  const btnAdmin = lang === 'uz' ? '🛡️ Men adminman' : '🛡️ Я админ';

  await ctx.reply(msg, {
    ...HTML,
    ...Markup.inlineKeyboard([
      [Markup.button.callback(btnEmployee, 'role_employee')],
      [Markup.button.callback(btnAdmin, 'role_admin')],
    ]),
  });
});

// ==================== ROL TANLASH ====================
bot.action('role_employee', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.deleteMessage().catch(() => {});

  const state = states.get(ctx.from.id);
  const lang = state?.lang || guessLang(ctx);
  const tgId = ctx.from.id;

  const existing = await getEmployeeByTelegramId(tgId);
  if (existing) {
    states.set(tgId, { step: 'done', lang, attempts: 0, docId: existing.documentId });
    return ctx.reply(translations[lang].welcomeBack(ctx.from.first_name || ''), {
      ...HTML,
      ...mainKeyboard(lang, existing.documentId),
    });
  }

  states.set(tgId, { step: 'passport', lang, attempts: 0 });
  await ctx.reply(
    `${translations[lang].startAuth}\n\n${translations[lang].stepPassport()}`,
    { ...HTML, ...cancelKeyboard(lang) }
  );
});

bot.action('role_admin', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.deleteMessage().catch(() => {});

  const state = states.get(ctx.from.id);
  const lang = state?.lang || guessLang(ctx);
  const tgId = ctx.from.id;

  // ⚡ HR dan taklif kodini so'raymiz
  states.set(tgId, { step: 'awaiting_admin_code', lang, attempts: 0 });

  const msg = lang === 'uz'
    ? `🛡️ <b>Admin Panel</b>\n\n` +
      `Tizimga ulanish uchun sizga <b>maxsus taklif kodi</b> berilgan bo'lishi kerak.\n\n` +
      `Iltimos, shu kodni kiriting (masalan: <code>HR7890</code>):`
    : `🛡️ <b>Админ Панель</b>\n\n` +
      `Для подключения к системе у вас должен быть <b>специальный код приглашения</b>.\n\n` +
      `Пожалуйста, введите этот код (например: <code>HR7890</code>):`;

  await ctx.reply(msg, HTML);
});

// ==================== /help, /language ====================
const showHelp = async (ctx: Context) => {
  const state = await resolveState(ctx);
  const lang = state?.lang ?? guessLang(ctx);
  return ctx.reply(translations[lang].help(HR_PHONE), HTML);
};

const showLanguage = async (ctx: Context) => {
  const state = await resolveState(ctx);
  const lang = state?.lang ?? guessLang(ctx);
  return ctx.reply(translations[lang].langPick, { ...HTML, ...langKeyboard() });
};

bot.command('help', showHelp);
bot.command('language', showLanguage);

bot.hears([translations.uz.btnHelp, translations.ru.btnHelp], showHelp);
bot.hears([translations.uz.btnLang, translations.ru.btnLang], showLanguage);

// ==================== TIL ALMASHTIRISH (MENYUDAN) ====================
bot.action(/^lang_(uz|ru)$/, async (ctx) => {
  const lang = ctx.match[1] as Lang;
  const tgId = ctx.from.id;
  const t = translations[lang];
  await ctx.answerCbQuery();

  const state = await resolveState(ctx);

  if (state?.step === 'done' && state.docId) {
    state.lang = lang;
    states.set(tgId, state);
    saveLanguage(state.docId, lang);

    await ctx.deleteMessage().catch(() => {});
    return ctx.reply(t.langChanged, { ...HTML, ...mainKeyboard(lang, state.docId) });
  }

  states.set(tgId, { step: 'passport', lang, attempts: 0 });
  await ctx.editMessageText(`${t.startAuth}\n\n${t.stepPassport()}`, {
    ...HTML,
    ...cancelKeyboard(lang),
  });
});

// ==================== BEKOR QILISH ====================
bot.action('cancel', async (ctx) => {
  const state = states.get(ctx.from.id);
  const lang = state?.lang ?? guessLang(ctx);
  states.delete(ctx.from.id);
  await ctx.answerCbQuery();
  await ctx.editMessageText(translations[lang].cancelled).catch(() => {});
});

// ==================== MATN (TASDIQLASH OQIMI) ====================
bot.on('text', async (ctx) => {
  const tgId = ctx.from.id;
  const text = ctx.message.text.trim();
  const state = await resolveState(ctx);

  if (!state) return ctx.reply(translations[guessLang(ctx)].useStart);
  if (state.step === 'done') return;

  const t = translations[state.lang];

  // ⚡ AGAR HR TAKLIF KODINI YUBORGAN BO'LSA
  if (state.step === 'awaiting_admin_code') {
    const inviteCode = sanitizeInput(text).toUpperCase();

    try {
      const res = await fetch(`${API_URL}/auth/bind-telegram`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-bot-secret': process.env.BOT_SECRET || '', },
        body: JSON.stringify({ invite_code: inviteCode, telegram_id: tgId }),
      });

      if (!res.ok) {
        const err = await res.json();
        return ctx.reply(
          `❌ <b>Xatolik:</b> ${err.error || 'Taklif kodi topilmadi'}`,
          HTML
        );
      }

      // Muvaffaqiyatli!
      states.set(tgId, { step: 'done', lang: state.lang, attempts: 0 });

      const successMsg = state.lang === 'uz'
        ? `✅ <b>Telegram ID ingiz muvaffaqiyatli bog'landi!</b>\n\n` +
          `Endi Admin Panelga o'tib, email va parolingizni kiritishingiz mumkin:\n` +
          `👉 ${ADMIN_PANEL_URL}\n\n` +
          `<i>Tizim sizning Telegramingizga tasdiqlash kodini yuboradi.</i>`
        : `✅ <b>Ваш Telegram ID успешно привязан!</b>\n\n` +
          `Теперь перейдите в Admin Panel и введите email и пароль:\n` +
          `👉 ${ADMIN_PANEL_URL}\n\n` +
          `<i>Система отправит вам код подтверждения в Telegram.</i>`;

      await ctx.reply(successMsg, HTML);
      return;
    } catch (error) {
      return ctx.reply(`❌ Serverga ulanib bo'lmadi. Keyinroq urinib ko'ring.`, HTML);
    }
  }

  // ---------- 1-qadam: PASSPORT ----------
  if (state.step === 'passport') {
    const security = checkBruteForce(tgId);
    if (!security.allowed) {
      return ctx.reply(
        `⛔ <b>Juda ko'p urinish!</b>\n\nIltimos, ${security.waitMinutes} daqiqadan so'ng qayta urinib ko'ring.`,
        HTML
      );
    }

    const cleanText = sanitizeInput(text);

    if (!validatePassport(cleanText)) {
      registerFailedAttempt(tgId);
      state.attempts++;
      if (state.attempts >= MAX_ATTEMPTS) {
        states.delete(tgId);
        return ctx.reply(t.tooMany, HTML);
      }
      return ctx.reply(t.invalidPassport(MAX_ATTEMPTS - state.attempts), {
        ...HTML,
        ...cancelKeyboard(state.lang),
      });
    }

    state.passport = cleanText.toUpperCase();
    state.step = 'birthdate';
    state.attempts = 0;
    states.set(tgId, state);

    return ctx.reply(t.stepBirth(state.passport), { ...HTML, ...cancelKeyboard(state.lang) });
  }

  // ---------- 2-qadam: TUG'ILGAN SANA ----------
  if (state.step === 'birthdate') {
    const security = checkBruteForce(tgId);
    if (!security.allowed) {
      return ctx.reply(
        `⛔ <b>Juda ko'p urinish!</b>\n\nIltimos, ${security.waitMinutes} daqiqadan so'ng qayta urinib ko'ring.`,
        HTML
      );
    }

    const cleanText = sanitizeInput(text);
    const isoDate = convertDate(cleanText);

    if (!isoDate) {
      registerFailedAttempt(tgId);
      state.attempts++;
      if (state.attempts >= MAX_ATTEMPTS) {
        states.delete(tgId);
        return ctx.reply(t.tooMany, HTML);
      }
      return ctx.reply(t.invalidDate(MAX_ATTEMPTS - state.attempts), {
        ...HTML,
        ...cancelKeyboard(state.lang),
      });
    }

    const employee = await getEmployeeByPassport(state.passport!, isoDate);

    if (!employee) {
      registerFailedAttempt(tgId);
      states.delete(tgId);
      return ctx.reply(t.notFound(HR_PHONE), HTML);
    }

    clearSecurityRecord(tgId);
    await saveTelegramId(employee.documentId, tgId);
    saveLanguage(employee.documentId, state.lang);

    const fullEmployee = await getEmployeeByTelegramId(tgId);
    const empData = fullEmployee || employee;

    states.set(tgId, { step: 'done', lang: state.lang, attempts: 0, docId: empData.documentId });

    const pos = empData.position;
    const dep = empData.department;
    const position =
      (state.lang === 'ru' ? pos?.name_ru : pos?.name_uz) || pos?.name_uz || t.defaultPosition;
    const department =
      (state.lang === 'ru' ? dep?.name_ru : dep?.name_uz) || dep?.name_uz || '';

    return ctx.reply(
      t.verified({ passport: empData.passport, position, department }),
      { ...HTML, ...mainKeyboard(state.lang, empData.documentId) }
    );
  }
});

// ==================== XATOLARNI USHLASH ====================
bot.catch(async (err, ctx) => {
  console.error('❌ Bot xatosi:', err);
  try {
    const lang = states.get(ctx.from?.id ?? 0)?.lang ?? guessLang(ctx);
    await ctx.reply(translations[lang].error(HR_PHONE), HTML);
  } catch {}
});

// ==================== LAUNCH ====================
bot.telegram.setMyCommands([
  { command: 'start', description: 'Boshlash / Начать' },
  { command: 'help', description: 'Yordam / Помощь' },
  { command: 'language', description: 'Til / Язык' },
]);

console.log('🚀 Bot ishga tushmoqda...');
bot.launch().then(() => console.log('✅ Bot ishlayapti!'));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));