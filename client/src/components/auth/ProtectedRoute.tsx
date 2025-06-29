import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { UserRole, Permission } from "../../types/auth";
import { useSkeleton } from "../../components/skeletons/SkeletonProvider";

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
  const { user, loading, isSuperAdmin } = useAuth();
  const location = useLocation();
  const { getSkeleton } = useSkeleton();

  if (loading) {
    return getSkeleton("content");
  }

  if (!user) {
    return <Navigate to="/auth/signin" state={{ from: location }} replace />;
  }

  // Path-specific permission checks
  const path = location.pathname.toLowerCase();

  // Role-based access check - only redirect if roles are explicitly specified
  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/pms/dashboard" replace />;
  }

  // Super Admin Access - give them access to most things
  if (user.role === UserRole.SUPER_ADMIN) {
    // Only check specific permissions for personal views that Super Admin might not have
    if (
      path.includes("/my-bonus") &&
      !user.permissions?.includes(Permission.VIEW_OWN_BONUS)
    ) {
      return <Navigate to="/pms/dashboard" replace />;
    }
    if (
      path.includes("/my-payslips") &&
      !user.permissions?.includes(Permission.VIEW_OWN_PAYSLIP)
    ) {
      return <Navigate to="/pms/dashboard" replace />;
    }
    if (
      path.includes("/my-leave") &&
      !user.permissions?.includes(Permission.VIEW_OWN_LEAVE)
    ) {
      return <Navigate to="/pms/dashboard" replace />;
    }
    return <>{children || element}</>;
  }

  // Admin Routes - be more permissive and only check when actually accessing restricted areas
  if (user.role === UserRole.ADMIN) {
    // Employee Management Routes - only check if they're actually trying to access these
    if (path.startsWith("/pms/employees")) {
      // Allow access to personal leave management
      if (path.includes("/my-leave")) {
        const userLeavePermissions = [
          Permission.REQUEST_LEAVE,
          Permission.VIEW_OWN_LEAVE,
          Permission.CANCEL_OWN_LEAVE,
        ];
        if (!userLeavePermissions.some((p) => user.permissions?.includes(p))) {
          return <Navigate to="/pms/dashboard" replace />;
        }
        return <>{children || element}</>;
      }

      // Check for team leave management access
      if (path.includes("/team-leave")) {
        const teamLeavePermissions = [
          Permission.VIEW_TEAM_LEAVE,
          Permission.APPROVE_LEAVE,
        ];
        if (!teamLeavePermissions.some((p) => user.permissions?.includes(p))) {
          return <Navigate to="/pms/dashboard" replace />;
        }
      } else {
        // For other employee routes, check if they have any employee management permissions
        const employeePermissions = [
          Permission.VIEW_ALL_USERS,
          Permission.MANAGE_DEPARTMENT_USERS,
          Permission.MANAGE_ONBOARDING,
          Permission.VIEW_ONBOARDING,
          Permission.MANAGE_OFFBOARDING,
          Permission.VIEW_OFFBOARDING,
        ];
        if (!employeePermissions.some((p) => user.permissions?.includes(p))) {
          return <Navigate to="/pms/dashboard" replace />;
        }
      }
    }

    // Payroll Management Routes - be more permissive
    if (path.startsWith("/pms/payroll")) {
      // Allow access to personal views without strict permission checks
      if (
        path.includes("/my-allowances") ||
        path.includes("/my-deductions") ||
        path.includes("/my-bonus") ||
        path.includes("/my-payslips")
      ) {
        return <>{children || element}</>;
      }

      // Admin Management Routes - only check if they're actually accessing these
      if (
        path.includes("/structure") ||
        path.includes("/deductions") ||
        path.includes("/allowances") ||
        path.includes("/bonuses") ||
        path.includes("/process")
      ) {
        const adminPayrollPermissions = [
          Permission.VIEW_ALL_PAYROLL,
          Permission.VIEW_DEPARTMENT_PAYROLL,
          Permission.CREATE_PAYROLL,
          Permission.EDIT_PAYROLL,
          Permission.DELETE_PAYROLL,
          Permission.SUBMIT_PAYROLL,
          Permission.VIEW_SALARY_STRUCTURE,
          Permission.EDIT_SALARY_STRUCTURE,
          Permission.VIEW_DEDUCTIONS,
          Permission.EDIT_DEDUCTIONS,
          Permission.MANAGE_DEPARTMENT_DEDUCTIONS,
          Permission.VIEW_DEPARTMENT_DEDUCTIONS,
          Permission.MANAGE_DEPARTMENT_ALLOWANCES,
          Permission.VIEW_DEPARTMENT_ALLOWANCES,
          Permission.MANAGE_DEPARTMENT_BONUSES,
          Permission.VIEW_DEPARTMENT_BONUSES,
          Permission.GENERATE_PAYSLIP,
        ];

        if (
          !adminPayrollPermissions.some((p) => user.permissions?.includes(p))
        ) {
          return <Navigate to="/pms/dashboard" replace />;
        }
      }

      // Processing Summary
      if (path.includes("/processing-summary")) {
        if (!user.permissions?.includes(Permission.VIEW_PAYROLL_STATS)) {
          return <Navigate to="/pms/dashboard" replace />;
        }
      }
    }

    // Settings Routes - check permissions instead of hardcoded role restrictions
    if (path.startsWith("/pms/settings")) {
      if (
        path === "/pms/settings" ||
        path === "/pms/settings/" ||
        path === "/pms/settings/general"
      ) {
        return <>{children || element}</>;
      }

      // Check specific permissions for different settings pages
      if (path.includes("/company")) {
        if (!user.permissions?.includes(Permission.MANAGE_SYSTEM_SETTINGS)) {
          return <Navigate to="/pms/dashboard" replace />;
        }
      }

      if (path.includes("/integrations")) {
        if (
          !user.permissions?.includes(Permission.MANAGE_INTEGRATION_SETTINGS)
        ) {
          return <Navigate to="/pms/dashboard" replace />;
        }
      }
    }

    // Reports Routes
    if (path.startsWith("/pms/reports")) {
      const reportPermissions = [
        Permission.VIEW_REPORTS,
        Permission.VIEW_PAYROLL_REPORTS,
      ];
      if (!reportPermissions.some((p) => user.permissions?.includes(p))) {
        return <Navigate to="/pms/dashboard" replace />;
      }
    }
  }

  // User Routes - be more permissive
  if (user.role === UserRole.USER) {
    // Payroll Section - allow access to personal views
    if (path.startsWith("/pms/payroll")) {
      // Only allow access to personal views
      if (
        !path.includes("/my-payslips") &&
        !path.includes("/my-allowances") &&
        !path.includes("/my-deductions") &&
        !path.includes("/my-bonus")
      ) {
        return <Navigate to="/pms/dashboard" replace />;
      }
      // For personal views, be more permissive
      return <>{children || element}</>;
    }

    // Leave Management - allow access to personal leave
    if (path.startsWith("/pms/employees/leave")) {
      // Check for team leave management access
      if (path.includes("/team-leave")) {
        // Only SUPER_ADMIN and ADMIN can access team leave management
        return <Navigate to="/pms/dashboard" replace />;
      } else {
        // Personal leave management - be more permissive
        return <>{children || element}</>;
      }
    }

    // Profile - be more permissive
    if (path.startsWith("/pms/profile")) {
      return <>{children || element}</>;
    }

    // Settings - Users can access notification settings
    if (path.startsWith("/pms/settings")) {
      // Allow access to main settings page and notification settings
      if (
        path === "/pms/settings" ||
        path === "/pms/settings/" ||
        path.includes("/notifications")
      ) {
        return <>{children || element}</>;
      }
      // Block access to all other settings pages for regular users
      return <Navigate to="/pms/dashboard" replace />;
    }
  }

  // General permission-based access check - only if permissions are explicitly specified
  if (permissions && permissions.length > 0) {
    const hasRequiredPermissions = requireAllPermissions
      ? permissions.every((permission) =>
          user.permissions?.includes(permission)
        )
      : permissions.some((permission) =>
          user.permissions?.includes(permission)
        );

    if (!hasRequiredPermissions) {
      return <Navigate to="/pms/dashboard" replace />;
    }
  }

  // Process Payment - Only for SUPER_ADMIN
  if (path.includes("/process")) {
    if (!isSuperAdmin()) {
      return <Navigate to="/pms/dashboard" replace />;
    }
  }

  if (path.includes("/department-process")) {
    const allowedRoles = [UserRole.ADMIN, UserRole.SUPER_ADMIN];
    if (!allowedRoles.includes(user.role)) {
      return <Navigate to="/pms/dashboard" replace />;
    }
  }

  return <>{children || element}</>;
};
