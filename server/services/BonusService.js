import { Types } from "mongoose";
import Bonus, { BonusType, ApprovalStatus } from "../models/Bonus.js";
import { ApiError } from "../utils/errorHandler.js";

export class BonusService {
  // ===== Core Bonus Methods =====
  static async createBonus(userId, data) {
    try {
      console.log("🔄 Creating bonus");

      const bonus = await Bonus.create({
        ...data,
        approvalStatus: ApprovalStatus.PENDING,
        createdBy: userId,
        updatedBy: userId,
      });

      console.log("✅ Bonus created successfully:", bonus._id);
      return bonus.populate([
        {
          path: "employee",
          select: "firstName lastName employeeId department",
        },
        { path: "department", select: "name code" },
        { path: "createdBy", select: "firstName lastName" },
      ]);
    } catch (error) {
      console.error("❌ Error creating bonus:", error);
      if (error.code === 11000) {
        throw new ApiError(400, "A bonus with this name already exists");
      }
      throw new ApiError(500, `Failed to create bonus: ${error.message}`);
    }
  }

  static async getAllBonuses(filters = {}) {
    try {
      console.log("📊 Fetching all bonuses");
      const query = { ...filters };
      const bonuses = await Bonus.find(query)
        .populate("employee", "firstName lastName employeeId department")
        .populate("department", "name code")
        .populate("approvedBy", "firstName lastName")
        .populate("createdBy", "firstName lastName")
        .populate("updatedBy", "firstName lastName")
        .sort({ createdAt: -1 });

      console.log(`✅ Found ${bonuses.length} bonuses`);
      return bonuses;
    } catch (error) {
      console.error("❌ Error fetching bonuses:", error);
      throw new ApiError(500, "Failed to fetch bonuses");
    }
  }

  // ===== Department-Specific Methods (Admin/HR) =====
  static async getDepartmentBonuses(departmentId) {
    try {
      console.log("📊 Fetching department bonuses for:", departmentId);

      const bonuses = await Bonus.find({
        department: departmentId,
        scope: { $in: ["department", "grade"] },
      })
        .populate("employee", "firstName lastName employeeId")
        .populate("department", "name code")
        .populate("approvedBy", "firstName lastName")
        .populate("createdBy", "firstName lastName")
        .sort({ createdAt: -1 });

      console.log(`✅ Found ${bonuses.length} department bonuses`);
      return bonuses;
    } catch (error) {
      console.error("❌ Error fetching department bonuses:", error);
      throw new ApiError(500, "Failed to fetch department bonuses");
    }
  }

  // ===== Individual Bonus Methods (Regular Users) =====
  static async getEmployeeBonuses(employeeId) {
    try {
      console.log("👤 Fetching bonuses for employee:", employeeId);

      const bonuses = await Bonus.find({
        employee: employeeId,
        scope: "individual",
        approvalStatus: ApprovalStatus.APPROVED,
      })
        .populate("department", "name code")
        .populate("approvedBy", "firstName lastName")
        .populate("createdBy", "firstName lastName")
        .sort({ createdAt: -1 });

      console.log(`✅ Found ${bonuses.length} employee bonuses`);
      return bonuses;
    } catch (error) {
      console.error("❌ Error fetching employee bonuses:", error);
      throw new ApiError(500, "Failed to fetch employee bonuses");
    }
  }

  static async requestBonus(userId, data) {
    try {
      console.log("📝 Creating bonus request for user:", userId);

      const bonus = await Bonus.create({
        ...data,
        employee: userId,
        scope: "individual",
        approvalStatus: ApprovalStatus.PENDING,
        createdBy: userId,
        updatedBy: userId,
      });

      console.log("✅ Bonus request created:", bonus._id);
      return bonus.populate([
        { path: "employee", select: "firstName lastName employeeId" },
        { path: "department", select: "name code" },
      ]);
    } catch (error) {
      console.error("❌ Error requesting bonus:", error);
      throw new ApiError(500, `Failed to request bonus: ${error.message}`);
    }
  }

  // ===== Approval Flow Methods (Admin/HR) =====
  static async approveBonus(id, userId, approved, rejectionReason = null) {
    try {
      console.log(`${approved ? "✅ Approving" : "❌ Rejecting"} bonus:`, id);

      const bonus = await Bonus.findById(id);
      if (!bonus) {
        throw new ApiError(404, "Bonus not found");
      }

      const updatedBonus = await Bonus.findByIdAndUpdate(
        id,
        {
          approvalStatus: approved
            ? ApprovalStatus.APPROVED
            : ApprovalStatus.REJECTED,
          approvedBy: userId,
          approvedAt: new Date(),
          rejectionReason: !approved ? rejectionReason : undefined,
          updatedBy: userId,
        },
        { new: true }
      ).populate([
        { path: "employee", select: "firstName lastName employeeId" },
        { path: "department", select: "name code" },
        { path: "approvedBy", select: "firstName lastName" },
      ]);

      console.log(
        `✅ Bonus ${approved ? "approved" : "rejected"} successfully`
      );
      return updatedBonus;
    } catch (error) {
      console.error("❌ Error updating bonus status:", error);
      throw new ApiError(
        500,
        `Failed to update bonus status: ${error.message}`
      );
    }
  }

  // ===== Update and Delete Methods =====
  static async updateBonus(id, userId, updates) {
    try {
      console.log("📝 Updating bonus:", id);

      const bonus = await Bonus.findById(id);
      if (!bonus) {
        throw new ApiError(404, "Bonus not found");
      }

      if (bonus.approvalStatus === ApprovalStatus.APPROVED) {
        throw new ApiError(400, "Cannot update an approved bonus");
      }

      const updatedBonus = await Bonus.findByIdAndUpdate(
        id,
        {
          ...updates,
          updatedBy: userId,
        },
        { new: true }
      ).populate([
        { path: "employee", select: "firstName lastName employeeId" },
        { path: "department", select: "name code" },
        { path: "updatedBy", select: "firstName lastName" },
      ]);

      console.log("✅ Bonus updated successfully");
      return updatedBonus;
    } catch (error) {
      console.error("❌ Error updating bonus:", error);
      throw new ApiError(500, `Failed to update bonus: ${error.message}`);
    }
  }

  static async deleteBonus(id) {
    try {
      console.log("🗑️ Deleting bonus:", id);

      const bonus = await Bonus.findById(id);
      if (!bonus) {
        throw new ApiError(404, "Bonus not found");
      }

      if (bonus.approvalStatus === ApprovalStatus.APPROVED) {
        throw new ApiError(400, "Cannot delete an approved bonus");
      }

      await Bonus.findByIdAndDelete(id);
      console.log("✅ Bonus deleted successfully");
    } catch (error) {
      console.error("❌ Error deleting bonus:", error);
      throw new ApiError(500, `Failed to delete bonus: ${error.message}`);
    }
  }

  // ===== Calculation Methods =====
  static calculateBonusAmount(basicSalary, bonus) {
    try {
      switch (bonus.type) {
        case BonusType.PERFORMANCE:
          return this.calculatePerformanceBonus(bonus);
        case BonusType.THIRTEENTH_MONTH:
          return basicSalary;
        case BonusType.SPECIAL:
        case BonusType.ACHIEVEMENT:
        case BonusType.RETENTION:
        case BonusType.PROJECT:
          return bonus.amount;
        default:
          throw new ApiError(400, "Invalid bonus type");
      }
    } catch (error) {
      console.error("❌ Error calculating bonus amount:", error);
      throw new ApiError(
        500,
        `Failed to calculate bonus amount: ${error.message}`
      );
    }
  }

  static calculatePerformanceBonus(bonus) {
    const { performanceScore, targetScore, baseAmount } = bonus;
    if (performanceScore >= targetScore) {
      return baseAmount * (performanceScore / targetScore);
    }
    return 0;
  }

  static async calculateBonusesForGrade(basicSalary, gradeLevel) {
    try {
      console.log("💰 Calculating bonuses for grade level:", gradeLevel);

      const bonuses = await this.getAllBonuses({
        approvalStatus: ApprovalStatus.APPROVED,
        gradeLevel,
      });

      const bonusDetails = bonuses.map((bonus) => ({
        name: bonus.name,
        amount: this.calculateBonusAmount(basicSalary, bonus),
      }));

      const totalBonuses = bonusDetails.reduce((sum, b) => sum + b.amount, 0);

      console.log(`✅ Calculated ${bonusDetails.length} bonuses`);
      return {
        bonusItems: bonusDetails,
        totalBonuses,
      };
    } catch (error) {
      console.error("❌ Error calculating grade bonuses:", error);
      return {
        bonusItems: [],
        totalBonuses: 0,
      };
    }
  }

  static async calculateBonuses(
    employeeId,
    departmentId,
    gradeLevel,
    basicSalary
  ) {
    try {
      console.log("🧮 Calculating bonuses for employee:", employeeId);

      // Get all approved bonuses for the employee's department and grade level
      const query = {
        $or: [
          { gradeLevel: gradeLevel, scope: "grade" },
          { employee: employeeId, scope: "individual" },
        ],
        approvalStatus: ApprovalStatus.APPROVED,
        isActive: true,
      };

      // Only add department query if departmentId is provided and valid
      if (departmentId && typeof departmentId === "string") {
        query.$or.push({
          department: new Types.ObjectId(departmentId),
          scope: "department",
        });
      }

      const bonuses = await Bonus.find(query);

      if (!bonuses || bonuses.length === 0) {
        console.log("ℹ️ No active bonuses found for employee");
        return {
          total: 0,
          details: [],
          message: "No active bonuses found",
        };
      }

      let totalBonuses = 0;
      const bonusDetails = [];

      for (const bonus of bonuses) {
        let amount = 0;

        switch (bonus.type) {
          case BonusType.PERFORMANCE:
            amount = this.calculatePerformanceBonus(bonus);
            break;
          case BonusType.GRADE:
            amount = this.calculateBonusAmount(basicSalary, bonus);
            break;
          case BonusType.FIXED:
            amount = bonus.value;
            break;
          default:
            console.warn(`⚠️ Unknown bonus type: ${bonus.type}`);
            continue;
        }

        totalBonuses += amount;
        bonusDetails.push({
          name: bonus.name,
          type: bonus.type,
          amount,
          description: bonus.description,
        });
      }

      console.log(
        `✅ Calculated ${bonusDetails.length} bonuses totaling ${totalBonuses}`
      );
      return {
        total: totalBonuses,
        details: bonusDetails,
        message: `Found ${bonusDetails.length} active bonuses`,
      };
    } catch (error) {
      console.error("❌ Error calculating bonuses:", error);
      // Instead of throwing an error, return empty bonuses
      return {
        total: 0,
        details: [],
        message: "Error calculating bonuses, defaulting to 0",
      };
    }
  }

  static async markStandaloneBonusesAsUsed(bonusIds, payrollId, month, year) {
    await Bonus.updateMany(
      { _id: { $in: bonusIds } },
      {
        $set: {
          usedInPayroll: {
            month,
            year,
            payrollId,
          },
        },
      }
    );
    console.log("✅ Standalone bonuses marked as used:", bonusIds);
  }
}
