import { Router } from "express";
import { EmployeeController } from "../controllers/EmployeeController.js";
import {
  requireAuth,
  requireRole,
  requirePermission,
} from "../middleware/authMiddleware.js";
import { UserRole, Permission } from "../models/User.js";
import { upload } from "../middleware/multerMiddleware.js";
import { SuperAdminController } from "../controllers/SuperAdminController.js";

const router = Router();

// Apply authentication middleware
router.use(requireAuth);

// Admin/Super Admin routes for managing employees
router.post(
  "/create",
  requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  EmployeeController.createEmployee
);

// Salary grades route - accessible to both admin and super admin
router.get(
  "/salary-grades",
  requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  SuperAdminController.getAllSalaryGrades
);

// Employee (self) routes
router.get(
  "/profile",
  requirePermission([Permission.VIEW_PERSONAL_INFO]),
  EmployeeController.getOwnProfile
);

router.put(
  "/profile",
  requirePermission([Permission.VIEW_PERSONAL_INFO]),
  EmployeeController.updateOwnProfile
);

// Payslip routes
router.get(
  "/payslips",
  requirePermission([Permission.VIEW_OWN_PAYSLIP]),
  EmployeeController.getOwnPayslips
);

router.get(
  "/payslips/:id",
  requirePermission([Permission.VIEW_OWN_PAYSLIP]),
  EmployeeController.getOwnPayslipById
);

// Leave management routes
router.get(
  "/leave",
  requirePermission([Permission.VIEW_OWN_LEAVE]),
  EmployeeController.getOwnLeaveRequests
);

router.post(
  "/leave",
  requirePermission([Permission.REQUEST_LEAVE]),
  EmployeeController.createLeaveRequest
);

router.put(
  "/leave/:id/cancel",
  requirePermission([Permission.CANCEL_OWN_LEAVE]),
  EmployeeController.cancelLeaveRequest
);

router.post(
  "/profile/image",
  requirePermission([Permission.EDIT_PERSONAL_INFO]),
  upload.single("image"),
  EmployeeController.updateProfileImage
);

router.delete(
  "/:id",
  requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  EmployeeController.deleteEmployee
);

router.get(
  "/:id",
  requirePermission([Permission.VIEW_EMPLOYEE_DETAILS]),
  EmployeeController.getEmployeeById
);

router.get("/dashboard/stats", EmployeeController.getDashboardStats);

export default router;
