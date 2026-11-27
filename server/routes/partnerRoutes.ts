import { Router } from "express";
import { getMe, updateMyProfile } from "../controllers/partnerController.js";
import verifyJwt from "../middlewares/verifyJwt.js";

const router = Router();

router.use(verifyJwt);
router.get("/me", getMe);
router.put("/me/profile", updateMyProfile);

export default router;
