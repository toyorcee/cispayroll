import mongoose from "mongoose";
const { Schema } = mongoose;

const NotificationPreferenceSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    preferences: {
      inApp: {
        enabled: { type: Boolean, default: true },
        types: {
          payroll: { type: Boolean, default: true },
          leave: { type: Boolean, default: true },
          allowance: { type: Boolean, default: true },
          bonus: { type: Boolean, default: true },
          system: { type: Boolean, default: true },
          onboarding: { type: Boolean, default: true },
          offboarding: { type: Boolean, default: true },
          general: { type: Boolean, default: true },
        },
      },
      email: {
        enabled: { type: Boolean, default: true },
        types: {
          payroll: { type: Boolean, default: true },
          leave: { type: Boolean, default: true },
          allowance: { type: Boolean, default: true },
          bonus: { type: Boolean, default: true },
          system: { type: Boolean, default: true },
          onboarding: { type: Boolean, default: true },
          offboarding: { type: Boolean, default: true },
          general: { type: Boolean, default: true },
        },
        frequency: {
          type: String,
          enum: ["immediate", "daily", "weekly"],
          default: "immediate",
        },
      },
    },
    globalSettings: {
      quietHours: {
        enabled: { type: Boolean, default: false },
        startTime: { type: String, default: "22:00" },
        endTime: { type: String, default: "08:00" },
        timezone: { type: String, default: "Africa/Lagos" },
      },
      doNotDisturb: {
        enabled: { type: Boolean, default: false },
        until: Date,
      },
    },
  },
  { timestamps: true }
);

NotificationPreferenceSchema.index({ user: 1 });

NotificationPreferenceSchema.statics.getOrCreatePreferences = async function (
  userId
) {
  let preferences = await this.findOne({ user: userId });
  if (!preferences) {
    preferences = new this({ user: userId });
    await preferences.save();
  }
  return preferences;
};

// Instance method to check if user is in quiet hours
NotificationPreferenceSchema.methods.isInQuietHours = function () {
  if (!this.globalSettings.quietHours.enabled) {
    return false;
  }

  const now = new Date();
  const currentTime = now.toLocaleTimeString("en-US", {
    hour12: false,
    timeZone: this.globalSettings.quietHours.timezone || "Africa/Lagos",
  });

  const startTime = this.globalSettings.quietHours.startTime;
  const endTime = this.globalSettings.quietHours.endTime;

  // Handle overnight quiet hours (e.g., 22:00 to 08:00)
  if (startTime > endTime) {
    return currentTime >= startTime || currentTime <= endTime;
  } else {
    return currentTime >= startTime && currentTime <= endTime;
  }
};

// Instance method to check if do not disturb is active
NotificationPreferenceSchema.methods.isDoNotDisturbActive = function () {
  if (!this.globalSettings.doNotDisturb.enabled) {
    return false;
  }

  if (!this.globalSettings.doNotDisturb.until) {
    return false;
  }

  const now = new Date();
  return now < this.globalSettings.doNotDisturb.until;
};

export default mongoose.model(
  "NotificationPreference",
  NotificationPreferenceSchema
);
