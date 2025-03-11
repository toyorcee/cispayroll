import { Router, RequestHandler } from "express";
import { AuthController } from "../controllers/AuthController.js";
import {
  requireAuth,
  requireSuperAdmin,
} from "../middleware/authMiddleware.js";
import { validateSignup } from "../middleware/validationMiddleware.js";

const router = Router();

// Public Routes
router.post("/login", AuthController.login as unknown as RequestHandler);

router.post(
  "/signup/super-admin",
  validateSignup,
  AuthController.superAdminSignup as unknown as RequestHandler
);

router.post(
  "/signup/admin",
  requireAuth,
  requireSuperAdmin,
  validateSignup,
  AuthController.adminSignup as unknown as RequestHandler
);

router.post(
  "/signup",
  validateSignup,
  AuthController.signup as unknown as RequestHandler
);

// Protected Routes
router.get(
  "/me",
  requireAuth,
  AuthController.getCurrentUser as unknown as RequestHandler
);

router.post(
  "/logout",
  requireAuth,
  AuthController.logout as unknown as RequestHandler
);

export default router;
