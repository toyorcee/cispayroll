import { Types } from "mongoose";
import UserModel, {
  UserRole,
  Permission,
  UserDocument,
} from "../models/User.js";
import { ApiError } from "../utils/errorHandler.js";
import { generateInvitationToken } from "../utils/tokenUtils.js";
import { EmailService } from "./emailService.js";

interface CreateEmployeeData {
  // Required fields only
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  department?: Types.ObjectId | string;
}

interface EmployeeCreator {
  _id: Types.ObjectId;
  role: UserRole;
  department?: Types.ObjectId | string;
}

export class EmployeeService {
  static async createEmployee(
    data: CreateEmployeeData,
    creator: EmployeeCreator
  ) {
    try {
      // Validate required fields
      if (
        !data.firstName ||
        !data.lastName ||
        !data.email ||
        !data.phone ||
        !data.position
      ) {
        throw new ApiError(400, "Required fields are missing");
      }

      // Check if email already exists
      const existingUser = await UserModel.findOne({ email: data.email });
      if (existingUser) {
        throw new ApiError(400, "Email already registered");
      }

      // Generate employee ID and invitation token
      const employeeId = await this.generateEmployeeId();
      const invitationToken = generateInvitationToken();
      const invitationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Create employee with minimal data
      const employeeData = {
        ...data,
        employeeId,
        role: UserRole.USER,
        status: "pending", 
        isEmailVerified: false,
        invitationToken,
        invitationExpires,
        createdBy: creator._id,
        permissions: [],
        department:
          creator.role === UserRole.ADMIN
            ? creator.department
            : data.department,
        // Don't include password, bankDetails, or emergencyContact here
      };

      const employee = await UserModel.create(employeeData);

      // Send invitation email
      await EmailService.sendInvitationEmail(employee.email, invitationToken);

      return {
        employee: this.formatEmployeeResponse(employee),
        invitationToken,
      };
    } catch (error) {
      console.error("Error in createEmployee:", error);
      throw error;
    }
  }

  private static async generateEmployeeId(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");

    // Get the latest employee ID for this month
    const latestEmployee = await UserModel.findOne(
      { employeeId: new RegExp(`^EMP${year}${month}`) },
      { employeeId: 1 }
    ).sort({ employeeId: -1 });

    let sequence = "001";
    if (latestEmployee?.employeeId) {
      const currentSequence = parseInt(latestEmployee.employeeId.slice(-3));
      sequence = (currentSequence + 1).toString().padStart(3, "0");
    }

    return `EMP${year}${month}${sequence}`;
  }

  private static formatEmployeeResponse(employee: UserDocument) {
    return {
      id: employee._id.toString(),
      employeeId: employee.employeeId,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      position: employee.position,
      department: employee.department?.toString(),
      status: employee.status,
    };
  }
}
