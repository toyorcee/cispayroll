import { Types } from "mongoose";
import Allowance, {
  IAllowance,
  AllowanceType,
  AllowanceFrequency,
} from "../models/Allowance.js";
import { ApiError } from "../utils/errorHandler.js";
import { PayrollFrequency } from "../models/Payroll.js";
import { IAllowanceFilters } from "../types/payroll.js";

export class AllowanceService {
  static async createAllowance(
    userId: Types.ObjectId,
    data: {
      name: string;
      type: AllowanceType;
      value: number;
      frequency: AllowanceFrequency;
      description?: string;
      taxable?: boolean;
      effectiveDate: Date;
      expiryDate?: Date;
      department?: Types.ObjectId;
      gradeLevel?: string;
    }
  ): Promise<IAllowance> {
    try {
      console.log("🔄 Creating allowance");

      const allowance = await Allowance.create({
        ...data,
        active: true,
        createdBy: userId,
        updatedBy: userId,
      });

      return allowance;
    } catch (error: any) {
      console.error("❌ Error creating allowance:", error);
      if (error.code === 11000) {
        throw new ApiError(400, "An allowance with this name already exists");
      }
      throw new ApiError(500, `Failed to create allowance: ${error.message}`);
    }
  }

  static async getAllAllowances(filters: IAllowanceFilters = {}) {
    try {
      const query = { ...filters };
      const allowances = await Allowance.find(query)
        .populate("department", "name code")
        .populate("createdBy", "firstName lastName")
        .populate("updatedBy", "firstName lastName")
        .sort({ createdAt: -1 });

      return allowances;
    } catch (error) {
      throw new ApiError(500, "Failed to fetch allowances");
    }
  }

  static async updateAllowance(
    id: string,
    userId: Types.ObjectId,
    updates: Partial<IAllowance>
  ): Promise<IAllowance> {
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
    } catch (error: any) {
      throw new ApiError(500, `Failed to update allowance: ${error.message}`);
    }
  }

  static async toggleAllowanceStatus(
    id: string,
    userId: Types.ObjectId
  ): Promise<IAllowance> {
    try {
      const allowance = await Allowance.findById(id);
      if (!allowance) {
        throw new ApiError(404, "Allowance not found");
      }

      allowance.active = !allowance.active;
      allowance.updatedBy = userId;
      await allowance.save();

      return allowance;
    } catch (error: any) {
      throw new ApiError(
        500,
        `Failed to toggle allowance status: ${error.message}`
      );
    }
  }

  static async deleteAllowance(id: string): Promise<void> {
    try {
      const allowance = await Allowance.findById(id);
      if (!allowance) {
        throw new ApiError(404, "Allowance not found");
      }

      await Allowance.findByIdAndDelete(id);
    } catch (error: any) {
      throw new ApiError(500, `Failed to delete allowance: ${error.message}`);
    }
  }

  // Calculate allowance amount based on type and value
  static calculateAllowanceAmount(
    basicSalary: number,
    allowance: { type: AllowanceType; value: number }
  ): number {
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

  // Add method to calculate prorated allowance
  static calculateProratedAllowance(
    allowance: IAllowance,
    basicSalary: number,
    frequency: PayrollFrequency
  ): number {
    try {
      let amount = this.calculateAllowanceAmount(basicSalary, {
        type: allowance.type,
        value: allowance.value,
      });

      // Prorate based on allowance frequency vs payroll frequency
      switch (allowance.frequency) {
        case AllowanceFrequency.QUARTERLY:
          amount = amount / 3; // Convert quarterly to monthly
          break;
        case AllowanceFrequency.ANNUAL:
          amount = amount / 12; // Convert annual to monthly
          break;
        case AllowanceFrequency.ONE_TIME:
          // One-time allowances are paid in full when they occur
          break;
        default:
          // Monthly allowance, no change needed
          break;
      }

      // Now prorate based on payroll frequency
      switch (frequency) {
        case PayrollFrequency.WEEKLY:
          return amount / 4;
        case PayrollFrequency.BIWEEKLY:
          return amount / 2;
        case PayrollFrequency.MONTHLY:
          return amount;
        case PayrollFrequency.QUARTERLY:
          return amount * 3;
        case PayrollFrequency.ANNUAL:
          return amount * 12;
        default:
          return amount;
      }
    } catch (error) {
      console.error("Error calculating prorated allowance:", error);
      return 0;
    }
  }

  // Update existing calculateAllowancesForGrade method
  static async calculateAllowancesForGrade(
    basicSalary: number,
    gradeLevel: string,
    frequency: PayrollFrequency = PayrollFrequency.MONTHLY
  ) {
    const allowances = await this.getAllAllowances({
      active: true,
      gradeLevel,
    });

    const allowanceDetails = allowances.map((allowance) => ({
      name: allowance.name,
      amount: this.calculateProratedAllowance(
        allowance,
        basicSalary,
        frequency
      ),
      frequency: allowance.frequency,
    }));

    return {
      allowanceItems: allowanceDetails,
      totalAllowances: allowanceDetails.reduce((sum, a) => sum + a.amount, 0),
    };
  }
}
