import { Types } from "mongoose";
import Bonus, { BonusType } from "../models/Bonus.js";
import { ApiError } from "../utils/errorHandler.js";

export class BonusService {
  static async createBonus(userId, data) {
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
    } catch (error) {
      console.error("❌ Error creating bonus:", error);
      throw new ApiError(500, `Failed to create bonus: ${error.message}`);
    }
  }

  static async getAllBonuses(filters = {}) {
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

  static async updateBonus(id, userId, updates) {
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
    } catch (error) {
      throw new ApiError(500, `Failed to update bonus: ${error.message}`);
    }
  }

  static async approveBonus(id, userId, approved) {
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
    } catch (error) {
      throw new ApiError(
        500,
        `Failed to update bonus status: ${error.message}`
      );
    }
  }

  static async deleteBonus(id) {
    try {
      const bonus = await Bonus.findById(id);
      if (!bonus) {
        throw new ApiError(404, "Bonus not found");
      }

      if (bonus.approvalStatus === "approved") {
        throw new ApiError(400, "Cannot delete an approved bonus");
      }

      await Bonus.findByIdAndDelete(id);
    } catch (error) {
      throw new ApiError(500, `Failed to delete bonus: ${error.message}`);
    }
  }
}
