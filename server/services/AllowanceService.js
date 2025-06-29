import Allowance, {
  AllowanceType,
  AllowanceStatus,
} from "../models/Allowance.js";
import { ApiError } from "../utils/errorHandler.js";
import User from "../models/User.js";
import { NotificationService } from "./NotificationService.js";

export class AllowanceService {
  // ===== Core Allowance Methods =====
  async createAllowance(employeeId, allowanceData) {
    const employee = await User.findById(employeeId);
    if (!employee) {
      throw new ApiError(404, "Employee not found");
    }

    const allowance = await Allowance.create({
      ...allowanceData,
      employee: employeeId,
      status: allowanceData.approvalStatus || AllowanceStatus.PENDING,
      approvedBy:
        allowanceData.approvalStatus === AllowanceStatus.APPROVED
          ? allowanceData.createdBy
          : undefined,
      approvedAt:
        allowanceData.approvalStatus === AllowanceStatus.APPROVED
          ? new Date()
          : undefined,
    });

    // Only send notification if the allowance is pending
    if (allowance.approvalStatus === AllowanceStatus.PENDING) {
      // Notify department head and HR
      await NotificationService.createNotification({
        recipient: employee.departmentHead,
        type: "ALLOWANCE_REQUEST",
        title: "New Allowance Request",
        message: `${employee.name} has requested an allowance of ${allowance.formattedAmount}`,
        data: { allowanceId: allowance._id },
      });
    }

    return allowance;
  }

  async getAllAllowances(filters = {}) {
    try {
      const query = { ...filters };
      const allowances = await Allowance.find(query)
        .populate("department", "name code")
        .populate("employee", "firstName lastName")
        .populate("createdBy", "firstName lastName")
        .populate("updatedBy", "firstName lastName")
        .sort({ createdAt: -1 });

      return allowances;
    } catch (error) {
      throw new ApiError(500, "Failed to fetch allowances");
    }
  }

  // ===== Department-Specific Methods (Admin/HR) =====
  async getDepartmentAllowances(departmentId) {
    try {
      console.log("📊 Fetching department allowances for:", departmentId);

      const allowances = await Allowance.find({
        department: departmentId,
        scope: { $in: ["department", "grade"] },
      })
        .populate("department", "name")
        .populate("salaryGrade", "level basicSalary")
        .populate("createdBy", "firstName lastName")
        .populate("updatedBy", "firstName lastName")
        .sort({ createdAt: -1 });

      console.log(`✅ Found ${allowances.length} department allowances`);
      return allowances;
    } catch (error) {
      console.error("❌ Error fetching department allowances:", error);
      throw new ApiError(500, "Failed to fetch department allowances");
    }
  }

  // ===== Individual Allowance Methods (Regular Users) =====
  async getEmployeeAllowances(employeeId) {
    return await Allowance.find({ employee: employeeId })
      .populate("employee", "name email")
      .sort({ createdAt: -1 });
  }

  // Request a new allowance
  async requestAllowance(userId, data) {
    try {
      const allowance = await Allowance.create({
        ...data,
        employee: userId,
        approvalStatus: AllowanceStatus.PENDING,
      });

      // Send notification to department head
      await NotificationService.sendNotification({
        recipient: data.departmentHead,
        type: "ALLOWANCE_REQUEST",
        title: "New Allowance Request",
        message: `New allowance request of ${allowance.formattedAmount} has been submitted`,
        data: { allowanceId: allowance._id },
      });

      return allowance;
    } catch (error) {
      throw new ApiError(500, `Failed to request allowance: ${error.message}`);
    }
  }

  // ===== Approval Flow Methods (Admin/HR) =====
  async approveAllowance(allowanceId, approverId) {
    const allowance = await Allowance.findById(allowanceId);
    if (!allowance) {
      throw new ApiError(404, "Allowance not found");
    }

    if (allowance.approvalStatus !== AllowanceStatus.PENDING) {
      throw new ApiError(400, "Allowance is not in pending status");
    }

    allowance.approvalStatus = AllowanceStatus.APPROVED;
    allowance.approvedBy = approverId;
    allowance.approvedAt = new Date();
    await allowance.save();

    // Notify employee
    await NotificationService.createNotification({
      recipient: allowance.employee,
      type: "ALLOWANCE_APPROVED",
      title: "Allowance Approved",
      message: "Your allowance request has been approved",
      data: { allowanceId: allowance._id },
    });

    return allowance;
  }

  async rejectAllowance(allowanceId, rejectorId, rejectionReason) {
    const allowance = await Allowance.findById(allowanceId);
    if (!allowance) {
      throw new ApiError(404, "Allowance not found");
    }

    if (allowance.approvalStatus !== AllowanceStatus.PENDING) {
      throw new ApiError(400, "Allowance is not in pending status");
    }

    allowance.approvalStatus = AllowanceStatus.REJECTED;
    allowance.rejectedBy = rejectorId;
    allowance.rejectedAt = new Date();
    allowance.rejectionReason = rejectionReason;
    await allowance.save();

    // Notify employee
    await NotificationService.createNotification({
      recipient: allowance.employee,
      type: "ALLOWANCE_REJECTED",
      title: "Allowance Rejected",
      message: "Your allowance request has been rejected",
      data: {
        allowanceId: allowance._id,
        reason: rejectionReason,
      },
    });

    return allowance;
  }

  // ===== Update and Toggle Methods =====
  async updateAllowance(allowanceId, employeeId, updateData) {
    const allowance = await Allowance.findOne({
      _id: allowanceId,
      employee: employeeId,
      approvalStatus: AllowanceStatus.PENDING,
    });

    if (!allowance) {
      throw new ApiError(404, "Allowance not found or cannot be updated");
    }

    Object.assign(allowance, updateData);
    await allowance.save();

    return allowance;
  }

  // Toggle allowance status
  async toggleAllowanceStatus(id, userId) {
    try {
      const allowance = await Allowance.findById(id);
      if (!allowance) {
        throw new ApiError(404, "Allowance not found");
      }

      // Only admin/super admin can toggle status
      const user = await User.findById(userId);
      if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
        throw new ApiError(403, "Not authorized to toggle allowance status");
      }

      allowance.isActive = !allowance.isActive;
      await allowance.save();

      return allowance;
    } catch (error) {
      throw new ApiError(
        500,
        `Failed to toggle allowance status: ${error.message}`
      );
    }
  }

  // ===== Calculation Methods =====
  calculateAllowanceAmount(basicSalary, allowance) {
    try {
      switch (allowance.type) {
        case AllowanceType.FIXED:
          return allowance.value;
        case AllowanceType.PERCENTAGE:
          return (basicSalary * allowance.value) / 100;
        case AllowanceType.PERFORMANCE_BASED:
          return this.calculatePerformanceAllowance(allowance);
        default:
          throw new ApiError(400, "Invalid allowance type");
      }
    } catch (error) {
      console.error("❌ Error calculating allowance amount:", error);
      throw new ApiError(
        500,
        `Failed to calculate allowance amount: ${error.message}`
      );
    }
  }

  calculatePerformanceAllowance(allowance) {
    const { performanceScore, targetScore, baseAmount } = allowance;
    if (performanceScore >= targetScore) {
      return baseAmount * (performanceScore / targetScore);
    }
    return 0;
  }

  async calculateAllowancesForGrade(basicSalary, gradeLevel) {
    try {
      console.log("💰 Calculating allowances for grade level:", gradeLevel);

      const allowances = await this.getAllAllowances({
        active: true,
        gradeLevel,
      });

      const allowanceDetails = allowances.map((allowance) => ({
        name: allowance.name,
        amount: this.calculateAllowanceAmount(basicSalary, allowance),
      }));

      const totalAllowances = allowanceDetails.reduce(
        (sum, a) => sum + a.amount,
        0
      );

      console.log(`✅ Calculated ${allowanceDetails.length} allowances`);
      return {
        allowanceItems: allowanceDetails,
        totalAllowances,
      };
    } catch (error) {
      console.error("❌ Error calculating grade allowances:", error);
      return {
        allowanceItems: [],
        totalAllowances: 0,
      };
    }
  }

  async getAllowanceById(allowanceId) {
    return await Allowance.findById(allowanceId)
      .populate("employee", "name email department")
      .populate("approvedBy", "name")
      .populate("rejectedBy", "name");
  }

  async createDepartmentEmployeeAllowance(employeeId, allowanceData) {
    const employee = await User.findById(employeeId);
    if (!employee) {
      throw new ApiError(404, "Employee not found");
    }

    const allowance = await Allowance.create({
      ...allowanceData,
      employee: employeeId,
      department: employee.department,
      status: AllowanceStatus.APPROVED,
      approvedBy: allowanceData.createdBy,
      approvedAt: new Date(),
      isDepartmentWide: false,
    });

    return allowance;
  }
}
