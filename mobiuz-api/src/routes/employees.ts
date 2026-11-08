import { Router } from 'express';
import { Employee } from '../models/Employee';
import { protect } from '../middleware/auth';
import { botAuth } from '../middleware/botAuth'; // ⚡ Bot himoyasi
import { webAppAuth } from '../middleware/webAppAuth';
import { botOrWebApp, anyAuth } from '../middleware/anyAuth';


const router = Router();

// 1. Barcha xodimlar (Admin Panel uchun — JWT bilan himoyalangan)
router.get('/', protect, async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate('department position')
      .sort({ createdAt: -1 });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  }
});

router.get('/telegram/:telegramId', botOrWebApp, async (req, res) => {
  try {
    const employee = await Employee.findOne({
      telegram_id: String(req.params.telegramId),
    }).populate('department position');
    if (!employee) return res.status(404).json({ error: 'Topilmadi' });
    res.json(employee);
  } catch {
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  }
});

// 3. Passport va sana orqali tekshirish (Bot uchun — BOT_SECRET bilan himoyalangan)
router.get('/verify', botAuth, async (req, res) => {
  try {
    const passport = String(req.query.passport || '').trim().toUpperCase();
    const birth_date = String(req.query.birth_date || '').trim();

    console.log(`\n=== 🔍 TEST BOSHLANDI ===`);
    console.log(`1. Botdan keldi: Passport[${passport}], Sana[${birth_date}]`);

    const employee: any = await Employee.findOne({ passport: passport });

    if (!employee) {
      console.log(`❌ 2. Xodim passport bo'yicha topilmadi!`);
      return res.status(404).json({ error: 'Xodim topilmadi' });
    }

    console.log(`✅ 2. Xodim topildi. Bazadagi sana: [${employee.birth_date}]`);

    const dbDate = String(employee.birth_date).split('T')[0];

    if (dbDate !== birth_date) {
      console.log(`❌ 3. Sana mos kelmadi! Baza[${dbDate}] != Bot[${birth_date}]`);
      return res.status(400).json({ error: 'Sana mos kelmadi' });
    }

    console.log(`✅ 3. Sana to'g'ri keldi! Xodim qaytarilmoqda.`);
    console.log(`=== TEST TUGADI ===\n`);

    res.json(employee);

  } catch (error: any) {
    console.error("❌ API XATOSI:", error);
    res.status(500).json({ error: 'Serverda xatolik', details: error.message });
  }
});



// Mini app uchun: xodimni id bo'yicha olish (faqat WebApp/Bot siri bilan)
router.get('/by-id/:id', botOrWebApp, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).populate('department position');
    if (!employee) return res.status(404).json({ error: 'Topilmadi' });
    res.json(employee);
  } catch {
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  }
});



// 4. Bitta xodim (Admin Panel uchun — JWT bilan himoyalangan)
router.get('/:id', protect, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).populate('department position');
    if (!employee) return res.status(404).json({ error: 'Topilmadi' });
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  }
});

// 5. Yangi xodim qo'shish (Admin Panel uchun — JWT bilan himoyalangan)
router.post('/', protect, async (req, res) => {
  try {
    const employee = new Employee(req.body);
    await employee.save();
    res.status(201).json(employee);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// 6. Xodimni tahrirlash (Admin Panel uchun — JWT bilan himoyalangan)
router.put('/:id', protect, async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { returnDocument: 'after' }
    );
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  }
});

// 7. Xodimni o'chirish (Admin Panel uchun — JWT bilan himoyalangan)
router.delete('/:id', protect, async (req, res) => {
  try {
    await Employee.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  }
});

// 8. Telegram ID ni saqlash (Bot uchun — BOT_SECRET bilan himoyalangan)
router.patch('/:id/telegram', botAuth, async (req, res) => {
  try {
    const { telegram_id } = req.body;
    const employee = await Employee.findByIdAndUpdate(
      req.params.id, 
      { telegram_id, is_verified: true }, 
      { returnDocument: 'after' }
    );
    if (!employee) return res.status(404).json({ error: 'Xodim topilmadi' });
    res.json(employee);
  } catch (error: any) {
    console.error('❌ Telegram ID saqlashda xato:', error);
    res.status(500).json({ error: 'Xatolik yuz berdi', details: error.message });
  }
});
// 9. Boshqa xodimlardan Telegram ID ni tozalash (Bot uchun — BOT_SECRET bilan himoyalangan)
router.patch('/clear-telegram/:tgId', botAuth, async (req, res) => {
  try {
    const { tgId } = req.params;
    await Employee.updateMany(
      { telegram_id: String(tgId) },
      { $set: { telegram_id: null } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  }
});

// 10. Tilni saqlash (Bot uchun — BOT_SECRET bilan himoyalangan)
router.patch('/:id/language', botAuth, async (req, res) => {
  try {
    const { language } = req.body;
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { language },
      { returnDocument: 'after' }
    );
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  }
});

export default router;