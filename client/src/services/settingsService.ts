import api from "./api"; 

export const settingsService = {
  getCompanyProfile: () => api.get("/api/settings/company-profile"),
  updateCompanyProfile: (data: any) =>
    api.put("/api/settings/company-profile", data),

  getSystemSettings: () => api.get("/api/settings/system-settings"),
  updateSystemSettings: (data: any) =>
    api.put("/api/settings/system-settings", data),

  getIntegrationSettings: () => api.get("/api/settings/integration-settings"),
  updateIntegrationSettings: (data: any) =>
    api.put("/api/settings/integration-settings", data),
};