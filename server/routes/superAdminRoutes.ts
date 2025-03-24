import { Router, RequestHandler } from "express";
import {
  requireAuth,
  requireSuperAdmin,
  requirePermission,
  AuthenticatedRequest,
} from "../middleware/authMiddleware.js";
import { SuperAdminController } from "../controllers/SuperAdminController.js";
import { Permission } from "../models/User.js";
import { validateDepartment } from "../middleware/departmentMiddleware.js";
import { Response, NextFunction } from "express";
import {
  validatePayrollCreate,
  validatePayrollUpdate,
  validateEmployeePayrollHistory,
} from "../middleware/payrollValidation.js";

const router = Router();

// Apply base middleware
router.use(requireAuth as unknown as RequestHandler);
router.use(requireSuperAdmin as unknown as RequestHandler);

// ===== Admin Management Routes =====
router.get(
  "/admins",
  requirePermission([Permission.VIEW_ALL_ADMINS]),
  SuperAdminController.getAllAdmins as unknown as RequestHandler
);

router.get(
  "/admins/:id",
  requirePermission([Permission.VIEW_ALL_ADMINS]),
  SuperAdminController.getAdminById as unknown as RequestHandler
);

router.post(
  "/admins",
  requirePermission([Permission.CREATE_ADMIN]),
  SuperAdminController.createAdmin as unknown as RequestHandler
);

router.put(
  "/admins/:id",
  requirePermission([Permission.EDIT_ADMIN]),
  SuperAdminController.updateAdmin as unknown as RequestHandler
);

router.delete(
  "/admins/:id",
  requirePermission([Permission.DELETE_ADMIN]),
  SuperAdminController.deleteAdmin as unknown as RequestHandler
);

// ===== User Management Routes =====
router.get(
  "/users",
  requirePermission([Permission.VIEW_ALL_USERS]),
  SuperAdminController.getAllUsers as unknown as RequestHandler
);

router.get(
  "/users/:id",
  requirePermission([Permission.VIEW_ALL_USERS]),
  SuperAdminController.getUserById as unknown as RequestHandler
);

router.post(
  "/users",
  requirePermission([Permission.CREATE_USER]),
  SuperAdminController.createUser as unknown as RequestHandler
);

router.put(
  "/users/:id",
  requirePermission([Permission.EDIT_USER]),
  SuperAdminController.updateUser as unknown as RequestHandler
);

router.delete(
  "/users/:id",
  requirePermission([Permission.DELETE_USER]),
  SuperAdminController.deleteUser as unknown as RequestHandler
);

// ===== Department Management Routes =====
router.get(
  "/departments",
  requirePermission([Permission.VIEW_ALL_DEPARTMENTS]),
  SuperAdminController.getAllDepartments as unknown as RequestHandler
);

router.post(
  "/departments",
  requirePermission([Permission.CREATE_DEPARTMENT]),
  validateDepartment as unknown as RequestHandler,
  SuperAdminController.createDepartment as unknown as RequestHandler
);

router.put(
  "/departments/:id",
  requirePermission([Permission.EDIT_DEPARTMENT]),
  validateDepartment as unknown as RequestHandler,
  SuperAdminController.updateDepartment as unknown as RequestHandler
);

router.delete(
  "/departments/:id",
  requirePermission([Permission.DELETE_DEPARTMENT]),
  SuperAdminController.deleteDepartment as unknown as RequestHandler
);

// ===== Payroll Management Routes =====
router.post(
  "/payroll",
  requirePermission([Permission.CREATE_PAYROLL]),
  validatePayrollCreate,
  SuperAdminController.createPayroll as unknown as RequestHandler
);

router.get(
  "/payroll/periods",
  requirePermission([Permission.VIEW_ALL_PAYROLL]),
  SuperAdminController.getPayrollPeriods as unknown as RequestHandler
);

router.get(
  "/payroll/stats",
  requirePermission([Permission.VIEW_PAYROLL_STATS]),
  SuperAdminController.getPayrollStats as unknown as RequestHandler
);

//Get all payrolls
router.get(
  "/payroll",
  requirePermission([Permission.VIEW_ALL_PAYROLL]),
  SuperAdminController.getAllPayroll as unknown as RequestHandler
);

router.get(
  "/payroll/:id",
  requirePermission([Permission.VIEW_ALL_PAYROLL]),
  SuperAdminController.getPayrollById as unknown as RequestHandler
);

router.delete(
  "/payroll/:id",
  requirePermission([Permission.DELETE_PAYROLL]),
  SuperAdminController.deletePayroll as unknown as RequestHandler
);

// Payroll Approval and Generation
// router.post(
//   "/payroll/:id/approve",
//   requirePermission([Permission.APPROVE_PAYROLL]),
//   SuperAdminController.approvePayroll as unknown as RequestHandler
// );

// router.post(
//   "/payroll/:id/generate-slip",
//   requirePermission([Permission.GENERATE_PAYSLIP]),
//   SuperAdminController.generatePayslip as unknown as RequestHandler
// );

// Payroll Views and Statistics
router.get(
  "/payroll/employee/:employeeId/history",
  requirePermission([Permission.VIEW_ALL_PAYROLL]),
  validateEmployeePayrollHistory,
  SuperAdminController.getEmployeePayrollHistory as unknown as RequestHandler
);

router.get(
  "/payroll/period/:month/:year",
  requirePermission([Permission.VIEW_ALL_PAYROLL]),
  SuperAdminController.getPeriodPayroll as unknown as RequestHandler
);

// router.get(
//   "/payroll/department/:departmentId",
//   requirePermission([Permission.VIEW_ALL_PAYROLL]),
//   SuperAdminController.getDepartmentPayroll as unknown as RequestHandler
// );

// Employee Management Routes
router.get(
  "/onboarding-employees",
  requirePermission([Permission.VIEW_ONBOARDING]),
  SuperAdminController.getOnboardingEmployees as unknown as RequestHandler
);

router.get(
  "/offboarding-employees",
  requirePermission([Permission.VIEW_OFFBOARDING]),
  SuperAdminController.getOffboardingEmployees as unknown as RequestHandler
);

router.post(
  "/employees/:employeeId/offboard",
  requirePermission([Permission.MANAGE_OFFBOARDING]),
  SuperAdminController.initiateOffboarding as unknown as RequestHandler
);

router.post(
  "/employees/:employeeId/revert-onboarding",
  requirePermission([Permission.MANAGE_ONBOARDING]),
  SuperAdminController.revertToOnboarding as unknown as RequestHandler
);

router.patch(
  "/employees/:employeeId/offboarding",
  requirePermission([Permission.MANAGE_OFFBOARDING]),
  SuperAdminController.updateOffboardingStatus as unknown as RequestHandler
);

router.post(
  "/employees/:employeeId/archive",
  requirePermission([Permission.MANAGE_OFFBOARDING]),
  SuperAdminController.archiveEmployee as unknown as RequestHandler
);

// ===== Leave Management Routes =====
router.get(
  "/leave/all",
  requirePermission([Permission.VIEW_ALL_LEAVE]),
  SuperAdminController.getAllLeaves as unknown as RequestHandler
);

router.patch(
  "/leave/:id/approve",
  requirePermission([Permission.APPROVE_LEAVE]),
  SuperAdminController.approveLeave as unknown as RequestHandler
);

router.patch(
  "/leave/:id/reject",
  requirePermission([Permission.APPROVE_LEAVE]),
  SuperAdminController.rejectLeave as unknown as RequestHandler
);

// Salary Structure Routes
router.post(
  "/salary-grades",
  requirePermission([Permission.MANAGE_SALARY_STRUCTURE]),
  SuperAdminController.createSalaryGrade as unknown as RequestHandler
);

router.get(
  "/salary-grades",
  requirePermission([Permission.VIEW_SALARY_STRUCTURE]),
  SuperAdminController.getAllSalaryGrades as unknown as RequestHandler
);

router.patch(
  "/salary-grades/:id",
  requirePermission([Permission.MANAGE_SALARY_STRUCTURE]),
  SuperAdminController.updateSalaryGrade as unknown as RequestHandler
);

router.post(
  "/salary-grades/:id/components",
  requirePermission([Permission.MANAGE_SALARY_STRUCTURE]),
  SuperAdminController.addSalaryComponent as unknown as RequestHandler
);

router.patch(
  "/salary-grades/:id/components/:componentId",
  requirePermission([Permission.MANAGE_SALARY_STRUCTURE]),
  SuperAdminController.updateSalaryComponent as unknown as RequestHandler
);

router.get(
  "/salary-grades/:id",
  requirePermission([Permission.VIEW_SALARY_STRUCTURE]),
  SuperAdminController.getSalaryGrade as unknown as RequestHandler
);

router.delete(
  "/salary-grades/:id",
  requirePermission([Permission.MANAGE_SALARY_STRUCTURE]),
  SuperAdminController.deleteSalaryGrade as unknown as RequestHandler
);

//Deduction Routes
router.post(
  "/deductions/statutory/setup",
  requirePermission([Permission.MANAGE_DEDUCTIONS]),
  SuperAdminController.setupStatutoryDeductions as unknown as RequestHandler
);

router.get(
  "/deductions",
  requirePermission([Permission.VIEW_DEDUCTIONS]),
  SuperAdminController.getAllDeductions as unknown as RequestHandler
);

router.post(
  "/deductions/voluntary",
  requirePermission([Permission.MANAGE_DEDUCTIONS]),
  SuperAdminController.createVoluntaryDeduction as unknown as RequestHandler
);

router.patch(
  "/deductions/:id",
  requirePermission([Permission.EDIT_DEDUCTIONS]),
  SuperAdminController.updateDeduction as unknown as RequestHandler
);

router.patch(
  "/deductions/:id/toggle",
  requirePermission([Permission.MANAGE_DEDUCTIONS]),
  SuperAdminController.toggleDeductionStatus as unknown as RequestHandler
);

router.delete(
  "/deductions/:id",
  requirePermission([Permission.MANAGE_DEDUCTIONS]),
  SuperAdminController.deleteDeduction as unknown as RequestHandler
);

// Allowance Routes
router.post(
  "/allowances",
  requirePermission([Permission.MANAGE_ALLOWANCES]),
  SuperAdminController.createAllowance as unknown as RequestHandler
);

router.get(
  "/allowances",
  requirePermission([Permission.VIEW_ALLOWANCES]),
  SuperAdminController.getAllAllowances as unknown as RequestHandler
);

router.patch(
  "/allowances/:id",
  requirePermission([Permission.EDIT_ALLOWANCES]),
  SuperAdminController.updateAllowance as unknown as RequestHandler
);

router.patch(
  "/allowances/:id/toggle",
  requirePermission([Permission.MANAGE_ALLOWANCES]),
  SuperAdminController.toggleAllowanceStatus as unknown as RequestHandler
);

router.delete(
  "/allowances/:id",
  requirePermission([Permission.MANAGE_ALLOWANCES]),
  SuperAdminController.deleteAllowance as unknown as RequestHandler
);

// Bonus Routes
router.post(
  "/bonuses",
  requirePermission([Permission.MANAGE_BONUSES]),
  SuperAdminController.createBonus as unknown as RequestHandler
);

router.get(
  "/bonuses",
  requirePermission([Permission.VIEW_BONUSES]),
  SuperAdminController.getAllBonuses as unknown as RequestHandler
);

router.patch(
  "/bonuses/:id",
  requirePermission([Permission.EDIT_BONUSES]),
  SuperAdminController.updateBonus as unknown as RequestHandler
);

router.patch(
  "/bonuses/:id/approve",
  requirePermission([Permission.MANAGE_BONUSES]),
  SuperAdminController.approveBonus as unknown as RequestHandler
);

router.delete(
  "/bonuses/:id",
  requirePermission([Permission.MANAGE_BONUSES]),
  SuperAdminController.deleteBonus as unknown as RequestHandler
);

export default router;
