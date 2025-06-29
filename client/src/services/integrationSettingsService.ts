import api from "./api";
import axios from "axios";

export const integrationSettingsService = {
  async getIntegrationSettings(userRole?: string, userPermissions?: string[]) {
    try {
      // Check if user has the required permission
      const hasPermission = userPermissions?.includes(
        "MANAGE_INTEGRATION_SETTINGS"
      );
      const isSuperAdmin = userRole === "SUPER_ADMIN";

      if (!hasPermission && !isSuperAdmin) {
        console.warn(
          "User lacks MANAGE_INTEGRATION_SETTINGS permission - returning empty integration settings"
        );
        return { data: { data: null } };
      }

      return await api.get("/api/settings/integration-settings");
    } catch (error: any) {
      console.error("❌ Error fetching integration settings:", error);
      // Don't show toast for permission errors to avoid spam
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        console.warn(
          "Permission denied for integration settings - this is expected for users without MANAGE_INTEGRATION_SETTINGS permission"
        );
        return { data: { data: null } };
      }
      throw error;
    }
  },

  async updateIntegrationSettings(
    data: any,
    userRole?: string,
    userPermissions?: string[]
  ) {
    try {
      // Check if user has the required permission
      const hasPermission = userPermissions?.includes(
        "MANAGE_INTEGRATION_SETTINGS"
      );
      const isSuperAdmin = userRole === "SUPER_ADMIN";

      if (!hasPermission && !isSuperAdmin) {
        console.warn(
          "User lacks MANAGE_INTEGRATION_SETTINGS permission - cannot update integration settings"
        );
        throw new Error(
          "Insufficient permissions to update integration settings"
        );
      }

      return await api.put("/api/settings/integration-settings", data);
    } catch (error: any) {
      console.error("❌ Error updating integration settings:", error);
      throw error;
    }
  },

  async generateApiKey(userRole?: string, userPermissions?: string[]) {
    try {
      // Check if user has the required permission
      const hasPermission = userPermissions?.includes(
        "MANAGE_INTEGRATION_SETTINGS"
      );
      const isSuperAdmin = userRole === "SUPER_ADMIN";

      if (!hasPermission && !isSuperAdmin) {
        console.warn(
          "User lacks MANAGE_INTEGRATION_SETTINGS permission - cannot generate API key"
        );
        throw new Error("Insufficient permissions to generate API key");
      }

      return await api.post("/api/settings/integration-settings/api-key");
    } catch (error: any) {
      console.error("❌ Error generating API key:", error);
      throw error;
    }
  },

  async updateWebhookUrl(
    webhookUrl: string,
    userRole?: string,
    userPermissions?: string[]
  ) {
    try {
      // Check if user has the required permission
      const hasPermission = userPermissions?.includes(
        "MANAGE_INTEGRATION_SETTINGS"
      );
      const isSuperAdmin = userRole === "SUPER_ADMIN";

      if (!hasPermission && !isSuperAdmin) {
        console.warn(
          "User lacks MANAGE_INTEGRATION_SETTINGS permission - cannot update webhook URL"
        );
        throw new Error("Insufficient permissions to update webhook URL");
      }

      return await api.put("/api/settings/integration-settings/webhook-url", {
        webhookUrl,
      });
    } catch (error: any) {
      console.error("❌ Error updating webhook URL:", error);
      throw error;
    }
  },
};
