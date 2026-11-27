import { Router } from "express";
import { getInviteByToken } from "../controllers/inviteController.js";
import {
  sendRegisterOtp,
  verifyRegisterOtpAndComplete,
  login,
  refresh,
  logout,
  forgotPasswordStart,
  forgotPasswordVerifyOtp,
  forgotPasswordReset,
} from "../controllers/authController.js";
import { loginRateLimiter, otpRateLimiter } from "../middlewares/rateLimiters.js";

const router = Router();

router.get("/register/:token", getInviteByToken);
router.post("/register/:token/send-otp", otpRateLimiter, sendRegisterOtp);
router.post("/register/:token/verify-otp", otpRateLimiter, verifyRegisterOtpAndComplete);

router.post("/login", loginRateLimiter, login);
router.post("/refresh", refresh);
router.post("/logout", logout);

router.post("/forgot-password/start", otpRateLimiter, forgotPasswordStart);
router.post("/forgot-password/verify-otp", otpRateLimiter, forgotPasswordVerifyOtp);
router.post("/forgot-password/reset", forgotPasswordReset);

export default router;
