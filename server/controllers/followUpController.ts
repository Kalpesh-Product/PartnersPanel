import type { Request, Response, NextFunction } from "express";
import FollowUp from "../models/FollowUp.js";
import Partner from "../models/Partner.js";
import { isPartnerService } from "../constants/partnerServices.js";

// GET /api/admin/follow-ups
export const listFollowUps = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const followUps = await FollowUp.find()
      .populate("partnerId", "fullName email")
      .sort({ dueAt: 1 })
      .lean();
    return res.status(200).json({ data: followUps });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/follow-ups
export const createFollowUp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { partnerId, service, leadRefCode, clientName, clientEmail, waitingOn, reason, dueAt } = req.body || {};

    if (!partnerId || !(await Partner.exists({ _id: partnerId }))) {
      return res.status(400).json({ message: "A valid partner is required." });
    }
    if (!isPartnerService(service)) {
      return res.status(400).json({ message: "A valid partner service is required." });
    }
    if (!clientName || typeof clientName !== "string") {
      return res.status(400).json({ message: "Client name is required." });
    }
    if (!["client", "partner"].includes(waitingOn)) {
      return res.status(400).json({ message: "waitingOn must be 'client' or 'partner'." });
    }
    if (!dueAt || Number.isNaN(new Date(dueAt).getTime())) {
      return res.status(400).json({ message: "A valid due date is required." });
    }

    const followUp = await FollowUp.create({
      partnerId,
      service,
      leadRefCode: leadRefCode || "",
      clientName,
      clientEmail: clientEmail || "",
      waitingOn,
      reason: reason || "",
      dueAt: new Date(dueAt),
    });
    return res.status(201).json({ message: "Follow-up added.", data: followUp });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/follow-ups/:id — log a response (resets the clock) or resolve/reopen it.
export const updateFollowUp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { waitingOn, reason, dueAt, status } = req.body || {};
    const update: Record<string, unknown> = {};

    if (waitingOn && ["client", "partner"].includes(waitingOn)) {
      update.waitingOn = waitingOn;
      update.lastResponseAt = new Date();
    }
    if (typeof reason === "string") update.reason = reason;
    if (dueAt && !Number.isNaN(new Date(dueAt).getTime())) update.dueAt = new Date(dueAt);
    if (status && ["open", "resolved"].includes(status)) update.status = status;

    const followUp = await FollowUp.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!followUp) return res.status(404).json({ message: "Follow-up not found." });

    return res.status(200).json({ message: "Follow-up updated.", data: followUp });
  } catch (error) {
    next(error);
  }
};
