import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  createAllowance,
  createDepartmentAllowance,
  createDepartmentEmployeeAllowance,
  getAllowanceRequests,
} from "../controllers/AllowancesController.js";

const router = express.Router();

// Apply authentication to all routes
router.use(requireAuth);

// GET route for fetching allowances
router.get("/requests", getAllowanceRequests);

// General allowance (Super Admin)
router.post("/", createAllowance);

// Department-wide allowance
router.post("/department/all", createDepartmentAllowance);

// Department employee-specific allowance
router.post("/department/employee", createDepartmentEmployeeAllowance);

export default router;
