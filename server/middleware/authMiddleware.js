// middleware/authMiddleware.ts
import jwt from "jsonwebtoken";
import UserModel from "../models/User.js";
import { UserRole, Permission, UserLifecycleState } from "../models/User.js";
import { PermissionChecker } from "../utils/permissionUtils.js";

// Update the requireAuth middleware to handle lifecycle states
export const requireAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );

    // Fetch full user to check lifecycle state
    const user = await UserModel.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Check user lifecycle state
    if (user.lifecycle?.currentState === UserLifecycleState.TERMINATED) {
      return res.status(403).json({
        message: "Account terminated. Please contact administrator.",
      });
    }

    if (user.lifecycle?.currentState === UserLifecycleState.OFFBOARDING) {
      // Allow only specific routes during offboarding
      const allowedOffboardingPaths = [
        "/api/password/update",
        "/api/users/profile",
        // Add other allowed paths during offboarding
      ];

      if (!allowedOffboardingPaths.includes(req.path)) {
        return res.status(403).json({
          message: "Limited access during offboarding process",
        });
      }
    }

    // Set user info in request
    req.user = {
      ...user.toObject(),
      id: user._id,
      _id: user._id,
    };

    // Add lifecycle state to response headers for client awareness
    res.set(
      "X-User-Lifecycle-State",
      user.lifecycle?.currentState || "UNKNOWN"
    );

    console.log("🔐 Auth middleware user:", {
      id: user._id,
      role: user.role,
      lifecycleState: user.lifecycle?.currentState,
    });

    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(401).json({
      message: "Invalid or expired token",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
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

// Add new middleware for password-related routes
export const requirePasswordChange = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user.id).select(
      "passwordLastChanged"
    );

    // Check if password change is required (e.g., password older than 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    if (!user.passwordLastChanged || user.passwordLastChanged < ninetyDaysAgo) {
      // Allow only password change route
      if (req.path !== "/api/password/update") {
        return res.status(403).json({
          message: "Password change required",
          requiresPasswordChange: true,
        });
      }
    }

    next();
  } catch (err) {
    next(err);
  }
};

// Add rate limiting for password attempts
export const passwordAttemptLimiter = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user.id).select(
      "passwordAttempts lastPasswordAttempt"
    );

    // Reset attempts if last attempt was more than 15 minutes ago
    if (
      user.lastPasswordAttempt &&
      Date.now() - user.lastPasswordAttempt.getTime() > 15 * 60 * 1000
    ) {
      user.passwordAttempts = 0;
    }

    if (user.passwordAttempts >= 5) {
      return res.status(429).json({
        message: "Too many password attempts. Please try again later.",
        nextAttemptAllowed: new Date(
          user.lastPasswordAttempt.getTime() + 15 * 60 * 1000
        ),
      });
    }

    // Store attempt info in request for later use
    req.passwordAttemptInfo = {
      user,
      incrementAttempt: async () => {
        user.passwordAttempts = (user.passwordAttempts || 0) + 1;
        user.lastPasswordAttempt = new Date();
        await user.save();
      },
    };

    next();
  } catch (err) {
    next(err);
  }
};
