import DepartmentModel from "../models/Department.js";
import { ApiError } from "../utils/errorHandler.js";
import UserModel, { UserRole } from "../models/User.js";
import mongoose from "mongoose";
import { Types } from "mongoose";

export const DepartmentStatus = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  DELETED: "deleted",
};

export class DepartmentService {
  // Helper method to validate department code format
  static validateDepartmentCode(code) {
    const codeRegex = /^[A-Z]{2,5}$/;
    if (!codeRegex.test(code)) {
      throw new ApiError(400, "Department code must be 2-5 uppercase letters");
    }
  }

  static async createDepartment(departmentData) {
    // Remove headOfDepartment validation or make it optional
    const department = await DepartmentModel.create({
      name: departmentData.name,
      code: departmentData.code,
      description: departmentData.description,
      location: departmentData.location,
      createdBy: departmentData.createdBy,
      updatedBy: departmentData.updatedBy,
      // headOfDepartment will be added later
    });

    return department;
  }

  static async getAllDepartments(page = 1, limit = 10, filter = {}) {
    try {
      // Build query
      const query = { status: { $ne: "deleted" } };

      // Add search filter
      if (filter.search) {
        query.$or = [
          { name: { $regex: filter.search, $options: "i" } },
          { code: { $regex: filter.search, $options: "i" } },
          { description: { $regex: filter.search, $options: "i" } },
        ];
      }

      // Add status filter
      if (filter.status) {
        query.status = filter.status;
      }

      // Calculate skip value
      const skip = (page - 1) * limit;

      // Get total count
      const total = await DepartmentModel.countDocuments(query);

      // Get departments with pagination
      const departments = await DepartmentModel.find(query)
        .populate("headOfDepartment", "firstName lastName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // Calculate employee counts for each department using aggregation
      const departmentCounts = await UserModel.aggregate([
        {
          $match: {
            department: { $exists: true },
            status: { $ne: "archived" },
          },
        },
        {
          $group: {
            _id: "$department",
            total: { $sum: 1 },
            admins: {
              $sum: {
                $cond: [{ $eq: ["$role", "ADMIN"] }, 1, 0],
              },
            },
            regularUsers: {
              $sum: {
                $cond: [{ $eq: ["$role", "USER"] }, 1, 0],
              },
            },
          },
        },
      ]);

      // Create a map of department counts for easier lookup
      const countsMap = departmentCounts.reduce((acc, curr) => {
        acc[curr._id.toString()] = {
          total: curr.total,
          admins: curr.admins,
          regularUsers: curr.regularUsers,
        };
        return acc;
      }, {});

      // Combine department data with counts
      const departmentsWithCounts = departments.map((dept) => {
        const deptId = dept._id.toString();
        const counts = countsMap[deptId] || {
          total: 0,
          admins: 0,
          regularUsers: 0,
        };

        return {
          ...dept.toObject(),
          employeeCounts: counts,
        };
      });

      // Log for debugging
      console.log(
        "Department Counts:",
        JSON.stringify(departmentCounts, null, 2)
      );
      console.log("Counts Map:", JSON.stringify(countsMap, null, 2));

      return {
        data: departmentsWithCounts,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error("Error in getAllDepartments:", error);
      throw new ApiError(500, "Error fetching departments: " + error.message);
    }
  }

  static async getDepartmentById(id) {
    try {
      const department = await DepartmentModel.findById(id)
        .populate("headOfDepartment", "firstName lastName email")
        .lean();

      if (!department) {
        throw new ApiError(404, "Department not found");
      }

      // Get employee counts using only ObjectId reference
      const [totalCount, adminCount, userCount] = await Promise.all([
        UserModel.countDocuments({
          department: department._id,
          status: { $ne: "archived" },
        }),
        UserModel.countDocuments({
          department: department._id,
          role: UserRole.ADMIN,
          status: { $ne: "archived" },
        }),
        UserModel.countDocuments({
          department: department._id,
          role: UserRole.USER,
          status: { $ne: "archived" },
        }),
      ]);

      return {
        ...department,
        employeeCounts: {
          total: totalCount,
          admins: adminCount,
          regularUsers: userCount,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  static async updateDepartment(id, data, userId) {
    try {
      const department = await DepartmentModel.findById(id);
      if (!department) {
        throw new ApiError(404, "Department not found");
      }

      // If updating HOD, verify the new HOD exists and is an admin
      if (data.headOfDepartment) {
        const newHOD = await UserModel.findById(data.headOfDepartment);
        if (!newHOD) {
          throw new ApiError(404, "New Head of Department user not found");
        }

        if (newHOD.role !== UserRole.ADMIN) {
          throw new ApiError(400, "Head of Department must be an admin");
        }
      }

      // If updating name or code, check for duplicates
      if (data.name || data.code) {
        const existingDepartment = await DepartmentModel.findOne({
          $or: [
            { name: data.name || department.name },
            { code: data.code || department.code },
          ],
          _id: { $ne: id },
        });

        if (existingDepartment) {
          throw new ApiError(
            400,
            "Department with this name or code already exists"
          );
        }
      }

      // Update department
      Object.assign(department, {
        ...data,
        updatedBy: userId,
      });

      await department.save();

      // Return populated department
      return await DepartmentModel.findById(department._id).populate(
        "headOfDepartment",
        "firstName lastName email"
      );
    } catch (error) {
      throw error;
    }
  }

  static async deleteDepartment(id) {
    try {
      const department = await DepartmentModel.findById(id);
      if (!department) {
        throw new ApiError(404, "Department not found");
      }

      // Check if department has any employees
      const employeeCount = await UserModel.countDocuments({
        department: department._id,
        status: { $ne: "archived" },
      });

      if (employeeCount > 0) {
        throw new ApiError(
          400,
          "Cannot delete department with active employees"
        );
      }

      // Soft delete by updating status
      department.status = DepartmentStatus.INACTIVE;
      await department.save();

      return department;
    } catch (error) {
      throw error;
    }
  }

  static async getDepartmentEmployees(departmentId, options = {}) {
    try {
      const { page = 1, limit = 10, status, role } = options;
      const department = await DepartmentModel.findById(departmentId);
      if (!department) {
        throw new ApiError(404, "Department not found");
      }

      const query = {
        department: department._id,
        status: { $ne: "archived" },
        ...(status && { status }),
        ...(role && { role }),
      };

      const [employees, total] = await Promise.all([
        UserModel.find(query)
          .select("-password")
          .populate("department", "name code")
          .sort({ role: -1, firstName: 1 })
          .skip((page - 1) * limit)
          .limit(limit),
        UserModel.countDocuments(query),
      ]);

      return {
        data: employees,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw error;
    }
  }

  static async getDepartmentChartStats({ startDate, endDate, user } = {}) {
    try {
      let departmentQuery = { status: DepartmentStatus.ACTIVE };

      // Filter departments based on user role
      if (user.role === "ADMIN") {
        // Admin only sees their own department
        departmentQuery._id = user.department;
      }

      const departments = await DepartmentModel.find(departmentQuery).lean();

      const dateQuery =
        startDate && endDate
          ? {
              createdAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
              },
            }
          : {};

      const departmentStats = await Promise.all(
        departments.map(async (dept) => {
          const baseQuery = {
            department: dept._id,
            status: { $ne: "archived" },
            ...dateQuery,
          };

          // For admin, only show their department's stats
          if (user.role === "ADMIN") {
            baseQuery.department = user.department;
          }

          const [totalCount, adminCount, userCount] = await Promise.all([
            UserModel.countDocuments(baseQuery),
            UserModel.countDocuments({ ...baseQuery, role: UserRole.ADMIN }),
            UserModel.countDocuments({ ...baseQuery, role: UserRole.USER }),
          ]);

          return {
            name: dept.name,
            totalEmployees: totalCount,
            adminCount,
            userCount,
          };
        })
      );

      // For admin, show additional department-specific stats
      if (user.role === "ADMIN") {
        return {
          departmentDistribution: {
            labels: departmentStats.map((dept) => dept.name),
            datasets: [
              {
                label: "Total Employees",
                data: departmentStats.map((dept) => dept.totalEmployees),
              },
              {
                label: "Admins",
                data: departmentStats.map((dept) => dept.adminCount),
              },
              {
                label: "Regular Users",
                data: departmentStats.map((dept) => dept.userCount),
              },
            ],
          },
          // Add admin-specific stats
          departmentGrowth: {
            // Last 6 months employee growth
            labels: await getLastSixMonths(user.department),
            datasets: [
              {
                label: "Employee Growth",
                data: await getMonthlyGrowth(user.department),
              },
            ],
          },
          employeeStatus: {
            labels: ["Active", "Pending", "On Leave"],
            datasets: [
              {
                label: "Employee Status",
                data: await getStatusCounts(user.department),
              },
            ],
          },
        };
      }

      // Return regular stats for super admin
      return {
        departmentDistribution: {
          labels: departmentStats.map((dept) => dept.name),
          datasets: [
            {
              label: "Total Employees",
              data: departmentStats.map((dept) => dept.totalEmployees),
            },
            {
              label: "Admins",
              data: departmentStats.map((dept) => dept.adminCount),
            },
            {
              label: "Regular Users",
              data: departmentStats.map((dept) => dept.userCount),
            },
          ],
        },
        pieChart: {
          labels: departmentStats.map((dept) => dept.name),
          datasets: [
            {
              data: departmentStats.map((dept) => dept.totalEmployees),
            },
          ],
        },
      };
    } catch (error) {
      throw error;
    }
  }

  // Helper functions for admin stats
  static async getLastSixMonths(departmentId) {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push(d.toLocaleString("default", { month: "short" }));
    }
    return months;
  }

  static async getMonthlyGrowth(departmentId) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyData = await UserModel.aggregate([
      {
        $match: {
          department: new mongoose.Types.ObjectId(departmentId),
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Fill in missing months with 0
    const growth = new Array(6).fill(0);
    monthlyData.forEach((data) => {
      const monthIndex = new Date().getMonth() - data._id.month + 6;
      if (monthIndex >= 0 && monthIndex < 6) {
        growth[monthIndex] = data.count;
      }
    });

    return growth;
  }

  static async getStatusCounts(departmentId) {
    const counts = await UserModel.aggregate([
      {
        $match: {
          department: new mongoose.Types.ObjectId(departmentId),
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      active: counts.find((c) => c._id === "active")?.count || 0,
      pending: counts.find((c) => c._id === "pending")?.count || 0,
      onLeave: counts.find((c) => c._id === "on_leave")?.count || 0,
    };
  }

  static async getAdminDepartmentStats(departmentId) {
    try {
      const department = await DepartmentModel.findById(departmentId);
      if (!department) {
        throw new ApiError(404, "Department not found");
      }

      // Get employee counts by status using only ObjectId
      const [totalCount, activeCount, pendingCount] = await Promise.all([
        UserModel.countDocuments({
          department: departmentId,
        }),
        UserModel.countDocuments({
          department: departmentId,
          status: "active",
        }),
        UserModel.countDocuments({
          department: departmentId,
          status: "pending",
        }),
      ]);

      // Get monthly employee count for the past 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const monthlyStats = await UserModel.aggregate([
        {
          $match: {
            department: new mongoose.Types.ObjectId(departmentId),
            createdAt: { $gte: sixMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { "_id.year": 1, "_id.month": 1 },
        },
      ]);

      // Format monthly stats
      const months = monthlyStats.map(
        (stat) => `${stat._id.year}-${String(stat._id.month).padStart(2, "0")}`
      );

      return {
        departmentStats: {
          labels: ["Total", "Active", "Pending"],
          datasets: [
            {
              label: "Employee Status",
              data: [totalCount, activeCount, pendingCount],
              backgroundColor: [
                "rgba(75, 192, 192, 0.5)",
                "rgba(54, 162, 235, 0.5)",
                "rgba(255, 206, 86, 0.5)",
              ],
              borderColor: [
                "rgba(75, 192, 192, 1)",
                "rgba(54, 162, 235, 1)",
                "rgba(255, 206, 86, 1)",
              ],
              borderWidth: 1,
            },
          ],
        },
        monthlyGrowth: {
          labels: months,
          datasets: [
            {
              label: "Monthly Growth",
              data: monthlyStats.map((stat) => stat.count),
              borderColor: "rgba(75, 192, 192, 1)",
              backgroundColor: "rgba(75, 192, 192, 0.2)",
              tension: 0.4,
            },
          ],
        },
      };
    } catch (error) {
      console.error("Error in getAdminDepartmentStats:", error);
      throw error;
    }
  }

  static async getUserStats(userId) {
    try {
      const user = await UserModel.findById(userId).populate("department");
      if (!user) {
        throw new ApiError(404, "User not found");
      }

      if (!user.department) {
        throw new ApiError(404, "Department not found for this user");
      }

      // Get active colleagues count using only ObjectId
      const departmentColleagues = await UserModel.countDocuments({
        department: user.department._id,
        _id: { $ne: user._id },
        status: "active",
      });

      // Get active employees count
      const activeEmployees = await UserModel.countDocuments({
        department: user.department._id,
        status: "active",
      });

      // Get total employees count
      const totalEmployees = await UserModel.countDocuments({
        department: user.department._id,
      });

      return {
        userStats: {
          department: user.department.name,
          position: user.position,
          colleagues: departmentColleagues,
          joinedDate: user.dateJoined,
        },
        departmentStats: {
          labels: ["Total Employees", "Active Employees", "Colleagues"],
          datasets: [
            {
              label: "Department Overview",
              data: [totalEmployees, activeEmployees, departmentColleagues],
              backgroundColor: [
                "rgba(255, 99, 132, 0.5)",
                "rgba(54, 162, 235, 0.5)",
                "rgba(255, 206, 86, 0.5)",
              ],
              borderColor: [
                "rgba(255, 99, 132, 1)",
                "rgba(54, 162, 235, 1)",
                "rgba(255, 206, 86, 1)",
              ],
              borderWidth: 1,
            },
          ],
        },
      };
    } catch (error) {
      console.error("Error in getUserStats:", error);
      throw error;
    }
  }
}
