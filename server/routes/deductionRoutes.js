// routes/deductionRoutes.js
import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { DeductionController } from "../controllers/deductionController.js";

const router = Router();

// Apply authentication middleware
router.use(requireAuth);

// Get user's deduction preferences
router.get(
  "/preferences/:userId?",
  DeductionController.getUserDeductionPreferences
);

// Add voluntary deduction preference
router.post(
  "/preferences/voluntary/:userId?",
  DeductionController.addVoluntaryDeduction
);

// Remove voluntary deduction preference
router.delete(
  "/preferences/voluntary/:userId?/:deductionId",
  DeductionController.removeVoluntaryDeduction
);

// Toggle voluntary deduction opt-in/out
router.patch(
  "/preferences/voluntary/toggle/:userId?",
  DeductionController.toggleVoluntaryDeduction
);

// Admin routes (keep these in superAdminRoutes.js)
// These routes are for managing the deductions themselves, not user preferences
// - Creating deductions
// - Updating deduction details
// - Viewing all deductions
// - etc.

export default router;
