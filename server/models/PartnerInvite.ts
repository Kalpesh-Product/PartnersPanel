import mongoose, { Schema } from "mongoose";
import { PARTNER_SERVICES, type PartnerService } from "../constants/partnerServices.js";
import type { ISetupDocument } from "./Partner.js";

// One invite per email while pending/accepted — approving a second service for
// someone who already has an invite/account extends this same document's
// `services` array instead of creating a second invite or account.
export interface IPartnerInvite extends mongoose.Document {
  email: string;
  fullName: string;
  contactCode?: string;
  contactNumber?: string;
  linkedinProfile?: string;
  currentCountry?: string;
  message?: string;
  submittedAt?: Date | null;
  // The default agreement PDF Master Panel had on file when this invite was
  // sent/last extended — copied onto the Partner account at registration.
  agreementDocument?: ISetupDocument | null;
  services: PartnerService[];
  sourceLeadRefs: { leadId: string; service: PartnerService }[];
  invitedBy: string;
  tokenHash: string;
  expiresAt: Date;
  status: "pending" | "accepted" | "revoked" | "expired";
  acceptedAt?: Date | null;
  acceptedPartnerId?: mongoose.Types.ObjectId | null;
  lastSentAt: Date;
}

const partnerInviteSchema = new Schema<IPartnerInvite>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
    },
    fullName: { type: String, trim: true, default: "" },
    contactCode: { type: String, trim: true, default: "" },
    contactNumber: { type: String, trim: true, default: "" },
    linkedinProfile: { type: String, trim: true, default: "" },
    currentCountry: { type: String, trim: true, default: "" },
    message: { type: String, trim: true, default: "" },
    submittedAt: { type: Date, default: null },
    agreementDocument: {
      type: new Schema<ISetupDocument>(
        { url: { type: String, trim: true, default: "" }, id: { type: String, trim: true, default: "" }, name: { type: String, trim: true, default: "" } },
        { _id: false },
      ),
      default: null,
    },
    services: {
      type: [{ type: String, enum: PARTNER_SERVICES }],
      default: [],
    },
    sourceLeadRefs: {
      type: [
        {
          leadId: { type: String, trim: true },
          service: { type: String, enum: PARTNER_SERVICES },
        },
      ],
      default: [],
    },
    invitedBy: { type: String, trim: true, default: "" },
    tokenHash: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "revoked", "expired"],
      default: "pending",
      index: true,
    },
    acceptedAt: { type: Date, default: null },
    acceptedPartnerId: { type: Schema.Types.ObjectId, ref: "Partner", default: null },
    lastSentAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true },
);

partnerInviteSchema.index({ email: 1, status: 1 });

const PartnerInvite =
  (mongoose.models.PartnerInvite as mongoose.Model<IPartnerInvite>) ||
  mongoose.model<IPartnerInvite>("PartnerInvite", partnerInviteSchema);
export default PartnerInvite;
