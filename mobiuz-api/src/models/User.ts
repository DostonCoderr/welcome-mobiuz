import mongoose, { Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'hr';
  phone?: string;
  avatar?: string;
  rating?: number;
  telegram_id?: string;          // ⚡ QO'SHILDI
  telegram_code?: string;        // ⚡ QO'SHILDI
  telegram_code_expires?: Date;  // ⚡ QO'SHILDI
  invite_code?: string | null;
  invite_code_expires?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

interface IUserModel extends Model<IUser> { }

const userSchema = new mongoose.Schema<IUser, IUserModel>(
  {
    name: { type: String, required: true },
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
    phone: { type: String, default: '' },
    avatar: { type: String, default: '' },
    rating: { type: Number, default: 5 },
    telegram_id: { type: String, default: null },          // ⚡ QO'SHILDI
    telegram_code: { type: String, default: null },        // ⚡ QO'SHILDI
    telegram_code_expires: { type: Date, default: null },  // ⚡ QO'SHILDI
    invite_code: { type: String, default: null },
    invite_code_expires: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.pre<IUser>('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser, IUserModel>('User', userSchema);