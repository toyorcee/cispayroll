import express from "express";
import { ProfileController } from "../controllers/ProfileController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/multerMiddleware.js";

const router = express.Router();

router.get("/", requireAuth, ProfileController.getProfile);
router.put("/", requireAuth, ProfileController.updateProfile);

// Route for updating profile image
router.put(
  "/image",
  requireAuth,
  upload.single("profileImage"),
  ProfileController.updateProfileImage
);

export default router;
