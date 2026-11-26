import jwt from "jsonwebtoken";

export interface AuthedRequest extends Express.Request {
  partnerId?: string;
  partnerEmail?: string;
}

const verifyJwt = (req: any, res: any, next: any) => {
  const header = req.headers?.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Access token is required." });

  jwt.verify(token, process.env.JWT_SECRET as string, (err: unknown, decoded: any) => {
    if (err) return res.status(403).json({ message: "Invalid or expired access token." });
    req.partnerId = decoded.partnerId;
    req.partnerEmail = decoded.email;
    next();
  });
};

export default verifyJwt;
