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
  link: { type: String },
  is_active: { type: Boolean, default: true },
  is_public: { type: Boolean, default: true },
}, { timestamps: true });

export const Notification = mongoose.model('Notification', notificationSchema);