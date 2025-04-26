import { Suspense, lazy } from "react";
import { createBrowserRouter, Outlet } from "react-router-dom";
// import AppLayout from "../components/shared/AppLayout";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
// import Home from "../pages/Home";
import DashboardLayout from "../components/shared/DashboardLayout";
import AllEmployees from "../pages/pms/employees/AllEmployees";
import Onboarding from "../pages/pms/employees/Onboarding";
import TeamLeaveManagement from "../pages/pms/employees/TeamLeaveManagement";
import ProcessPayment from "../pages/pms/payroll/ProcessPayment";
import ProcessDepartmentPayroll from "../pages/pms/payroll/ProcessDepartmentPayroll";
import SalaryStructure from "../pages/pms/payroll/SalaryStructure";
import Deductions from "../pages/pms/payroll/Deductions";
import PayrollReports from "../pages/pms/reports/PayrollReports";
import AuditLogs from "../pages/pms/reports/AuditLogs";
import GeneralSettings from "../pages/pms/settings/General";
import CompanyProfile from "../pages/pms/settings/CompanyProfile";
import Integrations from "../pages/pms/settings/Integrations";
import { UserRole, Permission } from "../types/auth";
import Offboarding from "../pages/pms/employees/Offboarding";
import { GlobalErrorBoundary } from "../components/error/GlobalErrorBoundary";
import { useSkeleton } from "../components/skeletons/SkeletonProvider";
import Dashboard from "../pages/pms/dashboard/Dashboard";
import AllowanceManagement from "../pages/pms/payroll/AllowanceManagement";
import BonusManagement from "../pages/pms/payroll/BonusManagement";
import Landing from "../pages/Landing";
import ComingSoonPage from "../pages/Coming/ComingSoonPage";
import FeedbackManagemnet from "../pages/feedback/FeedbackManagement";
import MyPayslipsPage from "../pages/pms/payroll/MyPayslips";
import UserProfile from "../pages/pms/profile/UserProfile";
import { RouteErrorFallback } from "../components/error/RouteErrorFallback";
import { ErrorBoundary } from "react-error-boundary";
import { ErrorFallback } from "../components/error/ErrorFallback";
import { NavigationProvider } from "../context/NavigationContext";
import PersonalLeaveManagement from "../pages/pms/employees/PersonalLeaveManagement";
import MyAllowances from "../pages/pms/payroll/MyAllowances";
import MyBonus from "../pages/pms/payroll/MyBonus";

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
const ForgotPassword = lazy(() => import("../pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("../pages/auth/ResetPassword"));
const UpdatePassword = lazy(() => import("../pages/auth/UpdatePassword"));

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
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER],
    permissions: [
      // Permission.VIEW_ALL_USERS,
      // Permission.MANAGE_DEPARTMENT_USERS,
      // Permission.MANAGE_ONBOARDING,
      // Permission.MANAGE_OFFBOARDING,
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
        path: "team-leave",
        label: "Team Leave Management",
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        permissions: [Permission.VIEW_TEAM_LEAVE, Permission.APPROVE_LEAVE],
        requireAllPermissions: false,
        element: <TeamLeaveManagement />,
      },
      {
        path: "my-leave",
        label: "My Leave",
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER],
        permissions: [
          Permission.REQUEST_LEAVE,
          Permission.VIEW_OWN_LEAVE,
          Permission.CANCEL_OWN_LEAVE,
        ],
        requireAllPermissions: false,
        element: <PersonalLeaveManagement />,
      },
    ],
  },
  {
    path: "payroll",
    label: "Payroll",
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER],
    permissions: [
      // Separate permissions by role access
      // Super Admin
      Permission.VIEW_ALL_PAYROLL,
      // Admin
      Permission.VIEW_DEPARTMENT_PAYROLL,
      Permission.CREATE_PAYROLL,
      Permission.EDIT_PAYROLL,
      Permission.DELETE_PAYROLL,
      Permission.SUBMIT_PAYROLL,
      Permission.VIEW_DEPARTMENT_DEDUCTIONS,
      Permission.VIEW_DEPARTMENT_ALLOWANCES,
      Permission.VIEW_DEPARTMENT_BONUSES,
      // All Users (including Admin)
      Permission.VIEW_OWN_PAYSLIP,
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
        requireAllPermissions: false,
        element: <SalaryStructure />,
      },
      {
        path: "deductions",
        label: "Statutory Deductions",
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        permissions: [
          Permission.VIEW_DEDUCTIONS,
          Permission.EDIT_DEDUCTIONS,
          Permission.MANAGE_DEPARTMENT_DEDUCTIONS,
          Permission.VIEW_DEPARTMENT_DEDUCTIONS,
        ],
        requireAllPermissions: false,
        element: <Deductions />,
      },
      {
        path: "allowances",
        label: "Allowances",
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        permissions: [
          Permission.VIEW_ALLOWANCES,
          Permission.EDIT_ALLOWANCES,
          Permission.MANAGE_DEPARTMENT_ALLOWANCES,
          Permission.VIEW_DEPARTMENT_ALLOWANCES,
        ],
        requireAllPermissions: false,
        element: <AllowanceManagement />,
      },
      {
        path: "bonuses",
        label: "Bonuses",
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        permissions: [
          Permission.VIEW_BONUSES,
          Permission.MANAGE_BONUSES,
          Permission.MANAGE_DEPARTMENT_BONUSES,
          Permission.VIEW_DEPARTMENT_BONUSES,
          Permission.CREATE_BONUSES,
          Permission.DELETE_BONUSES,
          Permission.EDIT_BONUSES,
        ],
        requireAllPermissions: false,
        element: <BonusManagement />,
      },
      {
        path: "process",
        label: "Process Payment",
        roles: [UserRole.SUPER_ADMIN],
        permissions: [
          Permission.CREATE_PAYROLL,
          Permission.EDIT_PAYROLL,
          Permission.DELETE_PAYROLL,
          Permission.SUBMIT_PAYROLL,
          Permission.VIEW_ALL_PAYROLL,
          Permission.GENERATE_PAYSLIP,
        ],
        requireAllPermissions: false,
        element: <ProcessPayment />,
      },
      {
        path: "department-process",
        label: "Process Department Payroll",
        roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
        permissions: [
          Permission.CREATE_PAYROLL,
          Permission.EDIT_PAYROLL,
          Permission.DELETE_PAYROLL,
          Permission.SUBMIT_PAYROLL,
          Permission.VIEW_DEPARTMENT_PAYROLL,
          Permission.GENERATE_PAYSLIP,
        ],
        requireAllPermissions: false,
        element: <ProcessDepartmentPayroll />,
      },
      {
        path: "my-payslips",
        label: "My Payslips",
        roles: [UserRole.ADMIN, UserRole.USER],
        permissions: [Permission.VIEW_OWN_PAYSLIP],
        requireAllPermissions: true,
        element: <MyPayslipsPage />,
      },
      {
        path: "my-allowances",
        label: "My Allowances",
        roles: [UserRole.ADMIN, UserRole.USER],
        permissions: [
          Permission.VIEW_OWN_ALLOWANCES,
          Permission.REQUEST_ALLOWANCES,
        ],
        requireAllPermissions: true,
        element: <MyAllowances />,
      },
      // {
      //   path: "my-deductions",
      //   label: "My Deductions",
      //   roles: [UserRole.ADMIN, UserRole.USER],
      //   permissions: [Permission.VIEW_OWN_DEDUCTIONS],
      //   requireAllPermissions: true,
      //   element: <MyDeductions />,
      // },
      {
        path: "my-bonus",
        label: "My Bonus",
        roles: [UserRole.ADMIN, UserRole.USER],
        permissions: [Permission.VIEW_OWN_BONUS],
        requireAllPermissions: true,
        element: <MyBonus />,
      },
    ],
  },
  {
    path: "reports",
    label: "Reports",
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    permissions: [Permission.VIEW_REPORTS, Permission.VIEW_PAYROLL_REPORTS],
    requireAllPermissions: false,
    element: <Outlet />,
    children: [
      {
        path: "payroll",
        label: "Payroll Reports",
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        permissions: [Permission.VIEW_PAYROLL_REPORTS],
        requireAllPermissions: true,
        element: <PayrollReports />,
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
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER],
    permissions: [],
    requireAllPermissions: false,
    element: <Outlet />,
    children: [
      {
        path: "",
        label: "General Settings",
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        permissions: [Permission.MANAGE_SYSTEM_SETTINGS],
        requireAllPermissions: true,
        element: <GeneralSettings />,
      },
      {
        path: "company",
        label: "Company Profile",
        roles: [UserRole.SUPER_ADMIN],
        permissions: [Permission.MANAGE_COMPANY_PROFILE],
        requireAllPermissions: true,
        element: <CompanyProfile />,
      },
      {
        path: "integrations",
        label: "Integration Settings",
        roles: [UserRole.SUPER_ADMIN],
        permissions: [Permission.MANAGE_INTEGRATION_SETTINGS],
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
    path: "profile",
    label: "My Profile",
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER],
    permissions: [Permission.VIEW_PERSONAL_INFO, Permission.EDIT_PERSONAL_INFO],
    requireAllPermissions: false,
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
      <GlobalErrorBoundary>
        <Outlet />
      </GlobalErrorBoundary>
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
          {
            path: "forgot-password",
            element: (
              <LazyRoute component={ForgotPassword} skeletonType="auth" />
            ),
          },
          {
            path: "reset-password",
            element: (
              <LazyRoute component={ResetPassword} skeletonType="auth" />
            ),
          },
          {
            path: "update-password",
            element: (
              <LazyRoute component={UpdatePassword} skeletonType="auth" />
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
            <NavigationProvider>
              <DashboardLayout />
            </NavigationProvider>
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
