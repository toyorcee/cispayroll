import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  createPersonalBonus,
  getBonusRequests,
  getBonusRequestById,
  approveBonusRequest,
  rejectBonusRequest,
  deleteBonusRequest,
} from "../controllers/BonusController.js";

const router = express.Router();

// Apply JWT verification to all routes
router.use(requireAuth);

// Personal bonus request routes
router.post("/personal", createPersonalBonus);
router.get("/requests", getBonusRequests);
router.get("/requests/:id", getBonusRequestById);
router.put("/requests/:id/approve", approveBonusRequest);
router.put("/requests/:id/reject", rejectBonusRequest);
router.delete("/requests/:id", deleteBonusRequest);

export default router;
