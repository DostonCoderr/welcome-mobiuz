import { Router } from 'express';
import { Banner } from '../models/Banner';

const router = Router();

// 1. Barcha bannerlar (Admin Panel uchun)
router.get('/', async (req, res) => {
  try {
    const banners = await Banner.find().sort({ order: 1 });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  }
});

// 2. Faol bannerlar (WebApp uchun)
router.get('/active', async (req, res) => {
  try {
    const banners = await Banner.find({ is_active: true }).sort({ order: 1 });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  }
});

// 3. Yangi banner qo'shish
router.post('/', async (req, res) => {
  try {
    const banner = new Banner(req.body);
    await banner.save();
    res.status(201).json(banner);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// 4. Bannerni tahrirlash
router.put('/:id', async (req, res) => {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(banner);
  } catch (error) {
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  }
});

// 5. Bannerni o'chirish
router.delete('/:id', async (req, res) => {
  try {
    await Banner.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  }
});

export default router;