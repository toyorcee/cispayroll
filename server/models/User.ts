// models/User.ts
import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";

export interface IUser extends Document {
  username?: string;  // For local auth
  password?: string;  // For local auth (hashed)
  googleId?: string;  // For Google OAuth
  email?: string;
  role?: string;      // e.g., 'admin' or 'user'
}

const UserSchema = new Schema<IUser>({
  username: {
    type: String,
    unique: true,
    sparse: true,
  },
  password: {
    type: String,
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
  },
  role: {
    type: String,
    default: "user",
  },
});

// PRE-SAVE HOOK: Hash password if modified
UserSchema.pre("save", async function (next) {
  const user = this;

  if (!user.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password!, salt);
    return next();
  } catch (error) {
    return next(error as Error);
  }
});

export default mongoose.model<IUser>("User", UserSchema);
