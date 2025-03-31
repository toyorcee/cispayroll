import { Types } from "mongoose";
import Allowance, {
  AllowanceType,
  AllowanceStatus,
} from "../models/Allowance.js";
import { ApiError } from "../utils/errorHandler.js";

export class AllowanceService {
  // ===== Core Allowance Methods =====
  static async createAllowance(userId, data) {
    try {
      console.log("🔄 Creating allowance");

      const allowance = await Allowance.create({
        ...data,
        active: true,
        createdBy: userId,
        updatedBy: userId,
      });

      return allowance;
    } catch (error) {
      console.error("❌ Error creating allowance:", error);
      if (error.code === 11000) {
        throw new ApiError(400, "An allowance with this name already exists");
      }
      throw new ApiError(500, `Failed to create allowance: ${error.message}`);
    }
  }

  static async getAllAllowances(filters = {}) {
    try {
      const query = { ...filters };
      const allowances = await Allowance.find(query)
        .populate("department", "name code")
        .populate("employee", "firstName lastName employeeId")
        .populate("createdBy", "firstName lastName")
        .populate("updatedBy", "firstName lastName")
        .sort({ createdAt: -1 });

      return allowances;
    } catch (error) {
      throw new ApiError(500, "Failed to fetch allowances");
    }
  }

  // ===== Department-Specific Methods (Admin/HR) =====
  static async getDepartmentAllowances(departmentId) {
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
  static async getEmployeeAllowances(employeeId) {
    try {
      console.log("👤 Fetching allowances for employee:", employeeId);

      const allowances = await Allowance.find({
        employee: employeeId,
        scope: "individual",
        active: true,
      })
        .populate("department", "name")
        .populate("salaryGrade", "level basicSalary")
        .populate("createdBy", "firstName lastName")
        .populate("updatedBy", "firstName lastName")
        .sort({ createdAt: -1 });

      console.log(`✅ Found ${allowances.length} employee allowances`);
      return allowances;
    } catch (error) {
      console.error("❌ Error fetching employee allowances:", error);
      throw new ApiError(500, "Failed to fetch employee allowances");
    }
  }

  static async requestAllowance(userId, data) {
    try {
      console.log("📝 Creating allowance request for user:", userId);

      const allowance = await Allowance.create({
        ...data,
        employee: userId,
        scope: "individual",
        status: AllowanceStatus.PENDING,
        active: false,
        createdBy: userId,
        updatedBy: userId,
      });

      console.log("✅ Allowance request created:", allowance._id);
      return allowance;
    } catch (error) {
      console.error("❌ Error requesting allowance:", error);
      throw new ApiError(500, `Failed to request allowance: ${error.message}`);
    }
  }

  // ===== Approval Flow Methods (Admin/HR) =====
  static async approveAllowance(id, userId) {
    try {
      console.log("✅ Approving allowance:", id);

      const allowance = await Allowance.findById(id);
      if (!allowance) {
        throw new ApiError(404, "Allowance not found");
      }

      allowance.status = AllowanceStatus.APPROVED;
      allowance.approvedBy = userId;
      allowance.approvedAt = new Date();
      allowance.active = true;
      allowance.updatedBy = userId;
      await allowance.save();

      console.log("✅ Allowance approved successfully");
      return allowance;
    } catch (error) {
      console.error("❌ Error approving allowance:", error);
      throw new ApiError(500, `Failed to approve allowance: ${error.message}`);
    }
  }

  static async rejectAllowance(id, userId, rejectionReason) {
    try {
      console.log("❌ Rejecting allowance:", id);

      const allowance = await Allowance.findById(id);
      if (!allowance) {
        throw new ApiError(404, "Allowance not found");
      }

      allowance.status = AllowanceStatus.REJECTED;
      allowance.rejectionReason = rejectionReason;
      allowance.active = false;
      allowance.updatedBy = userId;
      await allowance.save();

      console.log("✅ Allowance rejected successfully");
      return allowance;
    } catch (error) {
      console.error("❌ Error rejecting allowance:", error);
      throw new ApiError(500, `Failed to reject allowance: ${error.message}`);
    }
  }

  // ===== Update and Toggle Methods =====
  static async updateAllowance(id, userId, updates) {
    try {
      console.log("📝 Updating allowance:", id);

      const allowance = await Allowance.findById(id);
      if (!allowance) {
        throw new ApiError(404, "Allowance not found");
      }

      const updatedAllowance = await Allowance.findByIdAndUpdate(
        id,
        {
          ...updates,
          updatedBy: userId,
        },
        { new: true }
      ).populate([
        { path: "department", select: "name code" },
        { path: "employee", select: "firstName lastName employeeId" },
        { path: "updatedBy", select: "firstName lastName" },
      ]);

      console.log("✅ Allowance updated successfully");
      return updatedAllowance;
    } catch (error) {
      console.error("❌ Error updating allowance:", error);
      throw new ApiError(500, `Failed to update allowance: ${error.message}`);
    }
  }

  static async toggleAllowanceStatus(id, userId) {
    try {
      console.log("🔄 Toggling allowance status:", id);

      const allowance = await Allowance.findById(id);
      if (!allowance) {
        throw new ApiError(404, "Allowance not found");
      }

      allowance.active = !allowance.active;
      allowance.updatedBy = userId;
      await allowance.save();

      console.log(
        `✅ Allowance ${
          allowance.active ? "activated" : "deactivated"
        } successfully`
      );
      return allowance;
    } catch (error) {
      console.error("❌ Error toggling allowance status:", error);
      throw new ApiError(
        500,
        `Failed to toggle allowance status: ${error.message}`
      );
    }
  }

  // ===== Calculation Methods =====
  static calculateAllowanceAmount(basicSalary, allowance) {
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

  static calculatePerformanceAllowance(allowance) {
    const { performanceScore, targetScore, baseAmount } = allowance;
    if (performanceScore >= targetScore) {
      return baseAmount * (performanceScore / targetScore);
    }
    return 0;
  }

  static async calculateAllowancesForGrade(basicSalary, gradeLevel) {
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
}
