import express from "express";
import { InvitationController } from "../controllers/InvitationController.js";
import { upload } from "../utils/uploadConfig.js";

const router = express.Router();

// Explicitly mark these as public routes (no auth middleware)
router.get("/verify/:token", InvitationController.verifyInvitation);

router.post(
  "/complete-registration",
  upload.single("profileImage"),
  InvitationController.completeRegistration
);

export default router;
