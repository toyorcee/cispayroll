import { Router } from "express";
import { PasswordController } from "../controllers/PasswordController.js";
import {
  requireAuth,
  passwordAttemptLimiter,
  requirePasswordChange,
} from "../middleware/authMiddleware.js";

const router = Router();

// Protected routes with rate limiting
router.post(
  "/update",
  requireAuth,
  passwordAttemptLimiter,
  PasswordController.updatePassword
);

// Public routes with basic rate limiting
router.post(
  "/forgot",
  async (req, res, next) => {
    // Simple rate limiting for public routes
    const attempts = req.session?.passwordResetAttempts || 0;
    if (attempts > 5) {
      return res.status(429).json({
        message: "Too many password reset attempts. Please try again later.",
      });
    }
    req.session.passwordResetAttempts = attempts + 1;
    next();
  },
  PasswordController.forgotPassword
);

router.post("/reset", PasswordController.resetPassword);

// Add route for checking password status
router.get("/status", requireAuth, requirePasswordChange, (req, res) => {
  res.json({
    requiresChange: false,
  });
});

export default router;
