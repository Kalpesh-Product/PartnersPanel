import { Router } from "express";
import verifyAdminApiKey from "../middlewares/verifyAdminApiKey.js";
import {
  checkPartnerEmailAdmin,
  listPartnerLeadStatuses,
  listPartnersAdmin,
  updatePartnerAdmin,
} from "../controllers/adminPartnerController.js";
import { listFollowUps, createFollowUp, updateFollowUp } from "../controllers/followUpController.js";
import { listCommissions, createCommission, updateCommission } from "../controllers/commissionController.js";

const router = Router();

router.use(verifyAdminApiKey);

router.get("/check-email", checkPartnerEmailAdmin);
router.get("/partners", listPartnersAdmin);
router.get("/lead-statuses", listPartnerLeadStatuses);
router.patch("/partners/:id", updatePartnerAdmin);

router.get("/follow-ups", listFollowUps);
router.post("/follow-ups", createFollowUp);
router.patch("/follow-ups/:id", updateFollowUp);

router.get("/commissions", listCommissions);
router.post("/commissions", createCommission);
router.patch("/commissions/:id", updateCommission);

export default router;
