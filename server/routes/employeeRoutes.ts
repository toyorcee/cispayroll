import { Router, RequestHandler } from "express";
import {
  EmployeeController,
  AuthenticatedRequestWithFile,
} from "../controllers/employeeController.js";
import {
  requireAuth,
  requireRole,
  requirePermission,
  AuthenticatedRequest,
} from "../middleware/authMiddleware.js";
import { UserRole, Permission } from "../models/User.js";
import { upload } from "../middleware/multerMiddleware.js";

const router = Router();

// Apply authentication middleware
router.use(requireAuth as RequestHandler);

// Admin/Super Admin routes for managing employees
router.post(
  "/create",
  requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  (req, res, next) =>
    EmployeeController.createEmployee(req as AuthenticatedRequest, res, next)
);

// Employee (self) routes
router.get(
  "/profile",
  requirePermission([Permission.VIEW_PERSONAL_INFO]),
  (req, res, next) =>
    EmployeeController.getOwnProfile(req as AuthenticatedRequest, res, next)
);

router.put(
  "/profile",
  requirePermission([Permission.VIEW_PERSONAL_INFO]),
  (req, res, next) =>
    EmployeeController.updateOwnProfile(req as AuthenticatedRequest, res, next)
);

// Payslip routes
router.get(
  "/payslips",
  requirePermission([Permission.VIEW_OWN_PAYSLIP]),
  (req, res, next) =>
    EmployeeController.getOwnPayslips(req as AuthenticatedRequest, res, next)
);

router.get(
  "/payslips/:id",
  requirePermission([Permission.VIEW_OWN_PAYSLIP]),
  (req, res, next) =>
    EmployeeController.getOwnPayslipById(req as AuthenticatedRequest, res, next)
);

// Leave management routes
router.get(
  "/leave",
  requirePermission([Permission.VIEW_OWN_LEAVE]),
  (req, res, next) =>
    EmployeeController.getOwnLeaveRequests(
      req as AuthenticatedRequest,
      res,
      next
    )
);

router.post(
  "/leave",
  requirePermission([Permission.REQUEST_LEAVE]),
  (req, res, next) =>
    EmployeeController.createLeaveRequest(
      req as AuthenticatedRequest,
      res,
      next
    )
);

router.put(
  "/leave/:id/cancel",
  requirePermission([Permission.CANCEL_OWN_LEAVE]),
  (req, res, next) =>
    EmployeeController.cancelLeaveRequest(
      req as AuthenticatedRequest,
      res,
      next
    )
);

// Add this route after the profile routes
router.post(
  "/profile/image",
  requirePermission([Permission.VIEW_PERSONAL_INFO]),
  upload.single("image"),
  (req, res, next) =>
    EmployeeController.updateProfileImage(
      req as AuthenticatedRequestWithFile,
      res,
      next
    )
);

export default router;
