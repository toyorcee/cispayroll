import { Router } from "express";
import { AuthController } from "../controllers/AuthController.js";
import {
  requireAuth,
  requireSuperAdmin,
} from "../middleware/authMiddleware.js";
import { validateSignup } from "../middleware/validationMiddleware.js";

const router = Router();

// Public Routes
router.post("/login", AuthController.login);

router.post(
  "/signup/super-admin",
  validateSignup,
  AuthController.superAdminSignup
);

router.post(
  "/signup/admin",
  requireAuth,
  requireSuperAdmin,
  validateSignup,
  AuthController.adminSignup
);

router.post("/signup", validateSignup, AuthController.signup);

// Protected Routes
router.get("/me", requireAuth, AuthController.getCurrentUser);

router.post("/logout", requireAuth, AuthController.logout);

export default router;
