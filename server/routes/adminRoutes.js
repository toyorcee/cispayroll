import { Router } from "express";
import {
  requireAuth,
  requireAdmin,
  requirePermission,
} from "../middleware/authMiddleware.js";
import { AdminController } from "../controllers/AdminController.js";
import { Permission } from "../models/User.js";
import {
  validatePayrollCreate,
  validatePayrollUpdate,
} from "../middleware/payrollValidation.js";

const router = Router();

// Apply base middleware
router.use(requireAuth);
router.use(requireAdmin);

// ===== User Management Routes =====
router.get(
  "/employees",
  requirePermission([Permission.VIEW_ALL_USERS]),
  AdminController.getAllEmployees
);

router.get(
  "/users",
  requirePermission([Permission.VIEW_ALL_USERS]),
  AdminController.getDepartmentUsers
);

router.post(
  "/users",
  requirePermission([Permission.CREATE_USER]),
  AdminController.createDepartmentUser
);

router.put(
  "/users/:id",
  requirePermission([Permission.EDIT_USER]),
  AdminController.updateDepartmentUser
);

// ===== Payroll Management Routes =====
router.get(
  "/payroll",
  requirePermission([Permission.VIEW_DEPARTMENT_PAYROLL]),
  AdminController.getDepartmentPayroll
);

router.post(
  "/payroll",
  requirePermission([Permission.CREATE_PAYROLL]),
  validatePayrollCreate,
  AdminController.createDepartmentPayroll
);

router.put(
  "/payroll/:id",
  requirePermission([Permission.EDIT_PAYROLL]),
  validatePayrollUpdate,
  AdminController.updateDepartmentPayroll
);

// ===== Salary Structure & Allowances Management Routes =====
router.get(
  "/allowances",
  requirePermission([Permission.VIEW_ALLOWANCES]),
  AdminController.getDepartmentAllowances
);

router.post(
  "/allowances",
  requirePermission([Permission.CREATE_ALLOWANCES]),
  AdminController.createDepartmentAllowance
);

router.get(
  "/allowances/:id",
  requirePermission([Permission.VIEW_ALLOWANCES]),
  AdminController.getAllowanceDetails
);

router.put(
  "/allowances/:id",
  requirePermission([Permission.EDIT_ALLOWANCES]),
  AdminController.updateDepartmentAllowance
);

router.patch(
  "/allowances/:id/approve",
  requirePermission([Permission.APPROVE_ALLOWANCES]),
  AdminController.approveAllowance
);

router.patch(
  "/allowances/:id/reject",
  requirePermission([Permission.APPROVE_ALLOWANCES]),
  AdminController.rejectAllowance
);

// ===== Deduction Management Routes =====
// Department-specific deduction routes
router.post(
  "/department/deductions",
  requirePermission([Permission.MANAGE_DEPARTMENT_DEDUCTIONS]),
  AdminController.createDepartmentDeduction
);

router.get(
  "/department/deductions",
  requirePermission([Permission.VIEW_DEPARTMENT_DEDUCTIONS]),
  AdminController.getDepartmentDeductions
);

// Fix: Add employee deductions route
router.get(
  "/department/employees/:employeeId/deductions",
  requirePermission([Permission.VIEW_DEPARTMENT_DEDUCTIONS]),
  AdminController.getDepartmentEmployeeDeductions
);

// Fix: Individual assignment routes
router.post(
  "/department/deductions/:deductionId/assign/:employeeId",
  requirePermission([Permission.MANAGE_DEPARTMENT_DEDUCTIONS]),
  AdminController.assignDepartmentDeductionToEmployee
);

router.delete(
  "/department/deductions/:deductionId/employees/:employeeId",
  requirePermission([Permission.MANAGE_DEPARTMENT_DEDUCTIONS]),
  AdminController.removeDeductionFromEmployee
);

// Fix: Batch operations routes
router.post(
  "/department/deductions/:deductionId/assign-batch",
  requirePermission([Permission.MANAGE_DEPARTMENT_DEDUCTIONS]),
  AdminController.assignDepartmentDeductionToMultipleEmployees
);

router.post(
  "/department/deductions/:deductionId/remove-batch",
  requirePermission([Permission.MANAGE_DEPARTMENT_DEDUCTIONS]),
  AdminController.removeDepartmentDeductionFromMultipleEmployees
);

// Fix: History and details routes
router.get(
  "/department/deductions/:deductionId/history",
  requirePermission([Permission.VIEW_DEPARTMENT_DEDUCTIONS]),
  AdminController.getDepartmentDeductionHistory
);

router.get(
  "/deductions/:id",
  requirePermission([Permission.VIEW_DEDUCTIONS]),
  AdminController.getDeductionDetails
);

router.put(
  "/department/deductions/:id",
  requirePermission([Permission.EDIT_DEDUCTIONS]),
  AdminController.updateDepartmentDeduction
);

router.patch(
  "/department/deductions/:id/toggle",
  requirePermission([Permission.EDIT_DEDUCTIONS]),
  AdminController.toggleDeductionStatus
);

export default router;
