import mongoose from "mongoose"; // Use ES module syntax

const disciplinaryCaseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId, ref: "User", required: true,
    required: true,
  },
  evidence: {
    type: String, // This will store the file path to uploaded evidence
  },
  date: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["Active", "Resolved", "Approved"],
    default: "Active",
  },
  tracking: [
    {
      update: String,
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

// Use "export default" for ES module syntax
const DisciplinaryCase = mongoose.model("DisciplinaryCase", disciplinaryCaseSchema);
export default DisciplinaryCase;
