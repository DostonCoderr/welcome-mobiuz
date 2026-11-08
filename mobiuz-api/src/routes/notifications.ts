import { Router } from 'express';
import { Notification } from '../models/Notification';

const router = Router();

// 1. Barcha bildirishnomalar (Admin Panel uchun)
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find()
      .populate('department visible_positions')
      .sort({ order: 1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  }
});

// 2. Faol va umumiy bildirishnomalar (WebApp uchun)
router.get('/active', async (req, res) => {
  try {
    const notifications = await Notification.find({ 
      is_active: true, 
      is_public: true 
    }).sort({ order: 1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  }
});

// 3. Yangi bildirishnoma qo'shish
router.post('/', async (req, res) => {
  try {
    const notification = new Notification(req.body);
    await notification.save();
    res.status(201).json(notification);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// 4. Bildirishnomani tahrirlash
router.put('/:id', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { returnDocument: 'after', runValidators: true }
    );
    if (!notification) return res.status(404).json({ error: 'Topilmadi' });
    res.json(notification);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Bildirishnomani o'chirish
router.delete('/:id', async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  }
});

export default router;