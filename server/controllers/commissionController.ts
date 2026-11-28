import type { Request, Response, NextFunction } from "express";
import Commission from "../models/Commission.js";
import Partner from "../models/Partner.js";
import { isPartnerService } from "../constants/partnerServices.js";

// GET /api/admin/commissions
export const listCommissions = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const commissions = await Commission.find()
      .populate("partnerId", "fullName email")
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({ data: commissions });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/commissions
export const createCommission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { partnerId, service, leadRefCode, amount, currency, dueDate, note } = req.body || {};

    if (!partnerId || !(await Partner.exists({ _id: partnerId }))) {
      return res.status(400).json({ message: "A valid partner is required." });
    }
    if (!isPartnerService(service)) {
      return res.status(400).json({ message: "A valid partner service is required." });
    }
    if (typeof amount !== "number" || amount < 0) {
      return res.status(400).json({ message: "A valid amount is required." });
    }

    const commission = await Commission.create({
      partnerId,
      service,
      leadRefCode: leadRefCode || "",
      amount,
      currency: currency || "USD",
      dueDate: dueDate && !Number.isNaN(new Date(dueDate).getTime()) ? new Date(dueDate) : null,
      note: note || "",
    });
    return res.status(201).json({ message: "Commission logged.", data: commission });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/commissions/:id — mark paid/pending or edit amount/note.
export const updateCommission = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, amount, note, dueDate } = req.body || {};
    const update: Record<string, unknown> = {};

    if (status && ["pending", "paid"].includes(status)) {
      update.status = status;
      update.paidAt = status === "paid" ? new Date() : null;
    }
    if (typeof amount === "number" && amount >= 0) update.amount = amount;
    if (typeof note === "string") update.note = note;
    if (dueDate && !Number.isNaN(new Date(dueDate).getTime())) update.dueDate = new Date(dueDate);

    const commission = await Commission.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!commission) return res.status(404).json({ message: "Commission not found." });

    return res.status(200).json({ message: "Commission updated.", data: commission });
  } catch (error) {
    next(error);
  }
};
