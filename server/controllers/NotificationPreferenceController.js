import NotificationPreference from "../models/NotificationPreference.js";
import { ApiError } from "../utils/errorHandler.js";

export const NotificationPreferenceController = {
  // Get user's notification preferences
  async getPreferences(req, res) {
    try {
      const preferences = await NotificationPreference.getOrCreatePreferences(
        req.user._id
      );
      res.json({
        success: true,
        message: "Notification preferences retrieved successfully",
        data: preferences,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to retrieve notification preferences",
        error: error.message,
      });
    }
  },

  // Update user's notification preferences
  async updatePreferences(req, res) {
    try {
      const { preferences, globalSettings } = req.body;
      // Validate the structure
      if (preferences && typeof preferences !== "object") {
        throw new ApiError(400, "Invalid preferences structure");
      }
      if (globalSettings && typeof globalSettings !== "object") {
        throw new ApiError(400, "Invalid global settings structure");
      }
      // Get or create preferences
      let userPreferences = await NotificationPreference.getOrCreatePreferences(
        req.user._id
      );
      // Update preferences if provided
      if (preferences) {
        if (preferences.inApp) {
          userPreferences.preferences.inApp = {
            ...userPreferences.preferences.inApp,
            ...preferences.inApp,
          };
        }
        if (preferences.email) {
          userPreferences.preferences.email = {
            ...userPreferences.preferences.email,
            ...preferences.email,
          };
        }
      }
      // Update global settings if provided
      if (globalSettings) {
        userPreferences.globalSettings = {
          ...userPreferences.globalSettings,
          ...globalSettings,
        };
      }
      // Save the updated preferences
      await userPreferences.save();
      res.json({
        success: true,
        message: "Notification preferences updated successfully",
        data: userPreferences,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Failed to update notification preferences",
          error: error.message,
        });
      }
    }
  },

  // Reset user's notification preferences to defaults
  async resetPreferences(req, res) {
    try {
      // Delete existing preferences
      await NotificationPreference.findOneAndDelete({ user: req.user._id });
      // Create new default preferences
      const newPreferences =
        await NotificationPreference.getOrCreatePreferences(req.user._id);
      res.json({
        success: true,
        message: "Notification preferences reset to defaults successfully",
        data: newPreferences,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to reset notification preferences",
        error: error.message,
      });
    }
  },

  // Toggle specific notification type
  async toggleNotificationType(req, res) {
    try {
      const { channel, type, enabled } = req.body;
      // Get current preferences before change
      const preferences = await NotificationPreference.getOrCreatePreferences(
        req.user._id
      );
      // Validate parameters
      if (!channel || !type || typeof enabled !== "boolean") {
        throw new ApiError(
          400,
          "Invalid parameters. Required: channel, type, enabled"
        );
      }
      if (!["inApp", "email"].includes(channel)) {
        throw new ApiError(400, "Invalid channel. Must be 'inApp' or 'email'");
      }
      const validTypes = [
        "payroll",
        "leave",
        "allowance",
        "bonus",
        "system",
        "onboarding",
        "offboarding",
        "general",
      ];
      if (!validTypes.includes(type)) {
        throw new ApiError(
          400,
          `Invalid type. Must be one of: ${validTypes.join(", ")}`
        );
      }
      // Update the specific type
      preferences.preferences[channel].types[type] = enabled;
      await preferences.save();
      res.json({
        success: true,
        message: `${type} notifications ${
          enabled ? "enabled" : "disabled"
        } for ${channel}`,
        data: preferences,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Failed to toggle notification type",
          error: error.message,
        });
      }
    }
  },

  // Toggle channel (inApp or email)
  async toggleChannel(req, res) {
    try {
      const { channel, enabled } = req.body;
      // Get current preferences before change
      const preferences = await NotificationPreference.getOrCreatePreferences(
        req.user._id
      );
      // Validate parameters
      if (!channel || typeof enabled !== "boolean") {
        throw new ApiError(
          400,
          "Invalid parameters. Required: channel, enabled"
        );
      }
      if (!["inApp", "email"].includes(channel)) {
        throw new ApiError(400, "Invalid channel. Must be 'inApp' or 'email'");
      }
      // Update the channel
      preferences.preferences[channel].enabled = enabled;
      await preferences.save();
      res.json({
        success: true,
        message: `${channel} notifications ${enabled ? "enabled" : "disabled"}`,
        data: preferences,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Failed to toggle notification channel",
          error: error.message,
        });
      }
    }
  },
};
