import { toast } from 'sonner';

type Lang = 'uz' | 'ru';

const getLang = (): Lang => {
  return (localStorage.getItem('language') as Lang) || 'uz';
};

const messages = {
  uz: {
    success: 'Muvaffaqiyatli!',
    error: 'Xatolik yuz berdi',
    loading: 'Yuklanmoqda...',
    saved: 'Saqlandi',
    deleted: 'O\'chirildi',
    copied: 'Nusxalandi',
    feedbackSent: 'Fikringiz yuborildi!',
    loginSuccess: 'Tizimga kirdingiz',
    logoutSuccess: 'Tizimdan chiqdingiz',
    networkError: 'Internet aloqasi yo\'q',
    notFound: 'Ma\'lumot topilmadi',
  },
  ru: {
    success: 'Успешно!',
    error: 'Произошла ошибка',
    loading: 'Загрузка...',
    saved: 'Сохранено',
    deleted: 'Удалено',
    copied: 'Скопировано',
    feedbackSent: 'Ваш отзыв отправлен!',
    loginSuccess: 'Вы вошли в систему',
    logoutSuccess: 'Вы вышли из системы',
    networkError: 'Нет интернет-соединения',
    notFound: 'Данные не найдены',
  },
};

export const showToast = {
  success: (msg?: string) =>
    toast.success(msg || messages[getLang()].success),

  error: (msg?: string) =>
    toast.error(msg || messages[getLang()].error),

  // ⚡ LOADING — ID qaytaradi
  loading: (msg?: string): string | number => {
    return toast.loading(msg || messages[getLang()].loading);
  },

  // ⚡ LOADING NI SUCCESS GA O'ZGARTIRISH
  loadingToSuccess: (
    id: string | number,
    msg?: string
  ) => {
    toast.success(msg || messages[getLang()].success, { id });
  },

  // ⚡ LOADING NI ERROR GA O'ZGARTIRISH
  loadingToError: (
    id: string | number,
    msg?: string
  ) => {
    toast.error(msg || messages[getLang()].error, { id });
  },

  saved: () => toast.success(messages[getLang()].saved),

  deleted: () => toast.success(messages[getLang()].deleted),

  copied: () => toast.success(messages[getLang()].copied),

  feedbackSent: () => toast.success(messages[getLang()].feedbackSent),

  loginSuccess: () => toast.success(messages[getLang()].loginSuccess),

  logoutSuccess: () => toast.success(messages[getLang()].logoutSuccess),

  networkError: () => toast.error(messages[getLang()].networkError),

  notFound: () => toast.error(messages[getLang()].notFound),

  custom: (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (type === 'error') toast.error(msg);
    else if (type === 'info') toast.info(msg);
    else toast.success(msg);
  },
};