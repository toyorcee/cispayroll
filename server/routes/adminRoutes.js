import { Router } from "express";
import {
  requireAuth,
  requireAdmin,
  requirePermission,
} from "../middleware/authMiddleware.js";
import { AdminController } from "../controllers/AdminController.js";
import { Permission } from "../models/User.js";
import {
  validatePayrollUpdate,
  validateEmployeePayrollHistory,
  validatePayrollApproval,
  validatePayrollRejection,
  validatePayrollResubmission,
} from "../middleware/payrollValidation.js";
import {
  validateAdminSinglePayrollCreate,
  validateAdminBulkPayrollCreate,
  validateAdminPayrollSubmission,
  validateAdminDepartmentPayrollCreate,
} from "../middleware/adminPayrollValidation.js";

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
  "/employees/:id",
  requirePermission([Permission.VIEW_ALL_USERS]),
  AdminController.getEmployeeById
);

router.post(
  "/employees",
  requirePermission([Permission.CREATE_USER]),
  AdminController.createEmployee
);

router.put(
  "/employees/:id",
  requirePermission([Permission.EDIT_USER]),
  AdminController.updateEmployee
);

router.delete(
  "/employees/:id",
  requirePermission([Permission.DELETE_USER]),
  AdminController.deleteEmployee
);

router.get(
  "/departments/:id/employees",
  requirePermission([Permission.VIEW_ALL_USERS]),
  AdminController.getDepartmentEmployees
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
  "/payroll/periods",
  requirePermission([Permission.VIEW_DEPARTMENT_PAYROLL]),
  AdminController.getDepartmentPayrollPeriods
);

router.get(
  "/payroll/stats",
  requirePermission([Permission.VIEW_DEPARTMENT_PAYROLL]),
  AdminController.getPayrollStats
);

router.get(
  "/payroll/processing-statistics",
  requirePermission([Permission.VIEW_PAYROLL_STATS]),
  AdminController.getProcessingStatistics
);

router.get(
  "/payroll/history/:employeeId",
  requirePermission([Permission.VIEW_DEPARTMENT_PAYROLL]),
  validateEmployeePayrollHistory,
  AdminController.getEmployeePayrollHistory
);

router.get(
  "/payroll",
  requirePermission([Permission.VIEW_DEPARTMENT_PAYROLL]),
  AdminController.getDepartmentPayroll
);

router.get(
  "/payroll/:id",
  requirePermission([Permission.VIEW_DEPARTMENT_PAYROLL]),
  AdminController.getPayrollById
);

router.post(
  "/payroll",
  requirePermission([Permission.CREATE_PAYROLL]),
  AdminController.createDepartmentPayroll
);

router.put(
  "/payroll/:id",
  requirePermission([Permission.EDIT_PAYROLL]),
  validatePayrollUpdate,
  AdminController.updateDepartmentPayroll
);

router.patch(
  "/payroll/:id/approve",
  (req, res, next) => {
    console.log("Approval request received:", {
      path: req.path,
      method: req.method,
      body: req.body,
      params: req.params,
      user: req.user,
    });
    next();
  },
  requirePermission([Permission.APPROVE_PAYROLL]),
  validatePayrollApproval,
  AdminController.approvePayroll
);

router.patch(
  "/payroll/:id/reject",
  requirePermission([Permission.APPROVE_PAYROLL]),
  validatePayrollRejection,
  AdminController.rejectPayroll
);

router.patch(
  "/payroll/:id/process-payment",
  requirePermission([Permission.PROCESS_PAYMENT]),
  AdminController.processPayment
);

router.patch(
  "/payroll/:id/submit",
  requirePermission([Permission.SUBMIT_PAYROLL]),
  AdminController.submitPayroll
);

// Submit multiple payrolls for approval
router.post(
  "/payroll/submit-bulk",
  requirePermission([Permission.SUBMIT_PAYROLL]),
  AdminController.submitBulkPayrolls
);

router.get(
  "/payslip/:employeeId",
  requirePermission([Permission.VIEW_DEPARTMENT_PAYSLIPS]),
  AdminController.viewPayslip
);

router.post(
  "/payroll/process-single",
  requirePermission([Permission.CREATE_PAYROLL]),
  validateAdminSinglePayrollCreate,
  AdminController.processSingleEmployeePayroll
);

router.post(
  "/payroll/process-department",
  requirePermission([Permission.CREATE_PAYROLL]),
  validateAdminDepartmentPayrollCreate,
  AdminController.processDepartmentPayroll
);

router.post(
  "/payroll/submit-department",
  requirePermission([Permission.SUBMIT_PAYROLL]),
  validateAdminPayrollSubmission,
  AdminController.submitDepartmentPayrolls
);

router.post(
  "/payroll/process-multiple",
  requirePermission([Permission.CREATE_PAYROLL]),
  validateAdminBulkPayrollCreate,
  AdminController.processMultipleEmployeesPayroll
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
// Get all deductions (including company-wide and department-specific)
router.get(
  "/deductions",
  requirePermission([Permission.VIEW_DEDUCTIONS]),
  AdminController.getAllDeductions
);

// Get department-specific deductions
router.get(
  "/deductions/department",
  requirePermission([Permission.VIEW_DEPARTMENT_DEDUCTIONS]),
  AdminController.getDepartmentDeductions
);

// Create department-specific deduction
router.post(
  "/deductions/department",
  requirePermission([Permission.MANAGE_DEPARTMENT_DEDUCTIONS]),
  AdminController.createDepartmentDeduction
);

// Employee-specific deduction routes
router.post(
  "/deductions/:deductionId/assign/:employeeId",
  requirePermission([Permission.MANAGE_DEPARTMENT_DEDUCTIONS]),
  AdminController.assignDeductionToEmployee
);

router.delete(
  "/deductions/:deductionId/employees/:employeeId",
  requirePermission([Permission.MANAGE_DEPARTMENT_DEDUCTIONS]),
  AdminController.removeDeductionFromEmployee
);

router.get(
  "/employees/:employeeId/deductions",
  requirePermission([Permission.VIEW_DEPARTMENT_DEDUCTIONS]),
  AdminController.getEmployeeDeductions
);

// Batch operations
router.post(
  "/deductions/:deductionId/assign-batch",
  requirePermission([Permission.MANAGE_DEPARTMENT_DEDUCTIONS]),
  AdminController.assignDeductionToMultipleEmployees
);

router.delete(
  "/deductions/:deductionId/remove-batch",
  requirePermission([Permission.MANAGE_DEPARTMENT_DEDUCTIONS]),
  AdminController.removeDeductionFromMultipleEmployees
);

// ===== Department Statistics Routes =====
router.get(
  "/department/stats/charts",
  requirePermission([Permission.VIEW_DEPARTMENT_STATS]),
  AdminController.getDepartmentChartStats
);

// Bulk approval/rejection routes
router.post(
  "/payroll/approve-department",
  requirePermission([Permission.APPROVE_PAYROLL]),
  validateAdminPayrollSubmission,
  AdminController.approveDepartmentPayrolls
);

router.post(
  "/payroll/reject-department",
  requirePermission([Permission.APPROVE_PAYROLL]),
  validateAdminPayrollSubmission,
  AdminController.rejectDepartmentPayrolls
);

router.post(
  "/payroll/:payrollId/resubmit",
  requirePermission([Permission.CREATE_PAYROLL]),
  validatePayrollResubmission,
  AdminController.resubmitPayroll
);

export default router;
