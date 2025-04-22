import express from "express";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { RegularUserController } from "../controllers/RegularUserController.js";
import { AdminController } from "../controllers/AdminController.js";
import { SuperAdminController } from "../controllers/SuperAdminController.js";
import { Permission } from "../utils/constants.js";

const router = express.Router();

// Regular user routes (for applying/viewing own allowances)
router.post(
  "/request",
  requireAuth,
  requirePermission([Permission.REQUEST_ALLOWANCES]),
  RegularUserController.requestAllowance
);
router.get(
  "/my-allowances",
  requireAuth,
  requirePermission([Permission.VIEW_OWN_ALLOWANCES]),
  RegularUserController.getMyAllowances
);
router.get(
  "/my-allowances/:id",
  requireAuth,
  requirePermission([Permission.VIEW_OWN_ALLOWANCES]),
  RegularUserController.getAllowanceHistory
);

// Admin routes (for managing department allowances)
router.get(
  "/department/:departmentId",
  requireAuth,
  requirePermission([Permission.VIEW_DEPARTMENT_ALLOWANCES]),
  AdminController.getDepartmentAllowances
);
router.post(
  "/department",
  requireAuth,
  requirePermission([Permission.CREATE_ALLOWANCE]),
  AdminController.createDepartmentAllowance
);
router.put(
  "/department/:id",
  requireAuth,
  requirePermission([Permission.EDIT_ALLOWANCE]),
  AdminController.updateDepartmentAllowance
);
router.post(
  "/department/:id/approve",
  requireAuth,
  requirePermission([Permission.APPROVE_ALLOWANCE]),
  AdminController.approveAllowance
);
router.post(
  "/department/:id/reject",
  requireAuth,
  requirePermission([Permission.APPROVE_ALLOWANCE]),
  AdminController.rejectAllowance
);

// Super Admin routes (for managing company-wide allowances)
router.get(
  "/",
  requireAuth,
  requirePermission([Permission.VIEW_ALLOWANCES]),
  SuperAdminController.getAllAllowances
);
router.post(
  "/",
  requireAuth,
  requirePermission([Permission.CREATE_ALLOWANCE]),
  SuperAdminController.createAllowance
);
router.put(
  "/:id",
  requireAuth,
  requirePermission([Permission.EDIT_ALLOWANCE]),
  SuperAdminController.updateAllowance
);

export default router;
