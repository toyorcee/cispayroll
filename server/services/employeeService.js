import { Types } from "mongoose";
import UserModel, { UserRole } from "../models/User.js";
import { ApiError } from "../utils/errorHandler.js";
import { generateInvitationToken } from "../utils/tokenUtils.js";
import { EmailService } from "./emailService.js";

export class EmployeeService {
  static async createEmployee(data, creator) {
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

      // Generate employee/admin ID based on role
      const employeeId = await this.generateId(data.role || UserRole.USER);
      const invitationToken = generateInvitationToken();
      const invitationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Create employee with minimal data
      const employeeData = {
        ...data,
        employeeId,
        role: data.role || UserRole.USER,
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

  static async generateId(role) {
    const date = new Date();
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const prefix = role === UserRole.ADMIN ? "ADM" : "EMP";

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayCount = await UserModel.countDocuments({
      role: role,
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    const sequence = (todayCount + 1).toString().padStart(3, "0");
    return `${prefix}${day}${month}${sequence}`;
  }

  static formatEmployeeResponse(employee) {
    return {
      id: employee._id.toString(),
      employeeId: employee.employeeId,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      position: employee.position,
      department: employee.department?.toString(),
      status: employee.status,
      role: employee.role,
    };
  }

  static async getEmployees(filters) {
    try {
      const { page = 1, limit = 10, search, status, department } = filters;
      const skip = (page - 1) * limit;

      // Build query
      const query = {};

      // Add search filter
      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { employeeId: { $regex: search, $options: "i" } },
        ];
      }

      // Add status filter
      if (status) {
        query.status = status;
      }

      // Add department filter
      if (department) {
        if (department === "No Department") {
          query.department = { $in: [null, undefined] };
        } else {
          query.department = department;
        }
      }

      // Execute query with pagination
      const [employees, total] = await Promise.all([
        UserModel.find(query)
          .select("-password")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        UserModel.countDocuments(query),
      ]);

      return {
        data: employees.map((emp) => this.formatEmployeeResponse(emp)),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error("Error in getEmployees:", error);
      throw error;
    }
  }

  static async updateEmployee(employeeId, data) {
    try {
      const employee = await UserModel.findByIdAndUpdate(
        employeeId,
        data,
        { new: true, runValidators: true }
      );
      if (!employee) {
        throw new ApiError(404, "Employee not found");
      }
      return this.formatEmployeeResponse(employee);
    } catch (error) {
      console.error("Error in updateEmployee:", error);
      throw error;
    }
  }
  static async deleteEmployee(employeeId) {
    try {
      const employee = await UserModel.findByIdAndDelete(employeeId);
      if (!employee) {
        throw new ApiError(404, "Employee not found");
      }
      return this.formatEmployeeResponse(employee);
    } catch (error) {
      console.error("Error in deleteEmployee:", error);
      throw error;
    }
  }
}
