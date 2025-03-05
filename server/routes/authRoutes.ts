import express, { Request, Response, NextFunction } from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import bcrypt from "bcrypt";

const router = express.Router();

// Utility to generate JWT
function generateToken(user: IUser): string {
  return jwt.sign(
    { id: user._id, isAdmin: user.isAdmin },
    process.env.JWT_SECRET!,
    {
      expiresIn: "1d",
    }
  );
}

// ------------------------------------
// 1) LOCAL AUTH - SIGNUP
// ------------------------------------
router.post(
  "/signup",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { firstName, lastName, username, password, email } = req.body;

      // Enhanced validation
      if (!firstName || !lastName || !username || !password || !email) {
        res.status(400).json({
          message:
            "First name, last name, username, email, and password are required.",
        });
        return;
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({ message: "Invalid email format." });
        return;
      }

      // Password strength validation
      if (password.length < 6) {
        res.status(400).json({
          message: "Password must be at least 6 characters long.",
        });
        return;
      }

      // Check if username or email already exists
      const existingUser = await User.findOne({
        $or: [{ username }, { email }],
      });
      if (existingUser) {
        res.status(409).json({ message: "Username or email already taken." });
        return;
      }

      // Create new user with all required fields
      const newUser = new User({
        firstName,
        lastName,
        username,
        password,
        email,
        isAdmin: false, // Default to non-admin
        isEmailVerified: false,
      });
      await newUser.save();

      // Generate token
      const token = generateToken(newUser);

      // Set cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      // Return minimal user data
      res.status(201).json({
        message: "Signup successful",
        user: {
          id: newUser._id,
          firstName: newUser.firstName, // Needed for UI personalization
          isAdmin: newUser.isAdmin, // Needed for access control
        },
      });
    } catch (err: any) {
      console.error("Signup error:", err);
      if (err.name === "ValidationError") {
        res.status(400).json({ message: err.message });
        return;
      }
      res.status(500).json({ message: "Server error" });
    }
  }
);

// ------------------------------------
// 2) LOCAL AUTH - LOGIN
// ------------------------------------
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({
      $or: [{ email }, { username: email }],
    }).select("+password");

    if (!user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password!);
    if (!isValidPassword) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Update last login without triggering validation
    await User.findByIdAndUpdate(user._id, {
      lastLogin: new Date(),
    });

    // Generate JWT token
    const token = generateToken(user);

    // Set HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    // Send success response with user data
    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
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
  (req: Request, res: Response) => {
    const user = req.user as IUser;
    const token = generateToken(user);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    // Redirect to client
    res.redirect(process.env.CLIENT_URL || "/");
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
router.get(
  "/me",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const authUser = req.user as { id: string; isAdmin: boolean };
      const userId = authUser.id;

      const user = await User.findById(userId).select("-password");
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      // Return only necessary user data
      res.json({
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          isAdmin: user.isAdmin,
          email: user.email,
          username: user.username,
        },
      });
    } catch (err: any) {
      console.error("Error fetching current user:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;
