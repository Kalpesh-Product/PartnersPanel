import mongoose, { Schema } from "mongoose";
import { PARTNER_SERVICES, type PartnerService } from "../constants/partnerServices.js";

// Admin-logged follow-up: Master Panel staff record who still owes a
// response (client or partner) on a lead, and clear it once resolved.
export interface IFollowUp extends mongoose.Document {
  partnerId: mongoose.Types.ObjectId;
  service: PartnerService;
  leadRefCode: string;
  clientName: string;
  clientEmail: string;
  waitingOn: "client" | "partner";
  reason: string;
  lastResponseAt: Date;
  dueAt: Date;
  status: "open" | "resolved";
}

const followUpSchema = new Schema<IFollowUp>(
  {
    partnerId: { type: Schema.Types.ObjectId, ref: "Partner", required: true },
    service: { type: String, enum: PARTNER_SERVICES, required: true },
    leadRefCode: { type: String, trim: true, default: "" },
    clientName: { type: String, trim: true, required: true },
    clientEmail: { type: String, trim: true, default: "" },
    waitingOn: { type: String, enum: ["client", "partner"], required: true },
    reason: { type: String, trim: true, default: "" },
    lastResponseAt: { type: Date, default: () => new Date() },
    dueAt: { type: Date, required: true },
    status: { type: String, enum: ["open", "resolved"], default: "open" },
  },
  { timestamps: true },
);

const FollowUp =
  (mongoose.models.FollowUp as mongoose.Model<IFollowUp>) || mongoose.model<IFollowUp>("FollowUp", followUpSchema);
export default FollowUp;
