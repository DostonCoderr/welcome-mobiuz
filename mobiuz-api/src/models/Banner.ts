import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema({
  title_uz: { type: String, required: true },
  title_ru: { type: String, required: true },
  description_uz: { type: String },
  description_ru: { type: String },
  link: { type: String, default: '/' },
  image: { type: String }, // Rasm URL yoki fayl nomi
  order: { type: Number, default: 0 },
  is_active: { type: Boolean, default: true },
}, { timestamps: true });

export const Banner = mongoose.model('Banner', bannerSchema);