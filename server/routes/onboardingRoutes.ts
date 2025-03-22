import { Router } from "express";
import { OnboardingController } from "../controllers/onboardingController.js";
import {
  requireAuth,
  requirePermission,
  AuthenticatedRequest,
} from "../middleware/authMiddleware.js";
import { Permission } from "../models/User.js";
import type { RequestHandler } from "express";

const router = Router();

// Apply base middleware
router.use(requireAuth as unknown as RequestHandler);

// Get all employees in onboarding process
router.get(
  "/",
  requirePermission([Permission.VIEW_ONBOARDING]) as unknown as RequestHandler,
  OnboardingController.getOnboardingEmployees as unknown as RequestHandler
);

// Update employee onboarding progress
router.patch(
  "/:userId/progress",
  requirePermission([
    Permission.MANAGE_ONBOARDING,
  ]) as unknown as RequestHandler,
  OnboardingController.updateOnboardingProgress as unknown as RequestHandler
);

// Mark specific onboarding task as complete
router.patch(
  "/:userId/tasks/:taskName",
  requirePermission([
    Permission.MANAGE_ONBOARDING,
  ]) as unknown as RequestHandler,
  OnboardingController.completeTask as unknown as RequestHandler
);

export default router;
