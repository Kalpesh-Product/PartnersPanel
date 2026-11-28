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

// Latest upgrade request sent from the dashboard's Upgrade Plan modal — the
// master panel approves it and flips `plan`, same request-to-master flow as
// HostPanel's plan upgrades.
export interface IPlanRequest {
  plan: "starter" | "growth";
  billingCycle: "monthly" | "annual";
  requestedAt: Date;
  status: "pending" | "approved" | "rejected";
}

export interface ISetupDocument {
  url: string;
  id: string;
  name: string;
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
  plan: "free" | "starter" | "growth";
  planRequest: IPlanRequest | null;
  rating: number | null;
  responseTimeMinutes: number | null;
  leadsClosed: number;
  // Copied from the invite at registration — the agreement WONO staff attached
  // before sending it, same default-PDF pattern as HostPanel's invites.
  agreementDocument: ISetupDocument | null;
  agreementAcceptance: {
    accepted: boolean;
    acceptedAt: Date | null;
    signedDocument: ISetupDocument | null;
    businessDocuments: ISetupDocument[];
  };
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

const planRequestSchema = new Schema<IPlanRequest>(
  {
    plan: { type: String, enum: ["starter", "growth"], required: true },
    billingCycle: { type: String, enum: ["monthly", "annual"], default: "monthly" },
    requestedAt: { type: Date, default: () => new Date() },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  },
  { _id: false },
);

const setupDocumentSchema = new Schema<ISetupDocument>(
  {
    url: { type: String, trim: true, default: "" },
    id: { type: String, trim: true, default: "" },
    name: { type: String, trim: true, default: "" },
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
    plan: { type: String, enum: ["free", "starter", "growth"], default: "free" },
    planRequest: { type: planRequestSchema, default: null },
    rating: { type: Number, min: 0, max: 5, default: null },
    responseTimeMinutes: { type: Number, min: 0, default: null },
    leadsClosed: { type: Number, default: 0 },
    agreementDocument: { type: setupDocumentSchema, default: null },
    agreementAcceptance: {
      accepted: { type: Boolean, default: false },
      acceptedAt: { type: Date, default: null },
      signedDocument: { type: setupDocumentSchema, default: null },
      businessDocuments: { type: [setupDocumentSchema], default: [] },
    },
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
