import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import authRoutes from './routes/auth';
import departmentRoutes from './routes/departments';
import positionRoutes from './routes/positions';
import employeeRoutes from './routes/employees';
import sectionRoutes from './routes/sections';
import bannerRoutes from './routes/banners';
import feedbackRoutes from './routes/feedbacks';
import notificationRoutes from './routes/notifications';

dotenv.config();

const app = express();
app.use(cors({
  origin: [
    'http://localhost:5173', // Admin Panel (development)
    'http://localhost:5172', // WebApp (development)
    'https://welcome-mobi.uz', // WebApp (production)
    'https://admin.welcome-mobi.uz', // Admin Panel (production)
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-bot-secret', 'x-webapp-secret'],
}));


app.use(cookieParser());
app.use(express.json());

// ⚡ NoSQL Injection himoyasi (express-mongo-sanitize o'rniga)
app.use((req, res, next) => {
  const sanitize = (obj: any): any => {
    if (obj instanceof Array) {
      return obj.map(sanitize);
    } else if (obj !== null && typeof obj === 'object') {
      return Object.keys(obj).reduce((acc, key) => {
        // $ va . bilan boshlanuvchi kalitlarni olib tashlaymiz
        if (key.startsWith('$') || key.includes('.')) {
          return acc;
        }
        acc[key] = sanitize(obj[key]);
        return acc;
      }, {} as any);
    }
    return obj;
  };

  if (req.body) req.body = sanitize(req.body);
  if (req.params) req.params = sanitize(req.params);
  // req.query ni o'zgartirmaymiz (u faqat o'qish uchun)
  
  next();
});



// ⚡ uploads papkasini yaratish (agar yo'q bo'lsa)
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ⚡ Static papka (rasmlar uchun)
app.use('/uploads', express.static(uploadsDir));

// ⚡ Multer sozlamalari
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// ⚡ Rasm yuklash route'i (to'g'rilangan)
app.post('/api/upload', upload.single('image'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Rasm yuklanmadi' });
  }
  res.json({ url: `/uploads/${req.file.filename}` });
});

// Route'lar
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/positions', positionRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/feedbacks', feedbackRoutes);
app.use('/api/notifications', notificationRoutes);

// MongoDB ulanish
mongoose.connect(process.env.MONGODB_URI!)
  .then(() => console.log('✅ MongoDB bazasiga ulandi'))
  .catch(err => console.error('❌ MongoDB xatosi:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 API ishga tushdi: http://localhost:${PORT}`);
});