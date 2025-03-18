import { Suspense, lazy } from "react";
import { createBrowserRouter, Outlet } from "react-router-dom";
import AppLayout from "../components/shared/AppLayout";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import Home from "../pages/Home";
import DashboardLayout from "../components/shared/DashboardLayout";
import { NavigationProvider } from "../context/NavigationContext";
import AllEmployees from "../pages/dashboard/employees/AllEmployees";
import Onboarding from "../pages/dashboard/employees/Onboarding";
import LeaveManagement from "../pages/dashboard/employees/LeaveManagement";
import ProcessPayroll from "../pages/dashboard/payroll/ProcessPayroll";
import SalaryStructure from "../pages/dashboard/payroll/SalaryStructure";
import Deductions from "../pages/dashboard/payroll/Deductions";
import PayrollReports from "../pages/dashboard/reports/PayrollReports";
import EmployeeReports from "../pages/dashboard/reports/EmployeeReports";
import TaxReports from "../pages/dashboard/reports/TaxReports";
import AuditLogs from "../pages/dashboard/reports/AuditLogs";
import GeneralSettings from "../pages/dashboard/settings/General";
import CompanyProfile from "../pages/dashboard/settings/CompanyProfile";
import TaxConfiguration from "../pages/dashboard/settings/TaxConfiguration";
import Compliance from "../pages/dashboard/settings/Compliance";
import UserManagement from "../pages/dashboard/settings/UserManagement";
import Notifications from "../pages/dashboard/settings/Notifications";
import Integrations from "../pages/dashboard/settings/Integrations";
import UserProfile from "../pages/dashboard/profile/UserProfile";
import Payslips from "../pages/dashboard/settings/Payslips";
import UserDocuments from "../pages/dashboard/settings/UserDocuments";
import UserLeaveManagement from "../pages/dashboard/employees/UserLeaveManagement";
import { AuthProvider } from "../context/AuthContext";
import { UserRole, Permission } from "../types/auth";
import DepartmentManagement from "../pages/dashboard/settings/DepartmentManagement";
import Offboarding from "../pages/dashboard/employees/Offboarding";
import { GlobalErrorBoundary } from "../components/error/GlobalErrorBoundary";
import { SkeletonProvider } from "../components/skeletons/SkeletonProvider";
import { useSkeleton } from "../components/skeletons/SkeletonProvider";
import { AuthSkeleton } from "../components/skeletons/AuthSkeleton";
import Dashboard from "../pages/dashboard/Dashboard";
import AllowanceManagement from "../pages/dashboard/payroll/AllowanceManagement";
import BonusManagement from "../pages/dashboard/payroll/BonusManagement";
import Landing from "../pages/Landing";

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

// Super Admin specific routes
const superAdminRoutes: RouteConfig[] = [
  {
    path: "settings/departments",
    label: "Department Management",
    roles: [UserRole.SUPER_ADMIN],
    permissions: [
      Permission.CREATE_DEPARTMENT,
      Permission.EDIT_DEPARTMENT,
      Permission.DELETE_DEPARTMENT,
      Permission.VIEW_ALL_DEPARTMENTS,
    ],
    requireAllPermissions: false,
    element: <DepartmentManagement />,
  },
  {
    path: "reports/audit",
    label: "Audit Logs",
    roles: [UserRole.SUPER_ADMIN],
    permissions: [Permission.VIEW_AUDIT_LOGS],
    requireAllPermissions: false,
    element: <AuditLogs />,
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
    requireAllPermissions: false,
    element: <GeneralSettings />,
    children: [
      {
        path: "company",
        label: "Company Profile",
        roles: [UserRole.SUPER_ADMIN],
        permissions: [Permission.MANAGE_COMPANY_PROFILE],
        requireAllPermissions: false,
        element: <CompanyProfile />,
      },
      {
        path: "tax",
        label: "Tax Configuration",
        roles: [UserRole.SUPER_ADMIN],
        permissions: [Permission.MANAGE_TAX_CONFIG],
        requireAllPermissions: false,
        element: <TaxConfiguration />,
      },
      {
        path: "compliance",
        label: "Compliance",
        roles: [UserRole.SUPER_ADMIN],
        permissions: [Permission.MANAGE_COMPLIANCE],
        requireAllPermissions: false,
        element: <Compliance />,
      },
      {
        path: "users",
        label: "User Management",
        roles: [UserRole.SUPER_ADMIN],
        permissions: [Permission.CREATE_USER, Permission.EDIT_USER],
        requireAllPermissions: false,
        element: <UserManagement />,
      },
      {
        path: "notifications",
        label: "Notifications",
        roles: [UserRole.SUPER_ADMIN],
        permissions: [Permission.MANAGE_NOTIFICATIONS],
        requireAllPermissions: false,
        element: <Notifications />,
      },
      {
        path: "integrations",
        label: "Integrations",
        roles: [UserRole.SUPER_ADMIN],
        permissions: [Permission.MANAGE_INTEGRATIONS],
        requireAllPermissions: false,
        element: <Integrations />,
      },
    ],
  },
  {
    path: "reports",
    label: "Reports",
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    permissions: [
      Permission.VIEW_REPORTS,
      Permission.VIEW_AUDIT_LOGS,
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
    ],
  },
];

// Admin routes
const adminRoutes: RouteConfig[] = [
  {
    path: "employees",
    label: "Employees",
    roles: [UserRole.ADMIN],
    permissions: [
      Permission.VIEW_ALL_USERS,
      Permission.MANAGE_DEPARTMENT_USERS,
    ],
    element: <Outlet />,
    children: [
      {
        path: "list",
        label: "All Employees",
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        permissions: [Permission.VIEW_ALL_USERS],
        element: <AllEmployees />,
      },
      {
        path: "onboarding",
        label: "Onboarding",
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        permissions: [Permission.MANAGE_ONBOARDING],
        element: <Onboarding />,
      },
      {
        path: "offboarding",
        label: "Offboarding",
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        permissions: [Permission.MANAGE_OFFBOARDING],
        element: <Offboarding />,
      },
      {
        path: "leave",
        label: "Leave Management",
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        permissions: [Permission.APPROVE_LEAVE, Permission.VIEW_TEAM_LEAVE],
        element: <LeaveManagement />,
      },
    ],
  },
  {
    path: "payroll",
    label: "Payroll",
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    permissions: [
      Permission.VIEW_ALL_PAYROLL,
      Permission.VIEW_DEPARTMENT_PAYROLL,
      Permission.MANAGE_SALARY_STRUCTURE,
    ],
    requireAllPermissions: false,
    element: <Outlet />,
    children: [
      {
        path: "process",
        label: "Process Payroll",
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        permissions: [
          Permission.CREATE_PAYROLL,
          Permission.EDIT_PAYROLL,
          Permission.APPROVE_PAYROLL,
          Permission.GENERATE_PAYSLIP,
        ],
        requireAllPermissions: false,
        element: <ProcessPayroll />,
      },
      {
        path: "structure",
        label: "Salary Structure",
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        permissions: [
          Permission.MANAGE_SALARY_STRUCTURE,
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
          Permission.MANAGE_DEDUCTIONS,
          Permission.VIEW_DEDUCTIONS,
          Permission.EDIT_DEDUCTIONS,
        ],
        requireAllPermissions: false,
        element: <Deductions />,
      },
      {
        path: "allowances",
        label: "Allowances",
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        permissions: [
          Permission.MANAGE_SALARY_STRUCTURE,
          Permission.EDIT_SALARY_STRUCTURE,
        ],
        requireAllPermissions: false,
        element: <AllowanceManagement />,
      },
      {
        path: "bonuses",
        label: "Bonuses & Overtime",
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        permissions: [
          Permission.MANAGE_SALARY_STRUCTURE,
          Permission.EDIT_SALARY_STRUCTURE,
        ],
        requireAllPermissions: false,
        element: <BonusManagement />,
      },
    ],
  },
];

// User routes
const userRoutes: RouteConfig[] = [
  {
    path: "profile",
    label: "My Profile",
    roles: [UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
    permissions: [Permission.VIEW_PERSONAL_INFO],
    element: <UserProfile />,
  },
  {
    path: "my-payslips",
    label: "My Payslips",
    roles: [UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
    permissions: [Permission.VIEW_OWN_PAYSLIP],
    element: <Payslips />,
  },
  {
    path: "my-documents",
    label: "Documents",
    roles: [UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
    permissions: [Permission.MANAGE_DOCUMENTS],
    element: <UserDocuments />,
  },
  {
    path: "my-leave",
    label: "My Leave",
    roles: [UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
    permissions: [Permission.VIEW_OWN_LEAVE],
    element: <UserLeaveManagement />,
  },
];

// Move lazy loading declarations to the top, before any usage
const SignIn = lazy(() => import("../pages/auth/SignIn"));
const SignUp = lazy(() => import("../pages/auth/SignUp"));
const CompleteRegistration = lazy(
  () => import("../pages/auth/CompleteRegistration")
);

// Update the LazyRoute component
function LazyRoute({
  component: Component,
  element,
  skeletonType = "content",
}: {
  component?: React.LazyExoticComponent<React.ComponentType<any>>;
  element?: React.ReactNode;
  skeletonType: "content" | "auth";
}) {
  const { getSkeleton } = useSkeleton();

  return (
    <Suspense fallback={getSkeleton(skeletonType)}>
      <GlobalErrorBoundary>
        {Component ? <Component /> : element}
      </GlobalErrorBoundary>
    </Suspense>
  );
}

// Update the employee routes configuration
const employeeRoutes: RouteConfig = {
  path: "employees",
  label: "Employees",
  roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  element: <Outlet />,
  children: [
    {
      path: "list",
      label: "All Employees",
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
      element: <AllEmployees />,
      permissions: [
        Permission.VIEW_ALL_USERS,
        Permission.MANAGE_DEPARTMENT_USERS,
      ],
      requireAllPermissions: false,
    },
    {
      path: "onboarding",
      label: "Onboarding",
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
      element: <Onboarding />,
      permissions: [
        Permission.VIEW_ALL_USERS,
        Permission.MANAGE_DEPARTMENT_USERS,
      ],
      requireAllPermissions: false,
    },
    {
      path: "offboarding",
      label: "Offboarding",
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
      element: <Offboarding />,
      permissions: [
        Permission.VIEW_ALL_USERS,
        Permission.MANAGE_DEPARTMENT_USERS,
      ],
      requireAllPermissions: false,
    },
    {
      path: "leave",
      label: "Leave Management",
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
      element: <LeaveManagement />,
      permissions: [Permission.APPROVE_LEAVE, Permission.VIEW_TEAM_LEAVE],
      requireAllPermissions: false,
    },
  ],
};

// Payroll routes with specific permissions
const payrollRoutes: RouteConfig = {
  path: "payroll",
  label: "Payroll",
  roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  permissions: [
    Permission.VIEW_ALL_PAYROLL,
    Permission.VIEW_DEPARTMENT_PAYROLL,
    Permission.MANAGE_SALARY_STRUCTURE,
    Permission.DELETE_PAYROLL,
  ],
  requireAllPermissions: false,
  element: <Outlet />,
  children: [
    {
      path: "process",
      label: "Process Payroll",
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
      permissions: [
        Permission.CREATE_PAYROLL,
        Permission.EDIT_PAYROLL,
        Permission.DELETE_PAYROLL,
        Permission.APPROVE_PAYROLL,
        Permission.GENERATE_PAYSLIP,
      ],
      requireAllPermissions: false,
      element: <ProcessPayroll />,
    },
    {
      path: "structure",
      label: "Salary Structure",
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
      permissions: [
        Permission.MANAGE_SALARY_STRUCTURE,
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
        Permission.MANAGE_DEDUCTIONS,
        Permission.VIEW_DEDUCTIONS,
        Permission.EDIT_DEDUCTIONS,
      ],
      requireAllPermissions: false,
      element: <Deductions />,
    },
    {
      path: "allowances",
      label: "Allowances",
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
      permissions: [
        Permission.MANAGE_ALLOWANCES,
        Permission.VIEW_ALLOWANCES,
        Permission.EDIT_ALLOWANCES,
      ],
      requireAllPermissions: false,
      element: <AllowanceManagement />,
    },
    {
      path: "bonuses",
      label: "Bonuses & Overtime",
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
      permissions: [
        Permission.MANAGE_BONUSES,
        Permission.VIEW_BONUSES,
        Permission.EDIT_BONUSES,
        Permission.MANAGE_OVERTIME,
      ],
      requireAllPermissions: false,
      element: <BonusManagement />,
    },
  ],
};

// User-specific payroll routes
const userPayrollRoutes: RouteConfig[] = [
  {
    path: "my-payslips",
    label: "My Payslips",
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER],
    permissions: [Permission.VIEW_OWN_PAYSLIP],
    requireAllPermissions: false,
    element: <Payslips />,
  },
];

// Update the routes array
export const routes: RouteConfig[] = [
  {
    path: "",
    label: "Dashboard",
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER],
    element: <Dashboard />,
  },
  employeeRoutes,
  payrollRoutes,
  ...superAdminRoutes,
  ...adminRoutes.filter((route) => route.path !== "employees"),
  ...userPayrollRoutes,
  ...userRoutes,
];

// Update the router configuration to properly wrap each route with ProtectedRoute
export const router = createBrowserRouter([
  {
    element: (
      <AuthProvider>
        <SkeletonProvider>
          <NavigationProvider>
            <Outlet />
          </NavigationProvider>
        </SkeletonProvider>
      </AuthProvider>
    ),
    errorElement: <GlobalErrorBoundary />,
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
        path: "/dashboard",
        element: (
          <ProtectedRoute
            roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER]}
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
        element: <AppLayout />,
        children: [{ index: true, element: <Home /> }],
      },
      {
        path: "/home",
        element: <Landing />,
        // children: [{ index: true, element: <Landing /> }],
      },
    ],
  },
]);
