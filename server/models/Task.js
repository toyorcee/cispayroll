import mongoose from "mongoose";
const { Schema } = mongoose;

// Enums
export const TaskStatus = {
  NOT_STARTED: "not_started",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
};

// Schema Definition
const TaskSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Task name is required"],
      trim: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.NOT_STARTED,
    },
    dueDate: {
      type: Date,
      required: false,
    },
    completedAt: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Methods
TaskSchema.methods.markAsCompleted = function () {
  this.completed = true;
  this.status = TaskStatus.COMPLETED;
  this.completedAt = new Date();
};

TaskSchema.methods.updateStatus = function (newStatus) {
  if (!Object.values(TaskStatus).includes(newStatus)) {
    throw new Error("Invalid task status");
  }
  this.status = newStatus;
  if (newStatus === TaskStatus.COMPLETED) {
    this.completed = true;
    this.completedAt = new Date();
  }
};

// Indexes
TaskSchema.index({ userId: 1 });
TaskSchema.index({ status: 1 });
TaskSchema.index({ dueDate: 1 });

export default mongoose.model("Task", TaskSchema);
