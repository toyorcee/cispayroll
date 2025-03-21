import { UserRole, Permission } from "./auth";

export interface User {
  _id: string;
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  department?: string;
  status:
    | "pending"
    | "active"
    | "inactive"
    | "suspended"
    | "offboarding"
    | "terminated";
  permissions: Permission[];
}
