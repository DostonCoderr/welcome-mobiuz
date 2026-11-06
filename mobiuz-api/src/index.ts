import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from './routes/auth'; // ⚡ Yangi import
import departmentRoutes from './routes/departments';
import positionRoutes from './routes/positions';
import employeeRoutes from './routes/employees';
import sectionRoutes from './routes/sections';
import bannerRoutes from './routes/banners';
import feedbackRoutes from './routes/feedbacks';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Route'lar
app.use('/api/auth', authRoutes); // ⚡ Yangi route
app.use('/api/departments', departmentRoutes);
app.use('/api/positions', positionRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/feedbacks', feedbackRoutes);

// MongoDB ulanish
mongoose.connect(process.env.MONGODB_URI!)
  .then(() => console.log('✅ MongoDB bazasiga ulandi'))
  .catch(err => console.error('❌ MongoDB xatosi:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 API ishga tushdi: http://localhost:${PORT}`);
});