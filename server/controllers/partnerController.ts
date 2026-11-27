import type { Request, Response, NextFunction } from "express";
import Partner from "../models/Partner.js";
import { isPartnerService } from "../constants/partnerServices.js";

interface AuthedRequest extends Request {
  partnerId?: string;
}

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
    const { services, linkedinProfile } = req.body || {};
    if (!Array.isArray(services) || !services.length) {
      return res.status(400).json({ message: "At least one service's details are required." });
    }

    const partner = await Partner.findById(req.partnerId);
    if (!partner) return res.status(404).json({ message: "Partner not found." });

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

    await partner.save();
    return res.status(200).json({ message: "Profile updated.", data: partner });
  } catch (error) {
    next(error);
  }
};
