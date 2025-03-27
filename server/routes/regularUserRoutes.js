import { Router } from "express";
import {
  requireAuth,
  requirePermission,
} from "../middleware/authMiddleware.js";
import { RegularUserController } from "../controllers/RegularUserController.js";
import { Permission } from "../models/User.js";

const router = Router();

// Apply authentication middleware
router.use(requireAuth);

// Personal Information
router.get(
  "/profile",
  requirePermission([Permission.VIEW_PERSONAL_INFO]),
  RegularUserController.getOwnProfile
);

router.put(
  "/profile",
  requirePermission([Permission.VIEW_PERSONAL_INFO]),
  RegularUserController.updateOwnProfile
);

// Payslip
router.get(
  "/payroll/:payrollId/view",
  requirePermission([Permission.VIEW_ALL_PAYROLL]),
  RegularUserController.viewPayslip
);

router.get(
  "/payslips/:id",
  requirePermission([Permission.VIEW_OWN_PAYSLIP]),
  RegularUserController.getOwnPayslipById
);

// Leave Management
router.get(
  "/leave",
  requirePermission([Permission.VIEW_OWN_LEAVE]),
  RegularUserController.getOwnLeaveRequests
);

router.post(
  "/leave",
  requirePermission([Permission.REQUEST_LEAVE]),
  RegularUserController.createLeaveRequest
);

router.put(
  "/leave/:id/cancel",
  requirePermission([Permission.CANCEL_OWN_LEAVE]),
  RegularUserController.cancelLeaveRequest
);

export default router;
