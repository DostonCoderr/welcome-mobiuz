import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
  full_name: { type: String, required: true },
  passport: { 
    type: String, 
    required: true, 
    unique: true, 
    uppercase: true, 
    trim: true 
  },
  birth_date: { type: String, required: true }, // Format: YYYY-MM-DD
  telegram_id: { 
    type: String, 
    default: null, 
    // unique: true, 
    sparse: true // Bir nechta null bo'lishi mumkin
  },
  department: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Department' 
  },
  position: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Position' 
  },
  language: { 
    type: String, 
    enum: ['uz', 'ru'], 
    default: 'uz' 
  },
  is_verified: { 
    type: Boolean, 
    default: false 
  },
}, { timestamps: true });

export const Employee = mongoose.model('Employee', employeeSchema);