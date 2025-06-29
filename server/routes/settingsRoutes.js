import express from "express";
import { CompanyProfileController } from "../controllers/CompanyProfileController.js";
import { SystemSettingsController } from "../controllers/SystemSettingsController.js";
import { IntegrationSettingsController } from "../controllers/IntegrationSettingsController.js";
import {
  requireAuth,
  requireSuperAdmin,
  requirePermission,
} from "../middleware/authMiddleware.js";
import { Permission } from "../models/User.js";

const router = express.Router();

router.get(
  "/general",
  requireAuth,
  SystemSettingsController.getGeneralSettings
);

// Company Profile
router.get(
  "/company-profile",
  requireAuth,
  requirePermission([Permission.MANAGE_SYSTEM_SETTINGS]),
  CompanyProfileController.getProfile
);
router.put(
  "/company-profile",
  requireAuth,
  requireSuperAdmin,
  requirePermission([Permission.MANAGE_SYSTEM_SETTINGS]),
  CompanyProfileController.updateProfile
);

// System Settings
router.get(
  "/system-settings",
  requireAuth,
  requirePermission([Permission.MANAGE_SYSTEM_SETTINGS]),
  SystemSettingsController.getSettings
);
router.put(
  "/system-settings",
  requireAuth,
  requireSuperAdmin,
  requirePermission([Permission.MANAGE_SYSTEM_SETTINGS]),
  SystemSettingsController.updateSettings
);

// Integration Settings
router.get(
  "/integration-settings",
  requireAuth,
  requirePermission([Permission.MANAGE_INTEGRATION_SETTINGS]),
  IntegrationSettingsController.getSettings
);
router.put(
  "/integration-settings",
  requireAuth,
  requireSuperAdmin,
  requirePermission([Permission.MANAGE_INTEGRATION_SETTINGS]),
  IntegrationSettingsController.updateSettings
);

// --- New endpoints for API key and webhook URL ---
router.post(
  "/integration-settings/api-key",
  requireAuth,
  requireSuperAdmin,
  requirePermission([Permission.MANAGE_INTEGRATION_SETTINGS]),
  IntegrationSettingsController.generateApiKey
);
router.put(
  "/integration-settings/webhook-url",
  requireAuth,
  requireSuperAdmin,
  requirePermission([Permission.MANAGE_INTEGRATION_SETTINGS]),
  IntegrationSettingsController.updateWebhookUrl
);

// Pay Period Validation
router.get(
  "/validate-pay-period/:frequency",
  requireAuth,
  requirePermission([Permission.MANAGE_PAYROLL_SETTINGS]),
  SystemSettingsController.validatePayPeriodSettings
);

export default router;
