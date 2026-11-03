import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle, ChevronDown, Phone, Mail, MessageSquare,
  Send, Headphones, Briefcase, Shield, ExternalLink,
} from 'lucide-react';
import { useTelegram } from '../hooks/useTelegram';
import PageHeader from '../components/layout/PageHeader';

interface FAQItem {
  q_uz: string;
  q_ru: string;
  a_uz: string;
  a_ru: string;
}

const faqs: FAQItem[] = [
  {
    q_uz: 'Ish vaqti qanday?',
    q_ru: 'Какое рабочее время?',
    a_uz: 'Dushanbadan jumagacha, 9:00 - 18:00. Tushlik 13:00 - 14:00.',
    a_ru: 'С понедельника по пятницу, 9:00 - 18:00. Обед 13:00 - 14:00.',
  },
  {
    q_uz: "Ta'til qancha kun?",
    q_ru: 'Сколько дней отпуска?',
    a_uz: "Yillik ta'til — 15 ish kuni. Qo'shimcha — 3 kun.",
    a_ru: 'Ежегодный отпуск — 15 рабочих дней. Дополнительный — 3 дня.',
  },
  {
    q_uz: 'Kasallik varaqasi qanday olinadi?',
    q_ru: 'Как получить больничный?',
    a_uz: 'Tibbiy sug\'urta mavjud. HR bo\'limiga xabar bering.',
    a_ru: 'Есть медицинская страховка. Сообщите в HR-отдел.',
  },
  {
    q_uz: 'Oylik qanday to\'lanadi?',
    q_ru: 'Как выплачивается зарплата?',
    a_uz: 'Har oyning 5-sanasi, bank kartasiga.',
    a_ru: '5-го числа каждого месяца на банковскую карту.',
  },
  {
    q_uz: 'Karyera o\'sishi bormi?',
    q_ru: 'Есть карьерный рост?',
    a_uz: 'Ha, yillik baholash asosida.',
    a_ru: 'Да, на основе ежегодной оценки.',
  },
  {
    q_uz: 'Uydan ishlash mumkinmi?',
    q_ru: 'Можно работать из дома?',
    a_uz: 'Bo\'lim boshlig\'i bilan kelishilgan holda.',
    a_ru: 'По согласованию с руководителем отдела.',
  },
];

const contacts = [
  {
    icon: Briefcase,
    title_uz: 'HR bo\'limi',
    title_ru: 'HR-отдел',
    phone: '+998 XX XXX XX XX',
    email: 'hr@mobiuz.uz',
    telegram: '@mobiuz_hr',
    color: '#e30613',
  },
  {
    icon: Headphones,
    title_uz: 'IT qo\'llab-quvvatlash',
    title_ru: 'IT-поддержка',
    phone: '+998 XX XXX XX XX',
    email: 'it@mobiuz.uz',
    telegram: '@mobiuz_it',
    color: '#3b82f6',
  },
  {
    icon: Shield,
    title_uz: 'Xavfsizlik xizmati',
    title_ru: 'Служба безопасности',
    phone: '+998 XX XXX XX XX',
    email: 'security@mobiuz.uz',
    telegram: '@mobiuz_security',
    color: '#10b981',
  },
];

export default function HelpPage() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { hapticFeedback, openLink } = useTelegram();
  const isUz = i18n.language === 'uz';

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    hapticFeedback('light');
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-dvh pb-10">
      <PageHeader
        title={isUz ? 'Yordam markazi' : 'Центр помощи'}
        subtitle={isUz ? 'Savollar va kontaktlar' : 'Вопросы и контакты'}
        back
      />

      <motion.main
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 px-4 -mt-5 space-y-4"
      >
        {/* ==================== FAQ ==================== */}
        <section>
          <h3
            className="text-[12px] font-bold uppercase tracking-wider mb-2 px-1 flex items-center gap-2"
            style={{ color: 'var(--text-muted)' }}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            {isUz ? 'Ko\'p so\'raladigan savollar' : 'Часто задаваемые вопросы'}
          </h3>

          <div className="space-y-2">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              const q = isUz ? faq.q_uz : faq.q_ru;
              const a = isUz ? faq.a_uz : faq.a_ru;

              return (
                <motion.div
                  key={index}
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.03 }}
                  className="card overflow-hidden"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center justify-between gap-3 p-3.5 text-left"
                  >
                    <span
                      className="text-[13px] font-bold flex-1"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {q}
                    </span>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown
                        className="w-4 h-4 flex-shrink-0"
                        style={{ color: 'var(--text-muted)' }}
                      />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div
                          className="px-3.5 pb-3.5 text-[12px] leading-relaxed"
                          style={{
                            color: 'var(--text-secondary)',
                            borderTop: '1px solid var(--border-color)',
                            paddingTop: '0.75rem',
                          }}
                        >
                          {a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ==================== KONTAKTLAR ==================== */}
        <section>
          <h3
            className="text-[12px] font-bold uppercase tracking-wider mb-2 px-1 flex items-center gap-2"
            style={{ color: 'var(--text-muted)' }}
          >
            <Phone className="w-3.5 h-3.5" />
            {isUz ? 'Kontaktlar' : 'Контакты'}
          </h3>

          <div className="space-y-2">
            {contacts.map((contact, i) => {
              const Icon = contact.icon;
              const title = isUz ? contact.title_uz : contact.title_ru;

              return (
                <motion.div
                  key={i}
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="card p-3.5"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${contact.color}18` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: contact.color }} />
                    </div>
                    <h4
                      className="text-[14px] font-bold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {title}
                    </h4>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        hapticFeedback('light');
                        openLink(`tel:${contact.phone}`);
                      }}
                      className="w-full flex items-center gap-2.5 p-2 rounded-lg active:opacity-70"
                      style={{ background: 'var(--bg-secondary)' }}
                    >
                      <Phone className="w-4 h-4 flex-shrink-0" style={{ color: contact.color }} />
                      <span className="text-[12px] font-medium" style={{ color: 'var(--text-primary)' }}>
                        {contact.phone}
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        hapticFeedback('light');
                        openLink(`mailto:${contact.email}`);
                      }}
                      className="w-full flex items-center gap-2.5 p-2 rounded-lg active:opacity-70"
                      style={{ background: 'var(--bg-secondary)' }}
                    >
                      <Mail className="w-4 h-4 flex-shrink-0" style={{ color: contact.color }} />
                      <span className="text-[12px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {contact.email}
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        hapticFeedback('light');
                        openLink(`https://t.me/${contact.telegram.replace('@', '')}`);
                      }}
                      className="w-full flex items-center gap-2.5 p-2 rounded-lg active:opacity-70"
                      style={{ background: 'var(--bg-secondary)' }}
                    >
                      <MessageSquare className="w-4 h-4 flex-shrink-0" style={{ color: contact.color }} />
                      <span className="text-[12px] font-medium" style={{ color: 'var(--text-primary)' }}>
                        {contact.telegram}
                      </span>
                      <ExternalLink className="w-3 h-3 ml-auto" style={{ color: 'var(--text-muted)' }} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ==================== FEEDBACK CTA ==================== */}
        <button
          onClick={() => {
            hapticFeedback('medium');
            navigate('/feedback');
          }}
          className="btn-primary"
        >
          <Send className="w-[18px] h-[18px]" />
          {isUz ? 'Fikr qoldirish' : 'Оставить отзыв'}
        </button>
      </motion.main>
    </div>
  );
}