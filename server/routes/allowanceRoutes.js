import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  createAllowance,
  createDepartmentAllowance,
  createDepartmentEmployeeAllowance,
  getAllowanceRequests,
  createPersonalAllowance,
  getPersonalAllowances,
  cancelPersonalAllowance,
} from "../controllers/AllowancesController.js";

const router = express.Router();

// Apply authentication to all routes
router.use(requireAuth);

// GET route for fetching allowances
router.get(
  "/requests",
  (req, res, next) => {
    console.log("🔍 [AllowanceRoutes] /requests accessed by:", {
      userRole: req.user?.role,
      userId: req.user?._id,
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString(),
    });
    next();
  },
  getAllowanceRequests
);

// General allowance (Super Admin)
router.post("/", createAllowance);

// Department-wide allowance
router.post("/department/all", createDepartmentAllowance);

// Department employee-specific allowance
router.post("/department/employee", createDepartmentEmployeeAllowance);

// Personal allowance request (for all users)
router.post("/personal", createPersonalAllowance);

// Personal allowance requests (for all users)
router.get("/personal-requests", getPersonalAllowances);

// Cancel personal allowance request (for the requesting user only)
router.patch("/personal/:allowanceId/cancel", cancelPersonalAllowance);

export default router;
