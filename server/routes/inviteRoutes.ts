import { Router } from "express";
import { createOrExtendInvite } from "../controllers/inviteController.js";
import verifyAdminApiKey from "../middlewares/verifyAdminApiKey.js";

const router = Router();

router.post("/", verifyAdminApiKey, createOrExtendInvite);

export default router;
