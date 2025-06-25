import mongoose from "mongoose";
const { Schema } = mongoose;

const IntegrationOptionSchema = new Schema(
  {
    id: String,
    name: String,
    status: {
      type: String,
      enum: ["connected", "available"],
      default: "available",
    },
    lastSync: String,
  },
  { _id: false }
);

const IntegrationCategorySchema = new Schema(
  {
    id: String,
    name: String,
    description: String,
    icon: String,
    options: [IntegrationOptionSchema],
  },
  { _id: false }
);

const IntegrationSettingsSchema = new Schema(
  {
    integrations: [IntegrationCategorySchema],
    apiAccess: {
      apiKey: { type: String },
      webhookUrl: { type: String },
    },
  },
  { timestamps: true }
);

export default mongoose.model("IntegrationSettings", IntegrationSettingsSchema);
