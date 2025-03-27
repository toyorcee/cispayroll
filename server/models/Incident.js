import mongoose from "mongoose";

const incidentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      required: true,
    },
    location: {
      type: String,
    },
    dateTime: {
      type: Date,
      default: Date.now,
    },
    involvedPersons: {
      type: String,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    department: {
      type: String,
    },
    status: {
      type: String,
      enum: ["Reported", "Under Investigation", "Resolved", "Closed"],
      default: "Reported",
    },
    resolution: {
      type: String,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    resolutionDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Incident = mongoose.model("Incident", incidentSchema);

export default Incident; 