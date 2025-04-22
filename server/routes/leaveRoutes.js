import { Router } from "express";
import {
  requireAuth,
  requirePermission,
} from "../middleware/authMiddleware.js";
import { Permission } from "../models/User.js";
import { LeaveController } from "../controllers/LeaveController.js";

const router = Router();

// Personal leave routes (accessible to all users)
router.post(
  "/request",
  requireAuth,
  requirePermission([Permission.REQUEST_LEAVE]),
  LeaveController.requestLeave
);

router.get(
  "/my-leaves",
  requireAuth,
  requirePermission([Permission.VIEW_OWN_LEAVE]),
  LeaveController.getMyLeaves
);

router.delete(
  "/my-leaves/:leaveId/cancel",
  requireAuth,
  requirePermission([Permission.CANCEL_OWN_LEAVE]),
  LeaveController.cancelLeave
);

// Add route for deleting a leave
router.delete(
  "/my-leaves/:leaveId",
  requireAuth,
  requirePermission([Permission.CANCEL_OWN_LEAVE]),
  LeaveController.deleteLeave
);

// Team leave routes (accessible to admins and super admins)
router.get(
  "/team-leaves",
  requireAuth,
  requirePermission([Permission.VIEW_TEAM_LEAVE]),
  LeaveController.getTeamLeaves
);

router.patch(
  "/team-leaves/:leaveId/approve",
  requireAuth,
  requirePermission([Permission.APPROVE_LEAVE]),
  LeaveController.approveLeave
);

router.patch(
  "/team-leaves/:leaveId/reject",
  requireAuth,
  requirePermission([Permission.APPROVE_LEAVE]),
  LeaveController.rejectLeave
);

router.patch(
  "/:leaveId/status",
  requireAuth,
  requirePermission([Permission.APPROVE_LEAVE]),
  LeaveController.updateLeaveStatus
);

router.get(
  "/statistics",
  requireAuth,
  requirePermission([Permission.VIEW_TEAM_LEAVE]),
  LeaveController.getLeaveStatistics
);

export default router;
