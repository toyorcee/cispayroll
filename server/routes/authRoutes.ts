import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { AuthService } from "../services/authService.js";
import mongoose from "mongoose";
import { Request, Response, NextFunction } from "express";

// Add User model import
const User = mongoose.model("User");

// Add type declaration for the Request
declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: string;
      role: string;
      permissions: string[];
    };
  }
}

const router = Router();

// ------------------------------------
// 1) LOCAL AUTH - LOGIN
// ------------------------------------
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await AuthService.handleLogin({ email, password });

    // Set the token in cookie
    res.cookie("token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    // Only send the user data in response
    res.json({ user: result.user });
  } catch (error) {
    next(error);
  }
});

// ------------------------------------
// 2) LOCAL AUTH - SIGNUP
// ------------------------------------
router.post("/signup", async (req, res, next) => {
  try {
    const { token, user } = await AuthService.createUser(req.body);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({ message: "Signup successful", user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    res.status(400).json({ message });
  }
});

// ------------------------------------
// 4) LOGOUT
// ------------------------------------
router.get("/logout", (req, res, next) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
});

// ------------------------------------
// 5) GET CURRENT USER
// ------------------------------------
router.get(
  "/me",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await User.findById(req.user?.id).exec();

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      res.json({ user: AuthService.formatUserResponse(user) });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
