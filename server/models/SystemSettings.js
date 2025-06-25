import mongoose from "mongoose";
const { Schema } = mongoose;

const SystemSettingsSchema = new Schema(
  {
    payrollSettings: {
      processingDay: { type: Number, default: 25 },
      currency: { type: String, default: "NGN" },
      fiscalYear: { type: String, default: "2024" },
      payPeriod: { type: String, default: "monthly" },
    },
    quickSettings: {
      notifications: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export default mongoose.model("SystemSettings", SystemSettingsSchema);
