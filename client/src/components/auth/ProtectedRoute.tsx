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

  // Path-specific permission checks
  const path = location.pathname.toLowerCase();

  // Role-based access check
  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    toast.error("Access denied: Invalid role");
    return <Navigate to="/pms/dashboard" replace />;
  }

  // Super Admin Access
  if (user.role === UserRole.SUPER_ADMIN) {
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

    // Payroll Management Routes
    if (path.startsWith("/pms/payroll")) {
      const payrollPermissions = [
        Permission.VIEW_ALL_PAYROLL,
        Permission.VIEW_DEPARTMENT_PAYROLL,
        Permission.CREATE_PAYROLL,
        Permission.EDIT_PAYROLL,
        Permission.VIEW_SALARY_STRUCTURE,
        Permission.EDIT_SALARY_STRUCTURE,
        Permission.VIEW_ALLOWANCES,
        Permission.EDIT_ALLOWANCES,
        Permission.VIEW_DEDUCTIONS,
        Permission.EDIT_DEDUCTIONS,
      ];
      if (!payrollPermissions.some((p) => user.permissions?.includes(p))) {
        toast.error("Access denied: No payroll management permissions");
        return <Navigate to="/pms/dashboard" replace />;
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

    // // Disciplinary Routes
    // if (path.startsWith("/pms/disciplinary")) {
    //   const disciplinaryPermissions = [
    //     Permission.MANAGE_DISCIPLINARY_ACTIONS,
    //     Permission.VIEW_DISCIPLINARY_RECORDS,
    //   ];
    //   if (!disciplinaryPermissions.some((p) => user.permissions?.includes(p))) {
    //     toast.error("Access denied: No disciplinary management permissions");
    //     return <Navigate to="/pms/dashboard" replace />;
    //   }
    // }

    // Leave Management Routes
    // if (path.startsWith("/pms/leave")) {
    //   const leavePermissions = [
    //     Permission.APPROVE_LEAVE,
    //     Permission.VIEW_TEAM_LEAVE,
    //     Permission.REQUEST_LEAVE,
    //     Permission.VIEW_OWN_LEAVE,
    //     Permission.CANCEL_OWN_LEAVE,
    //   ];
    //   if (!leavePermissions.some((p) => user.permissions?.includes(p))) {
    //     toast.error("Access denied: No leave management permissions");
    //     return <Navigate to="/pms/dashboard" replace />;
    //   }
    // }
  }

  // User Routes
  if (user.role === UserRole.USER) {
    // Payroll Section
    if (path.startsWith("/pms/payroll")) {
      const userPayrollPermissions = [
        Permission.VIEW_OWN_PAYSLIP,
        Permission.VIEW_OWN_ALLOWANCES,
        Permission.REQUEST_ALLOWANCES,
        Permission.VIEW_OWN_DEDUCTIONS,
      ];
      if (!userPayrollPermissions.some((p) => user.permissions?.includes(p))) {
        toast.error("Access denied: No payroll access");
        return <Navigate to="/pms/dashboard" replace />;
      }
    }

    // // Leave Management
    // if (path.startsWith("/pms/leave")) {
    //   const leavePermissions = [
    //     Permission.REQUEST_LEAVE,
    //     Permission.VIEW_OWN_LEAVE,
    //     Permission.CANCEL_OWN_LEAVE,
    //   ];
    //   if (!leavePermissions.some((p) => user.permissions?.includes(p))) {
    //     toast.error("Access denied: No leave management access");
    //     return <Navigate to="/pms/dashboard" replace />;
    //   }
    // }

    // // Profile
    // if (path.startsWith("/pms/profile")) {
    //   if (!user.permissions?.includes(Permission.VIEW_PERSONAL_INFO)) {
    //     toast.error("Access denied: Cannot view profile");
    //     return <Navigate to="/pms/dashboard" replace />;
    //   }
    // }

    // Feedback
    // if (path.startsWith("/pms/feedback")) {
    //   if (!user.permissions?.includes(Permission.MANAGE_FEEDBACK)) {
    //     toast.error("Access denied: Cannot access feedback");
    //     return <Navigate to="/pms/dashboard" replace />;
    //   }
    // }
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

  return <>{children || element}</>;
};
