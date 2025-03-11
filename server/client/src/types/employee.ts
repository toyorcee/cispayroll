import { Status, BankDetails, Allowance, Deduction } from "./common";

export type LeaveType = "annual" | "sick" | "maternity" | "unpaid";
export type LeaveStatus = "pending" | "approved" | "rejected";

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

export interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  gradeLevel: string;
  bankDetails: BankDetails;
  dateJoined: Date;
  status: Status;
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
    maternity?: number;
    unpaid: number;
  };
  overtime?: {
    rate: number;
    hoursWorked: number;
  };
  createdAt: Date;
  updatedAt: Date;
  lastPayrollDate?: Date;
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
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  startDate: Date;
  status: OnboardingStatus;
  progress: number;
  tasks: OnboardingTask[];
  supervisor?: string;
  documents?: {
    contractSigned?: boolean;
    idSubmitted?: boolean;
    bankDetailsProvided?: boolean;
    taxInfoSubmitted?: boolean;
  };
}

export type OffboardingStatus =
  | "pending"
  | "in_progress"
  | "clearance_pending"
  | "completed"
  | "cancelled";

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
