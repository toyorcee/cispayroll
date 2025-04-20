import express from "express";
import { OffboardingController } from "../controllers/OffboardingController.js";
import {
  requirePermission,
  requireAuth,
} from "../middleware/authMiddleware.js";
import { Permission } from "../models/User.js";

const router = express.Router();

// Process Management Routes
router.post(
  "/initiate/:userId",
  requireAuth,
  requirePermission([Permission.MANAGE_OFFBOARDING]),
  OffboardingController.initiateOffboarding
);

router.post(
  "/cancel/:userId",
  requireAuth,
  requirePermission([Permission.MANAGE_OFFBOARDING]),
  OffboardingController.cancelOffboarding
);

// Task Management Routes
router.post(
  "/complete-task/:userId/:taskName",
  requireAuth,
  requirePermission([Permission.MANAGE_OFFBOARDING]),
  OffboardingController.completeTask
);

// Exit Interview Routes
router.post(
  "/exit-interview/:userId",
  requireAuth,
  requirePermission([Permission.MANAGE_OFFBOARDING]),
  OffboardingController.updateExitInterview
);

// Rehire Eligibility Routes
router.post(
  "/rehire-eligibility/:userId",
  requireAuth,
  requirePermission([Permission.MANAGE_OFFBOARDING]),
  OffboardingController.updateRehireEligibility
);

// Query Routes
router.get(
  "/details/:userId",
  requireAuth,
  requirePermission([Permission.VIEW_OFFBOARDING]),
  OffboardingController.getOffboardingDetails
);

router.get(
  "/employees",
  requireAuth,
  requirePermission([Permission.VIEW_OFFBOARDING]),
  OffboardingController.getOffboardingEmployees
);

// Final Settlement Report Routes
router.get(
  "/final-settlement-report/:employeeId",
  requireAuth,
  requirePermission([Permission.VIEW_OFFBOARDING]),
  OffboardingController.generateFinalSettlementReport
);

router.post(
  "/email-final-settlement-report/:employeeId",
  requireAuth,
  requirePermission([Permission.VIEW_OFFBOARDING]),
  OffboardingController.emailFinalSettlementReport
);

export default router;
