import mongoose, { Document, Schema } from "mongoose";

export enum TaskStatus {
  NOT_STARTED = "not_started",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
}

export interface ITask {
  name: string;
  completed: boolean;
  userId: mongoose.Types.ObjectId;
  status: TaskStatus;
  dueDate?: Date;
  completedAt?: Date;
}

export interface TaskDocument extends Document, ITask {}

const TaskSchema = new Schema(
  {
    name: { type: String, required: true },
    completed: { type: Boolean, default: false },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.NOT_STARTED,
    },
    dueDate: Date,
    completedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model<TaskDocument>("Task", TaskSchema);
