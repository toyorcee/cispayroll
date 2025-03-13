import { Router, RequestHandler } from "express";
import { InvitationController } from "../controllers/InvitationController.js";

const router = Router();

// Public routes for handling invitations
router.get(
  "/verify/:token",
  InvitationController.verifyInvitation as RequestHandler
);

router.post(
  "/complete-registration",
  InvitationController.completeRegistration as RequestHandler
);

export default router;
