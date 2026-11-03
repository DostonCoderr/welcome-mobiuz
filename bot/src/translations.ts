// bot/src/translations.ts

export type Lang = 'uz' | 'ru';

export const esc = (s: string = ''): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const bar = (step: 1 | 2) => (step === 1 ? '●○' : '●●');

export const translations = {
  uz: {
    // ---- umumiy ----
    langPick: '🌐 <b>Tilni tanlang</b>\nВыберите язык',
    langChanged: '✅ Til o\'zgartirildi: <b>O\'zbekcha</b>',

    // ---- salomlashish ----
    welcome: (name: string) =>
      `👋 <b>Assalomu alaykum, ${esc(name)}!</b>\n\n` +
      `<b>Mobiuz Welcome Book</b> — yangi xodimlar uchun qo'llanma.\n\n` +
      `Davom etish uchun o'zingizni tasdiqlashingiz kerak. Bu atigi 1 daqiqa oladi.`,
    welcomeBack: (name: string) =>
      `👋 <b>Qaytganingiz bilan, ${esc(name)}!</b>\n\n` +
      `Siz allaqachon tasdiqlangansiz. Kitobni ochish uchun pastdagi tugmani bosing.`,
    startAuth: `🔐 <b>Tasdiqlash</b>\n\nIkki qadamda o'zingizni tasdiqlaymiz.`,

    // ---- qadamlar ----
    stepPassport: () =>
      `<b>${bar(1)}  1/2 · Passport</b>\n\n` +
      `Passport seriya va raqamingizni yuboring.\n\n` +
      `Namuna: <code>AA1234567</code>`,
    stepBirth: (passport: string) =>
      `✅ Passport: <code>${esc(passport)}</code>\n\n` +
      `<b>${bar(2)}  2/2 · Tug'ilgan sana</b>\n\n` +
      `Tug'ilgan sanangizni yuboring.\n\n` +
      `Namuna: <code>15.03.1995</code>`,

    // ---- xatolar ----
    invalidPassport: (left: number) =>
      `⚠️ <b>Format noto'g'ri</b>\n\n` +
      `2 ta harf va 7 ta raqam bo'lishi kerak: <code>AA1234567</code>\n\n` +
      `Qolgan urinishlar: <b>${left}</b>`,
    invalidDate: (left: number) =>
      `⚠️ <b>Sana noto'g'ri</b>\n\n` +
      `Format: <code>KK.OO.YYYY</code>, masalan <code>15.03.1995</code>\n\n` +
      `Qolgan urinishlar: <b>${left}</b>`,
    tooMany: `⛔ <b>Urinishlar tugadi</b>\n\nQaytadan boshlash uchun /start bosing.`,
    notFound: (hr: string) =>
      `❌ <b>Ma'lumotlar topilmadi</b>\n\n` +
      `Passport yoki tug'ilgan sana mos kelmadi.\n` +
      `HR bo'limiga murojaat qiling: <b>${esc(hr)}</b>\n\n` +
      `Qayta urinish uchun /start bosing.`,
    useStart: `Boshlash uchun /start bosing.`,
    error: (hr: string) =>
      `⚠️ <b>Xatolik yuz berdi</b>\n\nKeyinroq urinib ko'ring yoki HR: ${esc(hr)}`,

    // ---- muvaffaqiyat ----
    verified: (o: { passport: string; position: string; department?: string }) =>
      `🎉 <b>Tasdiqlandi!</b>\n\n` +
      `┌ 👤 <b>Xodim:</b> <code>${esc(o.passport)}</code>\n` +
      `├ 💼 <b>Lavozim:</b> ${esc(o.position)}\n` +
      (o.department ? `└ 🏢 <b>Bo'lim:</b> ${esc(o.department)}\n` : `└ ✨\n`) +
      `\n📖 Kitobni ochish uchun pastdagi tugmani bosing.`,
    defaultPosition: 'Xodim',

    // ---- yordam ----
    help: (hr: string) =>
      `ℹ️ <b>Yordam</b>\n\n` +
      `📞 <b>HR bo'limi:</b> ${esc(hr)}\n` +
      `📧 <b>Email:</b> hr@mobiuz.uz\n\n` +
      `<b>Buyruqlar</b>\n/start — boshlash\n/help — yordam\n/language — tilni o'zgartirish`,

    // ---- tugmalar ----
    btnOpen: '📖 Kitobni ochish',
    btnHelp: 'ℹ️ Yordam',
    btnLang: '🌐 Til',
    btnCancel: '✖️ Bekor qilish',
    cancelled: '✖️ Bekor qilindi. Qayta boshlash uchun /start bosing.',
  },

  ru: {
    langPick: '🌐 <b>Выберите язык</b>\nTilni tanlang',
    langChanged: '✅ Язык изменён: <b>Русский</b>',

    welcome: (name: string) =>
      `👋 <b>Здравствуйте, ${esc(name)}!</b>\n\n` +
      `<b>Mobiuz Welcome Book</b> — путеводитель для новых сотрудников.\n\n` +
      `Чтобы продолжить, нужно подтвердить личность. Это займёт всего минуту.`,
    welcomeBack: (name: string) =>
      `👋 <b>С возвращением, ${esc(name)}!</b>\n\n` +
      `Вы уже авторизованы. Нажмите кнопку ниже, чтобы открыть книгу.`,
    startAuth: `🔐 <b>Авторизация</b>\n\nПодтвердим вас в два шага.`,

    stepPassport: () =>
      `<b>${bar(1)}  1/2 · Паспорт</b>\n\n` +
      `Отправьте серию и номер паспорта.\n\n` +
      `Пример: <code>AA1234567</code>`,
    stepBirth: (passport: string) =>
      `✅ Паспорт: <code>${esc(passport)}</code>\n\n` +
      `<b>${bar(2)}  2/2 · Дата рождения</b>\n\n` +
      `Отправьте дату рождения.\n\n` +
      `Пример: <code>15.03.1995</code>`,

    invalidPassport: (left: number) =>
      `⚠️ <b>Неверный формат</b>\n\n` +
      `Нужно 2 буквы и 7 цифр: <code>AA1234567</code>\n\n` +
      `Осталось попыток: <b>${left}</b>`,
    invalidDate: (left: number) =>
      `⚠️ <b>Неверная дата</b>\n\n` +
      `Формат: <code>ДД.ММ.ГГГГ</code>, например <code>15.03.1995</code>\n\n` +
      `Осталось попыток: <b>${left}</b>`,
    tooMany: `⛔ <b>Попытки закончились</b>\n\nНажмите /start, чтобы начать заново.`,
    notFound: (hr: string) =>
      `❌ <b>Данные не найдены</b>\n\n` +
      `Паспорт или дата рождения не совпали.\n` +
      `Обратитесь в HR: <b>${esc(hr)}</b>\n\n` +
      `Нажмите /start, чтобы повторить.`,
    useStart: `Нажмите /start, чтобы начать.`,
    error: (hr: string) =>
      `⚠️ <b>Произошла ошибка</b>\n\nПовторите позже или свяжитесь с HR: ${esc(hr)}`,

    verified: (o: { passport: string; position: string; department?: string }) =>
      `🎉 <b>Подтверждено!</b>\n\n` +
      `┌ 👤 <b>Сотрудник:</b> <code>${esc(o.passport)}</code>\n` +
      `├ 💼 <b>Должность:</b> ${esc(o.position)}\n` +
      (o.department ? `└ 🏢 <b>Отдел:</b> ${esc(o.department)}\n` : `└ ✨\n`) +
      `\n📖 Нажмите кнопку ниже, чтобы открыть книгу.`,
    defaultPosition: 'Сотрудник',

    help: (hr: string) =>
      `ℹ️ <b>Помощь</b>\n\n` +
      `📞 <b>HR отдел:</b> ${esc(hr)}\n` +
      `📧 <b>Email:</b> hr@mobiuz.uz\n\n` +
      `<b>Команды</b>\n/start — начать\n/help — помощь\n/language — сменить язык`,

    btnOpen: '📖 Открыть книгу',
    btnHelp: 'ℹ️ Помощь',
    btnLang: '🌐 Язык',
    btnCancel: '✖️ Отмена',
    cancelled: '✖️ Отменено. Нажмите /start, чтобы начать заново.',
  },
};