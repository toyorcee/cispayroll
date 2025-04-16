import { Allowance, Deduction } from "./common";
import { Permission } from "./auth";
export enum LeaveStatus {
  pending = "pending",
  approved = "approved",
  rejected = "rejected",
  cancelled = "cancelled",
}

export enum LeaveType {
  annual = "annual",
  sick = "sick",
  maternity = "maternity",
  unpaid = "unpaid",
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employee: Employee;
  type: LeaveType;
  startDate: Date;
  endDate: Date;
  status: LeaveStatus;
  submittedAt: Date;
  approvedBy?: string;
  rejectedBy?: string;
  reason: string;
}

export interface Task {
  _id: string;
  id: string;
  name: string;
  completed: boolean;
  completedAt?: string;
}

export interface Department {
  _id: string;
  name: string;
  code: string;
}

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
  bankCode: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface OnboardingDetails {
  status: string;
  progress: number;
  tasks: OnboardingTask[];
  startedAt?: Date;
  completedAt?: Date;
}

export interface OffboardingDetails {
  exitInterview: {
    completed: boolean;
  };
  status: "pending_exit" | "in_progress" | "completed";
  initiatedAt: string;
  initiatedBy: string;
  checklist: OffboardingChecklist[];
}

export interface DeductionPreferences {
  statutory: {
    defaultStatutory: Record<string, { opted: boolean }>;
  };
}

export interface CreatedBy {
  _id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  id: string;
}

export interface PersonalDetails {
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  middleName: string;
  dateOfBirth: string;
  maritalStatus: string;
  nationality: string;
  qualifications: Qualification[];
}

export interface Qualification {
  highestEducation: string;
  institution: string;
  yearGraduated: string;
  _id: string;
  id: string;
}

export interface Employee {
  _id: string;
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  department: Department;
  position: string;
  gradeLevel: string;
  workLocation: string;
  status: string;
  offboarding?: OffboardingDetails;
  permissions: Permission[];
  progress: number;
  dateJoined: string;
  startDate?: string;
  supervisor: string;
  tasks: Task[];
  onboardingStatus:
    | "not_started"
    | "contract_stage"
    | "documentation_stage"
    | "it_setup_stage"
    | "training_stage"
    | "completed";
  bankDetails: BankDetails;
  salary: {
    basic: number;
    allowances: Allowance[];
    deductions: Deduction[];
  };
  taxInfo: {
    tin: string;
    taxClass?: string;
  };
  pensionInfo: {
    pensionNumber: string;
    pensionProvider: string;
    employeeContribution: number;
    employerContribution: number;
  };
  nhfNumber?: string;
  leave: {
    annual: number;
    sick: number;
    unpaid: number;
    maternity?: number;
  };
  overtime: {
    rate: number;
    hoursWorked: number;
  };
  emergencyContact: EmergencyContact;
  profileImage?: string;
  reportingTo?: string;
  isEmailVerified?: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  lastWorkingDate: Date;
  initiatedDate: Date;
  reason: string;
  clearance: {
    itClearance?: boolean;
    financeClearance?: boolean;
    hrClearance?: boolean;
    departmentClearance?: boolean;
  };
  personalDetails?: PersonalDetails;
}

export type OnboardingStatus =
  | "documentation_pending"
  | "it_setup_pending"
  | "contract_pending"
  | "completed";
export type OnboardingTaskName =
  | "contract_signing"
  | "it_setup"
  | "documentation"
  | "training"
  | "bank_setup"
  | "pension_setup";

export interface OnboardingTask {
  _id: string;
  name: string;
  completed: boolean;
  completedAt?: Date;
  assignedTo?: string;
}

export interface OnboardingEmployee {
  _id: string;
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  permissions: string[];
  position: string;
  gradeLevel: string;
  workLocation: string;
  dateJoined: Date;
  status: string;
  profileImage: string;
  department: string | { name: string };
  onboarding: {
    status: string;
    progress: number;
    tasks: Task[];
    startedAt?: string;
  };
  fullName: string;
  // ... other fields as needed
}

export interface ExtendedOnboardingEmployee extends OnboardingEmployee {
  // Add any additional properties specific to extended version
  // If there are no additional properties, you might not need this interface at all
}

export type OffboardingStatus = "pending_exit" | "in_progress" | "completed";

export type OffboardingTaskName =
  | "exit_interview"
  | "equipment_return"
  | "access_revocation"
  | "final_settlement"
  | "knowledge_transfer"
  | "documentation_handover";

export interface OffboardingTask {
  name: OffboardingTaskName;
  completed: boolean;
  dueDate?: Date;
  assignedTo?: string;
  notes?: string;
  completedAt?: Date;
  verifiedBy?: string;
}

export interface OffboardingEmployee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  lastWorkingDate: Date;
  initiatedDate: Date;
  status: OffboardingStatus;
  progress: number;
  tasks: OffboardingTask[];
  supervisor?: string;
  reason: string;
  clearance: {
    itClearance?: boolean;
    financeClearance?: boolean;
    hrClearance?: boolean;
    departmentClearance?: boolean;
  };
}

export interface EmployeeResponse {
  success: boolean;
  data: Employee[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface EmployeeFilters {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  department?: string;
}

export interface EmployeeDetails extends Employee {
  fullName: string;
}

export interface CreateEmployeeData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: "USER" | "ADMIN";
  position: string;
  gradeLevel: string;
  workLocation: string;
  dateJoined: string;
  department: string;
}

export interface OffboardingChecklist {
  completed: boolean;
  _id: string;
  id: string;
}

export interface OffboardingDocument {
  type: "exit_interview" | "asset_return" | "final_settlement" | "clearance";
  url: string;
  generatedAt: Date;
}

export interface DepartmentEmployee {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string;
  position: string;
  department: string;
  status: string;
  gradeLevel: string;
  role: "USER" | "ADMIN";
  isHOD: boolean;
}

export interface DepartmentEmployeeResponse {
  employees: DepartmentEmployee[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SalaryGrade {
  _id: string;
  level: string;
  basicSalary: number;
  description: string;
  components: {
    name: string;
    type: string;
    calculationMethod: string;
    value: number;
    isActive: boolean;
    _id: string;
  }[];
  isActive: boolean;
}

export interface Offboarding {
  exitInterview: {
    completed: boolean;
  };
  status: "pending_exit" | "in_progress" | "completed";
  initiatedAt: string;
  initiatedBy: string;
  checklist: OffboardingChecklist[];
}
