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

    // Specific check for salary structure
    if (path.includes("/structure")) {
      const salaryStructurePermissions = [
        Permission.MANAGE_SALARY_STRUCTURE,
        Permission.VIEW_SALARY_STRUCTURE,
        Permission.EDIT_SALARY_STRUCTURE,
      ];
      console.log("Required permissions:", salaryStructurePermissions);
      console.log(
        "Has permissions:",
        salaryStructurePermissions.some((perm) =>
          user.permissions?.includes(perm)
        )
      );

      if (
        !salaryStructurePermissions.some((perm) =>
          user.permissions?.includes(perm)
        )
      ) {
        toast.error("Access denied: No salary structure permissions");
        return <Navigate to="/dashboard" replace />;
      }
      return <>{children || element}</>;
    }

    // Specific check for process payroll
    if (path.includes("/process")) {
      const processPayrollPermissions = [
        Permission.CREATE_PAYROLL,
        Permission.EDIT_PAYROLL,
        Permission.DELETE_PAYROLL,
        Permission.APPROVE_PAYROLL,
        Permission.GENERATE_PAYSLIP,
      ];
      if (
        !processPayrollPermissions.some((perm) =>
          user.permissions?.includes(perm)
        )
      ) {
        toast.error("Access denied: No payroll processing permissions");
        return <Navigate to="/dashboard" replace />;
      }
      // If has permissions, continue to render
      return <>{children || element}</>;
    }

    // General payroll access check for other payroll routes
    const generalPayrollPermissions = [
      Permission.VIEW_ALL_PAYROLL,
      Permission.VIEW_DEPARTMENT_PAYROLL,
    ];
    if (
      !generalPayrollPermissions.some((perm) =>
        user.permissions?.includes(perm)
      )
    ) {
      toast.error("Access denied: No payroll access permissions");
      return <Navigate to="/dashboard" replace />;
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
