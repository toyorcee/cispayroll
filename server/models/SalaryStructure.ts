import mongoose, { Schema, Document, Types } from "mongoose";

// Base interface for salary component data
export interface ISalaryComponentBase {
  name: string;
  type: "fixed" | "percentage";
  value: number;
  isActive: boolean;
  description?: string;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
}

// Interface for salary component as stored in MongoDB
export interface ISalaryComponent extends ISalaryComponentBase {
  _id: Types.ObjectId;
}

// Interface for input when creating/updating components
export interface ISalaryComponentInput
  extends Omit<ISalaryComponentBase, "createdBy" | "updatedBy"> {
  description?: string;
}

// Interface for the entire salary grade document
export interface ISalaryGrade extends Document {
  level: string;
  basicSalary: number;
  components: ISalaryComponent[];
  description?: string;
  isActive: boolean;
  department?: Types.ObjectId;
  departmentName?: string;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Schema for salary components
const SalaryComponentSchema = new Schema<ISalaryComponent>(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ["fixed", "percentage"], required: true },
    value: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    description: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { _id: true }
); // Explicitly enable _id

// Schema for salary grade
const SalaryGradeSchema = new Schema<ISalaryGrade>(
  {
    level: { type: String, required: true, unique: true },
    basicSalary: { type: Number, required: true },
    components: [SalaryComponentSchema],
    description: { type: String },
    isActive: { type: Boolean, default: true },
    department: { type: Schema.Types.ObjectId, ref: "Department" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ISalaryGrade>("SalaryGrade", SalaryGradeSchema);
