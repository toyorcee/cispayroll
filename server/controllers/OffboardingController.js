import { EmployeeService } from "../services/employeeService.js";
import { ApiError } from "../utils/errorHandler.js";
import { Permission } from "../models/User.js";
import UserModel, {
  OffboardingStatus,
  OffboardingType,
  UserLifecycleState,
} from "../models/User.js";
import { calculateFinalSettlement } from "../utils/payrollUtils.js";
import { generateFinalSettlementReport } from "../utils/documentGenerators.js";
import { EmailService } from "../services/emailService.js";
import mongoose from "mongoose";
import { getOffboardingTasks } from "../utils/defaultTasks.js";
import LeaveModel from "../models/Leave.js";

export class OffboardingController {
  // Get default offboarding tasks
  static async getDefaultOffboardingTasks(req, res, next) {
    try {
      console.log(
        "[OffboardingController.getDefaultOffboardingTasks] User:",
        req.user?._id
      );
      const defaultTasks = getOffboardingTasks();
      res.status(200).json({
        success: true,
        data: defaultTasks,
      });
    } catch (error) {
      console.error(
        "[OffboardingController.getDefaultOffboardingTasks] Error:",
        error
      );
      next(error);
    }
  }

  static async initiateOffboarding(req, res, next) {
    try {
      console.log(
        "[OffboardingController.initiateOffboarding] User:",
        req.user?._id,
        "Params:",
        req.params,
        "Body:",
        req.body
      );
      if (!req.user.permissions.includes(Permission.MANAGE_OFFBOARDING)) {
        console.log(
          "[OffboardingController.initiateOffboarding] Permission denied for user:",
          req.user._id
        );
        throw new ApiError(
          403,
          "You don't have permission to initiate offboarding"
        );
      }

      const { userId } = req.params;
      const { type, reason, targetExitDate } = req.body;

      // Validate required fields
      if (!type || !reason || !targetExitDate) {
        console.log("[OFFBOARDING CONTROLLER] Missing required fields:", {
          type,
          reason,
          targetExitDate,
        });
        throw new ApiError(
          400,
          "Missing required fields: type, reason, and targetExitDate are required"
        );
      }

      if (!Object.values(OffboardingType).includes(type)) {
        console.log(
          "[OFFBOARDING CONTROLLER] Invalid offboarding type provided"
        );
        throw new ApiError(
          400,
          `Invalid offboarding type. Must be one of: ${Object.values(
            OffboardingType
          ).join(", ")}`
        );
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        console.log(
          "[OffboardingController.initiateOffboarding] User not found:",
          userId
        );
        throw new ApiError(404, "User not found");
      }

      console.log("[OFFBOARDING CONTROLLER] User found:", {
        userId: user._id,
        currentOffboardingStatus: user.offboarding?.status,
        currentOffboardingObject: user.offboarding,
        currentLifecycleState: user.lifecycle?.currentState,
        currentOnboardingStatus: user.lifecycle?.onboarding?.status,
      });

      // Check if user is already in offboarding
      if (
        user.offboarding &&
        user.offboarding.status &&
        user.offboarding.status !== "not_started"
      ) {
        console.log(
          "[OFFBOARDING CONTROLLER] User already in offboarding process"
        );
        throw new ApiError(400, "User is already in offboarding process");
      }

      // Calculate unused leave days
      const approvedLeaves = await LeaveModel.find({
        user: userId,
        status: "approved",
        endDate: { $lte: new Date(targetExitDate) },
      });
      const leaveTaken = approvedLeaves.reduce((sum, leave) => {
        // Calculate days for each leave (inclusive)
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        const days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
        return sum + days;
      }, 0);
      const annualEntitlement = user.leave?.annual || 0;
      const unusedLeaveDays = Math.max(annualEntitlement - leaveTaken, 0);

      // Get default offboarding tasks
      const offboardingTasks = getOffboardingTasks();

      // Update user with offboarding information
      const updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        {
          $set: {
            "offboarding.status": OffboardingStatus.IN_PROGRESS,
            "offboarding.type": type,
            "offboarding.reason": reason,
            "offboarding.targetExitDate": new Date(targetExitDate),
            "offboarding.initiatedBy": req.user._id,
            "offboarding.initiatedAt": new Date(),
            "offboarding.tasks": offboardingTasks,
            "offboarding.unusedLeaveDays": unusedLeaveDays,
            "lifecycle.currentState": UserLifecycleState.OFFBOARDING,
          },
        },
        { new: true, runValidators: false }
      );
      console.log(
        "[OffboardingController.initiateOffboarding] Offboarding initiated for user:",
        userId,
        "Updated offboarding:",
        updatedUser.offboarding
      );
      res.status(200).json({
        success: true,
        message: "Offboarding process initiated successfully",
        data: updatedUser.offboarding,
      });
    } catch (error) {
      console.error(
        "[OffboardingController.initiateOffboarding] Error:",
        error
      );
      next(error);
    }
  }

  static async updateOffboardingChecklist(req, res, next) {
    try {
      console.log(
        "[OffboardingController.updateOffboardingChecklist] User:",
        req.user?._id,
        "Params:",
        req.params,
        "Body:",
        req.body
      );
      if (!req.user.permissions.includes(Permission.MANAGE_OFFBOARDING)) {
        throw new ApiError(
          403,
          "You don't have permission to update offboarding checklist"
        );
      }

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
      console.error(
        "[OffboardingController.updateOffboardingChecklist] Error:",
        error
      );
      next(error);
    }
  }

  static async completeOffboarding(req, res, next) {
    try {
      console.log(
        "[OffboardingController.completeOffboarding] User:",
        req.user?._id,
        "Params:",
        req.params,
        "Body:",
        req.body
      );
      if (!req.user.permissions.includes(Permission.MANAGE_OFFBOARDING)) {
        throw new ApiError(
          403,
          "You don't have permission to complete offboarding"
        );
      }

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
      console.error(
        "[OffboardingController.completeOffboarding] Error:",
        error
      );
      next(error);
    }
  }

  static async getOffboardingEmployees(req, res, next) {
    try {
      console.log(
        "[OffboardingController.getOffboardingEmployees] User:",
        req.user?._id,
        "Query:",
        req.query
      );
      if (!req.user.permissions.includes(Permission.VIEW_OFFBOARDING)) {
        throw new ApiError(
          403,
          "You don't have permission to view offboarding employees"
        );
      }

      // Get pagination parameters from query
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // Build base query
      const baseQuery = {
        $or: [
          { "lifecycle.currentState": UserLifecycleState.OFFBOARDING },
          { "offboarding.status": { $in: ["in_progress", "completed"] } },
        ],
      };

      // If user is an admin, only show employees from their department
      if (req.user.role === "ADMIN") {
        baseQuery.department = req.user.department._id;
      }

      // Get total count for pagination - include both active and completed offboarding
      const totalCount = await UserModel.countDocuments(baseQuery);

      // Get paginated employees - include both active and completed offboarding
      const employees = await UserModel.find(baseQuery)
        .populate("department", "name code")
        .populate("offboarding.initiatedBy", "firstName lastName email")
        .select("-password")
        .skip(skip)
        .limit(limit)
        .sort({ "offboarding.initiatedAt": -1 }); // Sort by most recent first

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      console.log(
        employees.map((e) => ({ email: e.email, offboarding: e.offboarding }))
      );

      res.status(200).json({
        success: true,
        data: employees,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages,
          hasNextPage,
          hasPrevPage,
        },
      });
    } catch (error) {
      console.error(
        "[OffboardingController.getOffboardingEmployees] Error:",
        error
      );
      next(error);
    }
  }

  // Complete a specific offboarding task
  static async completeTask(req, res) {
    try {
      console.log(
        "[OffboardingController.completeTask] User:",
        req.user?._id,
        "Params:",
        req.params,
        "Body:",
        req.body
      );
      const { userId, taskName } = req.params;
      const { completed, notes, attachments } = req.body;

      // Find and update the document in a single atomic operation
      const result = await UserModel.findOneAndUpdate(
        {
          _id: userId,
          "offboarding.tasks.name": taskName,
        },
        {
          $set: {
            "offboarding.tasks.$.completed": completed,
            "offboarding.tasks.$.completedAt": completed ? new Date() : null,
            "offboarding.tasks.$.completedBy": completed ? req.user._id : null,
            ...(notes && { "offboarding.tasks.$.notes": notes }),
            ...(attachments && {
              "offboarding.tasks.$.attachments": attachments,
            }),
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!result) {
        return res.status(404).json({ message: "User or task not found" });
      }

      // Calculate progress after update
      const completedTasks = result.offboarding.tasks.filter(
        (t) => t.completed
      ).length;
      const progress = (completedTasks / result.offboarding.tasks.length) * 100;

      // Update progress and status in a separate atomic operation
      const finalUpdate = await UserModel.findOneAndUpdate(
        { _id: userId },
        {
          $set: {
            "offboarding.progress": progress,
            "offboarding.status":
              progress === 100
                ? OffboardingStatus.COMPLETED
                : OffboardingStatus.IN_PROGRESS,
            ...(progress === 100 && {
              "offboarding.actualExitDate": new Date(),
            }),
          },
        },
        { new: true }
      );

      // If all tasks are completed, update lifecycle state
      if (progress === 100) {
        await finalUpdate.updateLifecycleState(
          UserLifecycleState.TERMINATED,
          req.user._id,
          "Offboarding process completed"
        );
      }

      // If this is the final settlement task and it's being completed, handle report generation
      if (taskName === "final_settlement" && completed) {
        try {
          const settlementDetails = await calculateFinalSettlement(finalUpdate);
          const pdfDoc = await generateFinalSettlementReport(
            finalUpdate,
            settlementDetails
          );
          const pdfBuffer = Buffer.from(pdfDoc.output("arraybuffer"));

          // Update task attachments with the report
          await UserModel.findOneAndUpdate(
            {
              _id: userId,
              "offboarding.tasks.name": taskName,
            },
            {
              $push: {
                "offboarding.tasks.$.attachments": {
                  name: "Final Settlement Report.pdf",
                  url: pdfBuffer.toString("base64"),
                  type: "application/pdf",
                },
              },
            }
          );

          // Send email with PDF attachment
          const emailService = new EmailService();
          await emailService.sendEmail({
            to: finalUpdate.email,
            subject: "Final Settlement Report",
            text: "Please find attached your final settlement report.",
            attachments: [
              {
                filename: "Final Settlement Report.pdf",
                content: pdfBuffer,
              },
            ],
          });
        } catch (error) {
          console.error("Error generating final settlement:", error);
          // Continue with task completion even if PDF generation fails
        }
      }

      res.json({
        message: `Task ${completed ? "completed" : "uncompleted"} successfully`,
        offboarding: finalUpdate.offboarding,
      });
    } catch (error) {
      console.error("[OffboardingController.completeTask] Error:", error);
      res
        .status(500)
        .json({ message: "Error completing task", error: error.message });
    }
  }

  // Get offboarding details
  static async getOffboardingDetails(req, res, next) {
    try {
      console.log(
        "[OffboardingController.getOffboardingDetails] User:",
        req.user?._id,
        "Params:",
        req.params
      );
      if (!req.user.permissions.includes(Permission.VIEW_OFFBOARDING)) {
        throw new ApiError(
          403,
          "You don't have permission to view offboarding details"
        );
      }

      const { userId } = req.params;

      const user = await UserModel.findById(userId)
        .populate("offboarding.initiatedBy", "firstName lastName email")
        .populate("offboarding.tasks.completedBy", "firstName lastName email")
        .populate(
          "offboarding.exitInterview.conductedBy",
          "firstName lastName email"
        )
        .populate(
          "offboarding.rehireEligible.decidedBy",
          "firstName lastName email"
        );

      if (!user || !user.offboarding) {
        throw new ApiError(404, "User or offboarding not found");
      }

      res.status(200).json({
        success: true,
        data: user.offboarding,
      });
    } catch (error) {
      console.error(
        "[OffboardingController.getOffboardingDetails] Error:",
        error
      );
      next(error);
    }
  }

  // Cancel offboarding
  static async cancelOffboarding(req, res, next) {
    try {
      console.log(
        "[OffboardingController.cancelOffboarding] User:",
        req.user?._id,
        "Params:",
        req.params,
        "Body:",
        req.body
      );
      if (!req.user.permissions.includes(Permission.MANAGE_OFFBOARDING)) {
        throw new ApiError(
          403,
          "You don't have permission to cancel offboarding"
        );
      }

      const { userId } = req.params;
      const { reason } = req.body;

      const user = await UserModel.findById(userId);
      if (!user || !user.offboarding) {
        throw new ApiError(404, "User or offboarding not found");
      }

      // Use the new model method to cancel offboarding
      await user.cancelOffboarding(reason, req.user._id);

      res.status(200).json({
        success: true,
        message: "Offboarding process cancelled successfully",
        data: user.offboarding,
      });
    } catch (error) {
      console.error("[OffboardingController.cancelOffboarding] Error:", error);
      next(error);
    }
  }

  static async updateExitInterview(req, res, next) {
    try {
      console.log(
        "[OffboardingController.updateExitInterview] User:",
        req.user?._id,
        "Params:",
        req.params,
        "Body:",
        req.body
      );
      if (!req.user.permissions.includes(Permission.MANAGE_OFFBOARDING)) {
        throw new ApiError(
          403,
          "You don't have permission to update exit interview"
        );
      }

      const { userId } = req.params;
      const { completed, notes, feedback } = req.body;

      const user = await UserModel.findById(userId);
      if (!user || !user.offboarding) {
        throw new ApiError(404, "User or offboarding not found");
      }

      user.offboarding.exitInterview = {
        ...user.offboarding.exitInterview,
        completed,
        conductedBy: req.user._id,
        date: completed ? new Date() : null,
        notes,
        feedback,
      };

      await user.save();

      res.status(200).json({
        success: true,
        message: "Exit interview updated successfully",
        data: user.offboarding.exitInterview,
      });
    } catch (error) {
      console.error(
        "[OffboardingController.updateExitInterview] Error:",
        error
      );
      next(error);
    }
  }

  static async updateRehireEligibility(req, res, next) {
    try {
      console.log(
        "[OffboardingController.updateRehireEligibility] User:",
        req.user?._id,
        "Params:",
        req.params,
        "Body:",
        req.body
      );
      if (!req.user.permissions.includes(Permission.MANAGE_OFFBOARDING)) {
        throw new ApiError(
          403,
          "You don't have permission to update rehire eligibility"
        );
      }

      const { userId } = req.params;
      const { status, notes } = req.body;

      const user = await UserModel.findById(userId);
      if (!user || !user.offboarding) {
        throw new ApiError(404, "User or offboarding not found");
      }

      user.offboarding.rehireEligible = {
        status,
        notes,
        decidedBy: req.user._id,
        decidedAt: new Date(),
      };

      await user.save();

      res.status(200).json({
        success: true,
        message: "Rehire eligibility updated successfully",
        data: user.offboarding.rehireEligible,
      });
    } catch (error) {
      console.error(
        "[OffboardingController.updateRehireEligibility] Error:",
        error
      );
      next(error);
    }
  }

  // Shared helper to prepare employee salary data and generate settlement details
  static async prepareEmployeeSettlement(employee) {
    // Check if salary grade information exists
    if (!employee.salaryGrade || !employee.salaryGrade.basicSalary) {
      console.warn(
        `No salary grade information found for employee ${employee._id}`
      );

      if (employee.gradeLevel) {
        console.log(
          `Using grade level ${employee.gradeLevel} to determine salary`
        );

        const salaryGrade = await mongoose.model("SalaryGrade").findOne({
          level: employee.gradeLevel,
          isActive: true,
        });

        if (salaryGrade) {
          console.log(
            `Found salary grade for level ${employee.gradeLevel}: ${salaryGrade.basicSalary}`
          );
          employee.salaryGrade = salaryGrade;
          employee.salary = {
            basic: salaryGrade.basicSalary,
            allowances: [],
            deductions: [],
          };
        } else {
          console.warn(
            `No salary grade found for level ${employee.gradeLevel}`
          );
          throw new ApiError(
            400,
            "Employee salary information is incomplete. Please set up salary grade first."
          );
        }
      } else {
        throw new ApiError(
          400,
          "Employee salary information is incomplete. Please set up salary grade first."
        );
      }
    } else {
      // Create a salary object from the salary grade
      employee.salary = {
        basic: employee.salaryGrade.basicSalary,
        allowances: [],
        deductions: [],
      };
    }

    // Calculate final settlement
    const exitDate = employee.offboarding?.targetExitDate || new Date();
    const exitMonth = new Date(exitDate).getMonth() + 1;
    const exitYear = new Date(exitDate).getFullYear();

    const settlementDetails = await calculateFinalSettlement(
      employee,
      exitMonth,
      exitYear,
      { bypassOnboardingCheck: true }
    );

    return { employee, settlementDetails };
  }

  static async generateFinalSettlementReport(req, res, next) {
    try {
      console.log(
        "[OffboardingController.generateFinalSettlementReport] User:",
        req.user?._id,
        "Params:",
        req.params
      );
      if (!req.user.permissions.includes(Permission.MANAGE_OFFBOARDING)) {
        throw new ApiError(
          403,
          "You don't have permission to generate final settlement report"
        );
      }

      const { employeeId } = req.params;

      // Find the employee with salary grade information
      const employee = await UserModel.findById(employeeId)
        .populate("department", "name code")
        .populate("salaryGrade", "level basicSalary")
        .select("-password");

      if (!employee) {
        throw new ApiError(404, "Employee not found");
      }

      // Use shared helper to prepare employee data
      const { employee: preparedEmployee, settlementDetails } =
        await OffboardingController.prepareEmployeeSettlement(employee);

      // Generate PDF report
      const doc = await generateFinalSettlementReport(
        preparedEmployee,
        settlementDetails
      );
      const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

      // Set response headers for PDF download
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=final_settlement_${employee.employeeId}.pdf`
      );

      // Send the PDF buffer
      res.send(pdfBuffer);
    } catch (error) {
      console.error(
        "[OffboardingController.generateFinalSettlementReport] Error:",
        error
      );
      next(error);
    }
  }

  static async sendFinalSettlementEmail(employee, reqUser) {
    try {
      // Use shared helper to prepare employee data
      const { employee: preparedEmployee, settlementDetails } =
        await OffboardingController.prepareEmployeeSettlement(employee);

      // Generate PDF
      const doc = await generateFinalSettlementReport(
        preparedEmployee,
        settlementDetails
      );
      const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

      // Send email
      const emailService = new EmailService();
      const html = `
        <!DOCTYPE html>
        <html><head><meta charset='utf-8'><title>Final Settlement Report</title></head><body>
        <div>Dear ${employee.firstName} ${employee.lastName},<br/>Please find attached your final settlement report.</div>
        </body></html>
      `;
      await emailService.sendEmail({
        to: employee.email,
        subject: "Final Settlement Report",
        html,
        attachments: [
          { filename: "Final Settlement Report.pdf", content: pdfBuffer },
        ],
      });
      return { success: true, message: "Email sent", employeeId: employee._id };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        employeeId: employee._id,
      };
    }
  }

  static async emailFinalSettlementReport(req, res, next) {
    try {
      console.log(
        "[OffboardingController.emailFinalSettlementReport] User:",
        req.user?._id,
        "Params:",
        req.params
      );
      console.log("Starting email final settlement report process...");

      if (!req.user.permissions.includes(Permission.MANAGE_OFFBOARDING)) {
        console.log("Permission denied for user:", req.user._id);
        throw new ApiError(
          403,
          "You don't have permission to email final settlement report"
        );
      }

      const { employeeId } = req.params;
      console.log(
        "Processing final settlement report for employee:",
        employeeId
      );

      // Find the employee with salary grade information
      const employee = await UserModel.findById(employeeId)
        .populate("department", "name code")
        .populate("salaryGrade", "level basicSalary")
        .select("-password");

      if (!employee) {
        console.log("Employee not found:", employeeId);
        throw new ApiError(404, "Employee not found");
      }

      console.log("Employee found:", {
        id: employee._id,
        name: `${employee.firstName} ${employee.lastName}`,
        email: employee.email,
      });

      // Use shared helper to prepare employee data
      const { employee: preparedEmployee, settlementDetails } =
        await OffboardingController.prepareEmployeeSettlement(employee);

      // Generate PDF report
      console.log("Generating PDF report...");
      const doc = await generateFinalSettlementReport(
        preparedEmployee,
        settlementDetails
      );
      const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
      console.log("PDF report generated successfully");

      // Send email with PDF attachment
      console.log("Preparing to send email to:", employee.email);
      const emailService = new EmailService();

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Final Settlement Report</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f4f4f4;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #ffffff;
            }
            .header {
              text-align: center;
              padding: 20px 0;
              background-color: #16a34a;
              color: white;
              border-radius: 5px 5px 0 0;
            }
            .content {
              padding: 20px;
              background-color: #ffffff;
              border-radius: 0 0 5px 5px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .greeting {
              font-size: 18px;
              margin-bottom: 20px;
              color: #16a34a;
            }
            .settlement-details {
              background-color: #f8f9fa;
              padding: 15px;
              border-radius: 5px;
              margin-bottom: 20px;
            }
            .settlement-details p {
              margin: 5px 0;
            }
            .summary {
              margin: 20px 0;
            }
            .summary-table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
            }
            .summary-table th, .summary-table td {
              padding: 10px;
              text-align: left;
              border-bottom: 1px solid #ddd;
            }
            .summary-table th {
              background-color: #f8f9fa;
              color: #16a34a;
            }
            .footer {
              text-align: center;
              padding: 20px;
              color: #666;
              font-size: 12px;
              margin-top: 20px;
              border-top: 1px solid #eee;
            }
            .footer p {
              margin: 5px 0;
            }
            .contact-info {
              color: #16a34a;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Final Settlement Report</h2>
            </div>
            
            <div class="content">
              <div class="greeting">
                Dear ${employee.firstName} ${employee.lastName},
              </div>
              
              <div class="settlement-details">
                <p><strong>Employee ID:</strong> ${employee.employeeId}</p>
                <p><strong>Department:</strong> ${
                  employee.department?.name || "N/A"
                }</p>
                <p><strong>Last Working Day:</strong> ${new Date().toLocaleDateString()}</p>
                <p><strong>Settlement Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
              
              <div class="summary">
                <h3>Settlement Summary</h3>
                <table class="summary-table">
                  <tr>
                    <th>Component</th>
                    <th>Amount</th>
                  </tr>
                  <tr>
                    <td>Basic Salary</td>
                    <td>NGN ${settlementDetails.basicSalary.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td>Gratuity (10%)</td>
                    <td>NGN ${settlementDetails.gratuity.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td>Unused Leave Payment</td>
                    <td>NGN ${settlementDetails.unusedLeavePayment.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td><strong>Total Settlement</strong></td>
                    <td><strong>NGN ${settlementDetails.totalSettlement.toLocaleString()}</strong></td>
                  </tr>
                </table>
              </div>
              
              <p>Please find attached your final settlement report for your records.</p>
              
              <p>If you have any questions regarding this settlement, please contact the HR department.</p>
              
              <div class="footer">
                <p><strong>Century Information Systems</strong></p>
                <p>HR Department</p>
                <p class="contact-info">Email: hr@centuryis.com | Phone: +234-xxx-xxx-xxxx</p>
                <p>Generated on: ${new Date().toLocaleString()}</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      await emailService.sendEmail({
        to: employee.email,
        subject: "Final Settlement Report",
        html: html,
        attachments: [
          {
            filename: "Final Settlement Report.pdf",
            content: pdfBuffer,
          },
        ],
      });

      console.log("Email sent successfully to:", employee.email);

      res.status(200).json({
        success: true,
        message: "Final settlement report sent successfully",
      });
    } catch (error) {
      console.error(
        "[OffboardingController.emailFinalSettlementReport] Error:",
        error
      );
      res.status(500).json({
        success: false,
        message: "Failed to send final settlement report",
        error: error.message,
      });
    }
  }

  // Bulk email final settlement reports
  static async emailFinalSettlementReportBulk(req, res) {
    try {
      if (!req.user.permissions.includes(Permission.MANAGE_OFFBOARDING)) {
        throw new ApiError(
          403,
          "You don't have permission to email final settlement report"
        );
      }
      let employees = [];
      if (
        Array.isArray(req.body.employeeIds) &&
        req.body.employeeIds.length > 0
      ) {
        employees = await UserModel.find({ _id: { $in: req.body.employeeIds } })
          .populate("department", "name code")
          .populate("salaryGrade", "level basicSalary")
          .select("-password");
      } else {
        // All offboarding or completed
        employees = await UserModel.find({
          $or: [
            { "lifecycle.currentState": "OFFBOARDING" },
            { "offboarding.status": { $in: ["in_progress", "completed"] } },
          ],
        })
          .populate("department", "name code")
          .populate("salaryGrade", "level basicSalary")
          .select("-password");
      }
      if (!employees.length)
        return res
          .status(404)
          .json({ success: false, message: "No employees found" });
      const results = [];
      for (const emp of employees) {
        // eslint-disable-next-line no-await-in-loop
        const result = await OffboardingController.sendFinalSettlementEmail(
          emp,
          req.user
        );
        results.push(result);
      }
      const success = results.filter((r) => r.success);
      const failed = results.filter((r) => !r.success);
      return res.status(200).json({
        success: true,
        total: results.length,
        sent: success.length,
        failed: failed.length,
        details: { success, failed },
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // Bulk generate final settlement reports
  static async generateFinalSettlementReportBulk(req, res) {
    try {
      if (!req.user.permissions.includes(Permission.VIEW_OFFBOARDING)) {
        throw new ApiError(
          403,
          "You don't have permission to generate final settlement reports"
        );
      }

      let employees = [];
      if (
        Array.isArray(req.body.employeeIds) &&
        req.body.employeeIds.length > 0
      ) {
        employees = await UserModel.find({ _id: { $in: req.body.employeeIds } })
          .populate("department", "name code")
          .populate("salaryGrade", "level basicSalary")
          .select("-password");
      } else {
        // All offboarding or completed
        employees = await UserModel.find({
          $or: [
            { "lifecycle.currentState": "OFFBOARDING" },
            { "offboarding.status": { $in: ["in_progress", "completed"] } },
          ],
        })
          .populate("department", "name code")
          .populate("salaryGrade", "level basicSalary")
          .select("-password");
      }

      if (!employees.length) {
        return res
          .status(404)
          .json({ success: false, message: "No employees found" });
      }

      // Generate PDFs for all employees
      const pdfBuffers = [];
      const employeeNames = [];

      for (const employee of employees) {
        try {
          const { settlementDetails } =
            await OffboardingController.prepareEmployeeSettlement(employee);
          const doc = await generateFinalSettlementReport(
            employee,
            settlementDetails
          );
          const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

          pdfBuffers.push(pdfBuffer);
          employeeNames.push(`${employee.firstName}_${employee.lastName}`);
        } catch (error) {
          console.error(
            `Error generating PDF for ${employee.fullName}:`,
            error
          );
          // Continue with other employees
        }
      }

      if (pdfBuffers.length === 0) {
        return res.status(500).json({
          success: false,
          message: "Failed to generate any PDFs",
        });
      }

      // Create ZIP file with all PDFs
      const JSZip = await import("jszip");
      const zip = new JSZip.default();

      pdfBuffers.forEach((buffer, index) => {
        const fileName = `final_settlement_${employeeNames[index]}.pdf`;
        zip.file(fileName, buffer);
      });

      const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

      // Set response headers for ZIP download
      res.setHeader("Content-Type", "application/zip");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="final_settlements_${
          new Date().toISOString().split("T")[0]
        }.zip"`
      );

      res.send(zipBuffer);
    } catch (error) {
      console.error("Error generating bulk final settlement reports:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate final settlement reports",
        error: error.message,
      });
    }
  }

  // Bulk get final settlement details
  static async getFinalSettlementDetailsBulk(req, res) {
    try {
      if (!req.user.permissions.includes(Permission.VIEW_OFFBOARDING)) {
        throw new ApiError(
          403,
          "You don't have permission to view final settlement details"
        );
      }

      let employees = [];
      if (
        Array.isArray(req.body.employeeIds) &&
        req.body.employeeIds.length > 0
      ) {
        employees = await UserModel.find({ _id: { $in: req.body.employeeIds } })
          .populate("department", "name code")
          .populate("salaryGrade", "level basicSalary")
          .select("-password");
      } else {
        // All offboarding or completed
        employees = await UserModel.find({
          $or: [
            { "lifecycle.currentState": "OFFBOARDING" },
            { "offboarding.status": { $in: ["in_progress", "completed"] } },
          ],
        })
          .populate("department", "name code")
          .populate("salaryGrade", "level basicSalary")
          .select("-password");
      }

      if (!employees.length) {
        return res
          .status(404)
          .json({ success: false, message: "No employees found" });
      }

      // Get settlement details for all employees
      const settlementDetails = [];

      for (const employee of employees) {
        try {
          const { settlementDetails: details } =
            await OffboardingController.prepareEmployeeSettlement(employee);
          settlementDetails.push({
            employee: {
              _id: employee._id,
              fullName: employee.fullName,
              department: employee.department,
              position: employee.position,
            },
            settlementDetails: details,
          });
        } catch (error) {
          console.error(
            `Error getting settlement details for ${employee.fullName}:`,
            error
          );
          // Continue with other employees
        }
      }

      res.status(200).json({
        success: true,
        settlementDetails: settlementDetails,
      });
    } catch (error) {
      console.error("Error getting bulk final settlement details:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get final settlement details",
        error: error.message,
      });
    }
  }

  static async getFinalSettlementDetails(req, res, next) {
    try {
      console.log(
        "[OffboardingController.getFinalSettlementDetails] User:",
        req.user?._id,
        "Params:",
        req.params
      );

      if (!req.user.permissions.includes(Permission.VIEW_OFFBOARDING)) {
        throw new ApiError(
          403,
          "You don't have permission to view final settlement details"
        );
      }

      const { employeeId } = req.params;

      // Find the employee with salary grade information
      const employee = await UserModel.findById(employeeId)
        .populate("department", "name code")
        .populate("salaryGrade", "level basicSalary")
        .select("-password");

      if (!employee) {
        throw new ApiError(404, "Employee not found");
      }

      // Use shared helper to prepare employee data
      const { settlementDetails } =
        await OffboardingController.prepareEmployeeSettlement(employee);

      console.log(
        "Settlement details calculated for CSV/print:",
        settlementDetails
      );

      res.status(200).json({
        success: true,
        employee: {
          _id: employee._id,
          fullName:
            employee.fullName || `${employee.firstName} ${employee.lastName}`,
          department: employee.department,
          position: employee.position,
          email: employee.email,
          employeeId: employee.employeeId,
        },
        settlementDetails: settlementDetails,
      });
    } catch (error) {
      console.error(
        "[OffboardingController.getFinalSettlementDetails] Error:",
        error
      );
      next(error);
    }
  }
}
