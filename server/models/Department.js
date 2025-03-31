import mongoose from "mongoose";
const { Schema } = mongoose;

// Constants
export const DepartmentStatus = {
  ACTIVE: "active",
  INACTIVE: "inactive",
};

const DepartmentSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Department name is required"],
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: [true, "Department code is required"],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Department description is required"],
    },
    location: {
      type: String,
      required: [true, "Department location is required"],
    },
    headOfDepartment: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    status: {
      type: String,
      enum: Object.values(DepartmentStatus),
      default: DepartmentStatus.ACTIVE,
      required: [true, "Department status is required"],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator is required"],
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  { timestamps: true }
);

// Indexes
DepartmentSchema.index({ name: 1 });
DepartmentSchema.index({ code: 1 });
DepartmentSchema.index({ status: 1 });

export default mongoose.model("Department", DepartmentSchema);
