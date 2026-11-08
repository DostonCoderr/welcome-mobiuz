import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
  name_uz: { type: String, required: true },
  name_ru: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  icon: { type: String, default: 'building' },
  color: { type: String, default: '#6b7280' },
  order: { type: Number, default: 0 },
  is_active: { type: Boolean, default: true },
}, { timestamps: true });

export const Department = mongoose.model('Department', departmentSchema);