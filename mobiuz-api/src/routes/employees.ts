import { Router } from 'express';
import { Employee } from '../models/Employee';

const router = Router();

// 1. Barcha xodimlar (Admin Panel uchun)
router.get('/', async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate('department position')
      .sort({ createdAt: -1 });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  }
});

// 2. Bitta xodim
router.get('/:id', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).populate('department position');
    if (!employee) return res.status(404).json({ error: 'Topilmadi' });
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  }
});

// 3. Yangi xodim qo'shish (Admin Panel uchun)
router.post('/', async (req, res) => {
  try {
    const employee = new Employee(req.body);
    await employee.save();
    res.status(201).json(employee);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// 4. Xodimni tahrirlash
router.put('/:id', async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  }
});

// 5. Xodimni o'chirish
router.delete('/:id', async (req, res) => {
  try {
    await Employee.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  }
});

// 6. Passport va sana orqali tekshirish (Bot uchun)
router.post('/verify', async (req, res) => {
  try {
    const { passport, birth_date } = req.body;
    const employee = await Employee.findOne({ 
      passport: passport.toUpperCase(), 
      birth_date 
    }).populate('department position');
    
    if (!employee) {
      return res.status(404).json({ error: 'Xodim topilmadi' });
    }
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  }
});

// 7. Telegram ID ni saqlash (Bot uchun)
router.patch('/:id/telegram', async (req, res) => {
  try {
    const { telegram_id } = req.body;
    const employee = await Employee.findByIdAndUpdate(
      req.params.id, 
      { telegram_id, is_verified: true }, 
      { new: true }
    );
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  }
});

// 8. Telegram ID orqali xodimni topish (WebApp uchun)
router.get('/telegram/:telegramId', async (req, res) => {
  try {
    const employee = await Employee.findOne({ 
      telegram_id: req.params.telegramId 
    }).populate('department position');
    
    if (!employee) return res.status(404).json({ error: 'Topilmadi' });
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  }
});

export default router;