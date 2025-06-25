import api from "./api";

export interface NotificationType {
  payroll: boolean;
  leave: boolean;
  allowance: boolean;
  bonus: boolean;
  system: boolean;
  onboarding: boolean;
  offboarding: boolean;
  general: boolean;
}

export interface NotificationChannel {
  enabled: boolean;
  types: NotificationType;
}

export interface EmailPreferences extends NotificationChannel {
  frequency: "immediate" | "daily" | "weekly";
}

export interface QuietHours {
  enabled: boolean;
  startTime: string;
  endTime: string;
  timezone: string;
}

export interface DoNotDisturb {
  enabled: boolean;
  until?: Date;
}

export interface NotificationPreferences {
  user: string;
  preferences: {
    inApp: NotificationChannel;
    email: EmailPreferences;
  };
  globalSettings: {
    quietHours: QuietHours;
    doNotDisturb: DoNotDisturb;
  };
}

export const notificationPreferenceService = {
  // Get user's notification preferences
  getPreferences: () => api.get("/api/notification-preferences"),

  // Update user's notification preferences
  updatePreferences: (data: Partial<NotificationPreferences>) =>
    api.put("/api/notification-preferences", data),

  // Reset user's notification preferences to defaults
  resetPreferences: () => api.post("/api/notification-preferences/reset"),

  // Toggle specific notification type
  toggleNotificationType: (
    channel: "inApp" | "email",
    type: string,
    enabled: boolean
  ) =>
    api.post("/api/notification-preferences/toggle-type", {
      channel,
      type,
      enabled,
    }),

  // Toggle notification channel (inApp or email)
  toggleChannel: (channel: "inApp" | "email", enabled: boolean) =>
    api.post("/api/notification-preferences/toggle-channel", {
      channel,
      enabled,
    }),
};
