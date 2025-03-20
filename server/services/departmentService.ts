import Department, {
  DepartmentStatus,
  IDepartment,
} from "../models/Department.js";
import { ApiError } from "../utils/errorHandler.js";

export class DepartmentService {
  static async createDepartment(data: Partial<IDepartment>, userId: string) {
    try {
      const existingDepartment = await Department.findOne({
        $or: [{ name: data.name }, { code: data.code }],
      });

      if (existingDepartment) {
        throw new ApiError(
          400,
          "Department with this name or code already exists"
        );
      }

      const department = new Department({
        ...data,
        status: DepartmentStatus.ACTIVE,
        createdBy: userId,
        updatedBy: userId,
      });

      await department.save();
      return department;
    } catch (error) {
      throw error;
    }
  }
}
