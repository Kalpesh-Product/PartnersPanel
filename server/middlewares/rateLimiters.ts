import rateLimit from "express-rate-limit";

// Per-IP limits as a backstop alongside the per-account lockout in authController
// (per-IP alone isn't enough against distributed credential stuffing, but it
// stops the common case of one client hammering the endpoint).
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please try again later." },
});

export const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please try again later." },
});
