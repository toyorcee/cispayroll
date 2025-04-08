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
  const { user, loading, isSuperAdmin, isAdmin } = useAuth();
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
      const leavePermissions = [
        Permission.APPROVE_LEAVE,
        Permission.VIEW_TEAM_LEAVE,
        Permission.REQUEST_LEAVE,
        Permission.VIEW_OWN_LEAVE,
        Permission.CANCEL_OWN_LEAVE,
      ];
      if (!leavePermissions.some((p) => user.permissions?.includes(p))) {
        toast.error("Access denied: No leave management permissions");
        return <Navigate to="/pms/dashboard" replace />;
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
      // General Settings
      if (path.includes("/general")) {
        if (!user.permissions?.includes(Permission.MANAGE_SYSTEM_SETTINGS)) {
          toast.error("Access denied: No system settings permissions");
          return <Navigate to="/pms/dashboard" replace />;
        }
      }

      // Company Profile Settings
      if (path.includes("/company")) {
        if (!user.permissions?.includes(Permission.MANAGE_COMPANY_PROFILE)) {
          toast.error("Access denied: No company profile settings permissions");
          return <Navigate to="/pms/dashboard" replace />;
        }
      }

      // Department Settings
      if (path.includes("/departments")) {
        if (
          !user.permissions?.includes(Permission.MANAGE_DEPARTMENT_SETTINGS)
        ) {
          toast.error("Access denied: No department settings permissions");
          return <Navigate to="/pms/dashboard" replace />;
        }
      }

      // User Settings
      if (path.includes("/users")) {
        if (!user.permissions?.includes(Permission.MANAGE_USER_SETTINGS)) {
          toast.error("Access denied: No user settings permissions");
          return <Navigate to="/pms/dashboard" replace />;
        }
      }

      // Payroll Settings
      if (path.includes("/payroll")) {
        if (!user.permissions?.includes(Permission.MANAGE_PAYROLL_SETTINGS)) {
          toast.error("Access denied: No payroll settings permissions");
          return <Navigate to="/pms/dashboard" replace />;
        }
      }

      // Leave Settings
      if (path.includes("/leave")) {
        if (!user.permissions?.includes(Permission.MANAGE_LEAVE_SETTINGS)) {
          toast.error("Access denied: No leave settings permissions");
          return <Navigate to="/pms/dashboard" replace />;
        }
      }

      // Document Settings
      if (path.includes("/documents")) {
        if (!user.permissions?.includes(Permission.MANAGE_DOCUMENT_SETTINGS)) {
          toast.error("Access denied: No document settings permissions");
          return <Navigate to="/pms/dashboard" replace />;
        }
      }

      // Notification Settings
      if (path.includes("/notifications")) {
        if (
          !user.permissions?.includes(Permission.MANAGE_NOTIFICATION_SETTINGS)
        ) {
          toast.error("Access denied: No notification settings permissions");
          return <Navigate to="/pms/dashboard" replace />;
        }
      }

      // Integration Settings
      if (path.includes("/integrations")) {
        if (
          !user.permissions?.includes(Permission.MANAGE_INTEGRATION_SETTINGS)
        ) {
          toast.error("Access denied: No integration settings permissions");
          return <Navigate to="/pms/dashboard" replace />;
        }
      }

      // Tax Settings
      if (path.includes("/tax")) {
        if (!user.permissions?.includes(Permission.MANAGE_TAX_SETTINGS)) {
          toast.error("Access denied: No tax settings permissions");
          return <Navigate to="/pms/dashboard" replace />;
        }
      }

      // Compliance Settings
      if (path.includes("/compliance")) {
        if (
          !user.permissions?.includes(Permission.MANAGE_COMPLIANCE_SETTINGS)
        ) {
          toast.error("Access denied: No compliance settings permissions");
          return <Navigate to="/pms/dashboard" replace />;
        }
      }

      // System Settings
      if (path.includes("/system")) {
        if (!user.permissions?.includes(Permission.MANAGE_SYSTEM_SETTINGS)) {
          toast.error("Access denied: No system settings permissions");
          return <Navigate to="/pms/dashboard" replace />;
        }
      }
    }

    // Reports Routes
    if (path.startsWith("/pms/reports")) {
      const reportPermissions = [
        Permission.VIEW_REPORTS,
        Permission.VIEW_PAYROLL_REPORTS,
        Permission.VIEW_EMPLOYEE_REPORTS,
        Permission.VIEW_TAX_REPORTS,
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
        !path.includes("/my-deductions")
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
    }

    // Leave Management
    if (path.startsWith("/pms/employees/leave")) {
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

    // Profile
    if (path.startsWith("/pms/profile")) {
      if (!user.permissions?.includes(Permission.VIEW_PERSONAL_INFO)) {
        toast.error("Access denied: Cannot view profile");
        return <Navigate to="/pms/dashboard" replace />;
      }
    }

    // Settings - Users can only view their own settings
    if (path.startsWith("/pms/settings")) {
      toast.error("Access denied: Users cannot access settings");
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

  // Process Payroll - Only for SUPER_ADMIN
  if (path.includes("/process")) {
    // Use the auth context's isSuperAdmin method
    if (!isSuperAdmin()) {
      toast.error(
        "Access denied: Process Payroll is only available for Super Admins"
      );
      return <Navigate to="/pms/dashboard" replace />;
    }

    const processPayrollPermissions = [
      Permission.CREATE_PAYROLL,
      Permission.EDIT_PAYROLL,
      Permission.DELETE_PAYROLL,
      Permission.SUBMIT_PAYROLL,
      Permission.VIEW_ALL_PAYROLL,
      Permission.GENERATE_PAYSLIP,
    ];

    if (!processPayrollPermissions.some((p) => user.permissions?.includes(p))) {
      toast.error(
        "Access denied: Insufficient permissions for Process Payroll"
      );
      return <Navigate to="/pms/dashboard" replace />;
    }
  }

  // Process Department Payroll - Only for ADMIN
  if (path.includes("/department-process")) {
    // Strictly check if user is an ADMIN (not SUPER_ADMIN)
    if (user.role !== UserRole.ADMIN) {
      toast.error(
        "Access denied: Process Department Payroll is only available for Department Admins"
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
