import { Router, Response, NextFunction, RequestHandler } from "express";
import {
  requireAuth,
  requireAdmin,
  AuthenticatedRequest,
  JWTPayload,
} from "../middleware/authMiddleware.js";
import { AuthService } from "../services/authService.js";
import { UserRole } from "../models/User.js";
import UserModel from "../models/User.js";
import { UserController } from "../controllers/UserController.js";

const router = Router();

// Development-only route to reset SUPER_ADMIN
router.post("/dev/reset-super-admin", (async (req, res: Response) => {
  if (process.env.NODE_ENV !== "development") {
    res
      .status(403)
      .json({ message: "This route is only available in development" });
    return;
  }

  try {
    await UserModel.deleteMany({ role: UserRole.SUPER_ADMIN });

    const userData = {
      ...req.body,
      role: UserRole.SUPER_ADMIN,
      isEmailVerified: true,
    };

    const { user } = await AuthService.createUser(userData);
    res.status(201).json({
      message: "SUPER_ADMIN reset successfully",
      user,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    res.status(400).json({ message });
  }
}) as RequestHandler<any, any, any, any, { user: JWTPayload }>);

// Apply middleware to all routes
router.use(requireAuth);
router.use(requireAdmin);

// Admin routes for managing regular users
router.get("/users", UserController.getAllUsers);
router.post("/users/create", UserController.createUser);
router.put("/users/:id", UserController.updateUser);
router.delete("/users/:id", UserController.deleteUser);

// Initial SUPER_ADMIN setup
router.post("/setup/super-admin", (async (
  req,
  res: Response,
  next: NextFunction
) => {
  try {
    const superAdminExists = await UserModel.exists({
      role: UserRole.SUPER_ADMIN,
    });

    if (superAdminExists) {
      const existingAdmin = await UserModel.findOne({
        role: UserRole.SUPER_ADMIN,
      }).select("email");

      res.status(400).json({
        message: "SUPER_ADMIN already exists",
        details:
          "Please use the existing super admin account or contact system administrator.",
        email:
          process.env.NODE_ENV === "development"
            ? existingAdmin?.email
            : undefined,
      });
      return;
    }

    const userData = {
      ...req.body,
      role: UserRole.SUPER_ADMIN,
      isEmailVerified: true,
    };

    const { user } = await AuthService.createUser(userData);
    res.status(201).json({
      message: "SUPER_ADMIN created successfully",
      user,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    res.status(400).json({ message });
  }
}) as RequestHandler<any, any, any, any, { user: JWTPayload }>);

export default router;
