import { Permission } from "../models/User.js";
import { JWTPayload } from "../middleware/authMiddleware.js";

export class PermissionChecker {
  static hasPermission(user: JWTPayload, permission: Permission): boolean {
    return user.permissions.includes(permission);
  }

  static hasAnyPermission(
    user: JWTPayload,
    permissions: Permission[]
  ): boolean {
    return permissions.some((permission) =>
      user.permissions.includes(permission)
    );
  }

  static hasAllPermissions(
    user: JWTPayload,
    permissions: Permission[]
  ): boolean {
    return permissions.every((permission) =>
      user.permissions.includes(permission)
    );
  }
}