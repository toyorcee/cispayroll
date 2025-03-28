import express from "express";
import { createCase, getAllCases, getCaseById, updateCaseStatus, deleteAllCases, getCaseStatistics } from "../controllers/DisciplinaryCaseController.js";
import { upload } from "../middleware/upload.js";
import DisciplinaryCase from "../models/DisciplinaryCase.js";

const router = express.Router();

router.post("/cases", upload.single("evidenceFiles"), createCase);         // Route to log a new case
router.get("/cases", getAllCases);          // Route to fetch all cases
router.get("/cases/:id", getCaseById);      // Route to fetch details of a specific case
router.put("/cases/:id/status", updateCaseStatus); // Route to update case status (resolve/approve)
router.delete("/cases", deleteAllCases);
router.get("/cases/statistics", getCaseStatistics);
router.get("/monthly-cases", async (req, res) => {
    try {
      const currentDate = new Date();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(currentDate.getMonth() - 5);
  
      const casesPerMonth = await DisciplinaryCase.aggregate([
        {
          $match: {
            date: { $gte: sixMonthsAgo }, // Filter cases from the last 6 months
          },
        },
        {
          $group: {
            _id: { $month: "$date" }, // Group by month
            count: { $sum: 1 }, // Count cases in each month
          },
        },
        { $sort: { "_id": 1 } }, // Sort by month (ascending)
      ]);
  
      res.json(casesPerMonth); // Respond with data in format [{_id: 1, count: 10}, ...]
    } catch (error) {
      console.error("Error fetching monthly cases:", error);
      res.status(500).json({ error: "Failed to fetch monthly case data" });
    }
  });

export default router; // Export the router as default
