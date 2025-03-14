import { Router, RequestHandler } from "express";
import { InvitationController } from "../controllers/InvitationController.js";
import { upload } from "../middleware/multerMiddleware.js";

const router = Router();

// Explicitly mark these as public routes (no auth middleware)
router.get(
  "/verify/:token",
  InvitationController.verifyInvitation as RequestHandler
);

router.post(
  "/complete-registration",
  upload.single("profileImage"),
  InvitationController.completeRegistration as RequestHandler
);

export default router;
