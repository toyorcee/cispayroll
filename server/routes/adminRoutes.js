import { Router } from "express";
import {
  requireAuth,
  requireAdmin,
  requirePermission,
} from "../middleware/authMiddleware.js";
import { AdminController } from "../controllers/AdminController.js";
import { Permission } from "../models/User.js";

const router = Router();

// Apply base middleware
router.use(requireAuth);
router.use(requireAdmin);

// Department-specific routes (admins can manage their own department)
router.get(
  "/department/users",
  requirePermission([Permission.VIEW_ALL_USERS]),
  AdminController.getDepartmentUsers
);

router.get(
  "/department/payroll",
  requirePermission([Permission.VIEW_DEPARTMENT_PAYROLL]),
  AdminController.getDepartmentPayroll
);

// User management within department
router.post(
  "/department/users",
  requirePermission([
    Permission.CREATE_USER,
    Permission.MANAGE_DEPARTMENT_USERS,
  ]),
  AdminController.createDepartmentUser
);

router.put(
  "/department/users/:id",
  requirePermission([Permission.EDIT_USER, Permission.MANAGE_DEPARTMENT_USERS]),
  AdminController.updateDepartmentUser
);

// Payroll management within department
router.post(
  "/department/payroll",
  requirePermission([Permission.CREATE_PAYROLL]),
  AdminController.createDepartmentPayroll
);

router.put(
  "/department/payroll/:id",
  requirePermission([Permission.EDIT_PAYROLL]),
  AdminController.updateDepartmentPayroll
);

export default router;
