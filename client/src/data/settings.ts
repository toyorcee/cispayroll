import {
  GeneralSettings,
  TimezoneOption,
  DateFormatOption,
  LanguageOption,
  CompanyProfile,
  ComplianceSettings,
  ComplianceItem,
  ComplianceStats,
} from "../types/settings";
import type { IntegrationCategory, APIAccess } from "../types/settings";
import type {
  NotificationCategory,
  NotificationChannels,
} from "../types/settings";
import type { TaxBracket, TaxSettings } from "../types/settings";

export const generalSettings: GeneralSettings = {
  payrollSettings: {
    processingDay: "25",
    currency: "NGN (₦)",
    fiscalYear: "January - December",
    payPeriod: "Monthly",
  },
  systemPreferences: {
    timezone: "Africa/Lagos",
    dateFormat: "DD/MM/YYYY",
    language: "English",
    theme: "Light",
  },
  quickSettings: {
    notifications: true,
    autoBackup: true,
  },
};

export const timezoneOptions: TimezoneOption[] = [
  { value: "Africa/Lagos", label: "Lagos (GMT+1)" },
  { value: "Africa/Abuja", label: "Abuja (GMT+1)" },
];

export const dateFormatOptions: DateFormatOption[] = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
];

export const languageOptions: LanguageOption[] = [
  { value: "en", label: "English" },
  { value: "fr", label: "French" },
];

export const companyProfile: CompanyProfile = {
  basic: {
    name: "TechCorp Solutions",
    registrationNumber: "RC-123456",
    taxId: "TIN-987654321",
    industry: "Technology",
    employeeCount: "42",
  },
  contact: {
    email: "info@techcorp.com",
    phone: "+234 801 234 5678",
    website: "www.techcorp.com",
  },
  address: {
    street: "123 Tech Avenue",
    city: "Lagos",
    state: "Lagos State",
    country: "Nigeria",
    postalCode: "100001",
  },
  legal: {
    incorporationDate: "2020-01-15",
    businessType: "Private Limited Company",
    fiscalYear: "January - December",
  },
};

export const complianceStats: ComplianceStats = {
  compliant: 8,
  pending: 3,
  overdue: 0,
  total: 11,
};

export const complianceItems: ComplianceItem[] = [
  {
    id: 1,
    name: "PAYE Monthly Returns",
    frequency: "Monthly",
    nextDue: "2024-04-30",
    status: "Upcoming",
    authority: "State Internal Revenue Service",
  },
  {
    id: 2,
    name: "Pension Remittance",
    frequency: "Monthly",
    nextDue: "2024-04-15",
    status: "Pending",
    authority: "Pension Fund Administrator",
  },
  {
    id: 3,
    name: "NHF Remittance",
    frequency: "Monthly",
    nextDue: "2024-04-15",
    status: "Completed",
    authority: "Federal Mortgage Bank",
  },
  {
    id: 4,
    name: "Annual Tax Returns",
    frequency: "Annually",
    nextDue: "2025-01-31",
    status: "Upcoming",
    authority: "Federal Internal Revenue Service",
  },
  {
    id: 5,
    name: "Social Insurance",
    frequency: "Monthly",
    nextDue: "2024-04-20",
    status: "Pending",
    authority: "Social Insurance Trust",
  },
  {
    id: 6,
    name: "VAT Returns",
    frequency: "Monthly",
    nextDue: "2024-04-21",
    status: "Completed",
    authority: "Federal Internal Revenue Service",
  },
  {
    id: 7,
    name: "Workers Compensation",
    frequency: "Annually",
    nextDue: "2024-12-31",
    status: "Completed",
    authority: "Labor Department",
  },
  {
    id: 8,
    name: "Industrial Training Fund",
    frequency: "Monthly",
    nextDue: "2024-04-30",
    status: "Upcoming",
    authority: "ITF",
  },
];

export const complianceSettings: ComplianceSettings = {
  emailNotificationDays: "7 days",
  dashboardAlerts: "Always",
};

export const integrations: IntegrationCategory[] = [
  {
    id: "accounting",
    name: "Accounting Software",
    description: "Connect with your accounting software for seamless data sync",
    icon: "CloudArrowUpIcon",
    options: [
      {
        id: "quickbooks",
        name: "QuickBooks",
        status: "connected",
        lastSync: "2024-03-21 14:30",
      },
      {
        id: "xero",
        name: "Xero",
        status: "available",
        lastSync: null,
      },
      {
        id: "sage",
        name: "Sage",
        status: "available",
        lastSync: null,
      },
    ],
  },
  {
    id: "hr",
    name: "HR Systems",
    description: "Integrate with HR management systems",
    icon: "LockClosedIcon",
    options: [
      {
        id: "workday",
        name: "Workday",
        status: "connected",
        lastSync: "2024-03-21 15:45",
      },
      {
        id: "bamboo",
        name: "BambooHR",
        status: "available",
        lastSync: null,
      },
    ],
  },
  {
    id: "banking",
    name: "Banking & Payment",
    description: "Connect with banking and payment systems",
    icon: "ArrowPathIcon",
    options: [
      {
        id: "wise",
        name: "Wise",
        status: "connected",
        lastSync: "2024-03-21 12:00",
      },
      {
        id: "paystack",
        name: "Paystack",
        status: "available",
        lastSync: null,
      },
    ],
  },
];

export const apiAccess: APIAccess = {
  apiKey: "sk_test_51NXbfEFV8yE9KKm2m",
  webhookUrl: "https://api.yourcompany.com/webhooks/payroll",
};

export const notificationCategories: NotificationCategory[] = [
  {
    id: "payroll",
    name: "Payroll Notifications",
    description: "Notifications related to payroll processing and approvals",
    events: [
      {
        id: "payroll_processing",
        name: "Payroll Processing",
        description: "When payroll processing begins or completes",
        email: true,
        push: true,
        sms: false,
      },
      {
        id: "payroll_approval",
        name: "Payroll Approval Required",
        description: "When payroll needs your approval",
        email: true,
        push: true,
        sms: true,
      },
    ],
  },
  {
    id: "employees",
    name: "Employee Updates",
    description: "Notifications about employee data changes and requests",
    events: [
      {
        id: "employee_onboarding",
        name: "New Employee Onboarding",
        description: "When a new employee is added to the system",
        email: true,
        push: false,
        sms: false,
      },
      {
        id: "employee_changes",
        name: "Employee Data Changes",
        description: "When employee information is updated",
        email: true,
        push: false,
        sms: false,
      },
    ],
  },
  {
    id: "compliance",
    name: "Compliance Alerts",
    description: "Important updates about compliance and deadlines",
    events: [
      {
        id: "tax_deadlines",
        name: "Tax Filing Deadlines",
        description: "Reminders for upcoming tax filing deadlines",
        email: true,
        push: true,
        sms: true,
      },
      {
        id: "compliance_updates",
        name: "Compliance Updates",
        description: "Changes in compliance requirements or regulations",
        email: true,
        push: true,
        sms: false,
      },
    ],
  },
];

export const defaultNotificationChannels: NotificationChannels = {
  email: true,
  push: true,
  sms: false,
};

export const taxBrackets: TaxBracket[] = [
  { id: 1, from: 0, to: 30000, rate: 7, description: "First ₦30,000" },
  { id: 2, from: 30001, to: 60000, rate: 11, description: "Next ₦30,000" },
  { id: 3, from: 60001, to: 110000, rate: 15, description: "Next ₦50,000" },
  { id: 4, from: 110001, to: 160000, rate: 19, description: "Next ₦50,000" },
  { id: 5, from: 160001, to: null, rate: 21, description: "Above ₦160,000" },
];

export const taxSettings: TaxSettings = {
  minimumTaxRate: 1,
  consolidatedReliefAllowance: 200000,
  pensionRate: 8,
  nhfRate: 2.5,
};

// export const users: User[] = [
//   {
//     id: "1",
//     name: "John Smith",
//     email: "john.smith@company.com",
//     role: "Admin",
//     department: "HR",
//     status: "Active",
//     lastActive: "2024-03-20",
//   },
//   {
//     id: "2",
//     name: "Sarah Johnson",
//     email: "sarah.j@company.com",
//     role: "Manager",
//     department: "Payroll",
//     status: "Active",
//     lastActive: "2024-03-21",
//   },
//   {
//     id: "3",
//     name: "Mike Wilson",
//     email: "mike.w@company.com",
//     role: "Viewer",
//     department: "Finance",
//     status: "inactive",
//     lastActive: "2024-03-15",
//   },
// ];

// export const roles: Role[] = [
//   {
//     name: "Admin",
//     permissions: [
//       "Full system access",
//       "User management",
//       "Payroll processing",
//       "Report generation",
//     ],
//   },
//   {
//     name: "Manager",
//     permissions: [
//       "Payroll processing",
//       "Report generation",
//       "Employee management",
//     ],
//   },
//   {
//     name: "Viewer",
//     permissions: ["View reports", "View employee data"],
//   },
// ];

// export const userStats: UserStats = {
//   total: 15,
//   active: 12,
//   pending: 3,
// };
