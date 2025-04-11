import express from "express";
import { ApiError } from "../utils/errorHandler.js";
import ApprovalController from "../controllers/ApprovalController.js";
import {
  requireAuth,
  requireAdmin,
  requirePermission,
} from "../middleware/authMiddleware.js";
import {
  validatePayrollApproval,
  validatePayrollRejection,
} from "../middleware/payrollValidation.js";
import { validatePayrollSubmission } from "../middleware/adminPayrollValidation.js";
import { Permission } from "../models/User.js";

const router = express.Router();

// Apply base middleware
router.use(requireAuth);
router.use(requireAdmin);
// Department Head Routes
router.patch(
  "/department-head/:id/approve",
  requirePermission([Permission.APPROVE_PAYROLL]),
  validatePayrollApproval,
  async (req, res, next) => {
    try {
      await ApprovalController.approveAsDepartmentHead(req, res, next);
    } catch (error) {
      next(new ApiError(error.statusCode || 500, error.message));
    }
  }
);

router.patch(
  "/department-head/:id/reject",
  requirePermission([Permission.APPROVE_PAYROLL]),
  validatePayrollRejection,
  async (req, res, next) => {
    try {
      await ApprovalController.rejectAsDepartmentHead(req, res, next);
    } catch (error) {
      next(new ApiError(error.statusCode || 500, error.message));
    }
  }
);

// HR Manager Routes
router.patch(
  "/hr-manager/:id/approve",
  requirePermission([Permission.APPROVE_PAYROLL]),
  validatePayrollApproval,
  async (req, res, next) => {
    try {
      await ApprovalController.approveAsHRManager(req, res, next);
    } catch (error) {
      next(new ApiError(error.statusCode || 500, error.message));
    }
  }
);

router.patch(
  "/hr-manager/:id/reject",
  requirePermission([Permission.APPROVE_PAYROLL]),
  validatePayrollRejection,
  async (req, res, next) => {
    try {
      await ApprovalController.rejectAsHRManager(req, res, next);
    } catch (error) {
      next(new ApiError(error.statusCode || 500, error.message));
    }
  }
);

// Finance Director Routes
router.patch(
  "/finance-director/:id/approve",
  requirePermission([Permission.APPROVE_PAYROLL]),
  validatePayrollApproval,
  async (req, res, next) => {
    try {
      await ApprovalController.approveAsFinanceDirector(req, res, next);
    } catch (error) {
      next(new ApiError(error.statusCode || 500, error.message));
    }
  }
);

router.patch(
  "/finance-director/:id/reject",
  requirePermission([Permission.APPROVE_PAYROLL]),
  validatePayrollRejection,
  async (req, res, next) => {
    try {
      await ApprovalController.rejectAsFinanceDirector(req, res, next);
    } catch (error) {
      next(new ApiError(error.statusCode || 500, error.message));
    }
  }
);

// Super Admin Routes
router.patch(
  "/super-admin/:id/approve",
  requirePermission([Permission.APPROVE_PAYROLL]),
  validatePayrollApproval,
  async (req, res, next) => {
    try {
      await ApprovalController.approveAsSuperAdmin(req, res, next);
    } catch (error) {
      next(new ApiError(error.statusCode || 500, error.message));
    }
  }
);

router.patch(
  "/super-admin/:id/reject",
  requirePermission([Permission.APPROVE_PAYROLL]),
  validatePayrollRejection,
  async (req, res, next) => {
    try {
      await ApprovalController.rejectAsSuperAdmin(req, res, next);
    } catch (error) {
      next(new ApiError(error.statusCode || 500, error.message));
    }
  }
);

export default router;
