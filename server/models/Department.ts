import mongoose, { Schema, Model, Types } from "mongoose";
import { UserDocument } from "./User.js";

// Define department status
export enum DepartmentStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

// Base interface for department properties
export interface IDepartment {
  name: string;
  code: string; // Unique department code (e.g., HR001, IT001)
  description: string;
  headOfDepartment: Types.ObjectId | UserDocument; // Reference to User model
  status: DepartmentStatus;
  location: string;
  email?: string; // Department email if any
  phone?: string; // Department contact number if any
  createdBy: Types.ObjectId | UserDocument;
  updatedBy: Types.ObjectId | UserDocument;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for department methods
export interface IDepartmentMethods {
  isActive(): boolean;
}

// Create the document type
export interface DepartmentDocument
  extends mongoose.Document,
    IDepartment,
    IDepartmentMethods {}

// Create the model type
export type DepartmentModel = Model<DepartmentDocument>;

const DepartmentSchema = new Schema<DepartmentDocument, DepartmentModel>(
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
      uppercase: true,
    },
    description: {
      type: String,
      required: [true, "Department description is required"],
      trim: true,
    },
    headOfDepartment: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Head of department is required"],
    },
    status: {
      type: String,
      enum: Object.values(DepartmentStatus),
      default: DepartmentStatus.ACTIVE,
    },
    location: {
      type: String,
      required: [true, "Department location is required"],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email address",
      ],
    },
    phone: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Add methods
DepartmentSchema.methods.isActive = function (
  this: DepartmentDocument
): boolean {
  return this.status === DepartmentStatus.ACTIVE;
};

// Add virtual for employee count (will be populated when needed)
DepartmentSchema.virtual("employeeCount", {
  ref: "User",
  localField: "_id",
  foreignField: "department",
  count: true,
});

// Add indexes for frequently queried fields
DepartmentSchema.index({ name: 1 });
DepartmentSchema.index({ code: 1 });
DepartmentSchema.index({ status: 1 });
DepartmentSchema.index({ headOfDepartment: 1 });

// Add middleware to prevent deletion if department has employees
DepartmentSchema.pre("deleteOne", async function (next) {
  const departmentId = this.getQuery()["_id"];
  const User = mongoose.model("User");

  const employeeCount = await User.countDocuments({ department: departmentId });
  if (employeeCount > 0) {
    next(new Error("Cannot delete department with existing employees"));
  }
  next();
});

// Add middleware to update all related users when department status changes
DepartmentSchema.pre("save", async function (this: DepartmentDocument, next) {
  if (this.isModified("status") && this.status === DepartmentStatus.INACTIVE) {
    const User = mongoose.model("User");
    await User.updateMany(
      { department: this._id },
      { $set: { status: "inactive" } }
    );
  }
  next();
});

export default mongoose.model<DepartmentDocument, DepartmentModel>(
  "Department",
  DepartmentSchema
);
