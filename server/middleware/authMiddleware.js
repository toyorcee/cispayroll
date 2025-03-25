// middleware/authMiddleware.ts
import jwt from "jsonwebtoken";
import UserModel from "../models/User.js";
import { UserRole, Permission } from "../models/User.js";
import { PermissionChecker } from "../utils/permissionUtils.js";

// Update the requireAuth middleware
export const requireAuth = (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      res.status(401).json({ message: "No token provided" });
      return;
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );

    // Set both id and _id to be the same value
    req.user = {
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
export const requireRole = (roles) => {
  return (req, res, next) => {
    const user = req.user;
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
export const requirePermission = (requiredPermissions) => {
  return (req, res, next) => {
    const user = req.user;

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
export const requireAdmin = (req, res, next) => {
  const user = req.user;

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
export const requireSuperAdmin = (req, res, next) => {
  const user = req.user;
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
export const requireDepartmentAccess = (allowedRoles = [UserRole.ADMIN]) => {
  return async (req, res, next) => {
    const user = req.user;
    const departmentId = req.params.departmentId || req.body.departmentId;

    // Super Admin can access all departments
    if (user.role === UserRole.SUPER_ADMIN) {
      req.departmentId = departmentId;
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

      req.departmentId = departmentId;
      next();
    } catch (error) {
      res.status(500).json({
        message: "Error verifying department access",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
};
