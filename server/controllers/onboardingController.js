import UserModel, { OnboardingStatus } from "../models/User.js";
import { ApiError } from "../utils/errorHandler.js";

export class OnboardingController {
  // Get all employees in onboarding
  static async getOnboardingEmployees(req, res, next) {
    try {
      const employees = await UserModel.find({
        "onboarding.status": { $ne: OnboardingStatus.COMPLETED },
        status: "active",
      }).select("-password");

      res.status(200).json({
        success: true,
        data: employees,
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
