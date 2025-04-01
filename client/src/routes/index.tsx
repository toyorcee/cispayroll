import { Suspense, lazy } from "react";
import { createBrowserRouter, Outlet } from "react-router-dom";
// import AppLayout from "../components/shared/AppLayout";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
// import Home from "../pages/Home";
import DashboardLayout from "../components/shared/DashboardLayout";
import { NavigationProvider } from "../context/NavigationContext";
import AllEmployees from "../pages/pms/employees/AllEmployees";
import Onboarding from "../pages/pms/employees/Onboarding";
import LeaveManagement from "../pages/pms/employees/LeaveManagement";
import ProcessPayroll from "../pages/pms/payroll/ProcessPayroll";
import SalaryStructure from "../pages/pms/payroll/SalaryStructure";
import Deductions from "../pages/pms/payroll/Deductions";
import PayrollReports from "../pages/pms/reports/PayrollReports";
import EmployeeReports from "../pages/pms/reports/EmployeeReports";
import TaxReports from "../pages/pms/reports/TaxReports";
import AuditLogs from "../pages/pms/reports/AuditLogs";
import GeneralSettings from "../pages/pms/settings/General";
import CompanyProfile from "../pages/pms/settings/CompanyProfile";
import TaxConfiguration from "../pages/pms/settings/TaxConfiguration";
import Compliance from "../pages/pms/settings/Compliance";
import UserManagement from "../pages/pms/settings/UserManagement";
import Notifications from "../pages/pms/settings/Notifications";
import Integrations from "../pages/pms/settings/Integrations";
import { UserRole, Permission } from "../types/auth";
import DepartmentManagement from "../pages/pms/settings/DepartmentManagement";
import Offboarding from "../pages/pms/employees/Offboarding";
import { GlobalErrorBoundary } from "../components/error/GlobalErrorBoundary";
import { SkeletonProvider } from "../components/skeletons/SkeletonProvider";
import { useSkeleton } from "../components/skeletons/SkeletonProvider";
import Dashboard from "../pages/pms/dashboard/Dashboard";
import AllowanceManagement from "../pages/pms/payroll/AllowanceManagement";
import BonusManagement from "../pages/pms/payroll/BonusManagement";
import Landing from "../pages/Landing";
import Disciplinary from "../pages/pms/disciplinary/Disciplinary";
import ComingSoonPage from "../pages/Coming/ComingSoonPage";
import FeedbackManagemnet from "../pages/feedback/FeedbackManagement";
import MyPayslipsPage from "../pages/pms/payroll/MyPayslips";
import UserProfile from "../pages/pms/profile/UserProfile";
import { RouteErrorFallback } from "../components/error/RouteErrorFallback";
import { ErrorBoundary } from "react-error-boundary";
import { ErrorFallback } from "../components/error/ErrorFallback";

export interface RouteConfig {
  path: string;
  label: string;
  icon?: React.ComponentType;
  roles: UserRole[];
  permissions?: Permission[];
  requireAllPermissions?: boolean;
  element: React.ReactNode;
  children?: RouteConfig[];
}

// Lazy loading declarations
const SignIn = lazy(() => import("../pages/auth/SignIn"));
const SignUp = lazy(() => import("../pages/auth/SignUp"));
const CompleteRegistration = lazy(
  () => import("../pages/auth/CompleteRegistration")
);

// LazyRoute component
function LazyRoute({
  component: Component,
  element,
  skeletonType = "content",
}: {
  component?: React.LazyExoticComponent<React.ComponentType<unknown>>;
  element?: React.ReactNode;
  skeletonType: "content" | "auth";
}) {
  const { getSkeleton } = useSkeleton();

  return (
    <Suspense fallback={getSkeleton(skeletonType)}>
      <GlobalErrorBoundary>
        {Component ? (
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Component />
          </ErrorBoundary>
        ) : (
          element
        )}
      </GlobalErrorBoundary>
    </Suspense>
  );
}

// Main Routes Configuration
export const routes: RouteConfig[] = [
  {
    path: "dashboard",
    label: "Dashboard",
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER],
    permissions: [Permission.VIEW_DASHBOARD],
    requireAllPermissions: true,
    element: <Dashboard />,
  },
  {
    path: "employees",
    label: "Employees",
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    permissions: [
      Permission.VIEW_ALL_USERS,
      Permission.MANAGE_DEPARTMENT_USERS,
      Permission.MANAGE_ONBOARDING,
      Permission.MANAGE_OFFBOARDING,
    ],
    requireAllPermissions: false,
    element: <Outlet />,
    children: [
      {
        path: "list",
        label: "All Employees",
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        permissions: [Permission.VIEW_ALL_USERS],
        requireAllPermissions: true,
        element: <AllEmployees />,
      },
      {
        path: "onboarding",
        label: "Onboarding",
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        permissions: [Permission.MANAGE_ONBOARDING],
        requireAllPermissions: true,
        element: <Onboarding />,
      },
      {
        path: "offboarding",
        label: "Offboarding",
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        permissions: [Permission.MANAGE_OFFBOARDING],
        requireAllPermissions: true,
        element: <Offboarding />,
      },
      {
        path: "leave",
        label: "Leave Management",
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        permissions: [Permission.APPROVE_LEAVE, Permission.VIEW_TEAM_LEAVE],
        requireAllPermissions: true,
        element: <LeaveManagement />,
      },
    ],
  },
  {
    path: "payroll",
    label: "Payroll",
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER],
    permissions: [
      Permission.VIEW_ALL_PAYROLL,
      Permission.VIEW_DEPARTMENT_PAYROLL,
      Permission.VIEW_OWN_PAYSLIP,
      Permission.VIEW_ALLOWANCES,
      Permission.EDIT_ALLOWANCES,
      Permission.VIEW_DEDUCTIONS,
      Permission.VIEW_OWN_ALLOWANCES,
      Permission.REQUEST_ALLOWANCES,
      Permission.VIEW_OWN_DEDUCTIONS,
    ],
    requireAllPermissions: false,
    element: <Outlet />,
    children: [
      {
        path: "structure",
        label: "Salary Structure",
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        permissions: [
          Permission.VIEW_SALARY_STRUCTURE,
          Permission.EDIT_SALARY_STRUCTURE,
        ],
        requireAllPermissions: true,
        element: <SalaryStructure />,
      },
      {
        path: "deductions",
        label: "Statutory Deductions",
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        permissions: [Permission.VIEW_DEDUCTIONS, Permission.EDIT_DEDUCTIONS],
        requireAllPermissions: true,
        element: <Deductions />,
      },
      {
        path: "allowances",
        label: "Allowances",
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        permissions: [Permission.VIEW_ALLOWANCES, Permission.EDIT_ALLOWANCES],
        requireAllPermissions: true,
        element: <AllowanceManagement />,
      },
      {
        path: "bonuses",
        label: "Bonuses",
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        permissions: [Permission.VIEW_BONUSES, Permission.MANAGE_BONUSES],
        requireAllPermissions: true,
        element: <BonusManagement />,
      },
      {
        path: "process",
        label: "Process Payroll",
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        permissions: [Permission.CREATE_PAYROLL, Permission.EDIT_PAYROLL],
        requireAllPermissions: true,
        element: <ProcessPayroll />,
      },
      {
        path: "my-payslips",
        label: "My Payslips",
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER],
        permissions: [Permission.VIEW_OWN_PAYSLIP],
        requireAllPermissions: true,
        element: <MyPayslipsPage />,
      },
      // {
      //   path: "my-allowances",
      //   label: "My Allowances",
      //   roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER],
      //   permissions: [
      //     Permission.VIEW_OWN_ALLOWANCES,
      //     Permission.REQUEST_ALLOWANCES,
      //   ],
      //   requireAllPermissions: true,
      //   element: <AllowanceManagement />,
      // },
      // {
      //   path: "my-deductions",
      //   label: "My Deductions",
      //   roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER],
      //   permissions: [Permission.VIEW_OWN_DEDUCTIONS],
      //   requireAllPermissions: true,
      //   element: <Deductions />,
      // },
    ],
  },
  {
    path: "reports",
    label: "Reports",
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    permissions: [
      Permission.VIEW_REPORTS,
      Permission.VIEW_PAYROLL_REPORTS,
      Permission.VIEW_EMPLOYEE_REPORTS,
      Permission.VIEW_TAX_REPORTS,
    ],
    requireAllPermissions: false,
    element: <Outlet />,
    children: [
      {
        path: "payroll",
        label: "Payroll Reports",
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        permissions: [Permission.VIEW_PAYROLL_REPORTS],
        requireAllPermissions: false,
        element: <PayrollReports />,
      },
      {
        path: "employees",
        label: "Employee Reports",
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        permissions: [Permission.VIEW_EMPLOYEE_REPORTS],
        requireAllPermissions: false,
        element: <EmployeeReports />,
      },
      {
        path: "tax",
        label: "Tax Reports",
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        permissions: [Permission.VIEW_TAX_REPORTS],
        requireAllPermissions: false,
        element: <TaxReports />,
      },
      {
        path: "audit",
        label: "Audit Logs",
        roles: [UserRole.SUPER_ADMIN],
        permissions: [Permission.VIEW_AUDIT_LOGS],
        requireAllPermissions: true,
        element: <AuditLogs />,
      },
    ],
  },
  {
    path: "settings",
    label: "Settings",
    roles: [UserRole.SUPER_ADMIN],
    permissions: [
      Permission.MANAGE_SYSTEM,
      Permission.MANAGE_COMPANY_PROFILE,
      Permission.MANAGE_TAX_CONFIG,
      Permission.MANAGE_COMPLIANCE,
      Permission.MANAGE_NOTIFICATIONS,
      Permission.MANAGE_INTEGRATIONS,
    ],
    requireAllPermissions: true,
    element: <GeneralSettings />,
    children: [
      {
        path: "company",
        label: "Company Profile",
        roles: [UserRole.SUPER_ADMIN],
        permissions: [Permission.MANAGE_COMPANY_PROFILE],
        requireAllPermissions: true,
        element: <CompanyProfile />,
      },
      {
        path: "departments",
        label: "Department Management",
        roles: [UserRole.SUPER_ADMIN],
        permissions: [
          Permission.CREATE_DEPARTMENT,
          Permission.EDIT_DEPARTMENT,
          Permission.DELETE_DEPARTMENT,
          Permission.VIEW_ALL_DEPARTMENTS,
        ],
        requireAllPermissions: true,
        element: <DepartmentManagement />,
      },
      {
        path: "tax",
        label: "Tax Configuration",
        roles: [UserRole.SUPER_ADMIN],
        permissions: [Permission.MANAGE_TAX_CONFIG],
        requireAllPermissions: true,
        element: <TaxConfiguration />,
      },
      {
        path: "compliance",
        label: "Compliance",
        roles: [UserRole.SUPER_ADMIN],
        permissions: [Permission.MANAGE_COMPLIANCE],
        requireAllPermissions: true,
        element: <Compliance />,
      },
      {
        path: "users",
        label: "User Management",
        roles: [UserRole.SUPER_ADMIN],
        permissions: [Permission.CREATE_USER, Permission.EDIT_USER],
        requireAllPermissions: true,
        element: <UserManagement />,
      },
      {
        path: "notifications",
        label: "Notifications",
        roles: [UserRole.SUPER_ADMIN],
        permissions: [Permission.MANAGE_NOTIFICATIONS],
        requireAllPermissions: true,
        element: <Notifications />,
      },
      {
        path: "integrations",
        label: "Integrations",
        roles: [UserRole.SUPER_ADMIN],
        permissions: [Permission.MANAGE_INTEGRATIONS],
        requireAllPermissions: true,
        element: <Integrations />,
      },
    ],
  },
  // {
  //   path: "disciplinary",
  //   label: "Disciplinary",
  //   roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  //   permissions: [
  //     Permission.MANAGE_DISCIPLINARY_ACTIONS,
  //     Permission.VIEW_DISCIPLINARY_RECORDS,
  //   ],
  //   requireAllPermissions: false,
  //   element: <Disciplinary />,
  // },
  {
    path: "leave",
    label: "Leave",
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER],
    permissions: [
      Permission.REQUEST_LEAVE,
      Permission.VIEW_OWN_LEAVE,
      Permission.CANCEL_OWN_LEAVE,
      Permission.APPROVE_LEAVE,
      Permission.VIEW_TEAM_LEAVE,
    ],
    requireAllPermissions: false,
    element: <LeaveManagement />,
  },
  {
    path: "profile",
    label: "My Profile",
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER],
    permissions: [Permission.VIEW_PERSONAL_INFO],
    requireAllPermissions: true,
    element: <UserProfile />,
  },
  {
    path: "feedback",
    label: "Feedback",
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER],
    permissions: [Permission.MANAGE_FEEDBACK],
    requireAllPermissions: true,
    element: <FeedbackManagemnet />,
  },
];

// Router configuration
export const router = createBrowserRouter([
  {
    element: (
      <SkeletonProvider>
        <NavigationProvider>
          <GlobalErrorBoundary>
            <Outlet />
          </GlobalErrorBoundary>
        </NavigationProvider>
      </SkeletonProvider>
    ),
    errorElement: <RouteErrorFallback />,
    children: [
      {
        path: "/auth",
        children: [
          {
            path: "signin",
            element: <LazyRoute component={SignIn} skeletonType="auth" />,
          },
          {
            path: "signup",
            element: <LazyRoute component={SignUp} skeletonType="auth" />,
          },
          {
            path: "complete-registration/:token",
            element: (
              <LazyRoute component={CompleteRegistration} skeletonType="auth" />
            ),
          },
        ],
      },
      {
        path: "/pms",
        element: (
          <ProtectedRoute
            roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER]}
            permissions={[Permission.VIEW_DASHBOARD]}
            requireAllPermissions={true}
          >
            <DashboardLayout />
          </ProtectedRoute>
        ),
        children: routes.map((route) => ({
          path: route.path,
          element: (
            <ProtectedRoute
              roles={route.roles}
              permissions={route.permissions}
              requireAllPermissions={route.requireAllPermissions}
            >
              <LazyRoute element={route.element} skeletonType="content" />
            </ProtectedRoute>
          ),
          children: route.children?.map((childRoute) => ({
            path: childRoute.path,
            element: (
              <ProtectedRoute
                roles={childRoute.roles}
                permissions={childRoute.permissions}
                requireAllPermissions={childRoute.requireAllPermissions}
              >
                <LazyRoute
                  element={childRoute.element}
                  skeletonType="content"
                />
              </ProtectedRoute>
            ),
          })),
        })),
      },
      {
        path: "/",
        element: <LazyRoute component={SignIn} skeletonType="auth" />,
      },
      {
        path: "/home",
        element: <Landing />,
      },
      {
        path: "/coming-soon/:moduleName",
        element: <ComingSoonPage />,
      },
    ],
  },
]);
