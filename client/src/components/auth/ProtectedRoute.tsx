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
  const { user, loading } = useAuth();
  const location = useLocation();
  const { getSkeleton } = useSkeleton();

  if (loading) {
    return getSkeleton("content");
  }

  if (!user) {
    return <Navigate to="/auth/signin" state={{ from: location }} replace />;
  }

  // Role-based access check
  if (roles && !roles.includes(user.role)) {
    toast.error("Access denied: Insufficient role privileges");
    return <Navigate to="/dashboard" replace />;
  }

  // Path-specific permission checks
  const path = location.pathname.toLowerCase();

  // Payroll Routes with specific submenu checks
  if (path.startsWith("/dashboard/payroll")) {
    // Debug log
    console.log("Current user permissions:", user.permissions);

    const payrollPermissions = [
      Permission.VIEW_ALL_PAYROLL,
      Permission.VIEW_DEPARTMENT_PAYROLL,
      Permission.CREATE_PAYROLL,
      Permission.EDIT_PAYROLL,
      Permission.VIEW_SALARY_STRUCTURE,
      Permission.MANAGE_DEDUCTIONS,
      Permission.VIEW_DEDUCTIONS,
      Permission.EDIT_DEDUCTIONS,
      Permission.MANAGE_ALLOWANCES,
      Permission.VIEW_ALLOWANCES,
      Permission.MANAGE_BONUSES,
      Permission.VIEW_BONUSES,
    ];

    if (!payrollPermissions.some((perm) => user.permissions?.includes(perm))) {
      toast.error("Access denied: No payroll management permissions");
      return <Navigate to="/dashboard" replace />;
    }

    // Specific checks for each payroll section
    if (path.includes("/structure")) {
      if (!user.permissions?.includes(Permission.VIEW_SALARY_STRUCTURE)) {
        toast.error("Access denied: Cannot view salary structure");
        return <Navigate to="/dashboard" replace />;
      }
    }

    if (path.includes("/allowances")) {
      if (
        !user.permissions?.some((p) =>
          [Permission.VIEW_ALLOWANCES, Permission.MANAGE_ALLOWANCES].includes(p)
        )
      ) {
        toast.error("Access denied: Cannot access allowances");
        return <Navigate to="/dashboard" replace />;
      }
    }

    if (path.includes("/bonuses")) {
      if (
        !user.permissions?.some((p) =>
          [Permission.VIEW_BONUSES, Permission.MANAGE_BONUSES].includes(p)
        )
      ) {
        toast.error("Access denied: Cannot access bonuses");
        return <Navigate to="/dashboard" replace />;
      }
    }

    if (path.includes("/process")) {
      if (
        !user.permissions?.some((p) =>
          [Permission.CREATE_PAYROLL, Permission.EDIT_PAYROLL].includes(p)
        )
      ) {
        toast.error("Access denied: Cannot process payroll");
        return <Navigate to="/dashboard" replace />;
      }
    }

    if (path.includes("/deductions")) {
      // Debug log
      console.log("Checking deductions permissions:", {
        userPermissions: user.permissions,
        hasViewDeductions: user.permissions?.includes(
          Permission.VIEW_DEDUCTIONS
        ),
        hasManageDeductions: user.permissions?.includes(
          Permission.MANAGE_DEDUCTIONS
        ),
        userRole: user.role,
      });

      // Super admin should always have access
      if (user.role === UserRole.SUPER_ADMIN) {
        return <>{children || element}</>;
      }

      // For other roles, check specific permissions
      if (
        !user.permissions?.some((p) =>
          [
            Permission.MANAGE_DEDUCTIONS,
            Permission.VIEW_DEDUCTIONS,
            Permission.EDIT_DEDUCTIONS,
          ].includes(p)
        )
      ) {
        toast.error("Access denied: Cannot access deductions");
        return <Navigate to="/dashboard" replace />;
      }
    }
  }

  // Reports Routes
  if (path.startsWith("/dashboard/reports")) {
    const reportPermissions = [
      Permission.VIEW_REPORTS,
      Permission.VIEW_PAYROLL_REPORTS,
      Permission.VIEW_EMPLOYEE_REPORTS,
      Permission.VIEW_TAX_REPORTS,
    ];

    if (!reportPermissions.some((perm) => user.permissions?.includes(perm))) {
      toast.error("Access denied: No report viewing permissions");
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Settings Routes
  if (path.startsWith("/dashboard/settings")) {
    const settingsPermissions = [
      Permission.MANAGE_SYSTEM,
      Permission.MANAGE_COMPANY_PROFILE,
      Permission.MANAGE_TAX_CONFIG,
      Permission.MANAGE_COMPLIANCE,
      Permission.MANAGE_NOTIFICATIONS,
      Permission.MANAGE_INTEGRATIONS,
      Permission.CREATE_DEPARTMENT,
      Permission.EDIT_DEPARTMENT,
      Permission.VIEW_ALL_DEPARTMENTS,
    ];

    if (!settingsPermissions.some((perm) => user.permissions?.includes(perm))) {
      toast.error("Access denied: No settings management permissions");
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Employee Routes
  if (path.startsWith("/dashboard/employees")) {
    const employeePermissions = [
      Permission.CREATE_USER,
      Permission.EDIT_USER,
      Permission.DELETE_USER,
      Permission.VIEW_ALL_USERS,
      Permission.MANAGE_DEPARTMENT_USERS,
      Permission.MANAGE_ONBOARDING,
      Permission.VIEW_ONBOARDING,
      Permission.MANAGE_OFFBOARDING,
      Permission.VIEW_OFFBOARDING,
      Permission.APPROVE_OFFBOARDING,
      Permission.APPROVE_LEAVE,
      Permission.VIEW_TEAM_LEAVE,
      Permission.VIEW_ALL_LEAVE,
    ];

    if (!employeePermissions.some((perm) => user.permissions?.includes(perm))) {
      toast.error("Access denied: No employee management permissions");
      return <Navigate to="/dashboard" replace />;
    }
  }

  // User Routes (profile, documents, etc.)
  if (
    path.startsWith("/dashboard/profile") ||
    path.startsWith("/dashboard/my-payslips")
  ) {
    const userPermissions = [
      Permission.VIEW_PERSONAL_INFO,
      Permission.EDIT_PERSONAL_INFO,
      Permission.VIEW_OWN_PAYSLIP,
    ];

    if (!userPermissions.some((perm) => user.permissions?.includes(perm))) {
      toast.error("Access denied: Insufficient permissions for this section");
      return <Navigate to="/dashboard" replace />;
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
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children || element}</>;
};
