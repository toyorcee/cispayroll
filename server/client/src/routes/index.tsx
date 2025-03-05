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
import { AuthProvider } from "../context/AuthContext";

export const router = createBrowserRouter([
  {
    // Root element that wraps everything
    element: (
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    ),
    children: [
      {
        // Auth routes (no header/footer)
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
        // Main routes (with header/footer)
        element: <AppLayout />,
        children: [
          {
            path: "/",
            element: <Home />,
          },
        ],
      },
      {
        // Dashboard routes (protected, with header/footer)
        path: "/dashboard",
        element: (
          <ProtectedRoute>
            <NavigationProvider>
              <DashboardLayout />
            </NavigationProvider>
          </ProtectedRoute>
        ),
        children: [
          {
            path: "",
            element: <Dashboard />,
          },
          {
            path: "employees",
            element: <AllEmployees />,
          },
          {
            path: "employees/onboarding",
            element: <Onboarding />,
          },
          {
            path: "employees/leave",
            element: <LeaveManagement />,
          },
          {
            path: "payroll",
            element: <ProcessPayroll />,
          },
          {
            path: "payroll/structure",
            element: <SalaryStructure />,
          },
          {
            path: "payroll/deductions",
            element: <Deductions />,
          },
          {
            path: "reports/payroll",
            element: <PayrollReports />,
          },
          {
            path: "reports/employees",
            element: <EmployeeReports />,
          },
          {
            path: "reports/tax",
            element: <TaxReports />,
          },
          {
            path: "reports/audit",
            element: <AuditLogs />,
          },
          {
            path: "settings",
            element: <GeneralSettings />,
          },
          {
            path: "settings/company",
            element: <CompanyProfile />,
          },
          {
            path: "settings/tax",
            element: <TaxConfiguration />,
          },
          {
            path: "settings/compliance",
            element: <Compliance />,
          },
          {
            path: "settings/users",
            element: <UserManagement />,
          },
          {
            path: "settings/notifications",
            element: <Notifications />,
          },
          {
            path: "settings/integrations",
            element: <Integrations />,
          },
        ],
      },
    ],
  },
]);