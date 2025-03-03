// routes/authRoutes.ts
import express, { Request, Response, NextFunction } from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// Utility to generate JWT
function generateToken(user: IUser): string {
  // Include user._id and role in token payload
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET!, {
    expiresIn: "1d",
  });
}

// ------------------------------------
// 1) LOCAL AUTH - SIGNUP
// ------------------------------------
router.post(
  "/signup",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { username, password, email } = req.body;

      // Basic validation
      if (!username || !password) {
        res
          .status(400)
          .json({ message: "Username and password are required." });
        return;
      }

      // Check if user already exists
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        res.status(409).json({ message: "Username already taken." });
        return;
      }

      // Create new user
      const newUser = new User({
        username,
        password, // Will be hashed by pre-save hook
        email,
      });
      await newUser.save();

      // Generate token
      const token = generateToken(newUser);

      // Set cookie (smart about sameSite for development vs. production)
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      });

      res.status(201).json({ message: "Signup successful" });
    } catch (err: any) {
      console.error("Signup error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// ------------------------------------
// 2) LOCAL AUTH - LOGIN
// ------------------------------------
router.post("/login", (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate(
    "local",
    { session: false },
    (err: any, user: IUser | false, _info: any) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate token
      const token = generateToken(user);

      // Set cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      });

      return res.json({ message: "Login successful" });
    }
  )(req, res, next);
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

router.get("/failure", (_req: Request, res: Response) => {
  res.status(401).send("Failed to authenticate with Google");
});

// ------------------------------------
// 5) LOGOUT
// ------------------------------------
router.get("/logout", (req: Request, res: Response) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
});

// ------------------------------------
// 6) GET CURRENT USER
router.get("/me", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    // Explicitly cast req.user to our minimal object type
    const authUser = req.user as { id: string; role: string };
    const userId = authUser.id;
    if (!userId) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const user = await User.findById(userId).select("-password"); 
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json({ user });
  } catch (err: any) {
    console.error("Error fetching current user:", err);
    res.status(500).json({ message: "Server error" });
  }
});


export default router;
