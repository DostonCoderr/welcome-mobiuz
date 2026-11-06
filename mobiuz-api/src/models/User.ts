import mongoose, { Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

// ⚡ Interfeys: User hujjatining tuzilishi
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'hr';
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// ⚡ Interfeys: User modelining statik metodlari
interface IUserModel extends Model<IUser> {}

const userSchema = new mongoose.Schema<IUser, IUserModel>(
  {
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true, 
      trim: true 
    },
    password: { 
      type: String, 
      required: true 
    },
    role: { 
      type: String, 
      enum: ['admin', 'hr'], 
      default: 'hr' 
    },
    name: { type: String, required: true },
  },
  { timestamps: true }
);

// ⚡ Parolni saqlashdan oldin shifrlash (next siz!)
userSchema.pre<IUser>('save', async function () {
  if (!this.isModified('password')) return;
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Parolni tekshirish metodi
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser, IUserModel>('User', userSchema);