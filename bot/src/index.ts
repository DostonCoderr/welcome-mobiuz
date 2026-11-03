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
const HR_PHONE = process.env.HR_PHONE || '+998 XX XXX XX XX';

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN topilmadi!');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const HTML = { parse_mode: 'HTML' as const };

// ==================== STATE ====================
interface UserState {
  step: 'passport' | 'birthdate' | 'done';
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

/** Xotirada bo'lmasa, bazadan tiklaydi */
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
      Markup.button.callback('🇺🇿 O\'zbekcha', 'lang_uz'),
      Markup.button.callback('🇷🇺 Русский', 'lang_ru'),
    ],
  ]);

const cancelKeyboard = (lang: Lang) =>
  Markup.inlineKeyboard([[Markup.button.callback(translations[lang].btnCancel, 'cancel')]]);

// Pastdagi menyu
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

  const existing = await getEmployeeByTelegramId(tgId);
  if (existing) {
    const lang: Lang =
      existing.language === 'ru' || existing.language === 'uz' ? existing.language : guessLang(ctx);
    states.set(tgId, { step: 'done', lang, attempts: 0, docId: existing.documentId });
    return ctx.reply(translations[lang].welcomeBack(name), {
      ...HTML,
      ...mainKeyboard(lang, existing.documentId),
    });
  }

  // Yangi foydalanuvchi
  states.delete(tgId);
  const lang = guessLang(ctx);
  await ctx.reply(translations[lang].welcome(name), { ...HTML, ...Markup.removeKeyboard() });
  return ctx.reply(translations[lang].langPick, { ...HTML, ...langKeyboard() });
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

// ==================== TIL TANLASH ====================
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

// ==================== MATN (tasdiqlash oqimi) ====================
bot.on('text', async (ctx) => {
  const tgId = ctx.from.id;
  const text = ctx.message.text.trim();
  const state = await resolveState(ctx);

  if (!state) return ctx.reply(translations[guessLang(ctx)].useStart);
  if (state.step === 'done') return;

  const t = translations[state.lang];

  // ---------- 1-qadam: PASSPORT ----------
  if (state.step === 'passport') {
    if (!validatePassport(text)) {
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

    state.passport = text.toUpperCase();
    state.step = 'birthdate';
    state.attempts = 0;
    states.set(tgId, state);

    return ctx.reply(t.stepBirth(state.passport), { ...HTML, ...cancelKeyboard(state.lang) });
  }

  // ---------- 2-qadam: TUG'ILGAN SANA ----------
  if (state.step === 'birthdate') {
    const isoDate = convertDate(text);
    if (!isoDate) {
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

    // ⚡ Sanani ham qidiruvga qo'shib yuboramiz (2 ta argument)
    const employee = await getEmployeeByPassport(state.passport!, isoDate);
    
    if (!employee) {
      states.delete(tgId);
      return ctx.reply(t.notFound(HR_PHONE), HTML);
    }

    // Muvaffaqiyat
    states.set(tgId, { step: 'done', lang: state.lang, attempts: 0, docId: employee.documentId });
    await saveTelegramId(employee.documentId, tgId);
    saveLanguage(employee.documentId, state.lang);

    const pos = employee.position;
    const dep = employee.department;
    const position =
      (state.lang === 'ru' ? pos?.name_ru : pos?.name_uz) || pos?.name_uz || t.defaultPosition;
    const department =
      (state.lang === 'ru' ? dep?.name_ru : dep?.name_uz) || dep?.name_uz || '';

    return ctx.reply(
      t.verified({ passport: employee.passport, position, department }),
      { ...HTML, ...mainKeyboard(state.lang, employee.documentId) }
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