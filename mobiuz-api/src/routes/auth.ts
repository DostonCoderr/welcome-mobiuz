import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { protect } from '../middleware/auth'; // ⚡ Protect middleware
import { botAuth } from '../middleware/botAuth';

const router = Router();

// Tokenni yaratish
const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, { expiresIn: '30d' });
};

// 1-QADAM: Email va parolni tekshirish, Telegramga kod yuborish
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('🔍 Login so\'rovi:', { email });

  try {
    const user = await User.findOne({ email });

  

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Email yoki parol xato' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.telegram_code = code;
    user.telegram_code_expires = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    console.log('✅ Kod yaratildi:', code);

    if (user.telegram_id) {
      console.log('📤 Telegramga yuborilmoqda...');
      const tgRes = await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: user.telegram_id,
          text: `Mobiuz Admin tizimiga kirish uchun tasdiqlash kodi: ${code}`,
        }),
      });
      const tgData = await tgRes.json();
      console.log('📥 Telegram javobi:', tgData);
      if (!tgData.ok) {
        return res.status(400).json({ error: 'Telegramga kod yuborishda xato' });
      }
    } else {
      console.log('⚠️ telegram_id yo\'q!');
      return res.status(400).json({ error: 'Adminning Telegram ID si topilmadi' });
    }

    res.json({ message: 'Kod Telegramingizga yuborildi', userId: user._id });
  } catch (error: any) {
    console.error('❌ Login xatosi:', error);
    res.status(500).json({ error: error.message });
  }
});


// 2-QADAM: Kodni tekshirish va JWT berish
router.post('/verify-code', async (req, res) => {
  const { userId, code } = req.body;

  try {
    const user = await User.findById(userId);
    
    // ⚡ undefined bo'lish ehtimolini tekshiramiz
    if (!user || !user.telegram_code || !user.telegram_code_expires) {
      return res.status(400).json({ error: 'Kod xato yoki muddati o\'tgan' });
    }

    if (user.telegram_code !== code || new Date() > user.telegram_code_expires) {
      return res.status(400).json({ error: 'Kod xato yoki muddati o\'tgan' });
    }

    // Kodni o'chirish
    user.telegram_code = undefined;
    user.telegram_code_expires = undefined;
    await user.save();

    // JWT token yaratish
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, { expiresIn: '30d' });

     res.cookie('admin_token', token, {
      httpOnly: true,      // JavaScript o'qiy olmaydi
      secure: process.env.NODE_ENV === 'production', // Productionda HTTPS
      sameSite: 'strict',  // CSRF himoyasi
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 kun
    });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      // ⚡ token: token ni JSON'da qaytarmaymiz!
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('admin_token');
  res.json({ message: 'Chiqildi' });
});


// ⚡ POST /api/auth/forgot-password — Parolni tiklash uchun kod yuborish
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      // Xavfsizlik uchun: email topilmasa ham "Yuborildi" deb javob beramiz
      return res.json({ message: 'Agar bunday email mavjud bo\'lsa, kod yuborildi' });
    }

    if (!user.telegram_id) {
      return res.status(400).json({ error: 'Sizning Telegram ID ingiz bazada yo\'q. Iltimos, boshqa adminga murojaat qiling.' });
    }

    // Yangi kod yaratamiz
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.telegram_code = code;
    user.telegram_code_expires = new Date(Date.now() + 10 * 60 * 1000); // 10 daqiqa
    await user.save();

    // Telegramga yuboramiz
    await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: user.telegram_id,
        text: `Parolni tiklash uchun kod: ${code}\n\nBu kod 10 daqiqa amal qiladi.`,
      }),
    });

    res.json({ message: 'Kod Telegramingizga yuborildi', userId: user._id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ⚡ POST /api/auth/reset-password — Yangi parolni o'rnatish
router.post('/reset-password', async (req, res) => {
  const { userId, code, newPassword } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user || !user.telegram_code || !user.telegram_code_expires) {
      return res.status(400).json({ error: 'Kod xato yoki muddati o\'tgan' });
    }

    if (user.telegram_code !== code || new Date() > user.telegram_code_expires) {
      return res.status(400).json({ error: 'Kod xato yoki muddati o\'tgan' });
    }

    // Yangi parolni o'rnatamiz
    user.password = newPassword; // User modelidagi pre-save hook avtomatik hash qiladi
    user.telegram_code = undefined;
    user.telegram_code_expires = undefined;
    await user.save();

    res.json({ message: 'Parol muvaffaqiyatli o\'zgartirildi' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ⚡ GET /api/auth/me — Profilni olish
router.get('/me', protect, async (req: any, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'Topilmadi' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Xatolik' });
  }
});

// ⚡ PUT /api/auth/profile — Profilni yangilash
router.put('/profile', protect, async (req: any, res) => {
  try {
    const { name, phone, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone, avatar },
      { returnDocument: 'after', runValidators: true }
    ).select('-password');
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ⚡ PUT /api/auth/password — Parolni o'zgartirish
router.put('/password', protect, async (req: any, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Topilmadi' });

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) return res.status(400).json({ error: 'Eski parol xato' });

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Parol o\'zgartirildi' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ⚡ GET /api/auth/users — Barcha adminlar (reyting uchun)
router.get('/users', protect, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ rating: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Xatolik' });
  }
});

export default router;


// ⚡ POST /api/auth/create-admin — Yangi admin/HR qo'shish (faqat admin uchun)
router.post('/create-admin', protect, async (req: any, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // Faqat admin boshqa admin qo'sha oladi
    const currentUser = await User.findById(req.user.id);
    if (currentUser?.role !== 'admin') {
      return res.status(403).json({ error: 'Faqat admin yangi admin qo\'sha oladi' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'Bu email allaqachon mavjud' });
    }

    // ⚡ 6 xonali taklif kodi yaratamiz
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'hr',
      phone: phone || '',
      invite_code: inviteCode,
      invite_code_expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 soat
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      invite_code: inviteCode,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ⚡ POST /api/auth/bind-telegram — Taklif kodi orqali Telegram ID ni bog'lash
router.post('/bind-telegram',botAuth, async (req, res) => {
  const { invite_code, telegram_id } = req.body;

  if (!invite_code || !telegram_id) {
    return res.status(400).json({ error: 'Taklif kodi va Telegram ID kiritilishi shart' });
  }

  try {
    const user = await User.findOne({
      invite_code: invite_code.toUpperCase(),
      invite_code_expires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(404).json({ error: 'Taklif kodi xato yoki muddati o\'tgan' });
    }

    user.telegram_id = String(telegram_id);
    user.invite_code = null; // Bir martalik
    user.invite_code_expires = null;
    await user.save();

    res.json({ message: 'Telegram ID muvaffaqiyatli bog\'landi!', email: user.email });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ⚡ DELETE /api/auth/users/:id — Adminni o'chirish
router.delete('/users/:id', protect, async (req: any, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (currentUser?.role !== 'admin') {
      return res.status(403).json({ error: 'Faqat admin o\'chira oladi' });
    }

    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'O\'zingizni o\'chira olmaysiz' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Xatolik' });
  }
});