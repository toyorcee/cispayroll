import { Router } from "express";
import { OnboardingController } from "../controllers/onboardingController.js";
import {
  requireAuth,
  requirePermission,
} from "../middleware/authMiddleware.js";
import { Permission } from "../models/User.js";

const router = Router();

// Apply base middleware
router.use(requireAuth);

// Get all employees in onboarding process
router.get(
  "/",
  requirePermission([Permission.VIEW_ONBOARDING]),
  OnboardingController.getOnboardingEmployees
);

// Update employee onboarding progress
router.patch(
  "/:userId/progress",
  requirePermission([Permission.MANAGE_ONBOARDING]),
  OnboardingController.updateOnboardingProgress
);

// Mark specific onboarding task as complete
router.patch(
  "/:userId/tasks/:taskName",
  requirePermission([Permission.MANAGE_ONBOARDING]),
  OnboardingController.completeTask
);

export default router;
