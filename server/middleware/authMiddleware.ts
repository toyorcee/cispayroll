// middleware/authMiddleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserRole, Permission } from "../models/User.js";

// Update JWTPayload to match what we're storing in the token
export interface JWTPayload {
  id: string;
  role: UserRole;
  permissions: Permission[];
  iat: number;
  exp: number;
}

// Update the request interface
export interface AuthenticatedRequest extends Request {
  user: JWTPayload;
}

// Base middleware to require authentication
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

// Middleware to check for specific roles
export const requireRole = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;
    if (user.role === UserRole.SUPER_ADMIN) {
      next();
      return;
    }
    if (!roles.includes(user.role)) {
      res.status(403).json({
        message: "Access denied. Insufficient role privileges.",
      });
      return;
    }
    next();
  };
};

// Middleware to check for specific permissions
export const requirePermission = (permissions: Permission[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;
    if (user.role === UserRole.SUPER_ADMIN) {
      next();
      return;
    }
    const hasAllPermissions = permissions.every((permission) =>
      user.permissions.includes(permission)
    );
    if (!hasAllPermissions) {
      res.status(403).json({
        message: "Access denied. Insufficient permissions.",
      });
      return;
    }
    next();
  };
};

// Convenience middleware for admin-only routes
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = (req as AuthenticatedRequest).user;
  if (![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role)) {
    res.status(403).json({
      message: "Access denied. Administrators only.",
    });
    return;
  }
  next();
};

// Convenience middleware for super-admin-only routes
export const requireSuperAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = (req as AuthenticatedRequest).user;
  if (user.role !== UserRole.SUPER_ADMIN) {
    return res.status(403).json({
      message: "Access denied. Super Admin privileges required.",
    });
  }
  next();
};
