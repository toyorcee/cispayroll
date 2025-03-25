import Department, {
  DepartmentStatus,
} from "../models/Department.js";
import { ApiError } from "../utils/errorHandler.js";
import UserModel, { UserRole } from "../models/User.js";

export class DepartmentService {
  static async createDepartment(data, userId) {
    try {
      if (!data.name || !data.code || !data.headOfDepartment) {
        throw new ApiError(
          400,
          "Name, code, and head of department are required"
        );
      }

      // Check if department already exists
      const existingDepartment = await Department.findOne({
        $or: [{ name: data.name }, { code: data.code }],
      });

      if (existingDepartment) {
        throw new ApiError(
          400,
          "Department with this name or code already exists"
        );
      }

      // Verify that the HOD exists and is an admin
      const headOfDepartment = await UserModel.findById(data.headOfDepartment);
      if (!headOfDepartment) {
        throw new ApiError(404, "Head of Department user not found");
      }

      if (headOfDepartment.role !== UserRole.ADMIN) {
        throw new ApiError(400, "Head of Department must be an admin");
      }

      // Check if user is already HOD of another department
      const existingHODDepartment = await Department.findOne({
        headOfDepartment: data.headOfDepartment,
      });

      if (existingHODDepartment) {
        throw new ApiError(
          400,
          "This user is already Head of Department for " +
            existingHODDepartment.name
        );
      }

      const department = new Department({
        ...data,
        status: DepartmentStatus.ACTIVE,
        createdBy: userId,
        updatedBy: userId,
      });

      await department.save();

      // Return populated department
      return await Department.findById(department._id).populate(
        "headOfDepartment",
        "firstName lastName email"
      );
    } catch (error) {
      throw error;
    }
  }

  static async getAllDepartments() {
    try {
      const departments = await Department.find({
        status: DepartmentStatus.ACTIVE,
      })
        .populate("headOfDepartment", "firstName lastName email")
        .lean();

      const departmentsWithCounts = await Promise.all(
        departments.map(async (dept) => {
          // Updated queries to use both _id and name for maximum compatibility
          const [totalCount, adminCount, userCount] = await Promise.all([
            UserModel.countDocuments({
              $or: [{ department: dept._id }, { department: dept.name }],
              status: { $ne: "archived" },
            }),
            UserModel.countDocuments({
              $or: [{ department: dept._id }, { department: dept.name }],
              role: UserRole.ADMIN,
              status: { $ne: "archived" },
            }),
            UserModel.countDocuments({
              $or: [{ department: dept._id }, { department: dept.name }],
              role: UserRole.USER,
              status: { $ne: "archived" },
            }),
          ]);

          return {
            ...dept,
            id: dept._id, // Ensure we have both _id and id
            employeeCounts: {
              total: totalCount,
              admins: adminCount,
              regularUsers: userCount,
            },
          };
        })
      );

      return departmentsWithCounts;
    } catch (error) {
      throw error;
    }
  }

  static async updateDepartment(id, data, userId) {
    try {
      // If HOD is being updated, validate the new HOD
      if (data.headOfDepartment) {
        // Verify that the HOD exists and is an admin
        const headOfDepartment = await UserModel.findById(
          data.headOfDepartment
        );
        if (!headOfDepartment) {
          throw new ApiError(404, "Head of Department user not found");
        }

        if (headOfDepartment.role !== UserRole.ADMIN) {
          throw new ApiError(400, "Head of Department must be an admin");
        }

        // Check if user is already HOD of another department
        const existingHODDepartment = await Department.findOne({
          _id: { $ne: id }, // Exclude current department
          headOfDepartment: data.headOfDepartment,
        });

        if (existingHODDepartment) {
          throw new ApiError(
            400,
            "This user is already Head of Department for " +
              existingHODDepartment.name
          );
        }
      }

      const department = await Department.findByIdAndUpdate(
        id,
        {
          ...data,
          updatedBy: userId,
        },
        { new: true, runValidators: true }
      ).populate("headOfDepartment", "firstName lastName email");

      if (!department) {
        throw new ApiError(404, "Department not found");
      }

      return department;
    } catch (error) {
      throw error;
    }
  }

  static async deleteDepartment(id) {
    try {
      const department = await Department.findById(id);
      if (!department) {
        throw new ApiError(404, "Department not found");
      }

      const employeeCount = await UserModel.countDocuments({
        department: department.name,
      });

      if (employeeCount > 0) {
        throw new ApiError(
          400,
          "Cannot delete department with existing employees"
        );
      }

      await department.deleteOne();
      return true;
    } catch (error) {
      throw error;
    }
  }
}