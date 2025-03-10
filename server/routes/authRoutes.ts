import {
  Router,
  RequestHandler,
  Request,
  Response,
  NextFunction,
} from "express";
import {
  requireAuth,
  AuthenticatedRequest,
} from "../middleware/authMiddleware.js";
import { AuthService } from "../services/authService.js";
import User, { UserDocument } from "../models/User.js";

const router = Router();

// ------------------------------------
// 1) LOCAL AUTH - LOGIN
// ------------------------------------
router.post("/login", (async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;
    const result = await AuthService.handleLogin({ email, password });

    res.cookie("token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({ user: result.user });
  } catch (error) {
    next(error);
  }
}) as RequestHandler);

// ------------------------------------
// 2) LOCAL AUTH - SIGNUP
// ------------------------------------
router.post("/signup", (async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
    next(error);
  }
}) as RequestHandler);

// ------------------------------------
// 3) LOGOUT
// ------------------------------------
router.get("/logout", (async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    res.clearCookie("token");
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
}) as RequestHandler);

// ------------------------------------
// 4) GET CURRENT USER
// ------------------------------------
router.get("/me", requireAuth, (async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = (await User.findById(req.user.id).exec()) as UserDocument;

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json({ user: AuthService.formatUserResponse(user) });
  } catch (error) {
    next(error);
  }
}) as RequestHandler);

export default router;
