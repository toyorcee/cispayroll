// middleware/authMiddleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Our custom request type with a user property
export interface AuthRequest extends Request {
  user?: { id: string; role: string };
}

// Middleware to require a valid JWT token and attach user info
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      res.status(401).json({ message: "No token provided" });
      return;
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      role: string;
    };
    // Now req.user (of type Express.User) is correctly set.
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Middleware to ensure the user is an admin
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authReq = req as AuthRequest;
  if (!authReq.user || authReq.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
  next();
};