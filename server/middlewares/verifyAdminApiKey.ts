import crypto from "crypto";

// Gates server-to-server calls (Master Panel -> Partners Panel), same
// convention as Nomads' x-admin-api-key checks.
const verifyAdminApiKey = (req: any, res: any, next: any) => {
  const key = String(req.headers?.["x-admin-api-key"] || "");
  const expected = String(process.env.PARTNERS_PANEL_ADMIN_API_KEY || "");
  const keyBuf = Buffer.from(key);
  const expectedBuf = Buffer.from(expected);
  const matches =
    expected.length > 0 && keyBuf.length === expectedBuf.length && crypto.timingSafeEqual(keyBuf, expectedBuf);
  if (!matches) {
    return res.status(401).json({ message: "Unauthorized." });
  }
  next();
};

export default verifyAdminApiKey;
