import mongoose, { Schema } from "mongoose";

export interface IOtp extends mongoose.Document {
  email: string;
  code: string;
  purpose: "registration" | "login" | "password_reset";
  attempts: number;
  expiresAt: Date;
  isUsed: boolean;
  payload: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const otpSchema = new Schema<IOtp>(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    code: { type: String, required: true },
    purpose: {
      type: String,
      enum: ["registration", "login", "password_reset"],
      required: true,
      index: true,
    },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true, index: true },
    isUsed: { type: Boolean, default: false, index: true },
    payload: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

// Auto-cleanup: OTP documents are useless 30 minutes after creation either way.
otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 1800 });

const Otp = (mongoose.models.Otp as mongoose.Model<IOtp>) || mongoose.model<IOtp>("Otp", otpSchema);
export default Otp;
