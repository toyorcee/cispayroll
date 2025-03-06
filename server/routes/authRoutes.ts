import { Router, Request, Response } from "express";
import passport from "passport";
import User, { IUser, UserDocument } from "../models/User.js";
import {
  requireAuth,
  AuthenticatedRequest,
} from "../middleware/authMiddleware.js";
import { AuthService } from "../services/authService.js";
import { Types } from "mongoose";

const router = Router();

// ------------------------------------
// 1) LOCAL AUTH - SIGNUP
// ------------------------------------
router.post("/signup", async (req: Request, res: Response) => {
  try {
    const { token, user } = await AuthService.handleSignup(req.body);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(201).json({ message: "Signup successful", user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    res.status(400).json({ message });
  }
});

// ------------------------------------
// 2) LOCAL AUTH - LOGIN
// ------------------------------------
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { token, user } = await AuthService.handleLogin(req.body);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({ message: "Login successful", user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    res.status(401).json({ message });
  }
});

// ------------------------------------
// 3) GOOGLE OAUTH - REDIRECT
// ------------------------------------
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// ------------------------------------
// 4) GOOGLE OAUTH - CALLBACK
// ------------------------------------
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/auth/failure",
    session: false,
  }),
  async (req: Request, res: Response) => {
    try {
      const user = req.user as IUser & { _id: Types.ObjectId };
      const token = AuthService.generateToken(user);

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.redirect(process.env.CLIENT_URL || "/");
    } catch (error) {
      res.redirect("/auth/failure");
    }
  }
);

// ------------------------------------
// 5) LOGOUT
// ------------------------------------
router.get("/logout", (req: Request, res: Response) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
});

// ------------------------------------
// 6) GET CURRENT USER
// ------------------------------------
router.get("/me", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = (req as AuthenticatedRequest).user;
    const user = await User.findById(id).exec();

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json({ user: AuthService.formatUserResponse(user) });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
