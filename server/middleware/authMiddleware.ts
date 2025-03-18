// middleware/authMiddleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import UserModel from "../models/User.js";
import { UserRole, Permission } from "../models/User.js";
import { PermissionChecker } from "../utils/permissionUtils.js";

// Update JWTPayload to match what we're storing in the token
export interface JWTPayload {
  _id: string;
  id: string;
  role: UserRole;
  department?: string;
  permissions: Permission[];
  iat: number;
  exp: number;
}

// Update the request interface to extend Express.Request
export interface AuthenticatedRequest extends Request {
  user: JWTPayload;
}

// Add a type guard function
export function isAuthenticatedRequest(
  req: Request
): req is AuthenticatedRequest {
  return "user" in req;
}

// New helper type for department-specific operations
export interface DepartmentRequest extends AuthenticatedRequest {
  departmentId?: string;
}

// Update the requireAuth middleware
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

    // Set both id and _id to be the same value
    (req as AuthenticatedRequest).user = {
      ...decoded,
      id: decoded.id,
      _id: decoded.id, // Use the same ID for both
    };

    console.log("🔐 Auth middleware user:", {
      id: decoded.id,
      _id: decoded.id, // Log both to verify
      role: decoded.role,
    });

    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Update requireRole to use permissions
export const requireRole = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;
    // Super Admin check remains the same
    if (user.role === UserRole.SUPER_ADMIN) {
      next();
      return;
    }
    if (!roles.includes(user.role)) {
      res.status(403).json({
        message: "Access denied. Insufficient role privileges.",
        required: roles,
        current: user.role,
      });
      return;
    }
    next();
  };
};

// Enhanced permission middleware with better error handling
export const requirePermission = (requiredPermissions: Permission[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;

    // Super Admin bypass remains
    if (user.role === UserRole.SUPER_ADMIN) {
      next();
      return;
    }

    if (!PermissionChecker.hasAllPermissions(user, requiredPermissions)) {
      const missingPermissions = requiredPermissions.filter(
        (permission) => !user.permissions.includes(permission)
      );

      res.status(403).json({
        message: "Access denied. Insufficient permissions.",
        required: requiredPermissions,
        missing: missingPermissions,
        current: user.permissions,
      });
      return;
    }
    next();
  };
};

// Simplify requireAdmin to focus on role check only since we have requirePermission
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = (req as AuthenticatedRequest).user;

  if (user.role === UserRole.SUPER_ADMIN) {
    next();
    return;
  }

  if (user.role !== UserRole.ADMIN) {
    res.status(403).json({
      message: "Access denied. Administrator privileges required.",
      current: user.role,
    });
    return;
  }

  next();
};

// requireSuperAdmin remains mostly the same but with enhanced error message
export const requireSuperAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = (req as AuthenticatedRequest).user;
  if (user.role !== UserRole.SUPER_ADMIN) {
    res.status(403).json({
      message: "Access denied. Super Admin privileges required.",
      current: user.role,
    });
    return;
  }
  next();
};

// New middleware for department-specific operations
export const requireDepartmentAccess = (
  allowedRoles: UserRole[] = [UserRole.ADMIN]
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;
    const departmentId = req.params.departmentId || req.body.departmentId;

    // Super Admin can access all departments
    if (user.role === UserRole.SUPER_ADMIN) {
      (req as DepartmentRequest).departmentId = departmentId;
      next();
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({
        message: "Access denied. Insufficient role for department access.",
        required: allowedRoles,
        current: user.role,
      });
      return;
    }

    // For admins, check if they belong to the department
    try {
      const userDoc = await UserModel.findById(user.id);
      if (!userDoc || userDoc.department !== departmentId) {
        res.status(403).json({
          message: "Access denied. You can only access your own department.",
          requestedDepartment: departmentId,
          userDepartment: userDoc?.department,
        });
        return;
      }

      (req as DepartmentRequest).departmentId = departmentId;
      next();
    } catch (error) {
      res.status(500).json({
        message: "Error verifying department access",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
};
