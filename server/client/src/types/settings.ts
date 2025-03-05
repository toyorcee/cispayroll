export interface PayrollSettings {
  processingDay: string;
  currency: string;
  fiscalYear: string;
  payPeriod: string;
}

export interface SystemPreferences {
  timezone: string;
  dateFormat: string;
  language: string;
  theme: "Light" | "Dark" | "System";
}

export interface QuickSettings {
  notifications: boolean;
  autoBackup: boolean;
}

export interface GeneralSettings {
  payrollSettings: PayrollSettings;
  systemPreferences: SystemPreferences;
  quickSettings: QuickSettings;
}

export type TimezoneOption = {
  value: string;
  label: string;
};

export type DateFormatOption = {
  value: string;
  label: string;
};

export type LanguageOption = {
  value: string;
  label: string;
};

export interface CompanyBasicInfo {
  name: string;
  registrationNumber: string;
  taxId: string;
  industry: string;
  employeeCount: string;
}

export interface CompanyContact {
  email: string;
  phone: string;
  website: string;
}

export interface CompanyAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface CompanyLegal {
  incorporationDate: string;
  businessType: string;
  fiscalYear: string;
}

export interface CompanyProfile {
  basic: CompanyBasicInfo;
  contact: CompanyContact;
  address: CompanyAddress;
  legal: CompanyLegal;
}

export interface ComplianceItem {
  id: number;
  name: string;
  frequency: "Monthly" | "Quarterly" | "Annually";
  nextDue: string;
  status: "Upcoming" | "Pending" | "Completed" | "Overdue";
  authority: string;
}

export interface ComplianceStats {
  compliant: number;
  pending: number;
  overdue: number;
  total: number;
}

export interface ComplianceSettings {
  emailNotificationDays: "7 days" | "14 days" | "30 days";
  dashboardAlerts: "Always" | "When due" | "Never";
}

export interface IntegrationOption {
  id: string;
  name: string;
  status: "connected" | "available";
  lastSync: string | null;
}

export interface IntegrationCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  options: IntegrationOption[];
}

export interface APIAccess {
  apiKey: string;
  webhookUrl: string;
}

export interface NotificationEvent {
  id: string;
  name: string;
  description: string;
  email: boolean;
  push: boolean;
  sms: boolean;
}

export interface NotificationCategory {
  id: string;
  name: string;
  description: string;
  events: NotificationEvent[];
}

export interface NotificationChannels {
  email: boolean;
  push: boolean;
  sms: boolean;
}

export interface TaxBracket {
  id: number;
  from: number;
  to: number | null;
  rate: number;
  description: string;
}

export interface TaxSettings {
  minimumTaxRate: number;
  consolidatedReliefAllowance: number;
  pensionRate: number;
  nhfRate: number;
}

// ... previous types ...

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  status: "Active" | "Inactive";
  lastActive: string;
}

export interface Role {
  name: string;
  permissions: string[];
}

export interface UserStats {
  total: number;
  active: number;
  pending: number;
}
