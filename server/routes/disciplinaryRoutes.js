import express from "express";
import { createCase, getAllCases, getCaseById, updateCaseStatus } from "../controllers/DisciplinaryCaseController.js";

const router = express.Router();

router.post("/cases", createCase);          // Route to log a new case
router.get("/cases", getAllCases);          // Route to fetch all cases
router.get("/cases/:id", getCaseById);      // Route to fetch details of a specific case
router.put("/cases/:id/status", updateCaseStatus); // Route to update case status (resolve/approve)

export default router; // Export the router as default
