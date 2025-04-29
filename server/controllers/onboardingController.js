import UserModel, {
  OnboardingStatus,
  UserLifecycleState,
} from "../models/User.js";
import { ApiError } from "../utils/errorHandler.js";

export class OnboardingController {
  static async getOnboardingEmployees(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        department,
        search,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      // Build query
      const query = {
        "onboarding.status": { $ne: OnboardingStatus.COMPLETED },
        status: "active",
      };

      // If user is an admin, only show employees from their department
      if (req.user.role === "ADMIN") {
        query.department = req.user.department._id;
      }

      // Add filters if provided
      if (status) {
        query["onboarding.status"] = status;
      }
      if (department) {
        query.department = department;
      }
      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
          { employeeId: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

      // Get total count for pagination
      const total = await UserModel.countDocuments(query);

      // Get paginated results
      const employees = await UserModel.find(query)
        .select("-password")
        .populate("department", "name code")
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      // Calculate onboarding statistics
      const stats = await UserModel.aggregate([
        { $match: query },
        {
          $group: {
            _id: "$onboarding.status",
            count: { $sum: 1 },
          },
        },
      ]);

      // Format stats
      const statusStats = stats.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {});

      res.status(200).json({
        success: true,
        data: employees,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
        stats: {
          total,
          byStatus: statusStats,
          departments: await UserModel.distinct("department", query),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Update onboarding progress
  static async updateOnboardingProgress(req, res, next) {
    try {
      const { userId } = req.params;
      const { progress } = req.body;

      const user = await UserModel.findById(userId);
      if (!user) {
        throw new ApiError(404, "User not found");
      }

      if (!user.onboarding) {
        throw new ApiError(400, "User not in onboarding");
      }

      user.onboarding.progress = progress;

      // Update status based on progress
      if (progress === 100) {
        user.onboarding.status = OnboardingStatus.COMPLETED;
        user.onboarding.completedAt = new Date();
      } else if (progress > 0) {
        user.onboarding.status = OnboardingStatus.IN_PROGRESS;
      }

      await user.save();

      res.status(200).json({
        success: true,
        data: user.onboarding,
      });
    } catch (error) {
      next(error);
    }
  }

  // Complete a specific task
  static async completeTask(req, res, next) {
    try {
      const { userId, taskName } = req.params;

      const user = await UserModel.findById(userId);
      if (!user || !user.onboarding) {
        throw new ApiError(404, "User or onboarding not found");
      }

      const task = user.onboarding.tasks.find((t) => t.name === taskName);
      if (!task) {
        throw new ApiError(404, "Task not found");
      }

      task.completed = true;
      task.completedAt = new Date();

      // Calculate progress based on completed tasks
      const completedTasks = user.onboarding.tasks.filter(
        (t) => t.completed
      ).length;
      const totalTasks = user.onboarding.tasks.length;
      user.onboarding.progress = Math.round(
        (completedTasks / totalTasks) * 100
      );

      // Update status if all tasks completed
      if (user.onboarding.progress === 100) {
        user.onboarding.status = OnboardingStatus.COMPLETED;
        user.onboarding.completedAt = new Date();

        // Update lifecycle state using the proper method
        await user.updateLifecycleState(
          UserLifecycleState.ACTIVE,
          req.user._id,
          "Onboarding completed - all tasks finished"
        );

        // Update lifecycle onboarding status
        user.lifecycle.onboarding.status = OnboardingStatus.COMPLETED;
        user.lifecycle.onboarding.completedAt = new Date();

        // Set user status to active for payroll processing
        user.status = "active";
      } else {
        user.onboarding.status = OnboardingStatus.IN_PROGRESS;
      }

      await user.save();

      res.status(200).json({
        success: true,
        data: user.onboarding,
      });
    } catch (error) {
      next(error);
    }
  }
}
