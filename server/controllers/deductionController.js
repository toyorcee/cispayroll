// controllers/deductionController.js
import { DeductionService } from "../services/DeductionService.js";
import { handleError, ApiError } from "../utils/errorHandler.js";
import User from "../models/User.js";
import Deduction from "../models/Deduction.js";

export class DeductionController {
  // Get user's deduction preferences
  static async getUserDeductionPreferences(req, res) {
    try {
      const userId = req.params.userId || req.user.id;
      const user = await User.findById(userId)
        .populate({
          path: "deductionPreferences.voluntary.standardVoluntary.deduction",
          select: "name calculationMethod value",
        })
        .populate({
          path: "deductionPreferences.voluntary.customVoluntary.deduction",
          select: "name calculationMethod value",
        });

      if (!user) {
        throw new ApiError(404, "User not found");
      }

      // Ensure we have the deduction preferences structure
      if (!user.deductionPreferences) {
        user.deductionPreferences = {
          statutory: {
            defaultStatutory: {
              pension: {
                opted: true,
                optedAt: new Date(),
                optedBy: userId,
                reason: null,
                notes: "Initial setup",
              },
              nhf: {
                opted: true,
                optedAt: new Date(),
                optedBy: userId,
                reason: null,
                notes: "Initial setup",
              },
            },
            customStatutory: [],
          },
          voluntary: {
            standardVoluntary: [],
            customVoluntary: [],
          },
        };
        await user.save();
      }

      res.status(200).json({
        success: true,
        data: user.deductionPreferences,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  // Update statutory deduction preferences (opt in/out)
  static async updateStatutoryPreference(req, res) {
    try {
      const userId = req.params.userId || req.user.id;
      const { deductionType, opted, reason } = req.body;

      if (!deductionType || opted === undefined) {
        throw new ApiError(400, "Deduction type and opted status are required");
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new ApiError(404, "User not found");
      }

      // Validate deduction type exists
      if (
        !user.deductionPreferences.statutory.defaultStatutory[deductionType]
      ) {
        throw new ApiError(400, "Invalid deduction type");
      }

      // Update preference
      user.deductionPreferences.statutory.defaultStatutory[deductionType] = {
        opted,
        optedAt: new Date(),
        optedBy: req.user.id,
        reason: reason || null,
        notes: `${
          opted ? "Opted in" : "Opted out"
        } by ${req.user.role.toLowerCase()}`,
      };

      await user.save();

      res.status(200).json({
        success: true,
        message: `Successfully ${
          opted ? "opted in to" : "opted out of"
        } ${deductionType}`,
        data: user.deductionPreferences,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  // Add voluntary deduction preference
  static async addVoluntaryDeduction(req, res) {
    try {
      const userId = req.params.userId || req.user.id;
      const { deductionId, amount, percentage, startDate, endDate, notes } =
        req.body;

      if (!deductionId) {
        throw new ApiError(400, "Deduction ID is required");
      }

      const [user, deduction] = await Promise.all([
        User.findById(userId),
        Deduction.findById(deductionId),
      ]);

      if (!user) {
        throw new ApiError(404, "User not found");
      }

      if (!deduction) {
        throw new ApiError(404, "Deduction not found");
      }

      // Validate amount/percentage based on deduction type
      if (
        deduction.calculationMethod === "percentage" &&
        (!percentage || percentage < 0 || percentage > 100)
      ) {
        throw new ApiError(
          400,
          "Valid percentage between 0 and 100 is required"
        );
      }

      if (deduction.calculationMethod === "fixed" && (!amount || amount <= 0)) {
        throw new ApiError(400, "Valid positive amount is required");
      }

      const deductionData = {
        deduction: deductionId,
        opted: true,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        optedAt: new Date(),
        optedBy: req.user.id,
        amount,
        percentage,
        notes,
      };

      const arrayPath = deduction.isCustom
        ? "customVoluntary"
        : "standardVoluntary";
      user.deductionPreferences.voluntary[arrayPath].push(deductionData);

      await user.save();

      res.status(200).json({
        success: true,
        message: "Voluntary deduction added successfully",
        data: user.deductionPreferences,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  // Remove voluntary deduction
  static async removeVoluntaryDeduction(req, res) {
    try {
      const userId = req.params.userId || req.user.id;
      const { deductionId } = req.params;

      if (!deductionId) {
        throw new ApiError(400, "Deduction ID is required");
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new ApiError(404, "User not found");
      }

      // Remove from both standard and custom voluntary deductions
      user.deductionPreferences.voluntary.standardVoluntary =
        user.deductionPreferences.voluntary.standardVoluntary.filter(
          (d) => d.deduction.toString() !== deductionId
        );

      user.deductionPreferences.voluntary.customVoluntary =
        user.deductionPreferences.voluntary.customVoluntary.filter(
          (d) => d.deduction.toString() !== deductionId
        );

      await user.save();

      res.status(200).json({
        success: true,
        message: "Voluntary deduction removed successfully",
        data: user.deductionPreferences,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }
}
