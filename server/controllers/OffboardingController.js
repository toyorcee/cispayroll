import { EmployeeService } from "../services/employeeService.js";
import { ApiError } from "../utils/errorHandler.js";
import { Permission } from "../models/User.js";

export class OffboardingController {
  static async initiateOffboarding(req, res, next) {
    try {
      const { userId } = req.params;
      const { type, reason, targetExitDate } = req.body;

      const offboardingData = {
        type,
        reason,
        targetExitDate: new Date(targetExitDate),
        initiatedBy: req.user._id,
      };

      const user = await EmployeeService.startOffboarding(
        userId,
        offboardingData
      );

      res.status(200).json({
        success: true,
        message: "Offboarding process initiated successfully",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateOffboardingChecklist(req, res, next) {
    try {
      const { userId, taskId } = req.params;
      const { completed, notes } = req.body;

      const user = await EmployeeService.updateOffboardingTask(userId, taskId, {
        completed,
        completedBy: req.user._id,
        notes,
        completedAt: completed ? new Date() : null,
      });

      res.status(200).json({
        success: true,
        data: user.offboarding,
      });
    } catch (error) {
      next(error);
    }
  }

  static async completeOffboarding(req, res, next) {
    try {
      const { userId } = req.params;
      const { exitInterviewNotes, rehireEligible, rehireNotes } = req.body;

      const user = await EmployeeService.completeOffboarding(userId, {
        exitInterviewNotes,
        rehireEligible,
        rehireNotes,
        completedBy: req.user._id,
      });

      res.status(200).json({
        success: true,
        message: "Offboarding completed successfully",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getOffboardingEmployees(req, res, next) {
    try {
      const employees = await EmployeeService.getEmployeesByLifecycleState(
        UserLifecycleState.OFFBOARDING
      );

      res.status(200).json({
        success: true,
        data: employees,
      });
    } catch (error) {
      next(error);
    }
  }
}
