import { Router } from "express";
import { getMe, requestPlanUpgrade, updateMyProfile, getSetupAgreement, uploadSetupDocument } from "../controllers/partnerController.js";
import verifyJwt from "../middlewares/verifyJwt.js";
import upload from "../middlewares/uploadSetupDocument.js";

const router = Router();

router.use(verifyJwt);
router.get("/me", getMe);
router.put("/me/profile", updateMyProfile);
router.post("/me/plan-request", requestPlanUpgrade);
router.get("/me/agreement", getSetupAgreement);
router.post("/me/setup-documents", upload.single("file"), uploadSetupDocument);

export default router;
