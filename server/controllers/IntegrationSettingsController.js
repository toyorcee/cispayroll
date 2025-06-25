import IntegrationSettings from "../models/IntegrationSettings.js";
import crypto from "crypto";

export const IntegrationSettingsController = {
  async getSettings(req, res) {
    try {
      let settings = await IntegrationSettings.findOne();
      const defaultIntegrations = [
        {
          id: "cloud-storage",
          name: "Cloud Storage",
          description:
            "Connect to cloud storage services for document management",
          icon: "CloudArrowUpIcon",
          options: [
            {
              id: "google-drive",
              name: "Google Drive",
              status: "available",
              lastSync: "",
            },
            {
              id: "dropbox",
              name: "Dropbox",
              status: "available",
              lastSync: "",
            },
            {
              id: "onedrive",
              name: "OneDrive",
              status: "available",
              lastSync: "",
            },
          ],
        },
        {
          id: "accounting",
          name: "Accounting Software",
          description:
            "Integrate with accounting and financial management systems",
          icon: "LockClosedIcon",
          options: [
            {
              id: "quickbooks",
              name: "QuickBooks",
              status: "available",
              lastSync: "",
            },
            {
              id: "xero",
              name: "Xero",
              status: "available",
              lastSync: "",
            },
            {
              id: "sage",
              name: "Sage",
              status: "available",
              lastSync: "",
            },
          ],
        },
      ];
      if (!settings) {
        // Create default integration settings
        const defaultSettings = {
          integrations: defaultIntegrations,
          apiAccess: {
            apiKey:
              "sk_" +
              Math.random().toString(36).substr(2, 9) +
              "_" +
              Date.now().toString(36),
            webhookUrl: "https://api.payrollcistechlab.com/webhooks/payroll",
          },
        };
        settings = await IntegrationSettings.create(defaultSettings);
      } else {
        // If integrations is missing or empty, set to default
        if (!settings.integrations || settings.integrations.length === 0) {
          try {
            settings.integrations = defaultIntegrations;
            await settings.save();
          } catch (err) {
            if (err.name === "VersionError") {
              await IntegrationSettings.deleteOne({ _id: settings._id });
              const defaultSettings = {
                integrations: defaultIntegrations,
                apiAccess: {
                  apiKey:
                    "sk_" +
                    Math.random().toString(36).substr(2, 9) +
                    "_" +
                    Date.now().toString(36),
                  webhookUrl:
                    "https://api.payrollcistechlab.com/webhooks/payroll",
                },
              };
              settings = await IntegrationSettings.create(defaultSettings);
            } else {
              throw err;
            }
          }
        }
      }
      res.json({
        success: true,
        message: "Integration settings retrieved successfully",
        data: settings,
      });
    } catch (err) {
      console.error(
        "[IntegrationSettingsController] Error getting settings:",
        err.message
      );
      res.status(500).json({
        success: false,
        message: "Failed to fetch integration settings",
        error: err.message,
      });
    }
  },

  async updateSettings(req, res) {
    try {
      let settings = await IntegrationSettings.findOne();
      // Filter out MongoDB-specific fields that shouldn't be updated
      const { _id, createdAt, updatedAt, __v, ...updateData } = req.body;
      if (!settings) {
        settings = await IntegrationSettings.create(updateData);
      } else {
        await IntegrationSettings.updateOne({ _id: settings._id }, updateData);
        settings = await IntegrationSettings.findById(settings._id);
      }
      res.json({
        success: true,
        message: "Integration settings updated successfully",
        data: settings,
      });
    } catch (err) {
      console.error(
        "[IntegrationSettingsController] Error updating settings:",
        err.message
      );
      res.status(500).json({
        success: false,
        message: "Failed to update integration settings",
        error: err.message,
      });
    }
  },

  // --- New: Generate a new API key ---
  async generateApiKey(req, res) {
    try {
      let settings = await IntegrationSettings.findOne();
      if (!settings) {
        return res.status(404).json({
          success: false,
          message: "Integration settings not found.",
        });
      }
      // Generate a secure random API key
      const newApiKey = "sk_" + crypto.randomBytes(32).toString("hex");
      settings.apiAccess.apiKey = newApiKey;
      await settings.save();
      res.json({
        success: true,
        message: "New API key generated successfully.",
        apiKey: newApiKey,
      });
    } catch (err) {
      console.error(
        "[IntegrationSettingsController] Error generating API key:",
        err.message
      );
      res.status(500).json({
        success: false,
        message: "Failed to generate new API key.",
        error: err.message,
      });
    }
  },

  // --- New: Update webhook URL ---
  async updateWebhookUrl(req, res) {
    try {
      const { webhookUrl } = req.body;
      if (!webhookUrl || typeof webhookUrl !== "string") {
        return res.status(400).json({
          success: false,
          message: "Invalid webhook URL.",
        });
      }
      // Basic URL validation
      const urlPattern = /^https?:\/\//i;
      if (!urlPattern.test(webhookUrl)) {
        return res.status(400).json({
          success: false,
          message: "Webhook URL must start with http:// or https://",
        });
      }
      let settings = await IntegrationSettings.findOne();
      if (!settings) {
        return res.status(404).json({
          success: false,
          message: "Integration settings not found.",
        });
      }
      settings.apiAccess.webhookUrl = webhookUrl;
      await settings.save();
      res.json({
        success: true,
        message: "Webhook URL updated successfully.",
        webhookUrl,
      });
    } catch (err) {
      console.error(
        "[IntegrationSettingsController] Error updating webhook URL:",
        err.message
      );
      res.status(500).json({
        success: false,
        message: "Failed to update webhook URL.",
        error: err.message,
      });
    }
  },
};
