import { Types } from "mongoose";
import Bonus, { IBonus, BonusType } from "../models/Bonus.js";
import { ApiError } from "../utils/errorHandler.js";
import UserModel from "../models/User.js";

export class BonusService {
  static async createBonus(
    userId: Types.ObjectId,
    data: {
      employee: Types.ObjectId;
      type: BonusType;
      amount: number;
      description?: string;
      paymentDate: Date;
      department?: Types.ObjectId;
      taxable?: boolean;
    }
  ): Promise<IBonus> {
    try {
      console.log("🔄 Creating bonus");

      const bonus = await Bonus.create({
        ...data,
        approvalStatus: "pending",
        createdBy: userId,
        updatedBy: userId,
      });

      return bonus.populate([
        { path: "employee", select: "firstName lastName employeeId" },
        { path: "department", select: "name code" },
      ]);
    } catch (error: any) {
      console.error("❌ Error creating bonus:", error);
      throw new ApiError(500, `Failed to create bonus: ${error.message}`);
    }
  }

  static async getAllBonuses(
    filters: {
      employee?: Types.ObjectId;
      department?: Types.ObjectId;
      approvalStatus?: string;
      type?: BonusType;
    } = {}
  ) {
    try {
      const query = { ...filters };
      const bonuses = await Bonus.find(query)
        .populate("employee", "firstName lastName employeeId")
        .populate("department", "name code")
        .populate("approvedBy", "firstName lastName")
        .populate("createdBy", "firstName lastName")
        .sort({ createdAt: -1 });

      return bonuses;
    } catch (error) {
      throw new ApiError(500, "Failed to fetch bonuses");
    }
  }

  static async updateBonus(
    id: string,
    userId: Types.ObjectId,
    updates: Partial<IBonus>
  ): Promise<IBonus> {
    try {
      const bonus = await Bonus.findById(id);
      if (!bonus) {
        throw new ApiError(404, "Bonus not found");
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
      ]);

      if (!updatedBonus) {
        throw new ApiError(404, "Failed to update bonus");
      }

      return updatedBonus;
    } catch (error: any) {
      throw new ApiError(500, `Failed to update bonus: ${error.message}`);
    }
  }

  static async approveBonus(
    id: string,
    userId: Types.ObjectId,
    approved: boolean
  ): Promise<IBonus> {
    try {
      const bonus = await Bonus.findById(id);
      if (!bonus) {
        throw new ApiError(404, "Bonus not found");
      }

      const updatedBonus = await Bonus.findByIdAndUpdate(
        id,
        {
          approvalStatus: approved ? "approved" : "rejected",
          approvedBy: userId,
          approvedAt: new Date(),
          updatedBy: userId,
        },
        { new: true }
      ).populate([
        { path: "employee", select: "firstName lastName employeeId" },
        { path: "department", select: "name code" },
        { path: "approvedBy", select: "firstName lastName" },
      ]);

      if (!updatedBonus) {
        throw new ApiError(404, "Failed to update bonus status");
      }

      return updatedBonus;
    } catch (error: any) {
      throw new ApiError(
        500,
        `Failed to update bonus status: ${error.message}`
      );
    }
  }

  static async deleteBonus(id: string): Promise<void> {
    try {
      const bonus = await Bonus.findById(id);
      if (!bonus) {
        throw new ApiError(404, "Bonus not found");
      }

      if (bonus.approvalStatus === "approved") {
        throw new ApiError(400, "Cannot delete an approved bonus");
      }

      await Bonus.findByIdAndDelete(id);
    } catch (error: any) {
      throw new ApiError(500, `Failed to delete bonus: ${error.message}`);
    }
  }

  static async createThirteenthMonthBonus(
    userId: Types.ObjectId,
    employeeId: Types.ObjectId,
    year: number,
    amount: number
  ): Promise<IBonus> {
    return await this.createBonus(userId, {
      employee: employeeId,
      type: BonusType.THIRTEENTH_MONTH,
      amount,
      description: `13th Month Pay for ${year}`,
      paymentDate: new Date(year, 11, 25), // December 25th
      taxable: true,
    });
  }

  static async getEligibleEmployeesForThirteenthMonth(year: number) {
    // Get employees who have worked for at least 6 months
    const sixMonthsAgo = new Date(year, 5, 1); // June 1st

    return await UserModel.find({
      createdAt: { $lte: sixMonthsAgo },
      status: "active",
    });
  }
}
