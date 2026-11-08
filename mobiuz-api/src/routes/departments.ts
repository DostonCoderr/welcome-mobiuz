import { Router } from 'express';
import { Department } from '../models/Department';

const router = Router();

// Barcha bo'limlar
router.get('/', async (req, res) => {
  try {
    const departments = await Department.find().sort({ order: 1 });
    res.json(departments);
  } catch (error) {
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  }
});

// Bitta bo'lim
router.get('/:id', async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) return res.status(404).json({ error: 'Topilmadi' });
    res.json(department);
  } catch (error) {
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  }
});

// Yangi bo'lim qo'shish
router.post('/', async (req, res) => {
  try {
    const department = new Department(req.body);
    await department.save();
    res.status(201).json(department);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Bo'limni tahrirlash
router.put('/:id', async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(department);
  } catch (error) {
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  }
});

// Bo'limni o'chirish
router.delete('/:id', async (req, res) => {
  try {
    await Department.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Xatolik yuz berdi' });
  }
});

export default router;