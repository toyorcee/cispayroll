import { Router, RequestHandler } from "express";
import {
  requireAuth,
  requireSuperAdmin,
  requirePermission,
} from "../middleware/authMiddleware.js";
import { SuperAdminController } from "../controllers/SuperAdminController.js";
import { Permission } from "../models/User.js";
import { validateDepartment } from "../middleware/departmentMiddleware.js";

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
router.get(
  "/payroll",
  requirePermission([Permission.VIEW_ALL_PAYROLL]),
  SuperAdminController.getAllPayroll as unknown as RequestHandler
);

router.post(
  "/payroll",
  requirePermission([Permission.CREATE_PAYROLL]),
  SuperAdminController.createPayroll as unknown as RequestHandler
);

router.post(
  "/payroll/:id/approve",
  requirePermission([Permission.APPROVE_PAYROLL]),
  SuperAdminController.approvePayroll as unknown as RequestHandler
);

router.delete(
  "/payroll/:id",
  requirePermission([Permission.DELETE_PAYROLL]),
  SuperAdminController.deletePayroll as unknown as RequestHandler
);

export default router;
