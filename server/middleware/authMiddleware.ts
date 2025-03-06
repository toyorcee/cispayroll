// middleware/authMiddleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Update JWTPayload to match what we're actually storing
export interface JWTPayload {
  id: string;
  isAdmin: boolean;
}

// Update the request interface
export type AuthenticatedRequest = Request & {
  user: JWTPayload;
};

// Middleware to require a valid JWT token and attach user info
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      res.status(401).json({ message: "No token provided" });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    (req as AuthenticatedRequest).user = decoded;
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
  const user = (req as AuthenticatedRequest).user;
  if (!user?.isAdmin) {
    res.status(403).json({ message: "Access denied. Admins only." });
    return;
  }
  next();
};
