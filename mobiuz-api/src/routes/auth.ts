import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

const router = Router();

// JWT token yaratish funksiyasi
const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, { expiresIn: '30d' });
};

// @route   POST /api/auth/login
// @desc    HR/Admin tizimga kirishi
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: 'Email yoki parol xato' });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Email yoki parol xato' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id.toString()),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/auth/register
// @desc    Yangi Admin/HR qo'shish (Faqat boshlang'ich uchun yoki Admin tomonidan)
// @access  Public (Keyinchalik himoyalash mumkin)
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'Bu email allaqachon ro\'yxatdan o\'tgan' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'hr',
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id.toString()),
      });
    } else {
      res.status(400).json({ error: 'Foydalanuvchi ma\'lumotlari xato' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;