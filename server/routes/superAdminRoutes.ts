import { Router, RequestHandler } from "express";
import {
  requireAuth,
  requireSuperAdmin,
  AuthenticatedRequest,
} from "../middleware/authMiddleware.js";
import { SuperAdminController } from "../controllers/SuperAdminController.js";

const router = Router();

// Apply middleware to all routes in this router
router.use(requireAuth as RequestHandler);
router.use(requireSuperAdmin as RequestHandler);

// SUPER_ADMIN routes
router.get("/users", SuperAdminController.getAllUsers as RequestHandler);
router.post(
  "/admin/create",
  SuperAdminController.createAdmin as RequestHandler
);
router.put("/users/:id", SuperAdminController.updateUser as RequestHandler);
router.delete("/users/:id", SuperAdminController.deleteUser as RequestHandler);

export default router;
