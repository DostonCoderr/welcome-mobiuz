import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  title_uz: { type: String, required: true },
  title_ru: { type: String, required: true },
  message_uz: { type: String, required: true },
  message_ru: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['info', 'section', 'event', 'gift'], 
    default: 'info' 
  },
  icon: { type: String, default: 'bell' },
  link: { type: String, default: '' },
  order: { type: Number, default: 0 },
  is_active: { type: Boolean, default: true },
  is_public: { type: Boolean, default: true },
  department: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Department' 
  },
  visible_positions: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Position' 
  }],
}, { timestamps: true });

export const Notification = mongoose.model('Notification', notificationSchema);