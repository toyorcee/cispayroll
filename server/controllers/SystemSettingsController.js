import SystemSettings from "../models/SystemSettings.js";
import { PayrollService } from "../services/PayrollService.js";

export const SystemSettingsController = {
  async getSettings(req, res) {
    try {
      let settings = await SystemSettings.findOne();
      if (!settings) {
        settings = await SystemSettings.create({});
      }
      res.json({
        success: true,
        message: "System settings retrieved successfully",
        data: settings,
      });
    } catch (err) {
      console.error(
        "[SystemSettingsController] Error getting settings:",
        err.message
      );
      res.status(500).json({
        success: false,
        message: "Failed to fetch system settings",
        error: err.message,
      });
    }
  },

  async updateSettings(req, res) {
    try {
      // Only allow specific fields to be updated
      const allowedFields = {
        payrollSettings: req.body.payrollSettings,
        quickSettings: req.body.quickSettings,
      };

      // Filter out any undefined fields
      const updateData = {};
      Object.keys(allowedFields).forEach((key) => {
        if (allowedFields[key] !== undefined) {
          updateData[key] = allowedFields[key];
        }
      });

      // Remove any autoBackup field if it exists
      if (
        updateData.quickSettings &&
        updateData.quickSettings.autoBackup !== undefined
      ) {
        delete updateData.quickSettings.autoBackup;
      }

      // Use findOneAndUpdate with upsert for more efficient updates
      const settings = await SystemSettings.findOneAndUpdate(
        {}, // empty filter to match any document
        { $set: updateData },
        {
          new: true, // return the updated document
          upsert: true, // create if doesn't exist
          runValidators: true, // run schema validators
        }
      );

      res.json({
        success: true,
        message: "System settings updated successfully",
        data: settings,
      });
    } catch (err) {
      console.error(
        "[SystemSettingsController] Error updating settings:",
        err.message
      );
      res.status(500).json({
        success: false,
        message: "Failed to update system settings",
        error: err.message,
      });
    }
  },

  async validatePayPeriodSettings(req, res) {
    try {
      const { frequency } = req.params;

      if (!frequency) {
        return res.status(400).json({
          success: false,
          message: "Frequency parameter is required",
        });
      }

      const validation = await PayrollService.validatePayPeriodSettings(
        null,
        frequency
      );

      res.json({
        success: true,
        message: "Pay period validation completed",
        data: validation,
      });
    } catch (err) {
      console.error(
        "[SystemSettingsController] Error validating pay period settings:",
        err.message
      );
      res.status(500).json({
        success: false,
        message: "Failed to validate pay period settings",
        error: err.message,
      });
    }
  },
};
