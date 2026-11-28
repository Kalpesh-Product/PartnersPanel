import type { Request, Response, NextFunction } from "express";
import Partner from "../models/Partner.js";
import { isPartnerService } from "../constants/partnerServices.js";
import { uploadFileToS3 } from "../config/s3config.js";

interface AuthedRequest extends Request {
  partnerId?: string;
  file?: Express.Multer.File;
}

const SETUP_DOCUMENT_KINDS = ["signedAgreement", "businessDocument"];
const MAX_BUSINESS_DOCUMENTS = 5;

const toSafeFileName = (name: unknown) =>
  String(name || "document")
    .replace(/[^A-Za-z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "") || "document";

// GET /api/partners/me
export const getMe = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const partner = await Partner.findById(req.partnerId).select("-password -refreshToken").lean();
    if (!partner) return res.status(404).json({ message: "Partner not found." });
    return res.status(200).json({ data: partner });
  } catch (error) {
    next(error);
  }
};

// PUT /api/partners/me/profile — body: { services: [{ service, companyName, countryOfOrigin, state, city, address, website, servicesOffered, marketsServed }], linkedinProfile? }
export const updateMyProfile = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const { services, linkedinProfile, agreementAcceptance } = req.body || {};
    if (!Array.isArray(services) || !services.length) {
      return res.status(400).json({ message: "At least one service's details are required." });
    }

    const partner = await Partner.findById(req.partnerId);
    if (!partner) return res.status(404).json({ message: "Partner not found." });

    // A business-verification document is always required; the signed
    // agreement + "I agree" are only required when WONO attached a default
    // agreement to this partner's invite — same gating as HostPanel's
    // Create Business Location. Once accepted, never re-require it.
    if (!partner.agreementAcceptance?.accepted) {
      const businessDocuments = Array.isArray(agreementAcceptance?.businessDocuments)
        ? agreementAcceptance.businessDocuments
        : [];
      if (businessDocuments.length === 0) {
        return res.status(400).json({ message: "Upload at least one business document." });
      }
      if (partner.agreementDocument?.url) {
        if (!agreementAcceptance?.accepted) {
          return res.status(400).json({ message: "You need to accept the agreement to continue." });
        }
        if (!agreementAcceptance?.signedDocument?.url) {
          return res.status(400).json({ message: "Upload the filled-in agreement." });
        }
      }
    }

    const ownedServices = new Set(partner.services.map((entry) => entry.service));

    for (const entry of services) {
      if (!isPartnerService(entry.service) || !ownedServices.has(entry.service)) {
        return res.status(400).json({ message: `Invalid service: ${entry.service}` });
      }
      if (!entry.companyName || !entry.countryOfOrigin || !entry.state || !entry.city || !entry.address) {
        return res.status(400).json({ message: "Company name, country, state, city and address are required for every service." });
      }
    }

    for (const entry of services) {
      const existing = partner.services.find((s) => s.service === entry.service);
      if (!existing) continue;
      existing.companyName = String(entry.companyName).trim();
      existing.countryOfOrigin = String(entry.countryOfOrigin).trim();
      existing.state = String(entry.state).trim();
      existing.city = String(entry.city).trim();
      existing.address = String(entry.address).trim();
      existing.website = String(entry.website || "").trim();
      existing.servicesOffered = Array.isArray(entry.servicesOffered) ? entry.servicesOffered.map(String) : [];
      existing.marketsServed = Array.isArray(entry.marketsServed) ? entry.marketsServed.map(String) : [];
    }

    if (typeof linkedinProfile === "string") {
      partner.linkedinProfile = linkedinProfile.trim();
    }

    if (!partner.agreementAcceptance?.accepted && agreementAcceptance) {
      partner.agreementAcceptance = {
        accepted: Boolean(agreementAcceptance.accepted),
        acceptedAt: agreementAcceptance.accepted ? new Date() : null,
        signedDocument: agreementAcceptance.signedDocument?.url ? agreementAcceptance.signedDocument : null,
        businessDocuments: Array.isArray(agreementAcceptance.businessDocuments)
          ? agreementAcceptance.businessDocuments.filter((doc: { url?: string }) => doc?.url)
          : [],
      };
    }

    await partner.save();
    return res.status(200).json({ message: "Profile updated.", data: partner });
  } catch (error) {
    next(error);
  }
};

// POST /api/partners/me/plan-request — body: { plan: "starter" | "growth", billingCycle?: "monthly" | "annual" }
export const requestPlanUpgrade = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const plan = String(req.body?.plan || "").toLowerCase();
    const billingCycle = String(req.body?.billingCycle || "monthly").toLowerCase();
    if (!["starter", "growth"].includes(plan)) {
      return res.status(400).json({ message: "Choose the Starter or Growth plan." });
    }
    if (!["monthly", "annual"].includes(billingCycle)) {
      return res.status(400).json({ message: "Choose a monthly or annual billing cycle." });
    }

    const partner = await Partner.findById(req.partnerId);
    if (!partner) return res.status(404).json({ message: "Partner not found." });

    partner.planRequest = {
      plan: plan as "starter" | "growth",
      billingCycle: billingCycle as "monthly" | "annual",
      requestedAt: new Date(),
      status: "pending",
    };
    await partner.save();

    return res.status(200).json({
      message: `Upgrade request for the ${plan} plan sent to the WONO team.`,
      data: partner.planRequest,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/partners/me/agreement
export const getSetupAgreement = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const partner = await Partner.findById(req.partnerId).select("agreementDocument").lean();
    if (!partner) return res.status(404).json({ message: "Partner not found." });
    return res.status(200).json({ agreement: partner.agreementDocument || null });
  } catch (error) {
    next(error);
  }
};

// POST /api/partners/me/setup-documents (multipart: kind, file)
export const uploadSetupDocument = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const kind = String(req.body?.kind || "").trim();
    if (!SETUP_DOCUMENT_KINDS.includes(kind)) {
      return res.status(400).json({ message: "Unknown document type." });
    }
    if (!req.file) return res.status(400).json({ message: "Choose a file to upload." });

    if (kind === "businessDocument") {
      const partner = await Partner.findById(req.partnerId).select("agreementAcceptance").lean();
      const existingCount = partner?.agreementAcceptance?.businessDocuments?.length || 0;
      if (existingCount >= MAX_BUSINESS_DOCUMENTS) {
        return res.status(400).json({ message: `You can add up to ${MAX_BUSINESS_DOCUMENTS} business documents.` });
      }
    }

    const safeName = toSafeFileName(req.file.originalname);
    const uploaded = await uploadFileToS3(
      `partner-setup-documents/${req.partnerId}/${kind}/${Date.now()}_${safeName}`,
      req.file,
    );
    return res.status(201).json({
      document: { url: uploaded.url, id: uploaded.id, name: String(req.file.originalname || "").slice(0, 200) || "document" },
    });
  } catch (error) {
    next(error);
  }
};
