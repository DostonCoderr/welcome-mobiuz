import { Router } from 'express';
import { Section } from '../models/Section';

const router = Router();

// 1. Barcha maqolalar (Admin Panel uchun)
router.get('/', async (req, res) => {
  try {
    const sections = await Section.find()
      .populate('department visible_positions')
      .sort({ order: 1 });
    res.json(sections);
  } catch (error) {
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  }
});

// 2. Hamma ko'radigan maqolalar (WebApp uchun)
router.get('/public', async (req, res) => {
  try {
    const sections = await Section.find({ is_active: true, is_public: true })
      .populate('department')
      .sort({ order: 1 });
    res.json(sections);
  } catch (error) {
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  }
});

// 3. Lavozimga xos maqolalar (WebApp uchun)
router.get('/private/:positionId', async (req, res) => {
  try {
    const sections = await Section.find({ 
      is_active: true, 
      is_public: false,
      visible_positions: req.params.positionId 
    }).sort({ order: 1 });
    res.json(sections);
  } catch (error) {
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  }
});

// 4. Bitta maqola
router.get('/:id', async (req, res) => {
  try {
    const section = await Section.findById(req.params.id).populate('department');
    if (!section) return res.status(404).json({ error: 'Topilmadi' });
    res.json(section);
  } catch (error) {
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  }
});

// 5. Yangi maqola qo'shish
router.post('/', async (req, res) => {
  try {
    const section = new Section(req.body);
    await section.save();
    res.status(201).json(section);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// 6. Maqolani tahrirlash
router.put('/:id', async (req, res) => {
  try {
    const section = await Section.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(section);
  } catch (error) {
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  }
});

// 7. Maqolani o'chirish
router.delete('/:id', async (req, res) => {
  try {
    await Section.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  }
});

export default router;