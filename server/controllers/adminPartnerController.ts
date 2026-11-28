import type { Request, Response, NextFunction } from "express";
import Partner from "../models/Partner.js";
import PartnerInvite from "../models/PartnerInvite.js";

// GET /api/admin/check-email — server-to-server availability check used by
// Nomads before accepting a new Value Adds Partner application.
export const checkPartnerEmailAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = String(req.query.email || "").trim().toLowerCase();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: "A valid email is required." });
    }

    const exists = await Partner.exists({ email });
    return res.status(200).json({
      exists: Boolean(exists),
      message: exists
        ? "This email already has a WONO Partner account."
        : "Email is available.",
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/partners — Master Panel's onboarded-partners listing
// (all verticals; the client filters/ranks per service).
export const listPartnersAdmin = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const partners = await Partner.find()
      .select("-password -refreshToken -failedLoginAttempts -lockUntil")
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({ data: partners });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/lead-statuses — invitation/onboarding state keyed by email.
// Master Panel uses this to lock a reviewed lead after that person has joined.
export const listPartnerLeadStatuses = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [partners, invites] = await Promise.all([
      Partner.find().select("email services createdAt").lean(),
      PartnerInvite.find().select("email services status lastSentAt acceptedAt").sort({ lastSentAt: -1 }).lean(),
    ]);

    const statuses: Record<string, unknown> = {};
    invites.forEach((invite) => {
      const email = String(invite.email || "").trim().toLowerCase();
      if (!email || statuses[email] || !["pending", "accepted"].includes(invite.status)) return;
      statuses[email] = {
        status: invite.status === "accepted" ? "joined" : "invite_sent",
        services: invite.services || [],
        updatedAt: invite.acceptedAt || invite.lastSentAt,
      };
    });
    partners.forEach((partner) => {
      const email = String(partner.email || "").trim().toLowerCase();
      if (!email) return;
      statuses[email] = {
        status: "joined",
        services: partner.services.map((entry) => entry.service),
        updatedAt: (partner as typeof partner & { createdAt?: Date }).createdAt,
      };
    });

    return res.status(200).json({ data: statuses });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/partners/:id — admin edits account-level fields only
// (not the per-service company details, which the partner owns via /partners/me).
export const updatePartnerAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { isActive, plan, rating, responseTimeMinutes, leadsClosed } = req.body || {};
    const update: Record<string, unknown> = {};

    if (typeof isActive === "boolean") update.isActive = isActive;
    if (plan && ["free", "starter", "growth"].includes(plan)) update.plan = plan;
    if (rating === null || typeof rating === "number") update.rating = rating;
    if (responseTimeMinutes === null || typeof responseTimeMinutes === "number") update.responseTimeMinutes = responseTimeMinutes;
    if (typeof leadsClosed === "number") update.leadsClosed = leadsClosed;

    const partner = await Partner.findByIdAndUpdate(req.params.id, update, { new: true })
      .select("-password -refreshToken -failedLoginAttempts -lockUntil");
    if (!partner) return res.status(404).json({ message: "Partner not found." });

    return res.status(200).json({ message: "Partner updated.", data: partner });
  } catch (error) {
    next(error);
  }
};
