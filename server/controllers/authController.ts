import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import PartnerInvite from "../models/PartnerInvite.js";
import Partner from "../models/Partner.js";
import Otp from "../models/Otp.js";
import { sendMail } from "../config/mailer.js";
import { buildOtpEmail } from "../utils/emailTemplates.js";
import { validateStrongPassword } from "../utils/password.js";
import { hashToken } from "./inviteController.js";

const OTP_EXPIRY_MINUTES = 10;
const OTP_RESEND_COOLDOWN_MS = 30 * 1000;
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

const accessSecret = () => process.env.JWT_SECRET as string;
const refreshSecret = () => (process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET) as string;

const findPendingInvite = async (token: string | string[]) => {
  const invite = await PartnerInvite.findOne({ tokenHash: hashToken(String(token)) });
  if (!invite) return { error: { status: 404, message: "Invalid or expired invite link." } };
  if (invite.status !== "pending") {
    return { error: { status: 409, message: "This invite has already been used or is no longer valid." } };
  }
  if (invite.expiresAt.getTime() < Date.now()) {
    return { error: { status: 410, message: "This invite link has expired. Ask WONO to resend it." } };
  }
  return { invite };
};

// POST /api/auth/register/:token/send-otp — body: { password, confirmPassword }
export const sendRegisterOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { password, confirmPassword } = req.body || {};
    if (!password || !confirmPassword) {
      return res.status(400).json({ message: "Password and confirm password are required." });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }
    const strengthMessage = validateStrongPassword(password);
    if (strengthMessage) return res.status(400).json({ message: strengthMessage });

    const { invite, error } = await findPendingInvite(req.params.token);
    if (error) return res.status(error.status).json({ message: error.message });

    const existingPartner = await Partner.findOne({ email: invite!.email });
    if (existingPartner) {
      return res.status(409).json({ message: "An account already exists for this email. Please sign in." });
    }

    const recentOtp = await Otp.findOne({ email: invite!.email, purpose: "registration", isUsed: false })
      .sort({ createdAt: -1 })
      .lean();
    if (recentOtp && Date.now() - new Date(recentOtp.createdAt).getTime() < OTP_RESEND_COOLDOWN_MS) {
      return res.status(429).json({ message: "Please wait a moment before requesting another code." });
    }

    const code = `${Math.floor(100000 + Math.random() * 900000)}`;
    await Otp.updateMany({ email: invite!.email, purpose: "registration", isUsed: false }, { $set: { isUsed: true } });
    await Otp.create({
      email: invite!.email,
      code,
      purpose: "registration",
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
      payload: { password, inviteToken: req.params.token },
    });

    const email_ = buildOtpEmail({ fullName: invite!.fullName, code, expiryMinutes: OTP_EXPIRY_MINUTES });
    await sendMail({ to: invite!.email, subject: email_.subject, text: email_.text, html: email_.html });

    return res.status(200).json({ message: "OTP sent successfully.", email: invite!.email });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/register/:token/verify-otp — body: { otp }
export const verifyRegisterOtpAndComplete = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { otp } = req.body || {};
    if (!otp) return res.status(400).json({ message: "OTP is required." });

    const { invite, error } = await findPendingInvite(req.params.token);
    if (error) return res.status(error.status).json({ message: error.message });

    const otpRecord = await Otp.findOne({ email: invite!.email, purpose: "registration", isUsed: false }).sort({
      createdAt: -1,
    });
    if (!otpRecord) return res.status(400).json({ message: "Please request an OTP first." });
    if (otpRecord.expiresAt.getTime() < Date.now()) {
      otpRecord.isUsed = true;
      await otpRecord.save();
      return res.status(400).json({ message: "OTP expired. Please request a new one." });
    }
    if (otpRecord.attempts >= 5) {
      otpRecord.isUsed = true;
      await otpRecord.save();
      return res.status(429).json({ message: "Too many attempts. Please request a new OTP." });
    }
    if (String(otpRecord.code) !== String(otp)) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ message: "Invalid OTP." });
    }

    const password = (otpRecord.payload as { password?: string })?.password;
    if (!password) return res.status(400).json({ message: "Registration session expired. Please start again." });

    const existingPartner = await Partner.findOne({ email: invite!.email });
    if (existingPartner) {
      return res.status(409).json({ message: "An account already exists for this email. Please sign in." });
    }

    // Bare account: each approved service gets a placeholder entry, filled in
    // later from the partner's own dashboard (the "[Vertical] Partner
    // Details" form), not at registration time.
    const partner = await Partner.create({
      fullName: invite!.fullName,
      email: invite!.email,
      password,
      contactCode: invite!.contactCode,
      contactNumber: invite!.contactNumber,
      linkedinProfile: invite!.linkedinProfile,
      currentCountry: invite!.currentCountry,
      services: invite!.services.map((service) => ({
        service,
        companyName: "",
        countryOfOrigin: "",
        state: "",
        city: "",
        address: "",
        website: "",
        servicesOffered: [],
        marketsServed: [],
        addedAt: new Date(),
      })),
    });

    otpRecord.isUsed = true;
    await otpRecord.save();
    invite!.status = "accepted";
    invite!.acceptedAt = new Date();
    invite!.acceptedPartnerId = partner._id as any;
    await invite!.save();

    return res.status(201).json({ message: "Registration completed successfully. You can now sign in." });
  } catch (error) {
    next(error);
  }
};

const issueTokens = (partner: { _id: unknown; email: string }) => {
  const accessToken = jwt.sign({ partnerId: partner._id, email: partner.email }, accessSecret(), {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
  const refreshToken = jwt.sign({ partnerId: partner._id }, refreshSecret(), {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
  return { accessToken, refreshToken };
};

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

// POST /api/auth/login — body: { email, password }
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: "Email and password are required." });

    const partner = await Partner.findOne({ email: String(email).trim().toLowerCase() });
    // Same generic message whether the account doesn't exist, is locked, is
    // inactive, or the password is wrong — avoids confirming which is true.
    const genericFailure = { status: 401, message: "Invalid email or password." };

    if (!partner || !partner.isActive) return res.status(genericFailure.status).json({ message: genericFailure.message });

    if (partner.lockUntil && partner.lockUntil.getTime() > Date.now()) {
      return res.status(423).json({ message: "Too many failed attempts. Please try again later." });
    }

    if (!(await partner.comparePassword(password))) {
      partner.failedLoginAttempts += 1;
      if (partner.failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
        partner.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
        partner.failedLoginAttempts = 0;
      }
      await partner.save();
      return res.status(genericFailure.status).json({ message: genericFailure.message });
    }

    partner.failedLoginAttempts = 0;
    partner.lockUntil = null;
    const { accessToken, refreshToken } = issueTokens(partner);
    partner.refreshToken = refreshToken;
    await partner.save();

    res.cookie("partnerRefreshToken", refreshToken, refreshCookieOptions);
    return res.status(200).json({
      accessToken,
      data: {
        id: partner._id,
        fullName: partner.fullName,
        email: partner.email,
        services: partner.services.map((entry) => entry.service),
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/refresh — reads the httpOnly cookie. Rotates the refresh
// token on every use: a stolen-and-reused old token stops matching the
// stored one on the partner's NEXT legitimate refresh, as a reuse signal.
export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies?.partnerRefreshToken;
    if (!refreshToken) return res.status(401).json({ message: "No refresh token provided." });

    let decoded: { partnerId: string };
    try {
      decoded = jwt.verify(refreshToken, refreshSecret()) as { partnerId: string };
    } catch {
      return res.status(403).json({ message: "Invalid or expired refresh token." });
    }

    const partner = await Partner.findOne({ _id: decoded.partnerId, refreshToken });
    if (!partner) return res.status(403).json({ message: "Invalid refresh token." });

    const { accessToken, refreshToken: newRefreshToken } = issueTokens(partner);
    partner.refreshToken = newRefreshToken;
    await partner.save();

    res.cookie("partnerRefreshToken", newRefreshToken, refreshCookieOptions);
    return res.status(200).json({ accessToken });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/logout
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies?.partnerRefreshToken;
    if (refreshToken) {
      await Partner.findOneAndUpdate({ refreshToken }, { $set: { refreshToken: "" } });
    }
    res.clearCookie("partnerRefreshToken", refreshCookieOptions);
    return res.status(200).json({ message: "Logged out." });
  } catch (error) {
    next(error);
  }
};
