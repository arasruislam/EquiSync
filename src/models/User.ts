import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type UserRole = "SUPER_ADMIN" | "CO_FOUNDER" | "PROJECT_MANAGER" | "LEADER" | "EMPLOYEE";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  twoFactorSecret?: string;
  twoFactorEnabled: boolean;
  isActive: boolean;
  image?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["SUPER_ADMIN", "CO_FOUNDER", "PROJECT_MANAGER", "LEADER", "EMPLOYEE"],
      required: true,
    },
    twoFactorSecret: { type: String, select: false },
    twoFactorEnabled: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    image: { type: String },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

UserSchema.index({ role: 1 });

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
