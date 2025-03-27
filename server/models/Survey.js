import mongoose from "mongoose";

// Question schema for survey questions
const questionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["Multiple Choice", "Single Choice", "Text Response", "Rating Scale", "Yes/No"],
    default: "Text Response",
  },
  options: [{
    type: String,
  }],
  required: {
    type: Boolean,
    default: true,
  },
});

const surveySchema = new mongoose.Schema(
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
    questions: [questionSchema],
    targetDepartments: [{
      type: String,
      // Optional: If storing as Object IDs, use:
      // type: mongoose.Schema.Types.ObjectId,
      // ref: "Department",
    }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["Draft", "Active", "Expired", "Closed"],
      default: "Active",
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    responseCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-update status based on expiration date
surveySchema.pre('find', function() {
  this.updateMany(
    { status: 'Active', expiresAt: { $lt: new Date() } },
    { $set: { status: 'Expired' } }
  );
});

const Survey = mongoose.model("Survey", surveySchema);

export default Survey; 