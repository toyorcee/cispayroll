import mongoose, { Document, Schema, Types } from "mongoose";

// Define department status
export enum DepartmentStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

// Base interface for department properties
export interface IDepartment {
  name: string;
  code: string;
  description: string;
  location: string;
  headOfDepartment: Types.ObjectId;
  status: "active" | "inactive";
  createdBy: Types.ObjectId | string;
  updatedBy: Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
}

// Document type
export interface DepartmentDocument extends Document, IDepartment {}

// Create the model type
export type DepartmentModel = mongoose.Model<DepartmentDocument>;

const DepartmentSchema = new mongoose.Schema<DepartmentDocument>(
  {
    name: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    headOfDepartment: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// Create and export the model
const Department = mongoose.model<DepartmentDocument>(
  "Department",
  DepartmentSchema
);
export default Department;
