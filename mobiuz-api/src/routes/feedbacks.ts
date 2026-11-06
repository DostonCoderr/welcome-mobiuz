import { Router } from 'express';
import { Feedback } from '../models/Feedback';

const router = Router();

// 1. Barcha fikrlar (Admin Panel uchun)
router.get('/', async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .populate('employee', 'full_name passport')
      .sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  }
});

// 2. Yangi fikr qo'shish (WebApp uchun)
router.post('/', async (req, res) => {
  try {
    const { employee_id, rating, comment, category } = req.body;
    
    const feedback = new Feedback({
      employee: employee_id,
      rating,
      comment,
      category,
    });
    
    await feedback.save();
    res.status(201).json(feedback);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// 3. Fikrni o'qilgan deb belgilash
router.patch('/:id/read', async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { is_read: true },
      { new: true }
    );
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  }
});

export default router;