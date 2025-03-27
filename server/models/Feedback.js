import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Work Environment",
        "Management",
        "Compensation",
        "Benefits",
        "Processes",
        "Technology",
        "Team Dynamics",
        "Professional Development",
        "Other"
      ],
    },
    description: {
      type: String,
      required: true,
    },
    recipientDepartment: {
      type: String,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Resolved"],
      default: "Pending",
    },
    adminComments: {
      type: String,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const Feedback = mongoose.model("Feedback", feedbackSchema);

export default Feedback; 