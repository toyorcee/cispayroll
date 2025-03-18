import { Types, FilterQuery } from "mongoose";
import SalaryGrade, {
  ISalaryComponent,
  ISalaryComponentInput,
  ISalaryGrade,
} from "../models/SalaryStructure.js";
import { ApiError } from "../utils/errorHandler.js";

export class SalaryStructureService {
  // Create a new salary grade
  static async createSalaryGrade(data: {
    level: string;
    basicSalary: number;
    components: ISalaryComponent[];
    description?: string;
    department?: Types.ObjectId | null;
    createdBy: Types.ObjectId;
  }): Promise<ISalaryGrade> {
    const existingGrade = await SalaryGrade.findOne({ level: data.level });
    if (existingGrade) {
      throw new ApiError(400, "Salary grade level already exists");
    }

    const salaryGrade = await SalaryGrade.create({
      ...data,
      updatedBy: data.createdBy,
    });

    return await salaryGrade.populate([
      { path: "department", select: "name code" },
    ]);
  }

  // Update a salary grade
  static async updateSalaryGrade(
    gradeId: string,
    data: Partial<ISalaryGrade> & { department?: Types.ObjectId | null },
    updatedBy: Types.ObjectId
  ): Promise<ISalaryGrade> {
    const salaryGrade = await SalaryGrade.findById(gradeId);
    if (!salaryGrade) {
      throw new ApiError(404, "Salary grade not found");
    }

    Object.assign(salaryGrade, {
      ...data,
      updatedBy,
    });

    await salaryGrade.save();

    return await salaryGrade.populate([
      { path: "department", select: "name code" },
    ]);
  }

  // Get all salary grades with department filter
  static async getAllSalaryGrades(
    filters: {
      isActive?: boolean;
      department?: Types.ObjectId;
    } = {}
  ): Promise<ISalaryGrade[]> {
    const query: FilterQuery<ISalaryGrade> = { ...filters };

    // If department is undefined, get all grades (both with and without departments)
    // If department is null, get only grades without departments
    // If department has a value, get grades for that department
    if (filters.department === null) {
      query.department = { $exists: false } as any;
    } else if (filters.department) {
      query.department = filters.department;
    }

    return SalaryGrade.find(query)
      .sort({ level: 1 })
      .populate([
        { path: "createdBy", select: "firstName lastName" },
        { path: "updatedBy", select: "firstName lastName" },
        { path: "department", select: "name code" },
      ]);
  }

  // Get salary grades by department
  static async getSalaryGradesByDepartment(
    departmentId: Types.ObjectId | null
  ): Promise<ISalaryGrade[]> {
    const query: FilterQuery<ISalaryGrade> = departmentId
      ? { department: departmentId }
      : { department: { $exists: false } as any };

    return SalaryGrade.find(query)
      .sort({ level: 1 })
      .populate("department", "name code");
  }

  // Get salary grade by ID
  static async getSalaryGradeById(id: string): Promise<ISalaryGrade> {
    const salaryGrade = await SalaryGrade.findById(id).populate([
      { path: "createdBy", select: "firstName lastName" },
      { path: "updatedBy", select: "firstName lastName" },
    ]);

    if (!salaryGrade) {
      throw new ApiError(404, "Salary grade not found");
    }

    return salaryGrade;
  }

  // Add component to salary grade
  static async addComponent(
    gradeId: string,
    component: ISalaryComponentInput,
    updatedBy: Types.ObjectId
  ): Promise<ISalaryGrade> {
    const salaryGrade = await SalaryGrade.findById(gradeId);
    if (!salaryGrade) {
      throw new ApiError(404, "Salary grade not found");
    }

    const newComponent = {
      ...component,
      _id: new Types.ObjectId(),
      createdBy: updatedBy,
      updatedBy,
    } as ISalaryComponent;

    salaryGrade.components.push(newComponent);
    salaryGrade.updatedBy = updatedBy;

    await salaryGrade.save();
    return salaryGrade;
  }

  // Update component in salary grade
  static async updateComponent(
    gradeId: string,
    componentId: string,
    updates: Partial<ISalaryComponentInput>,
    updatedBy: Types.ObjectId
  ): Promise<ISalaryGrade> {
    const salaryGrade = await SalaryGrade.findById(gradeId);
    if (!salaryGrade) {
      throw new ApiError(404, "Salary grade not found");
    }

    const componentIndex = salaryGrade.components.findIndex(
      (c) => c._id.toString() === componentId
    );

    if (componentIndex === -1) {
      throw new ApiError(404, "Component not found in salary grade");
    }

    const existingComponent = salaryGrade.components[componentIndex];
    const updatedComponent: ISalaryComponent = {
      ...existingComponent,
      ...updates,
      _id: existingComponent._id,
      updatedBy,
      createdBy: existingComponent.createdBy,
    };

    salaryGrade.components[componentIndex] = updatedComponent;
    salaryGrade.updatedBy = updatedBy;
    await salaryGrade.save();
    return salaryGrade;
  }

  // Calculate total salary for a grade
  static calculateTotalSalary(salaryGrade: ISalaryGrade): {
    basicSalary: number;
    totalAllowances: number;
    grossSalary: number;
  } {
    const basicSalary = salaryGrade.basicSalary;
    let totalAllowances = 0;

    salaryGrade.components.forEach((component) => {
      if (component.isActive) {
        if (component.type === "fixed") {
          totalAllowances += component.value;
        } else {
          // percentage
          totalAllowances += (basicSalary * component.value) / 100;
        }
      }
    });

    return {
      basicSalary,
      totalAllowances,
      grossSalary: basicSalary + totalAllowances,
    };
  }
}
