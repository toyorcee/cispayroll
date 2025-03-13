import { Router } from "express";
import { EmployeeController } from "../controllers/employeeController.js";
import {
  requireAuth,
  requireRole,
  AuthenticatedRequest,
} from "../middleware/authMiddleware.js";
import { UserRole } from "../models/User.js";

const router = Router();

// Protected routes - only accessible by admin and super admin
router.post(
  "/create",
  requireAuth,
  requireRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  (req, res) => {
    console.log("Request body:", req.body);
    console.log("User:", (req as AuthenticatedRequest).user);
    return EmployeeController.createEmployee(req as AuthenticatedRequest, res);
  }
);

export default router;
