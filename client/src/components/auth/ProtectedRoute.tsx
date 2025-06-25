import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { UserRole, Permission } from "../../types/auth";
import { toast } from "react-toastify";
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

  // Role-based access check
  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    toast.error("Access denied: Invalid role");
    return <Navigate to="/pms/dashboard" replace />;
  }

  // Super Admin Access
  if (user.role === UserRole.SUPER_ADMIN) {
    // Check permissions for personal views
    if (
      path.includes("/my-bonus") &&
      !user.permissions?.includes(Permission.VIEW_OWN_BONUS)
    ) {
      toast.error("Access denied: Cannot view personal bonus");
      return <Navigate to="/pms/dashboard" replace />;
    }
    if (
      path.includes("/my-payslips") &&
      !user.permissions?.includes(Permission.VIEW_OWN_PAYSLIP)
    ) {
      toast.error("Access denied: Cannot view personal payslips");
      return <Navigate to="/pms/dashboard" replace />;
    }
    if (
      path.includes("/my-leave") &&
      !user.permissions?.includes(Permission.VIEW_OWN_LEAVE)
    ) {
      toast.error("Access denied: Cannot view personal leave");
      return <Navigate to="/pms/dashboard" replace />;
    }
    return <>{children || element}</>;
  }

  // Admin Routes
  if (user.role === UserRole.ADMIN) {
    // Employee Management Routes
    if (path.startsWith("/pms/employees")) {
      const employeePermissions = [
        Permission.VIEW_ALL_USERS,
        Permission.MANAGE_DEPARTMENT_USERS,
        Permission.MANAGE_ONBOARDING,
        Permission.VIEW_ONBOARDING,
        Permission.MANAGE_OFFBOARDING,
        Permission.VIEW_OFFBOARDING,
      ];
      if (!employeePermissions.some((p) => user.permissions?.includes(p))) {
        toast.error("Access denied: No employee management permissions");
        return <Navigate to="/pms/dashboard" replace />;
      }
    }

    // Leave Management Routes
    if (path.startsWith("/pms/employees/leave")) {
      // Check for team leave management access
      if (path.includes("/team-leave")) {
        // Only SUPER_ADMIN and ADMIN can access team leave management
        const allowedRoles = [UserRole.SUPER_ADMIN, UserRole.ADMIN];
        if (!allowedRoles.includes(user.role)) {
          toast.error(
            "Access denied: Only Super Admin and Admin can access team leave management"
          );
          return <Navigate to="/pms/dashboard" replace />;
        }

        const teamLeavePermissions = [
          Permission.VIEW_TEAM_LEAVE,
          Permission.APPROVE_LEAVE,
        ];
        if (!teamLeavePermissions.some((p) => user.permissions?.includes(p))) {
          toast.error("Access denied: No team leave management permissions");
          return <Navigate to="/pms/dashboard" replace />;
        }
      } else {
        // Personal leave management
        const userLeavePermissions = [
          Permission.REQUEST_LEAVE,
          Permission.VIEW_OWN_LEAVE,
          Permission.CANCEL_OWN_LEAVE,
        ];
        if (!userLeavePermissions.some((p) => user.permissions?.includes(p))) {
          toast.error("Access denied: No leave management access");
          return <Navigate to="/pms/dashboard" replace />;
        }
      }
    }

    // Payroll Management Routes
    if (path.startsWith("/pms/payroll")) {
      // Admin Management Routes
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

        // Change this check to handle bonuses specifically
        if (path.includes("/bonuses")) {
          const bonusPermissions = [
            Permission.MANAGE_DEPARTMENT_BONUSES,
            Permission.VIEW_DEPARTMENT_BONUSES,
            Permission.VIEW_BONUSES,
            Permission.MANAGE_BONUSES,
            Permission.CREATE_BONUSES,
            Permission.DELETE_BONUSES,
            Permission.EDIT_BONUSES,
          ];
          if (!bonusPermissions.some((p) => user.permissions?.includes(p))) {
            toast.error("Access denied: No bonus management permissions");
            return <Navigate to="/pms/dashboard" replace />;
          }
        } else if (
          !adminPayrollPermissions.some((p) => user.permissions?.includes(p))
        ) {
          toast.error("Access denied: No payroll management permissions");
          return <Navigate to="/pms/dashboard" replace />;
        }
      }

      // Personal Views
      if (path.includes("/my-allowances")) {
        if (!user.permissions?.includes(Permission.VIEW_OWN_ALLOWANCES)) {
          toast.error("Access denied: Cannot view personal allowances");
          return <Navigate to="/pms/dashboard" replace />;
        }
      }

      if (path.includes("/my-deductions")) {
        if (!user.permissions?.includes(Permission.VIEW_OWN_DEDUCTIONS)) {
          toast.error("Access denied: Cannot view personal deductions");
          return <Navigate to="/pms/dashboard" replace />;
        }
      }

      // My Bonus
      if (path.includes("/my-bonus")) {
        if (!user.permissions?.includes(Permission.VIEW_OWN_BONUS)) {
          toast.error("Access denied: Cannot view personal bonus");
          return <Navigate to="/pms/dashboard" replace />;
        }
      }

      // My Payslips
      if (path.includes("/my-payslips")) {
        if (!user.permissions?.includes(Permission.VIEW_OWN_PAYSLIP)) {
          toast.error("Access denied: Cannot view personal payslips");
          return <Navigate to="/pms/dashboard" replace />;
        }
      }
    }

    // Settings Routes
    if (path.startsWith("/pms/settings")) {
      // For Admin role, allow access to their permitted settings pages
      if (user.role === UserRole.ADMIN) {
        // Allow access to main settings page
        if (path === "/pms/settings" || path === "/pms/settings/") {
          return <>{children || element}</>;
        }
        // Block access to settings pages that are only for Super Admin
        if (path.includes("/company") || path.includes("/integrations")) {
          toast.error(
            "Access denied: This setting is only available for Super Admin"
          );
          return <Navigate to="/pms/dashboard" replace />;
        }
      } else if (user.role === UserRole.USER) {
        // Allow access to main settings page and notification settings if user has the permission
        if (
          path === "/pms/settings" ||
          path === "/pms/settings/" ||
          path.includes("/notifications")
        ) {
          if (
            !user.permissions?.includes(Permission.MANAGE_NOTIFICATION_SETTINGS)
          ) {
            toast.error("Access denied: No notification settings permissions");
            return <Navigate to="/pms/dashboard" replace />;
          }
          return <>{children || element}</>;
        }
        toast.error(
          "Access denied: Users can only access Notification Settings"
        );
        return <Navigate to="/pms/dashboard" replace />;
      }
    }

    // Reports Routes
    if (path.startsWith("/pms/reports")) {
      const reportPermissions = [
        Permission.VIEW_REPORTS,
        Permission.VIEW_PAYROLL_REPORTS,
      ];
      if (!reportPermissions.some((p) => user.permissions?.includes(p))) {
        toast.error("Access denied: No report viewing permissions");
        return <Navigate to="/pms/dashboard" replace />;
      }
    }
  }

  // User Routes
  if (user.role === UserRole.USER) {
    // Payroll Section
    if (path.startsWith("/pms/payroll")) {
      // Only allow access to personal views
      if (
        !path.includes("/my-payslips") &&
        !path.includes("/my-allowances") &&
        !path.includes("/my-deductions") &&
        !path.includes("/my-bonus")
      ) {
        toast.error("Access denied: Users can only access personal views");
        return <Navigate to="/pms/dashboard" replace />;
      }

      // Check specific permissions for each personal view
      if (path.includes("/my-payslips")) {
        if (!user.permissions?.includes(Permission.VIEW_OWN_PAYSLIP)) {
          toast.error("Access denied: Cannot view personal payslips");
          return <Navigate to="/pms/dashboard" replace />;
        }
      }

      if (path.includes("/my-allowances")) {
        if (!user.permissions?.includes(Permission.VIEW_OWN_ALLOWANCES)) {
          toast.error("Access denied: Cannot view personal allowances");
          return <Navigate to="/pms/dashboard" replace />;
        }
      }

      if (path.includes("/my-deductions")) {
        if (!user.permissions?.includes(Permission.VIEW_OWN_DEDUCTIONS)) {
          toast.error("Access denied: Cannot view personal deductions");
          return <Navigate to="/pms/dashboard" replace />;
        }
      }

      if (path.includes("/my-bonus")) {
        if (!user.permissions?.includes(Permission.VIEW_OWN_BONUS)) {
          toast.error("Access denied: Cannot view personal bonus");
          return <Navigate to="/pms/dashboard" replace />;
        }
      }
    }

    // Leave Management
    if (path.startsWith("/pms/employees/leave")) {
      // Check for team leave management access
      if (path.includes("/team-leave")) {
        // Only SUPER_ADMIN and ADMIN can access team leave management
        const allowedRoles = [UserRole.SUPER_ADMIN, UserRole.ADMIN];
        if (!allowedRoles.includes(user.role)) {
          toast.error(
            "Access denied: Only Super Admin and Admin can access team leave management"
          );
          return <Navigate to="/pms/dashboard" replace />;
        }

        const teamLeavePermissions = [
          Permission.VIEW_TEAM_LEAVE,
          Permission.APPROVE_LEAVE,
        ];
        if (!teamLeavePermissions.some((p) => user.permissions?.includes(p))) {
          toast.error("Access denied: No team leave management permissions");
          return <Navigate to="/pms/dashboard" replace />;
        }
      } else {
        // Personal leave management
        const userLeavePermissions = [
          Permission.REQUEST_LEAVE,
          Permission.VIEW_OWN_LEAVE,
          Permission.CANCEL_OWN_LEAVE,
        ];
        if (!userLeavePermissions.some((p) => user.permissions?.includes(p))) {
          toast.error("Access denied: No leave management access");
          return <Navigate to="/pms/dashboard" replace />;
        }
      }
    }

    // Profile
    if (path.startsWith("/pms/profile")) {
      if (
        !user.permissions?.includes(Permission.VIEW_PERSONAL_INFO) &&
        !user.permissions?.includes(Permission.EDIT_PERSONAL_INFO)
      ) {
        toast.error("Access denied: Cannot view profile");
        return <Navigate to="/pms/dashboard" replace />;
      }
    }

    // Settings - Users can only access Notification Settings if they have the permission
    if (path.startsWith("/pms/settings")) {
      // Allow access to main settings page and notification settings if user has the permission
      if (
        path === "/pms/settings" ||
        path === "/pms/settings/" ||
        path.includes("/notifications")
      ) {
        if (
          !user.permissions?.includes(Permission.MANAGE_NOTIFICATION_SETTINGS)
        ) {
          toast.error("Access denied: No notification settings permissions");
          return <Navigate to="/pms/dashboard" replace />;
        }
        return <>{children || element}</>;
      }

      // Block access to all other settings pages for regular users
      toast.error("Access denied: Users can only access Notification Settings");
      return <Navigate to="/pms/dashboard" replace />;
    }
  }

  // General permission-based access check
  if (permissions && permissions.length > 0) {
    const hasRequiredPermissions = requireAllPermissions
      ? permissions.every((permission) =>
          user.permissions?.includes(permission)
        )
      : permissions.some((permission) =>
          user.permissions?.includes(permission)
        );

    if (!hasRequiredPermissions) {
      toast.error("Access denied: Insufficient permissions");
      return <Navigate to="/pms/dashboard" replace />;
    }
  }

  // Process Payment - Only for SUPER_ADMIN
  if (path.includes("/process")) {
    // Use the auth context's isSuperAdmin method
    if (!isSuperAdmin()) {
      toast.error(
        "Access denied: Process Payroll is only available for Super Admins"
      );
      return <Navigate to="/pms/dashboard" replace />;
    }

    const processPaymentPermissions = [
      Permission.CREATE_PAYROLL,
      Permission.EDIT_PAYROLL,
      Permission.DELETE_PAYROLL,
      Permission.SUBMIT_PAYROLL,
      Permission.VIEW_ALL_PAYROLL,
      Permission.GENERATE_PAYSLIP,
    ];

    if (!processPaymentPermissions.some((p) => user.permissions?.includes(p))) {
      toast.error(
        "Access denied: Insufficient permissions for Process Payroll"
      );
      return <Navigate to="/pms/dashboard" replace />;
    }
  }

  if (path.includes("/department-process")) {
    const allowedRoles = [UserRole.ADMIN, UserRole.SUPER_ADMIN];
    if (!allowedRoles.includes(user.role)) {
      toast.error(
        "Access denied: Process Department Payroll is only available for Department Admins and Super Admins"
      );
      return <Navigate to="/pms/dashboard" replace />;
    }

    const departmentPayrollPermissions = [
      Permission.CREATE_PAYROLL,
      Permission.EDIT_PAYROLL,
      Permission.DELETE_PAYROLL,
      Permission.SUBMIT_PAYROLL,
      Permission.VIEW_DEPARTMENT_PAYROLL,
      Permission.GENERATE_PAYSLIP,
    ];

    if (
      !departmentPayrollPermissions.some((p) => user.permissions?.includes(p))
    ) {
      toast.error(
        "Access denied: Insufficient permissions for Process Department Payroll"
      );
      return <Navigate to="/pms/dashboard" replace />;
    }
  }

  return <>{children || element}</>;
};
