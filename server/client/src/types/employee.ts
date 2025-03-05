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
