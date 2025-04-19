import { Router } from "express";
import {
  requireAuth,
  requireSuperAdmin,
  requirePermission,
} from "../middleware/authMiddleware.js";
import { SuperAdminController } from "../controllers/SuperAdminController.js";
import { Permission } from "../models/User.js";
import {
  validatePayrollCreate,
  validatePayrollUpdate,
  validateEmployeePayrollHistory,
  validatePayrollApproval,
  validatePayrollRejection,
  validateBulkPayrollCreate,
  validateSuperAdminSingleEmployeePayroll,
  validateSuperAdminMultipleEmployeesPayroll,
} from "../middleware/payrollValidation.js";

const router = Router();

// Apply base middleware
router.use(requireAuth);
router.use(requireSuperAdmin);

// ===== Admin Management Routes =====
router.get(
  "/admins",
  requirePermission([Permission.VIEW_ALL_ADMINS]),
  SuperAdminController.getAllAdmins
);

router.get(
  "/admins/:id",
  requirePermission([Permission.VIEW_ALL_ADMINS]),
  SuperAdminController.getAdminById
);

router.post(
  "/admins",
  requirePermission([Permission.CREATE_ADMIN]),
  SuperAdminController.createAdmin
);

router.put(
  "/admins/:id",
  requirePermission([Permission.EDIT_ADMIN]),
  SuperAdminController.updateAdmin
);

router.delete(
  "/admins/:id",
  requirePermission([Permission.DELETE_ADMIN]),
  SuperAdminController.deleteAdmin
);

// ===== User Management Routes =====
router.get(
  "/users",
  requirePermission([Permission.VIEW_ALL_USERS]),
  SuperAdminController.getAllUsers
);

router.get(
  "/users/offboarding",
  requirePermission([Permission.VIEW_OFFBOARDING]),
  SuperAdminController.getOffboardingUsers
);

router.get(
  "/users/:id",
  requirePermission([Permission.VIEW_ALL_USERS]),
  SuperAdminController.getUserById
);

router.post(
  "/users",
  requirePermission([Permission.CREATE_USER]),
  SuperAdminController.createUser
);

router.put(
  "/users/:id",
  requirePermission([Permission.EDIT_USER]),
  SuperAdminController.updateUser
);

router.delete(
  "/users/:id",
  requirePermission([Permission.DELETE_USER]),
  SuperAdminController.deleteUser
);

// ===== Department Management Routes =====
router.get(
  "/departments",
  requirePermission([Permission.VIEW_ALL_DEPARTMENTS]),
  SuperAdminController.getAllDepartments
);

router.get(
  "/departments/:id",
  requirePermission([Permission.VIEW_ALL_DEPARTMENTS]),
  SuperAdminController.getDepartmentById
);

router.get(
  "/departments/:departmentId/employees",
  requirePermission([Permission.VIEW_ALL_USERS]),
  SuperAdminController.getDepartmentEmployees
);

// ===== Payroll Management Routes =====
// Get all payrolls with filters
router.get(
  "/payroll",
  requirePermission([Permission.VIEW_ALL_PAYROLL]),
  SuperAdminController.getAllPayrolls
);

// Get payroll periods
router.get(
  "/payroll/periods",
  requirePermission([Permission.VIEW_ALL_PAYROLL]),
  SuperAdminController.getPayrollPeriods
);

// Get payroll stats
router.get(
  "/payroll/stats",
  requirePermission([Permission.VIEW_PAYROLL_STATS]),
  SuperAdminController.getPayrollStats
);

// Get pending payrolls
router.get(
  "/payroll/pending",
  requirePermission([Permission.VIEW_ALL_PAYROLL]),
  SuperAdminController.getPendingPayrolls
);

// Get filtered payrolls
router.get(
  "/payroll/filtered",
  requirePermission([Permission.VIEW_ALL_PAYROLL]),
  SuperAdminController.getFilteredPayrolls
);

// Get processing statistics
router.get(
  "/payroll/processing-statistics",
  requirePermission([Permission.VIEW_PAYROLL_STATS]),
  SuperAdminController.getProcessingStatistics
);

// Get payroll by ID
router.get(
  "/payroll/:payrollId",
  requirePermission([Permission.VIEW_PAYROLL]),
  SuperAdminController.getPayrollById
);

// View payslip
router.get(
  "/payroll/:payrollId/view",
  requirePermission([Permission.VIEW_DEPARTMENT_PAYSLIPS]),
  SuperAdminController.viewPayslip
);

// Send payslip email
router.post(
  "/payroll/:payrollId/email",
  requirePermission([Permission.VIEW_DEPARTMENT_PAYSLIPS]),
  SuperAdminController.sendPayslipEmail
);

// Update payroll (only allowed for DRAFT status)
router.patch(
  "/payroll/:id",
  requirePermission([Permission.CREATE_PAYROLL]),
  validatePayrollUpdate,
  SuperAdminController.updatePayroll
);

// Create new payroll (DRAFT status)
router.post(
  "/payroll",
  requirePermission([Permission.CREATE_PAYROLL]),
  validatePayrollCreate,
  SuperAdminController.createPayroll
);

// Start processing payroll (PENDING -> PROCESSING)
router.patch(
  "/payroll/:id/process",
  requirePermission([Permission.APPROVE_PAYROLL]),
  SuperAdminController.updatePayrollStatus
);

// Initiate payment for processing payrolls (PROCESSING -> PENDING_PAYMENT)
router.patch(
  "/payroll/:id/initiate-payment",
  requirePermission([Permission.APPROVE_PAYROLL]),
  SuperAdminController.initiatePayment
);

// Approve payroll (PROCESSING/PENDING -> APPROVED)
router.patch(
  "/payroll/:id/approve",
  requirePermission([Permission.APPROVE_PAYROLL]),
  validatePayrollApproval,
  SuperAdminController.approvePayroll
);

// Mark payroll as paid (PENDING_PAYMENT -> PAID)
router.patch(
  "/payroll/:payrollId/mark-paid",
  requirePermission([Permission.APPROVE_PAYROLL]),
  SuperAdminController.markPaymentPaid
);

// Process payment for approved payroll
router.post(
  "/payroll/:id/process-payment",
  requirePermission([Permission.APPROVE_PAYROLL]),
  SuperAdminController.processPayment
);

// Mark payroll as failed (PAID -> FAILED)
router.patch(
  "/payroll/:id/mark-failed",
  requirePermission([Permission.APPROVE_PAYROLL]),
  SuperAdminController.updatePayrollStatus
);

// Cancel payroll (Any status -> CANCELLED)
router.patch(
  "/payroll/:id/cancel",
  requirePermission([Permission.APPROVE_PAYROLL]),
  SuperAdminController.updatePayrollStatus
);

// Archive payroll (PAID -> ARCHIVED)
router.patch(
  "/payroll/:id/archive",
  requirePermission([Permission.APPROVE_PAYROLL]),
  SuperAdminController.updatePayrollStatus
);

// Get period payroll
router.get(
  "/payroll/period/:month/:year",
  requirePermission([Permission.VIEW_ALL_PAYROLL]),
  SuperAdminController.getPeriodPayroll
);

// Get employee payroll history
router.get(
  "/payroll/employee/:employeeId/history",
  requirePermission([Permission.VIEW_ALL_PAYROLL]),
  validateEmployeePayrollHistory,
  SuperAdminController.getEmployeePayrollHistory
);

// Delete payroll (only allowed for DRAFT status)
router.delete(
  "/payroll/:id",
  requirePermission([Permission.DELETE_PAYROLL]),
  SuperAdminController.deletePayroll
);

// Employee Management Routes
router.get(
  "/onboarding-employees",
  requirePermission([Permission.VIEW_ONBOARDING]),
  SuperAdminController.getOnboardingEmployees
);

router.get(
  "/offboarding-employees",
  requirePermission([Permission.VIEW_OFFBOARDING]),
  SuperAdminController.getOffboardingEmployees
);

router.post(
  "/employees/:employeeId/offboard",
  requirePermission([Permission.MANAGE_OFFBOARDING]),
  SuperAdminController.initiateOffboarding
);

router.post(
  "/employees/:employeeId/revert-onboarding",
  requirePermission([Permission.MANAGE_ONBOARDING]),
  SuperAdminController.revertToOnboarding
);

router.patch(
  "/employees/:employeeId/offboarding",
  requirePermission([Permission.MANAGE_OFFBOARDING]),
  SuperAdminController.updateOffboardingStatus
);

router.post(
  "/employees/:employeeId/archive",
  requirePermission([Permission.MANAGE_OFFBOARDING]),
  SuperAdminController.archiveEmployee
);

router.get(
  "/active-employees",
  requirePermission([Permission.VIEW_ALL_USERS]),
  SuperAdminController.getActiveEmployees
);

// ===== Leave Management Routes =====
router.get(
  "/leave/all",
  requirePermission([Permission.VIEW_ALL_LEAVE]),
  SuperAdminController.getAllLeaves
);

router.patch(
  "/leave/:id/approve",
  requirePermission([Permission.APPROVE_LEAVE]),
  SuperAdminController.approveLeave
);

router.patch(
  "/leave/:id/reject",
  requirePermission([Permission.APPROVE_LEAVE]),
  SuperAdminController.rejectLeave
);

// Salary Structure Routes
router.post(
  "/salary-grades",
  requirePermission([Permission.MANAGE_SALARY_STRUCTURE]),
  SuperAdminController.createSalaryGrade
);

router.get(
  "/salary-grades",
  requirePermission([Permission.VIEW_SALARY_STRUCTURE]),
  SuperAdminController.getAllSalaryGrades
);

router.patch(
  "/salary-grades/:id",
  requirePermission([Permission.MANAGE_SALARY_STRUCTURE]),
  SuperAdminController.updateSalaryGrade
);

router.post(
  "/salary-grades/:id/components",
  requirePermission([Permission.MANAGE_SALARY_STRUCTURE]),
  SuperAdminController.addSalaryComponent
);

router.patch(
  "/salary-grades/:id/components/:componentId",
  requirePermission([Permission.MANAGE_SALARY_STRUCTURE]),
  SuperAdminController.updateSalaryComponent
);

router.get(
  "/salary-grades/:id",
  requirePermission([Permission.VIEW_SALARY_STRUCTURE]),
  SuperAdminController.getSalaryGrade
);

router.delete(
  "/salary-grades/:id",
  requirePermission([Permission.MANAGE_SALARY_STRUCTURE]),
  SuperAdminController.deleteSalaryGrade
);

// Group all deduction-related routes together
// ===== Deduction Management Routes =====
router.post(
  "/deductions/statutory",
  requirePermission([Permission.MANAGE_DEDUCTIONS]),
  SuperAdminController.setupStatutoryDeductions
);

router.get(
  "/deductions",
  requirePermission([Permission.VIEW_DEDUCTIONS]),
  SuperAdminController.getAllDeductions
);

router.post(
  "/deductions/voluntary",
  requirePermission([Permission.MANAGE_DEDUCTIONS]),
  SuperAdminController.createVoluntaryDeduction
);

router.post(
  "/deductions/statutory/custom",
  requirePermission([Permission.MANAGE_DEDUCTIONS]),
  SuperAdminController.createCustomStatutoryDeduction
);

router.post(
  "/deductions/statutory/department",
  requirePermission([Permission.MANAGE_DEDUCTIONS]),
  SuperAdminController.createDepartmentStatutoryDeduction
);

// Employee-specific deduction routes
router.post(
  "/deductions/:deductionId/assign/:employeeId",
  requirePermission([Permission.MANAGE_DEDUCTIONS]),
  SuperAdminController.assignDeductionToEmployee
);

router.delete(
  "/deductions/:deductionId/employees/:employeeId",
  requirePermission([Permission.MANAGE_DEDUCTIONS]),
  SuperAdminController.removeDeductionFromEmployee
);

router.get(
  "/employees/:employeeId/deductions",
  requirePermission([Permission.VIEW_DEDUCTIONS]),
  SuperAdminController.getEmployeeDeductions
);

// General deduction management routes
router.patch(
  "/deductions/:id",
  requirePermission([Permission.EDIT_DEDUCTIONS]),
  SuperAdminController.updateDeduction
);

router.patch(
  "/deductions/:id/toggle",
  requirePermission([Permission.MANAGE_DEDUCTIONS]),
  SuperAdminController.toggleDeductionStatus
);

router.delete(
  "/deductions/:id",
  requirePermission([Permission.MANAGE_DEDUCTIONS]),
  SuperAdminController.deleteDeduction
);

// Batch operations
router.post(
  "/deductions/:deductionId/assign-batch",
  requirePermission([Permission.MANAGE_DEDUCTIONS]),
  SuperAdminController.assignDeductionToMultipleEmployees
);

router.delete(
  "/deductions/:deductionId/remove-batch",
  requirePermission([Permission.MANAGE_DEDUCTIONS]),
  SuperAdminController.removeDeductionFromMultipleEmployees
);

// Assignment history
router.get(
  "/deductions/:deductionId/history",
  requirePermission([Permission.VIEW_DEDUCTIONS]),
  SuperAdminController.getDeductionAssignmentHistory
);

// Allowance Routes
router.post(
  "/allowances",
  requirePermission([Permission.MANAGE_ALLOWANCES]),
  SuperAdminController.createAllowance
);

router.get(
  "/allowances",
  requirePermission([Permission.VIEW_ALLOWANCES]),
  SuperAdminController.getAllAllowances
);

router.patch(
  "/allowances/:id",
  requirePermission([Permission.EDIT_ALLOWANCES]),
  SuperAdminController.updateAllowance
);

router.patch(
  "/allowances/:id/toggle",
  requirePermission([Permission.MANAGE_ALLOWANCES]),
  SuperAdminController.toggleAllowanceStatus
);

router.delete(
  "/allowances/:id",
  requirePermission([Permission.MANAGE_ALLOWANCES]),
  SuperAdminController.deleteAllowance
);

// Bonus Routes
router.post(
  "/bonuses",
  requirePermission([Permission.MANAGE_BONUSES]),
  SuperAdminController.createBonus
);

router.get(
  "/bonuses",
  requirePermission([Permission.VIEW_BONUSES]),
  SuperAdminController.getAllBonuses
);

router.patch(
  "/bonuses/:id",
  requirePermission([Permission.EDIT_BONUSES]),
  SuperAdminController.updateBonus
);

router.patch(
  "/bonuses/:id/approve",
  requirePermission([Permission.MANAGE_BONUSES]),
  SuperAdminController.approveBonus
);

router.delete(
  "/bonuses/:id",
  requirePermission([Permission.MANAGE_BONUSES]),
  SuperAdminController.deleteBonus
);

// ===== Payment Management Routes =====
// Payment Processing
router.post(
  "/payroll/:id/process-payment",
  requirePermission([Permission.PROCESS_PAYMENT]),
  SuperAdminController.processPayment
);

router.patch(
  "/payroll/:id/mark-paid",
  requirePermission([Permission.PROCESS_PAYMENT]),
  SuperAdminController.updatePayrollStatus
);

router.patch(
  "/payroll/:id/mark-failed",
  requirePermission([Permission.MARK_PAYMENT_FAILED]),
  SuperAdminController.updatePayrollStatus
);

// Payment History
router.get(
  "/payroll/:id/payment-history",
  requirePermission([Permission.VIEW_PAYMENT_HISTORY]),
  SuperAdminController.getPaymentHistory
);

// Payment Methods Management
router.get(
  "/payment-methods",
  requirePermission([Permission.MANAGE_PAYMENT_METHODS]),
  SuperAdminController.getPaymentMethods
);

router.post(
  "/payment-methods",
  requirePermission([Permission.MANAGE_PAYMENT_METHODS]),
  SuperAdminController.createPaymentMethod
);

router.patch(
  "/payment-methods/:id",
  requirePermission([Permission.MANAGE_PAYMENT_METHODS]),
  SuperAdminController.updatePaymentMethod
);

router.delete(
  "/payment-methods/:id",
  requirePermission([Permission.MANAGE_PAYMENT_METHODS]),
  SuperAdminController.deletePaymentMethod
);

// Add these new routes for bulk processing
router.post(
  "/payroll/process-department",
  requirePermission([Permission.CREATE_PAYROLL]),
  validateBulkPayrollCreate,
  SuperAdminController.processDepartmentEmployeesPayroll
);

router.post(
  "/payroll/process-all-departments",
  requirePermission([Permission.CREATE_PAYROLL]),
  validateBulkPayrollCreate,
  SuperAdminController.processAllDepartmentsPayroll
);

// Add route for processing single employee payroll
router.post(
  "/payroll/process-single-employee",
  validateSuperAdminSingleEmployeePayroll,
  SuperAdminController.processSingleEmployeePayroll
);

// Add route for processing multiple employees payroll
router.post(
  "/payroll/process-multiple-employees",
  requirePermission([Permission.CREATE_PAYROLL]),
  validateSuperAdminMultipleEmployeesPayroll,
  SuperAdminController.processMultipleEmployeesPayroll
);

export default router;
