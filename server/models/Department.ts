
import mongoose, { Document } from "mongoose";

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
  headOfDepartment?: string;
  email?: string;
  phone?: string;
  status: DepartmentStatus;
  createdBy: string;
  updatedBy: string;
}

// Document type
export interface DepartmentDocument extends Document, IDepartment {}

// Create the model type
export type DepartmentModel = mongoose.Model<DepartmentDocument>;

const DepartmentSchema = new mongoose.Schema<DepartmentDocument>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    headOfDepartment: { type: String },
    email: { type: String },
    phone: { type: String },
    status: {
      type: String,
      enum: Object.values(DepartmentStatus),
      default: DepartmentStatus.ACTIVE,
    },
    createdBy: { type: String, required: true },
    updatedBy: { type: String, required: true },
  },
  { timestamps: true }
);

// Create and export the model
const Department = mongoose.model<DepartmentDocument>(
  "Department",
  DepartmentSchema
);
export default Department;
