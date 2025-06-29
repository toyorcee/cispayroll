import { Router } from "express";
import {
  requireAuth,
  requirePermission,
} from "../middleware/authMiddleware.js";
import { RegularUserController } from "../controllers/RegularUserController.js";
import { Permission } from "../models/User.js";

const router = Router();

// Apply base middleware
router.use(requireAuth);

// ===== Dashboard Routes =====
router.get(
  "/dashboard/stats",
  requirePermission([Permission.VIEW_PERSONAL_INFO]),
  RegularUserController.getDashboardStats
);

router.get(
  "/department/stats",
  requirePermission([Permission.VIEW_PERSONAL_INFO]),
  RegularUserController.getDepartmentStats
);

router.get(
  "/team/stats",
  requirePermission([Permission.VIEW_PERSONAL_INFO]),
  RegularUserController.getTeamStats
);

// ===== Profile Management Routes =====
// These routes are accessible to all authenticated users with the right permissions
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
// router.get(
//   "/deductions",
//   requirePermission([Permission.VIEW_OWN_PAYSLIP]),
//   RegularUserController.getMyDeductions
// );

router.get(
  "/deductions/:id",
  requirePermission([Permission.VIEW_OWN_PAYSLIP]),
  RegularUserController.getDeductionDetails
);

router.get(
  "/deductions",
  requirePermission([Permission.VIEW_OWN_DEDUCTIONS]),
  RegularUserController.getMyDeductions
);

// ===== Department Management Routes =====
router.get(
  "/departments",
  requirePermission([Permission.VIEW_ALL_DEPARTMENTS]),
  RegularUserController.getAllDepartments
);

export default router;
