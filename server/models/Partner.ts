import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import { PARTNER_SERVICES, type PartnerService } from "../constants/partnerServices.js";

// The confirmed-stable fields from the Figma "[Vertical] Partner Details" block
// (company/location/offerings) — one of these per approved service on the
// account, not per invite, since a partner account can gain more services later.
export interface IPartnerServiceDetails {
  service: PartnerService;
  companyName: string;
  countryOfOrigin: string;
  state: string;
  city: string;
  address: string;
  website: string;
  servicesOffered: string[];
  marketsServed: string[];
  addedAt: Date;
}

export interface IPartner extends mongoose.Document {
  fullName: string;
  email: string;
  password: string;
  contactCode: string;
  contactNumber: string;
  linkedinProfile: string;
  currentCountry: string;
  services: IPartnerServiceDetails[];
  isActive: boolean;
  refreshToken: string;
  failedLoginAttempts: number;
  lockUntil: Date | null;
  comparePassword(candidate: string): Promise<boolean>;
}

const partnerServiceDetailsSchema = new Schema<IPartnerServiceDetails>(
  {
    service: { type: String, enum: PARTNER_SERVICES, required: true },
    companyName: { type: String, trim: true, default: "" },
    countryOfOrigin: { type: String, trim: true, default: "" },
    state: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" },
    website: { type: String, trim: true, default: "" },
    servicesOffered: { type: [String], default: [] },
    marketsServed: { type: [String], default: [] },
    addedAt: { type: Date, default: () => new Date() },
  },
  { _id: false },
);

const partnerSchema = new Schema<IPartner>(
  {
    fullName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
    },
    password: { type: String, required: true, minlength: 8 },
    contactCode: { type: String, trim: true, default: "" },
    contactNumber: { type: String, trim: true, default: "" },
    linkedinProfile: { type: String, trim: true, default: "" },
    currentCountry: { type: String, trim: true, default: "" },
    services: { type: [partnerServiceDetailsSchema], default: [] },
    isActive: { type: Boolean, default: true },
    refreshToken: { type: String, default: "" },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
  },
  { timestamps: true },
);

// Mongoose 9's save-hook signature is promise-based, not callback-style.
partnerSchema.pre("save", async function (this: IPartner) {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

partnerSchema.methods.comparePassword = function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

const Partner =
  (mongoose.models.Partner as mongoose.Model<IPartner>) || mongoose.model<IPartner>("Partner", partnerSchema);
export default Partner;
