import { Router, RequestHandler } from "express";
import {
  requireAuth,
  requirePermission,
  AuthenticatedRequest,
} from "../middleware/authMiddleware.js";
import { RegularUserController } from "../controllers/RegularUserController.js";
import { Permission } from "../models/User.js";

const router = Router();

// Apply authentication middleware
router.use(requireAuth as RequestHandler);

// Personal Information
router.get(
  "/profile",
  requirePermission([Permission.VIEW_PERSONAL_INFO]),
  RegularUserController.getOwnProfile as RequestHandler<
    {},
    any,
    any,
    any,
    { user: AuthenticatedRequest["user"] }
  >
);

router.put(
  "/profile",
  requirePermission([Permission.VIEW_PERSONAL_INFO]),
  RegularUserController.updateOwnProfile as RequestHandler<
    {},
    any,
    any,
    any,
    { user: AuthenticatedRequest["user"] }
  >
);

// Payslip
router.get(
  "/payslips",
  requirePermission([Permission.VIEW_OWN_PAYSLIP]),
  RegularUserController.getOwnPayslips as RequestHandler<
    {},
    any,
    any,
    any,
    { user: AuthenticatedRequest["user"] }
  >
);

router.get(
  "/payslips/:id",
  requirePermission([Permission.VIEW_OWN_PAYSLIP]),
  RegularUserController.getOwnPayslipById as RequestHandler<
    {},
    any,
    any,
    any,
    { user: AuthenticatedRequest["user"] }
  >
);

// Leave Management
router.get(
  "/leave",
  requirePermission([Permission.VIEW_OWN_LEAVE]),
  RegularUserController.getOwnLeaveRequests as RequestHandler<
    {},
    any,
    any,
    any,
    { user: AuthenticatedRequest["user"] }
  >
);

router.post(
  "/leave",
  requirePermission([Permission.REQUEST_LEAVE]),
  RegularUserController.createLeaveRequest as RequestHandler<
    {},
    any,
    any,
    any,
    { user: AuthenticatedRequest["user"] }
  >
);

router.put(
  "/leave/:id/cancel",
  requirePermission([Permission.CANCEL_OWN_LEAVE]),
  RegularUserController.cancelLeaveRequest as RequestHandler<
    {},
    any,
    any,
    any,
    { user: AuthenticatedRequest["user"] }
  >
);

export default router;
