import express from "express";
import { CompanyProfileController } from "../controllers/CompanyProfileController.js";
import { SystemSettingsController } from "../controllers/SystemSettingsController.js";
import { IntegrationSettingsController } from "../controllers/IntegrationSettingsController.js";
import {
  requireAuth,
  requireSuperAdmin,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// Company Profile
router.get(
  "/company-profile",
  requireAuth,
  requireSuperAdmin,
  CompanyProfileController.getProfile
);
router.put(
  "/company-profile",
  requireAuth,
  requireSuperAdmin,
  CompanyProfileController.updateProfile
);

// System Settings
router.get(
  "/system-settings",
  requireAuth,
  requireSuperAdmin,
  SystemSettingsController.getSettings
);
router.put(
  "/system-settings",
  requireAuth,
  requireSuperAdmin,
  SystemSettingsController.updateSettings
);

// Integration Settings
router.get(
  "/integration-settings",
  requireAuth,
  requireSuperAdmin,
  IntegrationSettingsController.getSettings
);
router.put(
  "/integration-settings",
  requireAuth,
  requireSuperAdmin,
  IntegrationSettingsController.updateSettings
);

// --- New endpoints for API key and webhook URL ---
router.post(
  "/integration-settings/api-key",
  requireAuth,
  requireSuperAdmin,
  IntegrationSettingsController.generateApiKey
);
router.put(
  "/integration-settings/webhook-url",
  requireAuth,
  requireSuperAdmin,
  IntegrationSettingsController.updateWebhookUrl
);

// Pay Period Validation
router.get(
  "/validate-pay-period/:frequency",
  requireAuth,
  requireSuperAdmin,
  SystemSettingsController.validatePayPeriodSettings
);

export default router;
