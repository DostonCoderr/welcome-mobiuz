import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema({
  document_id: { type: String, unique: true, sparse: true }, // ⚡ QO'SHILDI
  title_uz: { type: String, required: true },
  title_ru: { type: String, required: true },
  content_uz: { type: String, required: true },
  content_ru: { type: String, required: true },
  icon: { type: String, default: 'file' },
  order: { type: Number, default: 0 },
  is_active: { type: Boolean, default: true },
  is_public: { type: Boolean, default: true }, // Hamma ko'radimi?
  department: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Department' 
  },
  // Faqat ma'lum lavozimlarga ko'rinadigan maqolalar uchun:
  visible_positions: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Position' 
  }],
  images: [{ type: String }], // Rasmlar URL lari
}, { timestamps: true });

export const Section = mongoose.model('Section', sectionSchema);