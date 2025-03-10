import { createBrowserRouter, Outlet } from "react-router-dom";
import AppLayout from "../components/shared/AppLayout";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import Home from "../pages/Home";
import SignIn from "../pages/auth/SignIn";
import SignUp from "../pages/auth/SignUp";
import DashboardLayout from "../components/shared/DashboardLayout";
import Dashboard from "../pages/dashboard/Dashboard";
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

export interface RouteConfig {
  path: string;
  label: string;
  icon?: React.ComponentType;
  roles: UserRole[];
  permissions?: Permission[];
  element: React.ReactNode;
  children?: RouteConfig[];
}

export const routes: RouteConfig[] = [
  {
    path: "",
    label: "Dashboard",
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER],
    element: <Dashboard />,
  },
  {
    path: "profile",
    label: "My Profile",
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER],
    permissions: [Permission.VIEW_PERSONAL_INFO],
    element: <UserProfile />,
  },
  {
    path: "my-payslips",
    label: "Payslips",
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER],
    element: <Payslips />,
  },
  {
    path: "my-documents",
    label: "Documents",
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER],
    element: <UserDocuments />,
  },
  {
    path: "my-leave",
    label: "Leave Management",
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER],
    permissions: [Permission.REQUEST_LEAVE, Permission.VIEW_OWN_LEAVE],
    element: <UserLeaveManagement />,
  },
  {
    path: "employees",
    label: "Employees",
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    element: <AllEmployees />,
    children: [
      {
        path: "list",
        label: "All Employees",
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        permissions: [Permission.MANAGE_USERS],
        element: <AllEmployees />,
      },
      {
        path: "onboarding",
        label: "Onboarding",
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        permissions: [Permission.MANAGE_USERS],
        element: <Onboarding />,
      },
      {
        path: "leave",
        label: "Leave Management",
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        element: <LeaveManagement />,
      },
    ],
  },
  {
    path: "payroll",
    label: "Payroll",
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    element: <ProcessPayroll />,
    children: [
      {
        path: "process",
        label: "Process Payroll",
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        permissions: [Permission.MANAGE_PAYROLL],
        element: <ProcessPayroll />,
      },
      {
        path: "structure",
        label: "Salary Structure",
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        permissions: [Permission.MANAGE_PAYROLL],
        element: <SalaryStructure />,
      },
      {
        path: "deductions",
        label: "Deductions",
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        permissions: [Permission.MANAGE_PAYROLL],
        element: <Deductions />,
      },
    ],
  },
  {
    path: "reports",
    label: "Reports",
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    permissions: [Permission.VIEW_REPORTS],
    element: <PayrollReports />,
    children: [
      {
        path: "payroll",
        label: "Payroll Reports",
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        permissions: [Permission.VIEW_REPORTS],
        element: <PayrollReports />,
      },
      {
        path: "employees",
        label: "Employee Reports",
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        permissions: [Permission.VIEW_REPORTS],
        element: <EmployeeReports />,
      },
      {
        path: "tax",
        label: "Tax Reports",
        roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
        permissions: [Permission.VIEW_REPORTS],
        element: <TaxReports />,
      },
      {
        path: "audit",
        label: "Audit Logs",
        roles: [UserRole.SUPER_ADMIN],
        permissions: [Permission.VIEW_REPORTS],
        element: <AuditLogs />,
      },
    ],
  },
  {
    path: "settings",
    label: "Settings",
    roles: [UserRole.SUPER_ADMIN],
    element: <GeneralSettings />,
    children: [
      {
        path: "company",
        label: "Company Profile",
        roles: [UserRole.SUPER_ADMIN],
        element: <CompanyProfile />,
      },
      {
        path: "tax",
        label: "Tax Configuration",
        roles: [UserRole.SUPER_ADMIN],
        element: <TaxConfiguration />,
      },
      {
        path: "compliance",
        label: "Compliance",
        roles: [UserRole.SUPER_ADMIN],
        element: <Compliance />,
      },
      {
        path: "users",
        label: "User Management",
        roles: [UserRole.SUPER_ADMIN],
        element: <UserManagement />,
      },
      {
        path: "notifications",
        label: "Notifications",
        roles: [UserRole.SUPER_ADMIN],
        element: <Notifications />,
      },
      {
        path: "integrations",
        label: "Integrations",
        roles: [UserRole.SUPER_ADMIN],
        element: <Integrations />,
      },
    ],
  },
];

export const router = createBrowserRouter([
  {
    element: (
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    ),
    children: [
      {
        children: [
          {
            path: "/auth/signin",
            element: <SignIn />,
          },
          {
            path: "/auth/signup",
            element: <SignUp />,
          },
        ],
      },
      {
        element: <AppLayout />,
        children: [
          {
            path: "/",
            element: <Home />,
          },
        ],
      },
      {
        path: "/dashboard",
        element: (
          <ProtectedRoute
            roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER]}
          >
            <NavigationProvider>
              <DashboardLayout />
            </NavigationProvider>
          </ProtectedRoute>
        ),
        children: routes.map((route) => ({
          path: route.path.replace(/^\/dashboard\/?/, "") || "",
          element: (
            <ProtectedRoute roles={route.roles} permissions={route.permissions}>
              {route.element}
            </ProtectedRoute>
          ),
          children: route.children?.map((child) => ({
            path: child.path.replace(/^\/dashboard\/?/, ""),
            element: (
              <ProtectedRoute
                roles={child.roles}
                permissions={child.permissions}
              >
                {child.element}
              </ProtectedRoute>
            ),
          })),
        })),
      },
    ],
  },
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "auth/signin", element: <SignIn /> },
      { path: "auth/signup", element: <SignUp /> },
    ],
  },
]);
