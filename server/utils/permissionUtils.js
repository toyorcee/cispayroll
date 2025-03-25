import { Permission } from "../models/User.js";

/**
 * Utility class for checking user permissions
 */
export class PermissionChecker {
  /**
   * Check if user has a specific permission
   * @param {Object} user - User object containing permissions array
   * @param {string} permission - Permission from Permission enum
   * @returns {boolean} True if user has the permission
   */
  static hasPermission(user, permission) {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission);
  }

  /**
   * Check if user has any of the specified permissions
   * @param {Object} user - User object containing permissions array
   * @param {string[]} permissions - Array of permissions from Permission enum
   * @returns {boolean} True if user has at least one of the permissions
   */
  static hasAnyPermission(user, permissions) {
    if (!user || !user.permissions) return false;
    return permissions.some((permission) =>
      user.permissions.includes(permission)
    );
  }

  /**
   * Check if user has all of the specified permissions
   * @param {Object} user - User object containing permissions array
   * @param {string[]} permissions - Array of permissions from Permission enum
   * @returns {boolean} True if user has all of the permissions
   */
  static hasAllPermissions(user, permissions) {
    if (!user || !user.permissions) return false;
    return permissions.every((permission) =>
      user.permissions.includes(permission)
    );
  }
}
