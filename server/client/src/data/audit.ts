import { AuditLog } from "../types/audit";

export const auditLogs: AuditLog[] = [
  {
    id: 1,
    action: "Payroll Processing",
    module: "Payroll",
    description: "March 2024 payroll batch processed",
    performedBy: "Oluwaseun Adebayo",
    ipAddress: "192.168.1.100",
    timestamp: new Date("2024-03-31T15:30:00"),
    status: "Success",
    details: "Processed 42 employee payments",
  },
  {
    id: 2,
    action: "Employee Update",
    module: "Employee",
    description: "Modified salary structure",
    performedBy: "Aisha Ibrahim",
    ipAddress: "192.168.1.102",
    timestamp: new Date("2024-03-31T14:25:00"),
    status: "Success",
    details: "Updated grade level for ID: EMP123",
  },
  {
    id: 3,
    action: "Tax Filing",
    module: "Tax",
    description: "Monthly PAYE returns submission",
    performedBy: "Babajide Oluwole",
    ipAddress: "192.168.1.105",
    timestamp: new Date("2024-03-31T11:15:00"),
    status: "Warning",
    details: "Pending verification for 2 records",
  },
  {
    id: 4,
    action: "System Access",
    module: "Settings",
    description: "Failed login attempt",
    performedBy: "Unknown",
    ipAddress: "192.168.1.150",
    timestamp: new Date("2024-03-31T10:45:00"),
    status: "Failed",
    details: "Multiple failed attempts detected",
  },
];

export const formatDateTime = (date: Date): string => {
  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};
