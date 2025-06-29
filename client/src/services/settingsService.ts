import api from "./api";
import axios from "axios";

export const settingsService = {
  getGeneralSettings: async () => {
    try {
      // General settings are accessible to all authenticated users
      return await api.get("/api/settings/general");
    } catch (error: any) {
      console.error("❌ Error fetching general settings:", error);
      throw error;
    }
  },

  getCompanyProfile: async (userRole?: string, userPermissions?: string[]) => {
    try {
      // Check if user has the required permission
      const hasPermission = userPermissions?.includes("MANAGE_SYSTEM_SETTINGS");
      const isSuperAdmin = userRole === "SUPER_ADMIN";

      if (!hasPermission && !isSuperAdmin) {
        console.warn(
          "User lacks MANAGE_SYSTEM_SETTINGS permission - returning empty profile"
        );
        return { data: { data: null } };
      }

      return await api.get("/api/settings/company-profile");
    } catch (error: any) {
      console.error("❌ Error fetching company profile:", error);
      // Don't show toast for permission errors to avoid spam
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        console.warn(
          "Permission denied for company profile - this is expected for users without MANAGE_SYSTEM_SETTINGS permission"
        );
        return { data: { data: null } };
      }
      throw error;
    }
  },

  updateCompanyProfile: async (
    data: any,
    userRole?: string,
    userPermissions?: string[]
  ) => {
    try {
      // Check if user has the required permission
      const hasPermission = userPermissions?.includes("MANAGE_SYSTEM_SETTINGS");
      const isSuperAdmin = userRole === "SUPER_ADMIN";

      if (!hasPermission && !isSuperAdmin) {
        console.warn(
          "User lacks MANAGE_SYSTEM_SETTINGS permission - cannot update profile"
        );
        throw new Error("Insufficient permissions to update company profile");
      }

      return await api.put("/api/settings/company-profile", data);
    } catch (error: any) {
      console.error("❌ Error updating company profile:", error);
      throw error;
    }
  },

  getSystemSettings: async (userRole?: string, userPermissions?: string[]) => {
    try {
      // Check if user has the required permission
      const hasPermission = userPermissions?.includes("MANAGE_SYSTEM_SETTINGS");
      const isSuperAdmin = userRole === "SUPER_ADMIN";

      if (!hasPermission && !isSuperAdmin) {
        console.warn(
          "User lacks MANAGE_SYSTEM_SETTINGS permission - returning empty settings"
        );
        return { data: { data: null } };
      }

      return await api.get("/api/settings/system-settings");
    } catch (error: any) {
      console.error("❌ Error fetching system settings:", error);
      // Don't show toast for permission errors to avoid spam
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        console.warn(
          "Permission denied for system settings - this is expected for users without MANAGE_SYSTEM_SETTINGS permission"
        );
        return { data: { data: null } };
      }
      throw error;
    }
  },

  updateSystemSettings: async (
    data: any,
    userRole?: string,
    userPermissions?: string[]
  ) => {
    try {
      // Check if user has the required permission
      const hasPermission = userPermissions?.includes("MANAGE_SYSTEM_SETTINGS");
      const isSuperAdmin = userRole === "SUPER_ADMIN";

      if (!hasPermission && !isSuperAdmin) {
        console.warn(
          "User lacks MANAGE_SYSTEM_SETTINGS permission - cannot update settings"
        );
        throw new Error("Insufficient permissions to update system settings");
      }

      return await api.put("/api/settings/system-settings", data);
    } catch (error: any) {
      console.error("❌ Error updating system settings:", error);
      throw error;
    }
  },

  getIntegrationSettings: async (
    userRole?: string,
    userPermissions?: string[]
  ) => {
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

  updateIntegrationSettings: async (
    data: any,
    userRole?: string,
    userPermissions?: string[]
  ) => {
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
};
