import { Response } from "express";
import { Types } from "mongoose";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { EmployeeService } from "../services/employeeService.js";
import { handleError } from "../utils/errorHandler.js";

export class EmployeeController {
  static async createEmployee(req: AuthenticatedRequest, res: Response) {
    try {
      const creator = {
        _id: new Types.ObjectId(req.user.id),
        role: req.user.role,
        department: req.user.department
          ? new Types.ObjectId(req.user.department)
          : undefined,
      };

      const { employee, invitationToken } =
        await EmployeeService.createEmployee(req.body, creator);

      res.status(201).json({
        success: true,
        message: "Employee created successfully. Invitation sent.",
        employee,
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }
}
