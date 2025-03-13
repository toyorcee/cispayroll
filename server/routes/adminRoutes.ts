import { Router, RequestHandler } from "express";
import {
  requireAuth,
  requireAdmin,
  requirePermission,
  AuthenticatedRequest,
} from "../middleware/authMiddleware.js";
import { AdminController } from "../controllers/AdminController.js";
import { Permission } from "../models/User.js";

const router = Router();

// Apply base middleware
router.use(requireAuth as RequestHandler);
router.use(requireAdmin as RequestHandler);

// Department-specific routes (admins can manage their own department)
router.get(
  "/department/users",
  requirePermission([Permission.VIEW_ALL_USERS]),
  AdminController.getDepartmentUsers as RequestHandler<
    {},
    any,
    any,
    any,
    { user: AuthenticatedRequest["user"] }
  >
);

router.get(
  "/department/payroll",
  requirePermission([Permission.VIEW_DEPARTMENT_PAYROLL]),
  AdminController.getDepartmentPayroll as RequestHandler<
    {},
    any,
    any,
    any,
    { user: AuthenticatedRequest["user"] }
  >
);

// User management within department
router.post(
  "/department/users",
  requirePermission([
    Permission.CREATE_USER,
    Permission.MANAGE_DEPARTMENT_USERS,
  ]),
  AdminController.createDepartmentUser as RequestHandler<
    {},
    any,
    any,
    any,
    { user: AuthenticatedRequest["user"] }
  >
);

router.put(
  "/department/users/:id",
  requirePermission([Permission.EDIT_USER, Permission.MANAGE_DEPARTMENT_USERS]),
  AdminController.updateDepartmentUser as RequestHandler<
    {},
    any,
    any,
    any,
    { user: AuthenticatedRequest["user"] }
  >
);

// Payroll management within department
router.post(
  "/department/payroll",
  requirePermission([Permission.CREATE_PAYROLL]),
  AdminController.createDepartmentPayroll as RequestHandler<
    {},
    any,
    any,
    any,
    { user: AuthenticatedRequest["user"] }
  >
);

router.put(
  "/department/payroll/:id",
  requirePermission([Permission.EDIT_PAYROLL]),
  AdminController.updateDepartmentPayroll as RequestHandler<
    {},
    any,
    any,
    any,
    { user: AuthenticatedRequest["user"] }
  >
);

export default router;