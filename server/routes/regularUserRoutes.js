import { Router } from "express";
import {
  requireAuth,
  requirePermission,
  requireRole,
} from "../middleware/authMiddleware.js";
import { RegularUserController } from "../controllers/RegularUserController.js";
import { Permission, UserRole } from "../models/User.js";

const router = Router();

// Apply base middleware
router.use(requireAuth);
router.use(requireRole([UserRole.USER]));

// ===== Profile Management Routes =====
router.get(
  "/profile",
  requirePermission([Permission.VIEW_PERSONAL_INFO]),
  RegularUserController.getOwnProfile
);

router.put(
  "/profile",
  requirePermission([Permission.EDIT_PERSONAL_INFO]),
  RegularUserController.updateOwnProfile
);

// ===== Payslip Management Routes =====
router.get(
  "/payslips",
  requirePermission([Permission.VIEW_OWN_PAYSLIP]),
  RegularUserController.getOwnPayslipById
);

router.get(
  "/payslips/:payrollId",
  requirePermission([Permission.VIEW_OWN_PAYSLIP]),
  RegularUserController.viewPayslip
);

// ===== Leave Management Routes =====
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

router.patch(
  "/leave/:id/cancel",
  requirePermission([Permission.CANCEL_OWN_LEAVE]),
  RegularUserController.cancelLeaveRequest
);

// ===== Salary Structure & Allowances Management Routes =====
router.get(
  "/allowances",
  requirePermission([Permission.VIEW_OWN_ALLOWANCES]),
  RegularUserController.getMyAllowances
);

router.post(
  "/allowances/request",
  requirePermission([Permission.REQUEST_ALLOWANCES]),
  RegularUserController.requestAllowance
);

router.get(
  "/allowances/history",
  requirePermission([Permission.VIEW_OWN_ALLOWANCES]),
  RegularUserController.getAllowanceHistory
);

// ===== Deduction Management Routes =====
router.get(
  "/deductions",
  requirePermission([Permission.VIEW_OWN_PAYSLIP]),
  RegularUserController.getMyDeductions
);

router.get(
  "/deductions/:id",
  requirePermission([Permission.VIEW_OWN_PAYSLIP]),
  RegularUserController.getDeductionDetails
);

export default router;
