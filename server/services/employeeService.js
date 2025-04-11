import UserModel, {
  UserRole,
  UserLifecycleState,
  OnboardingStatus,
  OffboardingType,
  OffboardingStatus,
} from "../models/User.js";
import { ApiError } from "../utils/errorHandler.js";
import { EmailService } from "./EmailService.js";
import { v4 as uuidv4 } from "uuid";
import DepartmentModel from "../models/Department.js";

export class EmployeeService {
  static async createEmployee(data, creator) {
    try {
      // Validate required fields
      if (
        !data.firstName ||
        !data.lastName ||
        !data.email ||
        !data.phone ||
        !data.position ||
        !data.department
      ) {
        throw new ApiError(400, "Required fields are missing");
      }

      // Check if email already exists
      const existingUser = await UserModel.findOne({ email: data.email });
      if (existingUser) {
        throw new ApiError(400, "Email already registered");
      }

      // Validate department if provided
      const department = await DepartmentModel.findById(data.department);
      if (!department) {
        throw new ApiError(400, "Invalid department selected");
      }

      const invitationToken = uuidv4();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const employeeData = {
        ...data,
        employeeId: await this.generateId(data.role || UserRole.USER),
        role: data.role || UserRole.USER,
        status: "pending",
        isEmailVerified: false,
        invitation: {
          token: invitationToken,
          expiresAt,
          sentAt: new Date(),
        },
        lifecycle: {
          currentState: UserLifecycleState.INVITED,
          history: [
            {
              state: UserLifecycleState.INVITED,
              timestamp: new Date(),
              updatedBy: creator._id,
              notes: `Invited by ${creator.firstName} ${creator.lastName}`,
            },
          ],
        },
        createdBy: creator._id,
        department: department._id,
        position: data.position,
        onboarding: {
          status: OnboardingStatus.NOT_STARTED,
          tasks: [
            {
              name: "Welcome Meeting",
              description: "Initial orientation and welcome meeting",
              category: "orientation",
              deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            },
            {
              name: "Department Introduction",
              description: "Meet team and understand department workflow",
              category: "orientation",
              deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            },
          ],
        },
      };

      const employee = await UserModel.create(employeeData);
      await EmailService.sendInvitationEmail(
        employee.email,
        invitationToken,
        employee.role
      );

      // Return formatted response with populated department
      const populatedEmployee = await UserModel.findById(employee._id)
        .populate("department", "name code")
        .select("-password");

      return {
        employee: this.formatEmployeeResponse(populatedEmployee),
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
      phone: employee.phone,
      position: employee.position,
      department: employee.department
        ? {
            _id: employee.department._id,
            name: employee.department.name,
            code: employee.department.code,
          }
        : null,
      status: employee.status,
      role: employee.role,
      permissions: employee.permissions || [],
      gradeLevel: employee.gradeLevel,
      workLocation: employee.workLocation,
      dateJoined: employee.dateJoined,
      emergencyContact: employee.emergencyContact,
      bankDetails: employee.bankDetails,
      profileImage: employee.profileImage,
      reportingTo: employee.reportingTo,
      isEmailVerified: employee.isEmailVerified,
      lastLogin: employee.lastLogin,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
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
      const employee = await UserModel.findByIdAndUpdate(employeeId, data, {
        new: true,
        runValidators: true,
      });
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

  static async completeRegistration(invitationToken, userData) {
    const user = await UserModel.findOne({
      "invitation.token": invitationToken,
    });
    if (!user) throw new ApiError(404, "Invalid invitation token");
    if (user.invitation.expiresAt < new Date())
      throw new ApiError(400, "Invitation expired");

    user.password = userData.hashedPassword;
    user.emergencyContact = userData.emergencyContact;
    user.bankDetails = userData.bankDetails;
    if (userData.profileImage) {
      user.profileImage = userData.profileImage;
    }

    // Update lifecycle state
    await user.updateLifecycleState(
      UserLifecycleState.REGISTERED,
      user._id,
      "Completed registration"
    );

    // Clear invitation data
    user.invitation.token = undefined;
    user.invitation.expiresAt = undefined;

    await user.save();
    await EmailService.sendLifecycleUpdateEmail(
      user,
      UserLifecycleState.REGISTERED
    );

    return user;
  }

  static async startOnboarding(userId, supervisorId) {
    const user = await UserModel.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    await user.updateLifecycleState(
      UserLifecycleState.ONBOARDING,
      supervisorId,
      "Started onboarding process"
    );

    user.onboarding.supervisor = supervisorId;
    user.onboarding.expectedCompletionDate = new Date(
      Date.now() + 14 * 24 * 60 * 60 * 1000
    );
    await user.save();

    return user;
  }

  static async completeOnboarding(userId, completedBy) {
    const user = await UserModel.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    await user.updateLifecycleState(
      UserLifecycleState.ACTIVE,
      completedBy,
      "Completed onboarding process"
    );

    return user;
  }

  static async startOffboarding(userId, data) {
    const user = await UserModel.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    const { type, reason, targetExitDate, initiatedBy } = data;

    await user.updateLifecycleState(
      UserLifecycleState.OFFBOARDING,
      initiatedBy,
      `Started offboarding process - ${type}`
    );

    user.offboarding = {
      status: OffboardingStatus.IN_PROGRESS,
      type,
      reason,
      initiatedAt: new Date(),
      initiatedBy,
      targetExitDate,
      checklist: [
        { task: "Exit Interview Scheduled" },
        { task: "System Access Review" },
        { task: "Equipment Return" },
        { task: "Knowledge Transfer" },
        { task: "Final Documentation" },
      ],
    };

    await user.save();
    return user;
  }

  static async updatePassword(userId, hashedPassword) {
    const user = await UserModel.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    user.password = hashedPassword;
    await user.save();
    return this.formatEmployeeResponse(user);
  }

  static async resetPassword(resetToken, hashedPassword) {
    const user = await UserModel.findOne({
      resetPasswordToken: resetToken,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) throw new ApiError(400, "Invalid or expired reset token");

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    return this.formatEmployeeResponse(user);
  }

  static async getEmployeeById(employeeId) {
    try {
      const employee = await UserModel.findById(employeeId)
        .populate({
          path: "department",
          select: "_id name code",
        })
        .select("-password");

      if (!employee) {
        throw new ApiError(404, "Employee not found");
      }

      return this.formatEmployeeResponse(employee);
    } catch (error) {
      console.error("Error in getEmployeeById:", error);
      throw error;
    }
  }
}
