import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { UserRole, Permission } from "../../types/auth";
import { toast } from "react-toastify";
import { useSkeleton } from "../../components/skeletons/SkeletonProvider";
import { useState, useEffect } from "react";

interface ProtectedRouteProps {
  children?: React.ReactNode;
  element?: React.ReactNode;
  roles?: UserRole[];
  permissions?: Permission[];
  requireAllPermissions?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  element,
  roles,
  permissions,
  requireAllPermissions = false,
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const { getSkeleton } = useSkeleton();

  if (loading) {
    return getSkeleton("content");
  }

  if (!user) {
    return <Navigate to="/auth/signin" state={{ from: location }} replace />;
  }

  // Check if user has required role
  if (roles && !roles.includes(user.role)) {
    toast.error(`Access denied: Insufficient role privileges`);
    return <Navigate to="/dashboard" replace />;
  }

  // Enhanced permission checking
  if (permissions && permissions.length > 0) {
    const hasRequiredPermissions = requireAllPermissions
      ? permissions.every((permission) =>
          user.permissions?.includes(permission)
        )
      : permissions.some((permission) =>
          user.permissions?.includes(permission)
        );

    if (!hasRequiredPermissions) {
      const missingPermissions = permissions.filter(
        (permission) => !user.permissions?.includes(permission)
      );
      console.log("User permissions:", user.permissions);
      console.log("Required permissions:", permissions);
      console.log("Missing permissions:", missingPermissions);

      toast.error(`Access denied: Insufficient permissions for this action`);
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Route-specific permission checks
  const path = location.pathname.toLowerCase();

  // Department Management Routes
  if (path.includes("departments")) {
    if (
      !user.permissions?.includes(Permission.VIEW_ALL_DEPARTMENTS) &&
      !user.permissions?.includes(Permission.MANAGE_DEPARTMENT_USERS)
    ) {
      toast.error("Access denied: No department management permissions");
      return <Navigate to="/dashboard" replace />;
    }

    if (
      (path.includes("new") || path.includes("edit")) &&
      !user.permissions?.includes(Permission.CREATE_DEPARTMENT) &&
      !user.permissions?.includes(Permission.EDIT_DEPARTMENT)
    ) {
      toast.error(
        "Access denied: Department modification restricted to Super Admin"
      );
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Onboarding Routes
  if (path.includes("onboarding")) {
    if (
      !user.permissions?.includes(Permission.VIEW_ONBOARDING) &&
      !user.permissions?.includes(Permission.MANAGE_ONBOARDING)
    ) {
      toast.error("Access denied: No onboarding permissions");
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Offboarding Routes
  if (path.includes("offboarding")) {
    if (
      !user.permissions?.includes(Permission.VIEW_OFFBOARDING) &&
      !user.permissions?.includes(Permission.MANAGE_OFFBOARDING) &&
      !user.permissions?.includes(Permission.APPROVE_OFFBOARDING)
    ) {
      toast.error("Access denied: No offboarding permissions");
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Payroll Routes
  if (path.includes("payroll")) {
    if (
      !user.permissions?.includes(Permission.VIEW_DEPARTMENT_PAYROLL) &&
      !user.permissions?.includes(Permission.VIEW_ALL_PAYROLL)
    ) {
      toast.error("Access denied: No payroll viewing permissions");
      return <Navigate to="/dashboard" replace />;
    }

    if (
      path.includes("process") &&
      !user.permissions?.includes(Permission.CREATE_PAYROLL)
    ) {
      toast.error("Access denied: No payroll processing permissions");
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Leave Management Routes
  if (path.includes("leave")) {
    if (
      !user.permissions?.includes(Permission.VIEW_TEAM_LEAVE) &&
      !user.permissions?.includes(Permission.VIEW_ALL_LEAVE)
    ) {
      toast.error("Access denied: No leave management permissions");
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Reports Routes
  if (path.includes("reports")) {
    if (!user.permissions?.includes(Permission.VIEW_REPORTS)) {
      toast.error("Access denied: No report viewing permissions");
      return <Navigate to="/dashboard" replace />;
    }
  }

  // System Management Routes
  if (path.includes("settings")) {
    if (
      !user.permissions?.includes(Permission.MANAGE_SYSTEM) &&
      !user.permissions?.includes(Permission.VIEW_SYSTEM_HEALTH)
    ) {
      toast.error("Access denied: No system management permissions");
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};
