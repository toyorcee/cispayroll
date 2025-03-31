import { Router } from "express";
import {
  requireAuth,
  requireSuperAdmin,
  requirePermission,
  requireDepartmentAccess,
  requireAdmin,
} from "../middleware/authMiddleware.js";
import { DepartmentController } from "../controllers/DepartmentController.js";
import { Permission, UserRole } from "../models/User.js";
import {
  validateCreateDepartment,
  validateUpdateDepartment,
} from "../middleware/departmentMiddleware.js";

const router = Router();

// Base middleware
router.use(requireAuth);

// Department Routes with proper permissions
router.get(
  "/",
  requirePermission([Permission.VIEW_ALL_DEPARTMENTS]),
  DepartmentController.getAllDepartments
);

router.get(
  "/:id",
  requirePermission([Permission.VIEW_ALL_DEPARTMENTS]),
  DepartmentController.getDepartmentById
);

router.post(
  "/",
  requirePermission([Permission.CREATE_DEPARTMENT]),
  validateCreateDepartment,
  DepartmentController.createDepartment
);

router.put(
  "/:id",
  requirePermission([Permission.EDIT_DEPARTMENT]),
  validateUpdateDepartment,
  DepartmentController.updateDepartment
);

router.delete(
  "/:id",
  requirePermission([Permission.DELETE_DEPARTMENT]),
  DepartmentController.deleteDepartment
);

router.get(
  "/:departmentId/employees",
  requirePermission([Permission.VIEW_ALL_DEPARTMENTS]),
  DepartmentController.getDepartmentEmployees
);

// Department Stats
router.get(
  "/stats/charts",
  requireSuperAdmin,
  DepartmentController.getDepartmentChartStats
);

router.get(
  "/stats/admin/:departmentId",
  requireAuth,
  requireDepartmentAccess([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  DepartmentController.getAdminDepartmentStats
);

export default router;
