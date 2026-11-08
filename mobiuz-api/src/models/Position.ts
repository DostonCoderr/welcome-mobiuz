import mongoose from 'mongoose';

const positionSchema = new mongoose.Schema({
  name_uz: { type: String, required: true },
  name_ru: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  is_active: { type: Boolean, default: true },
}, { timestamps: true });

export const Position = mongoose.model('Position', positionSchema);