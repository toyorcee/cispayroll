import { Router, Response, NextFunction, RequestHandler } from "express";
import {
  requireAuth,
  requirePermission,
  AuthenticatedRequest,
} from "../middleware/authMiddleware.js";
import { LeaveService } from "../services/leaveService.js";
import { Permission } from "../models/User.js";
import User from "../models/User.js";
import { Types } from "mongoose";

const router = Router();

// Request leave
router.post(
  "/request",
  requireAuth,
  requirePermission([Permission.REQUEST_LEAVE]),
  (async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      const leave = await LeaveService.createLeave(user, req.body);
      res.status(201).json({ message: "Leave request created", leave });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Server error";
      res.status(400).json({ message });
    }
  }) as RequestHandler
);

// Get user's own leaves
router.get(
  "/my-leaves",
  requireAuth,
  requirePermission([Permission.VIEW_OWN_LEAVE]),
  (async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const leaves = await LeaveService.getUserLeaves(
        new Types.ObjectId(userId)
      );
      res.json({ leaves });
    } catch (error) {
      res.status(500).json({ message: "Error fetching leaves" });
    }
  }) as RequestHandler
);

// Approve/Reject leave (Admin only)
router.patch(
  "/:leaveId/status",
  requireAuth,
  requirePermission([Permission.APPROVE_LEAVE]),
  (async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { leaveId } = req.params;
      const { status, notes } = req.body;
      const userId = req.user.id;

      const approver = await User.findById(userId);
      if (!approver) {
        res.status(404).json({ message: "Approver not found" });
        return;
      }

      let leave;
      if (status === "APPROVED") {
        leave = await LeaveService.approveLeave(
          new Types.ObjectId(leaveId),
          approver,
          notes
        );
      } else if (status === "REJECTED") {
        leave = await LeaveService.rejectLeave(
          new Types.ObjectId(leaveId),
          approver,
          notes
        );
      } else {
        res.status(400).json({ message: "Invalid status" });
        return;
      }

      res.json({ message: `Leave ${status.toLowerCase()}`, leave });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Server error";
      res.status(400).json({ message });
    }
  }) as RequestHandler
);

export default router;