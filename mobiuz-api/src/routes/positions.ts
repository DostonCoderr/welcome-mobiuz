import { Router } from 'express';
import { Position } from '../models/Position';

const router = Router();

// Barcha lavozimlar
router.get('/', async (req, res) => {
  try {
    const positions = await Position.find().sort({ name_uz: 1 });
    res.json(positions);
  } catch (error) {
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  }
});

// Yangi lavozim qo'shish
router.post('/', async (req, res) => {
  try {
    const position = new Position(req.body);
    await position.save();
    res.status(201).json(position);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Lavozimni tahrirlash
router.put('/:id', async (req, res) => {
  try {
    const position = await Position.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(position);
  } catch (error) {
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  }
});

// Lavozimni o'chirish
router.delete('/:id', async (req, res) => {
  try {
    await Position.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  }
});

export default router;