import { UserRole, Permission } from "../../models/User.js";

declare namespace Express {
  interface User {
    id: string;
    role: UserRole;
    permissions: Permission[];
  }
}
