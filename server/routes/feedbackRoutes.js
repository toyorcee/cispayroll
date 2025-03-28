import { Router } from "express";
import { FeedbackController } from "../controllers/FeedbackController.js";
import {
  requireAuth,
  requireRole,
  requirePermission,
} from "../middleware/authMiddleware.js";
import { UserRole, Permission } from "../models/User.js";

const router = Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// Employee feedback submission
router.post(
  "/submit",
  FeedbackController.submitFeedback
);

// Anonymous feedback
router.post(
  "/anonymous",
  FeedbackController.submitAnonymousFeedback
);

// Incident reporting
router.post(
  "/incident",
  FeedbackController.reportIncident
);

// Feedback management (Admin/HR)
router.get(
  "/all",
  requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  FeedbackController.getAllFeedback
);

router.get(
  "/department/:departmentId",
  requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  FeedbackController.getDepartmentFeedback
);

router.get(
  "/analytics",
  requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  FeedbackController.getFeedbackAnalytics
);

// Survey management
router.post(
  "/survey/create",
  requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  FeedbackController.createSurvey
);

router.get(
  "/survey/all",
  FeedbackController.getAllSurveys
);

router.get(
  "/survey/:id",
  FeedbackController.getSurveyById
);

router.post(
  "/survey/:id/respond",
  FeedbackController.respondToSurvey
);

// Route for approving/rejecting feedback
router.put(
  "/:id/status",
  requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  FeedbackController.updateFeedbackStatus
);

// Add this route to get all incidents
router.get(
  "/incidents",
  requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  FeedbackController.getAllIncidents
);

// Add this route to update incident status
router.put(
  "/incident/:id/status",
  requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  FeedbackController.updateIncidentStatus
);

// Update survey
router.put(
  "/survey/:id",
  requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  FeedbackController.updateSurvey
);

// Delete survey
router.delete(
  "/survey/:id",
  requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  FeedbackController.deleteSurvey
);

export default router; 