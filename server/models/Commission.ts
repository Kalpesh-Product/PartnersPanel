import mongoose, { Schema } from "mongoose";
import { PARTNER_SERVICES, type PartnerService } from "../constants/partnerServices.js";

// Admin-logged commission ledger entry — a tracked amount owed/paid to a
// partner for a closed lead, not a real payment integration.
export interface ICommission extends mongoose.Document {
  partnerId: mongoose.Types.ObjectId;
  service: PartnerService;
  leadRefCode: string;
  amount: number;
  currency: string;
  status: "pending" | "paid";
  dueDate: Date | null;
  paidAt: Date | null;
  note: string;
}

const commissionSchema = new Schema<ICommission>(
  {
    partnerId: { type: Schema.Types.ObjectId, ref: "Partner", required: true },
    service: { type: String, enum: PARTNER_SERVICES, required: true },
    leadRefCode: { type: String, trim: true, default: "" },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, trim: true, default: "USD" },
    status: { type: String, enum: ["pending", "paid"], default: "pending" },
    dueDate: { type: Date, default: null },
    paidAt: { type: Date, default: null },
    note: { type: String, trim: true, default: "" },
  },
  { timestamps: true },
);

const Commission =
  (mongoose.models.Commission as mongoose.Model<ICommission>) ||
  mongoose.model<ICommission>("Commission", commissionSchema);
export default Commission;
