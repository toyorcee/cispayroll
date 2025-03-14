import { UserRole, Permission } from "../../models/User.js";

declare namespace Express {
  interface User {
    id: string;
    role: UserRole;
    permissions: Permission[];
  }

  export interface Multer {
    File: {
      fieldname: string;
      originalname: string;
      encoding: string;
      mimetype: string;
      size: number;
      destination: string;
      filename: string;
      path: string;
      buffer: Buffer;
    };
  }
}
