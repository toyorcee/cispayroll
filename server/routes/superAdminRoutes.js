import { Router } from "express";
import {
  requireAuth,
  requireSuperAdmin,
  requirePermission,
} from "../middleware/authMiddleware.js";
import { SuperAdminController } from "../controllers/SuperAdminController.js";
import { Permission } from "../models/User.js";
import { validateDepartment } from "../middleware/departmentMiddleware.js";
import {
  validatePayrollCreate,
  validatePayrollUpdate,
  validateEmployeePayrollHistory,
  validatePayrollApproval,
  validatePayrollRejection,
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

router.post(
  "/departments",
  requirePermission([Permission.CREATE_DEPARTMENT]),
  validateDepartment,
  SuperAdminController.createDepartment
);

router.put(
  "/departments/:id",
  requirePermission([Permission.EDIT_DEPARTMENT]),
  validateDepartment,
  SuperAdminController.updateDepartment
);

router.delete(
  "/departments/:id",
  requirePermission([Permission.DELETE_DEPARTMENT]),
  SuperAdminController.deleteDepartment
);

// ===== Payroll Management Routes =====
router.post(
  "/payroll",
  requirePermission([Permission.CREATE_PAYROLL]),
  validatePayrollCreate,
  SuperAdminController.createPayroll
);

router.get(
  "/payroll/periods",
  requirePermission([Permission.VIEW_ALL_PAYROLL]),
  SuperAdminController.getPayrollPeriods
);

router.get(
  "/payroll/stats",
  requirePermission([Permission.VIEW_PAYROLL_STATS]),
  SuperAdminController.getPayrollStats
);

router.get(
  "/payroll/pending",
  requirePermission([Permission.VIEW_ALL_PAYROLL]),
  SuperAdminController.getPendingPayrolls
);

//Get all payrolls
router.get("/payroll", SuperAdminController.getAllPayrolls);

router.get(
  "/payroll/:id",
  requirePermission([Permission.VIEW_ALL_PAYROLL]),
  SuperAdminController.getPayrollById
);

router.delete(
  "/payroll/:id",
  requirePermission([Permission.DELETE_PAYROLL]),
  SuperAdminController.deletePayroll
);

router.get(
  "/payroll/employee/:employeeId/history",
  requirePermission([Permission.VIEW_ALL_PAYROLL]),
  validateEmployeePayrollHistory,
  SuperAdminController.getEmployeePayrollHistory
);

router.get(
  "/payroll/period/:month/:year",
  requirePermission([Permission.VIEW_ALL_PAYROLL]),
  SuperAdminController.getPeriodPayroll
);

router.get(
  "/payroll/filtered",
  requirePermission([Permission.VIEW_ALL_PAYROLL]),
  SuperAdminController.getFilteredPayrolls
);

router.get(
  "/payroll/:payrollId/view",
  requirePermission([Permission.VIEW_ALL_PAYROLL]),
  SuperAdminController.viewPayslip
);

router.patch(
  "/payroll/:id/approve",
  requirePermission([Permission.APPROVE_PAYROLL]),
  SuperAdminController.approvePayroll
);

router.patch(
  "/payroll/:id/reject",
  requirePermission([Permission.APPROVE_PAYROLL]),
  SuperAdminController.rejectPayroll
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
  "/departments/:departmentId/employees",
  requirePermission([Permission.VIEW_ALL_USERS]),
  SuperAdminController.getDepartmentEmployees
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

//Deduction Routes
router.post(
  "/deductions/statutory/setup",
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

export default router;
