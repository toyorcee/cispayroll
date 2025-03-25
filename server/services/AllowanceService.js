import { Types } from "mongoose";
import Allowance, { AllowanceType } from "../models/Allowance.js";
import { PayrollFrequency } from "../types/payroll.js";
import { ApiError } from "../utils/errorHandler.js";

export class AllowanceService {
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

  static async updateAllowance(id, userId, updates) {
    try {
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
      ).populate("department", "name code");

      if (!updatedAllowance) {
        throw new ApiError(404, "Failed to update allowance");
      }

      return updatedAllowance;
    } catch (error) {
      throw new ApiError(500, `Failed to update allowance: ${error.message}`);
    }
  }

  static async toggleAllowanceStatus(id, userId) {
    try {
      const allowance = await Allowance.findById(id);
      if (!allowance) {
        throw new ApiError(404, "Allowance not found");
      }

      allowance.active = !allowance.active;
      allowance.updatedBy = userId;
      await allowance.save();

      return allowance;
    } catch (error) {
      throw new ApiError(
        500,
        `Failed to toggle allowance status: ${error.message}`
      );
    }
  }

  static async deleteAllowance(id) {
    try {
      const allowance = await Allowance.findById(id);
      if (!allowance) {
        throw new ApiError(404, "Allowance not found");
      }

      await Allowance.findByIdAndDelete(id);
    } catch (error) {
      throw new ApiError(500, `Failed to delete allowance: ${error.message}`);
    }
  }

  static calculateAllowanceAmount(basicSalary, allowance) {
    switch (allowance.type) {
      case AllowanceType.FIXED:
        return allowance.value;
      case AllowanceType.PERCENTAGE:
        return (basicSalary * allowance.value) / 100;
      case AllowanceType.PERFORMANCE_BASED:
        // Implement performance-based calculation logic
        return allowance.value;
      default:
        throw new ApiError(400, "Invalid allowance type");
    }
  }

  static async calculateAllowancesForGrade(basicSalary, gradeLevel) {
    try {
      console.log("💰 Calculating allowances for grade level:", gradeLevel);

      // Get active allowances for this grade level
      const allowances = await this.getAllAllowances({
        active: true,
        gradeLevel,
      });

      // Calculate each allowance amount
      const allowanceDetails = allowances.map((allowance) => ({
        name: allowance.name,
        amount: this.calculateAllowanceAmount(basicSalary, allowance),
      }));

      // Calculate total allowances
      const totalAllowances = allowanceDetails.reduce(
        (sum, a) => sum + a.amount,
        0
      );

      return {
        allowanceItems: allowanceDetails,
        totalAllowances,
      };
    } catch (error) {
      console.error("Error calculating allowances:", error);
      return {
        allowanceItems: [],
        totalAllowances: 0,
      };
    }
  }
}
