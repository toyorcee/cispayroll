import { Status, BankDetails, Allowance, Deduction } from "./common";
import { UserRole, Permission } from "./auth";
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
  name: string;
  completed: boolean;
}

export interface Employee {
  _id: string;
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  department: string;
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
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
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
  name: OnboardingTaskName;
  completed: boolean;
  dueDate?: Date;
  assignedTo?: string;
  notes?: string;
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
  department: {
    _id: string;
    name: string;
    code: string;
  };
  position: string;
  gradeLevel: string;
  workLocation: string;
  dateJoined: string;
  status: string;
  onboarding: {
    status: string;
    progress: number;
    tasks: {
      name: string;
      completed: boolean;
      _id: string;
      id: string;
    }[];
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  bankDetails: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  profileImage?: string;
  fullName: string;
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

export interface EmployeeDetails {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  position: string;
  gradeLevel: string;
  workLocation: string;
  department: string | { name: string; _id: string };
  status: string;
  dateJoined: string;
  lastLogin?: string;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
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
  exitInterview: boolean;
  assetsReturned: boolean;
  knowledgeTransfer: boolean;
  accessRevoked: boolean;
  finalSettlement: boolean;
}

export interface OffboardingDocument {
  type: "exit_interview" | "asset_return" | "final_settlement" | "clearance";
  url: string;
  generatedAt: Date;
}

export interface OffboardingDetails {
  status: OffboardingStatus;
  lastWorkingDay: Date;
  initiatedAt: Date;
  initiatedBy: string;
  checklist: OffboardingChecklist;
  documents?: OffboardingDocument[];
}

export interface DepartmentBasic {
  _id: string;
  name: string;
  code: string;
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
