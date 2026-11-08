import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  employee: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Employee', 
    required: true 
  }, // Kim qoldirgani (xodim ID si)
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '' },
  category: { 
    type: String, 
    enum: ['general', 'content', 'ux', 'bug'], 
    default: 'general' 
  },
  is_read: { type: Boolean, default: false }, // HR o'qidimi?
}, { timestamps: true });

export const Feedback = mongoose.model('Feedback', feedbackSchema);