import api from "./api";

export const integrationSettingsService = {
  async getIntegrationSettings() {
    return api.get("/api/settings/integration-settings");
  },

  async updateIntegrationSettings(data: any) {
    return api.put("/api/settings/integration-settings", data);
  },

  async generateApiKey() {
    return api.post("/api/settings/integration-settings/api-key");
  },

  async updateWebhookUrl(webhookUrl: string) {
    return api.put("/api/settings/integration-settings/webhook-url", {
      webhookUrl,
    });
  },
};
