import { Employee } from "../types/employee";
import { UserRole, Permission } from "../types/auth";
import { Status, Allowance, Deduction, BankDetails } from "../types/common";
import { departments } from "./departments";

export const employees: Employee[] = [
  {
    id: "EMP001",
    employeeId: "2023001",
    firstName: "Oluwaseun",
    lastName: "Adebayo",
    email: "oluwaseun.adebayo@company.com",
    phone: "+234 801 234 5678",
    department: "Engineering",
    position: "Senior Developer",
    gradeLevel: "L5",
    workLocation: "Lagos Office",
    bankDetails: {
      bankName: "Zenith Bank",
      accountNumber: "1234567890",
      accountName: "Oluwaseun Adebayo",
    },
    dateJoined: new Date("2023-01-15"),
    status: "active",
    salary: {
      basic: 850000,
      allowances: [
        {
          id: "all-001",
          type: "Housing",
          amount: 150000,
          description: "Monthly housing allowance",
        },
        {
          id: "all-002",
          type: "Transport",
          amount: 50000,
          description: "Monthly transport allowance",
        },
      ],
      deductions: [
        {
          id: "ded-001",
          type: "Tax",
          amount: 85000,
          description: "Monthly PAYE tax",
        },
        {
          id: "ded-002",
          type: "Pension",
          amount: 42500,
          description: "Monthly pension contribution",
        },
      ],
    },
    taxInfo: {
      tin: "1234567890",
      taxClass: "PAYE",
    },
    pensionInfo: {
      pensionNumber: "PEN123456",
      pensionProvider: "ARM Pension",
      employeeContribution: 0.08,
      employerContribution: 0.1,
    },
    nhfNumber: "NHF123456",
    leave: {
      annual: 24,
      sick: 10,
      unpaid: 0,
    },
    overtime: {
      rate: 1.5,
      hoursWorked: 0,
    },
    createdAt: new Date("2023-01-15"),
    updatedAt: new Date("2024-02-28"),
    userRole: UserRole.SUPER_ADMIN,
    permissions: [Permission.VIEW_ALL_USERS],
  },
  {
    id: "EMP002",
    employeeId: "2023002",
    firstName: "Chidinma",
    lastName: "Okonkwo",
    email: "chidinma.okonkwo@company.com",
    phone: "+234 802 345 6789",
    department: "Marketing",
    position: "Marketing Manager",
    gradeLevel: "L4",
    workLocation: "Abuja Office",
    bankDetails: {
      bankName: "Access Bank",
      accountNumber: "2345678901",
      accountName: "Chidinma Okonkwo",
    },
    dateJoined: new Date("2023-03-01"),
    status: "active",
    salary: {
      basic: 750000,
      allowances: [
        {
          id: "all-003",
          type: "Housing",
          amount: 120000,
          description: "Monthly housing allowance",
        },
        {
          id: "all-004",
          type: "Transport",
          amount: 45000,
          description: "Monthly transport allowance",
        },
      ],
      deductions: [
        {
          id: "ded-003",
          type: "Tax",
          amount: 75000,
          description: "Monthly PAYE tax",
        },
        {
          id: "ded-004",
          type: "Pension",
          amount: 37500,
          description: "Monthly pension contribution",
        },
      ],
    },
    taxInfo: {
      tin: "2345678901",
      taxClass: "PAYE",
    },
    pensionInfo: {
      pensionNumber: "PEN234567",
      pensionProvider: "Stanbic IBTC Pension",
      employeeContribution: 0.08,
      employerContribution: 0.1,
    },
    nhfNumber: "NHF234567",
    leave: {
      annual: 24,
      sick: 10,
      unpaid: 0,
    },
    overtime: {
      rate: 1.5,
      hoursWorked: 0,
    },
    createdAt: new Date("2023-03-01"),
    updatedAt: new Date("2024-02-28"),
    userRole: UserRole.ADMIN,
    permissions: [Permission.VIEW_ALL_USERS],
  },
  {
    id: "EMP003",
    employeeId: "2023003",
    firstName: "Babajide",
    lastName: "Oluwole",
    email: "babajide.oluwole@company.com",
    phone: "+234 803 456 7890",
    department: "Finance",
    position: "Financial Analyst",
    gradeLevel: "L3",
    workLocation: "Lagos Office",
    bankDetails: {
      bankName: "Guaranty Trust Bank",
      accountNumber: "3456789012",
      accountName: "Babajide Oluwole",
    },
    dateJoined: new Date("2023-06-10"),
    status: "suspended",
    salary: {
      basic: 650000,
      allowances: [
        {
          id: "all-005",
          type: "Housing",
          amount: 100000,
          description: "Monthly housing allowance",
        },
        {
          id: "all-006",
          type: "Transport",
          amount: 40000,
          description: "Monthly transport allowance",
        },
      ],
      deductions: [
        {
          id: "ded-005",
          type: "Tax",
          amount: 65000,
          description: "Monthly PAYE tax",
        },
        {
          id: "ded-006",
          type: "Pension",
          amount: 32500,
          description: "Monthly pension contribution",
        },
      ],
    },
    taxInfo: {
      tin: "3456789012",
    },
    pensionInfo: {
      pensionNumber: "PEN345678",
      pensionProvider: "Stanbic IBTC Pension",
      employeeContribution: 0.08,
      employerContribution: 0.1,
    },
    leave: {
      annual: 24,
      sick: 10,
      unpaid: 0,
    },
    overtime: {
      rate: 1.5,
      hoursWorked: 0,
    },
    createdAt: new Date("2023-06-10"),
    updatedAt: new Date("2024-02-28"),
    userRole: UserRole.USER,
    permissions: [Permission.VIEW_ALL_USERS],
  },
  {
    id: "EMP004",
    employeeId: "2023004",
    firstName: "Aisha",
    lastName: "Ibrahim",
    email: "aisha.ibrahim@company.com",
    phone: "+234 804 567 8901",
    department: "HR",
    position: "HR Specialist",
    gradeLevel: "L3",
    workLocation: "Abuja Office",
    bankDetails: {
      bankName: "First Bank",
      accountNumber: "4567890123",
      accountName: "Aisha Ibrahim",
    },
    dateJoined: new Date("2023-09-05"),
    status: "active",
    salary: {
      basic: 600000,
      allowances: [
        {
          id: "all-007",
          type: "Housing",
          amount: 90000,
          description: "Monthly housing allowance",
        },
        {
          id: "all-008",
          type: "Transport",
          amount: 35000,
          description: "Monthly transport allowance",
        },
      ],
      deductions: [
        {
          id: "ded-007",
          type: "Tax",
          amount: 60000,
          description: "Monthly PAYE tax",
        },
        {
          id: "ded-008",
          type: "Pension",
          amount: 30000,
          description: "Monthly pension contribution",
        },
      ],
    },
    taxInfo: {
      tin: "4567890123",
      taxClass: "PAYE",
    },
    pensionInfo: {
      pensionNumber: "PEN456789",
      pensionProvider: "NLPC Pension",
      employeeContribution: 0.08,
      employerContribution: 0.1,
    },
    nhfNumber: "NHF456789",
    leave: {
      annual: 24,
      sick: 10,
      maternity: 90,
      unpaid: 0,
    },
    overtime: {
      rate: 1.5,
      hoursWorked: 0,
    },
    createdAt: new Date("2023-09-05"),
    updatedAt: new Date("2024-02-28"),
    userRole: UserRole.USER,
    permissions: [Permission.VIEW_ALL_USERS],
  },
  // Add more employees with consistent department references
  ...Array.from({ length: 25 }, (_, index) => ({
    id: `EMP${(index + 5).toString().padStart(3, "0")}`,
    employeeId: `2023${(index + 5).toString().padStart(3, "0")}`,
    firstName: `Employee`,
    lastName: `${index + 5}`,
    email: `employee${index + 5}@company.com`,
    phone: `+234 ${(800000000 + index).toString()}`,
    userRole: index < 3 ? UserRole.ADMIN : UserRole.USER,
    permissions:
      index < 3
        ? [
            Permission.VIEW_TEAM_LEAVE,
            Permission.APPROVE_LEAVE,
            Permission.VIEW_DEPARTMENT_PAYROLL,
            Permission.MANAGE_DEPARTMENT_USERS,
            Permission.VIEW_ONBOARDING,
            Permission.MANAGE_ONBOARDING,
          ]
        : [
            Permission.VIEW_PERSONAL_INFO,
            Permission.VIEW_OWN_PAYSLIP,
            Permission.REQUEST_LEAVE,
            Permission.VIEW_OWN_LEAVE,
          ],
    department: departments[index % departments.length].name,
    position: [
      "Senior Developer",
      "Manager",
      "Analyst",
      "Specialist",
      "Coordinator",
    ][index % 5],
    gradeLevel: `L${Math.floor(index / 5) + 1}`,
    workLocation: ["Lagos Office", "Abuja Office", "Port Harcourt Office"][
      index % 3
    ],
    dateJoined: new Date(2023, Math.floor(index / 3), 1),
    status: ["active", "inactive", "suspended", "terminated"][
      index % 4
    ] as Status,
    salary: {
      basic: 500000 + index * 50000,
      allowances: [
        {
          id: `all-${index}-1`,
          type: "Housing",
          amount: 100000,
          description: "Monthly housing allowance",
        } as Allowance,
        {
          id: `all-${index}-2`,
          type: "Transport",
          amount: 50000,
          description: "Monthly transport allowance",
        } as Allowance,
      ],
      deductions: [
        {
          id: `ded-${index}-1`,
          type: "Tax",
          amount: 50000,
          description: "Monthly PAYE tax",
        } as Deduction,
        {
          id: `ded-${index}-2`,
          type: "Pension",
          amount: 25000,
          description: "Monthly pension contribution",
        } as Deduction,
      ],
    },
    taxInfo: {
      tin: `TIN${(index + 1).toString().padStart(9, "0")}`,
      taxClass: "PAYE",
    },
    pensionInfo: {
      pensionNumber: `PEN${(index + 1).toString().padStart(6, "0")}`,
      pensionProvider: ["ARM Pension", "Stanbic IBTC Pension", "NLPC Pension"][
        index % 3
      ],
      employeeContribution: 0.08,
      employerContribution: 0.1,
    },
    leave: {
      annual: 24,
      sick: 10,
      unpaid: 0,
      ...(index % 2 === 0 && { maternity: 90 }),
    },
    emergencyContact: {
      name: `Emergency Contact ${index + 1}`,
      relationship: "Family",
      phone: `+1987654${(index + 1).toString().padStart(4, "0")}`,
    },
    bankDetails: {
      bankName: ["Zenith Bank", "Access Bank", "GTBank", "First Bank"][
        index % 4
      ],
      accountNumber: `1234567${(index + 1).toString().padStart(4, "0")}`,
      accountName: `Employee ${index + 1}`,
    } as BankDetails,
    profileImage: `https://i.pravatar.cc/150?img=${(index % 70) + 1}`,
    reportingTo:
      index === 0
        ? undefined
        : `EMP${Math.floor(index / 5)
            .toString()
            .padStart(3, "0")}`,
    isEmailVerified: true,
    lastLogin: new Date(),
    createdAt: new Date(2023, 0, 1),
    updatedAt: new Date(),
    nhfNumber: `NHF${(index + 1).toString().padStart(6, "0")}`,
    overtime: {
      rate: 1.5,
      hoursWorked: Math.floor(Math.random() * 20),
    },
  })),
];
