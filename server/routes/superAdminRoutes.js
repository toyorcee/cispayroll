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
import { PayrollReportController } from "../controllers/PayrollReportController.js";

const router = Router();

// Apply base middleware
router.use(requireAuth);

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
  requireSuperAdmin,
  requirePermission([Permission.CREATE_ADMIN]),
  SuperAdminController.createAdmin
);

router.put(
  "/admins/:id",
  requireSuperAdmin,
  requirePermission([Permission.EDIT_ADMIN]),
  SuperAdminController.updateAdmin
);

router.delete(
  "/admins/:id",
  requireSuperAdmin,
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
  requireSuperAdmin,
  requirePermission([Permission.CREATE_USER]),
  SuperAdminController.createUser
);

router.put(
  "/users/:id",
  requireSuperAdmin,
  requirePermission([Permission.EDIT_USER]),
  SuperAdminController.updateUser
);

router.delete(
  "/users/:id",
  requireSuperAdmin,
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
// Payroll Reports - Simple unified route (must come before /payroll to avoid conflicts)
console.log("🔧 Registering payroll reports route: /payroll/reports");
router.get("/payroll/reports", PayrollReportController.generateReport);
console.log("✅ Payroll reports route registered successfully");

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

// Send multiple payslips email (batch)
router.post(
  "/payroll/send-payslips-batch",
  requirePermission([Permission.VIEW_DEPARTMENT_PAYSLIPS]),
  SuperAdminController.sendMultiplePayslipsEmail
);

// Update payroll (only allowed for DRAFT status)
router.patch(
  "/payroll/:id",
  requireSuperAdmin,
  requirePermission([Permission.CREATE_PAYROLL]),
  validatePayrollUpdate,
  SuperAdminController.updatePayroll
);

// Create new payroll (DRAFT status)
router.post(
  "/payroll",
  requireSuperAdmin,
  requirePermission([Permission.CREATE_PAYROLL]),
  validatePayrollCreate,
  SuperAdminController.createPayroll
);

// Start processing payroll (PENDING -> PROCESSING)
router.patch(
  "/payroll/:id/process",
  requireSuperAdmin,
  requirePermission([Permission.APPROVE_PAYROLL]),
  SuperAdminController.updatePayrollStatus
);

// Single payment route
router.post(
  "/payroll/:id/mark-paid",
  requireSuperAdmin,
  requirePermission([Permission.APPROVE_PAYROLL]),
  SuperAdminController.markPaymentPaid
);

// Batch payment route
router.post(
  "/payroll/mark-paid-batch",
  requireSuperAdmin,
  requirePermission([Permission.APPROVE_PAYROLL]),
  SuperAdminController.markPaymentPaid
);

// Approve payroll (PROCESSING/PENDING -> APPROVED)
router.patch(
  "/payroll/:id/approve",
  requireSuperAdmin,
  requirePermission([Permission.APPROVE_PAYROLL]),
  validatePayrollApproval,
  SuperAdminController.approvePayroll
);

// Mark payroll as failed (PAID -> FAILED)
router.post(
  "/payroll/:id/mark-failed",
  requireSuperAdmin,
  requirePermission([Permission.APPROVE_PAYROLL]),
  SuperAdminController.markPaymentFailed
);

// Batch mark as failed
router.post(
  "/payroll/mark-failed-batch",
  requireSuperAdmin,
  requirePermission([Permission.APPROVE_PAYROLL]),
  SuperAdminController.markPaymentFailed
);

// Cancel payroll (Any status -> CANCELLED)
router.patch(
  "/payroll/:id/cancel",
  requireSuperAdmin,
  requirePermission([Permission.APPROVE_PAYROLL]),
  SuperAdminController.updatePayrollStatus
);

// Archive payroll (PAID -> ARCHIVED)
router.patch(
  "/payroll/:id/archive",
  requireSuperAdmin,
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
  requireSuperAdmin,
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
  requireSuperAdmin,
  requirePermission([Permission.MANAGE_OFFBOARDING]),
  SuperAdminController.initiateOffboarding
);

router.post(
  "/employees/:employeeId/revert-onboarding",
  requireSuperAdmin,
  requirePermission([Permission.MANAGE_ONBOARDING]),
  SuperAdminController.revertToOnboarding
);

router.patch(
  "/employees/:employeeId/offboarding",
  requireSuperAdmin,
  requirePermission([Permission.MANAGE_OFFBOARDING]),
  SuperAdminController.updateOffboardingStatus
);

router.post(
  "/employees/:employeeId/archive",
  requireSuperAdmin,
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
  requireSuperAdmin,
  requirePermission([Permission.APPROVE_LEAVE]),
  SuperAdminController.approveLeave
);

router.patch(
  "/leave/:id/reject",
  requireSuperAdmin,
  requirePermission([Permission.APPROVE_LEAVE]),
  SuperAdminController.rejectLeave
);

// Salary Structure Routes
router.post(
  "/salary-grades",
  requireSuperAdmin,
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
  requireSuperAdmin,
  requirePermission([Permission.MANAGE_SALARY_STRUCTURE]),
  SuperAdminController.updateSalaryGrade
);

router.post(
  "/salary-grades/:id/components",
  requireSuperAdmin,
  requirePermission([Permission.MANAGE_SALARY_STRUCTURE]),
  SuperAdminController.addSalaryComponent
);

router.patch(
  "/salary-grades/:id/components/:componentId",
  requireSuperAdmin,
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
  requireSuperAdmin,
  requirePermission([Permission.MANAGE_SALARY_STRUCTURE]),
  SuperAdminController.deleteSalaryGrade
);

// Group all deduction-related routes together
// ===== Deduction Management Routes =====
router.post(
  "/deductions/statutory",
  requireSuperAdmin,
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
  requireSuperAdmin,
  requirePermission([Permission.MANAGE_DEDUCTIONS]),
  SuperAdminController.createVoluntaryDeduction
);

router.post(
  "/deductions/statutory/custom",
  requireSuperAdmin,
  requirePermission([Permission.MANAGE_DEDUCTIONS]),
  SuperAdminController.createCustomStatutoryDeduction
);

router.post(
  "/deductions/statutory/department",
  requireSuperAdmin,
  requirePermission([Permission.MANAGE_DEDUCTIONS]),
  SuperAdminController.createDepartmentStatutoryDeduction
);

// Employee-specific deduction routes
router.post(
  "/deductions/:deductionId/assign/:employeeId",
  requireSuperAdmin,
  requirePermission([Permission.MANAGE_DEDUCTIONS]),
  SuperAdminController.assignDeductionToEmployee
);

router.delete(
  "/deductions/:deductionId/employees/:employeeId",
  requireSuperAdmin,
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
  requireSuperAdmin,
  requirePermission([Permission.EDIT_DEDUCTIONS]),
  SuperAdminController.updateDeduction
);

router.patch(
  "/deductions/:id/toggle",
  requireSuperAdmin,
  requirePermission([Permission.MANAGE_DEDUCTIONS]),
  SuperAdminController.toggleDeductionStatus
);

router.delete(
  "/deductions/:id",
  requireSuperAdmin,
  requirePermission([Permission.MANAGE_DEDUCTIONS]),
  SuperAdminController.deleteDeduction
);

// Batch operations
router.post(
  "/deductions/:deductionId/assign-batch",
  requireSuperAdmin,
  requirePermission([Permission.MANAGE_DEDUCTIONS]),
  SuperAdminController.assignDeductionToMultipleEmployees
);

router.delete(
  "/deductions/:deductionId/remove-batch",
  requireSuperAdmin,
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
  requireSuperAdmin,
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
  requireSuperAdmin,
  requirePermission([Permission.EDIT_ALLOWANCES]),
  SuperAdminController.updateAllowance
);

router.patch(
  "/allowances/:id/toggle",
  requireSuperAdmin,
  requirePermission([Permission.MANAGE_ALLOWANCES]),
  SuperAdminController.toggleAllowanceStatus
);

router.delete(
  "/allowances/:id",
  requireSuperAdmin,
  requirePermission([Permission.MANAGE_ALLOWANCES]),
  SuperAdminController.deleteAllowance
);

// Bonus Routes
router.post(
  "/bonuses",
  requireSuperAdmin,
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
  requireSuperAdmin,
  requirePermission([Permission.EDIT_BONUSES]),
  SuperAdminController.updateBonus
);

router.patch(
  "/bonuses/:id/approve",
  requireSuperAdmin,
  requirePermission([Permission.MANAGE_BONUSES]),
  SuperAdminController.approveBonus
);

router.delete(
  "/bonuses/:id",
  requireSuperAdmin,
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
  requireSuperAdmin,
  requirePermission([Permission.MANAGE_PAYMENT_METHODS]),
  SuperAdminController.createPaymentMethod
);

router.patch(
  "/payment-methods/:id",
  requireSuperAdmin,
  requirePermission([Permission.MANAGE_PAYMENT_METHODS]),
  SuperAdminController.updatePaymentMethod
);

router.delete(
  "/payment-methods/:id",
  requireSuperAdmin,
  requirePermission([Permission.MANAGE_PAYMENT_METHODS]),
  SuperAdminController.deletePaymentMethod
);

// Add these new routes for bulk processing
router.post(
  "/payroll/process-department",
  requireSuperAdmin,
  requirePermission([Permission.CREATE_PAYROLL]),
  validateBulkPayrollCreate,
  SuperAdminController.processDepartmentEmployeesPayroll
);

router.post(
  "/payroll/process-all-departments",
  requireSuperAdmin,
  requirePermission([Permission.CREATE_PAYROLL]),
  validateBulkPayrollCreate,
  SuperAdminController.processAllDepartmentsPayroll
);

// Add route for processing single employee payroll
router.post(
  "/payroll/process-single-employee",
  requireSuperAdmin,
  validateSuperAdminSingleEmployeePayroll,
  SuperAdminController.processSingleEmployeePayroll
);

// Add route for processing multiple employees payroll
router.post(
  "/payroll/process-multiple-employees",
  requireSuperAdmin,
  requirePermission([Permission.CREATE_PAYROLL]),
  validateSuperAdminMultipleEmployeesPayroll,
  SuperAdminController.processMultipleEmployeesPayroll
);

// Add route for processing all employees payroll
router.post(
  "/payroll/process-all-employees",
  requireSuperAdmin,
  requirePermission([Permission.CREATE_PAYROLL]),
  validateBulkPayrollCreate,
  SuperAdminController.processAllEmployeesPayroll
);

// Single payment initiation route
router.post(
  "/payroll/:id/initiate-payment",
  requireSuperAdmin,
  requirePermission([Permission.APPROVE_PAYROLL]),
  SuperAdminController.initiatePayment
);

// Batch payment initiation route
router.post(
  "/payroll/initiate-payment",
  requireSuperAdmin,
  requirePermission([Permission.APPROVE_PAYROLL]),
  SuperAdminController.initiatePayment
);

export default router;
