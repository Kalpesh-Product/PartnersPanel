import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import PartnerInvite from "../models/PartnerInvite.js";
import Partner from "../models/Partner.js";
import { sendMail } from "../config/mailer.js";
import { buildPartnerInviteEmail } from "../utils/emailTemplates.js";
import { isPartnerService, type PartnerService } from "../constants/partnerServices.js";

const INVITE_EXPIRY_DAYS = 7;

const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

const frontendUrl = () =>
  String(process.env.PARTNERS_PANEL_FRONTEND_URL || "http://localhost:3008").replace(/\/+$/, "");

// Called when Master Panel approves a lead for one service. One pending
// invite per email: approving a second service for the same person extends
// that invite's `services` array instead of creating a second invite/email.
// Same rule for someone who already registered — the service is added
// straight onto their existing Partner account, no new invite needed.
export const createOrExtendInvite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, service, fullName, contactCode, contactNumber, linkedinProfile, currentCountry, leadId, invitedBy } =
      req.body || {};

    if (!email || typeof email !== "string") {
      return res.status(400).json({ message: "A valid email is required." });
    }
    if (!isPartnerService(service)) {
      return res.status(400).json({ message: "A valid partner service is required." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingPartner = await Partner.findOne({ email: normalizedEmail });
    if (existingPartner) {
      const alreadyHasService = existingPartner.services.some((entry) => entry.service === service);
      if (!alreadyHasService) {
        existingPartner.services.push({
          service: service as PartnerService,
          companyName: "",
          countryOfOrigin: "",
          state: "",
          city: "",
          address: "",
          website: "",
          servicesOffered: [],
          marketsServed: [],
          addedAt: new Date(),
        });
        await existingPartner.save();
      }
      return res.status(200).json({
        message: alreadyHasService
          ? "This partner already has access to that service."
          : "Service added to the partner's existing account.",
        data: { accountExists: true, partnerId: existingPartner._id },
      });
    }

    let invite = await PartnerInvite.findOne({ email: normalizedEmail, status: "pending" });
    const rawToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    if (invite) {
      if (!invite.services.includes(service)) invite.services.push(service as PartnerService);
      if (leadId) invite.sourceLeadRefs.push({ leadId: String(leadId), service: service as PartnerService });
      invite.fullName = fullName || invite.fullName;
      invite.contactCode = contactCode || invite.contactCode;
      invite.contactNumber = contactNumber || invite.contactNumber;
      invite.linkedinProfile = linkedinProfile || invite.linkedinProfile;
      invite.currentCountry = currentCountry || invite.currentCountry;
      invite.invitedBy = invitedBy || invite.invitedBy;
      invite.expiresAt = expiresAt;
      invite.lastSentAt = new Date();
      await invite.save();
    } else {
      invite = await PartnerInvite.create({
        email: normalizedEmail,
        fullName: fullName || "",
        contactCode: contactCode || "",
        contactNumber: contactNumber || "",
        linkedinProfile: linkedinProfile || "",
        currentCountry: currentCountry || "",
        services: [service],
        sourceLeadRefs: leadId ? [{ leadId: String(leadId), service }] : [],
        invitedBy: invitedBy || "",
        tokenHash: hashToken(rawToken),
        expiresAt,
        status: "pending",
        lastSentAt: new Date(),
      });
    }

    const email_ = buildPartnerInviteEmail({
      fullName: invite.fullName,
      services: invite.services,
      registerUrl: `${frontendUrl()}/register/${rawToken}`,
    });
    await sendMail({ to: invite.email, subject: email_.subject, text: email_.text, html: email_.html });

    return res.status(200).json({ message: "Invite sent.", data: { inviteId: invite._id, services: invite.services } });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/register/:token — lets the frontend prefill the locked
// Personal Information fields and know which services to show.
export const getInviteByToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invite = await PartnerInvite.findOne({ tokenHash: hashToken(String(req.params.token)) });
    if (!invite) return res.status(404).json({ message: "Invalid or expired invite link." });
    if (invite.status !== "pending") {
      return res.status(409).json({ message: "This invite has already been used or is no longer valid." });
    }
    if (invite.expiresAt.getTime() < Date.now()) {
      return res.status(410).json({ message: "This invite link has expired. Ask WONO to resend it." });
    }

    return res.status(200).json({
      data: {
        email: invite.email,
        fullName: invite.fullName,
        contactCode: invite.contactCode,
        contactNumber: invite.contactNumber,
        linkedinProfile: invite.linkedinProfile,
        currentCountry: invite.currentCountry,
        services: invite.services,
      },
    });
  } catch (error) {
    next(error);
  }
};

export { hashToken };
