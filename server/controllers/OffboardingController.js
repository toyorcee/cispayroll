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
import { EmailService } from "../services/EmailService.js";
import { NotificationService } from "../services/NotificationService.js";
import mongoose from "mongoose";

export class OffboardingController {
  static async initiateOffboarding(req, res, next) {
    try {
      console.log(
        "[OFFBOARDING CONTROLLER] Initiating offboarding with data:",
        {
          userId: req.params.userId,
          body: req.body,
          user: req.user._id,
        }
      );

      if (!req.user.permissions.includes(Permission.MANAGE_OFFBOARDING)) {
        console.log(
          "[OFFBOARDING CONTROLLER] Permission denied for user:",
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

      // Validate offboarding type
      console.log("[OFFBOARDING CONTROLLER] Validating offboarding type:", {
        providedType: type,
        validTypes: Object.values(OffboardingType),
      });

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
        console.log("[OFFBOARDING CONTROLLER] User not found:", userId);
        throw new ApiError(404, "User not found");
      }

      console.log("[OFFBOARDING CONTROLLER] User found:", {
        userId: user._id,
        currentOffboardingStatus: user.offboarding?.status,
        currentLifecycleState: user.lifecycle?.currentState,
        currentOnboardingStatus: user.lifecycle?.onboarding?.status,
      });

      // Check if user is already in offboarding
      if (
        user.offboarding?.status &&
        user.offboarding.status !== OffboardingStatus.NOT_STARTED
      ) {
        console.log(
          "[OFFBOARDING CONTROLLER] User already in offboarding process"
        );
        throw new ApiError(400, "User is already in offboarding process");
      }

      // Call the model method to initiate offboarding
      const updatedUser = await user.initiateOffboarding({
        type: {
          status: OffboardingStatus.INITIATED,
          type: type,
          reason: reason,
          targetExitDate: new Date(targetExitDate),
          initiatedBy: req.user._id,
          initiatedAt: new Date(),
        },
      });

      console.log(
        "[OFFBOARDING CONTROLLER] Offboarding initiated successfully"
      );

      res.status(200).json({
        success: true,
        message: "Offboarding process initiated successfully",
        data: updatedUser.offboarding,
      });
    } catch (error) {
      console.error(
        "[OFFBOARDING CONTROLLER] Error initiating offboarding:",
        error
      );
      next(error);
    }
  }

  static async updateOffboardingChecklist(req, res, next) {
    try {
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
      next(error);
    }
  }

  static async completeOffboarding(req, res, next) {
    try {
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
      next(error);
    }
  }

  static async getOffboardingEmployees(req, res, next) {
    try {
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

      // Get total count for pagination - include both active and completed offboarding
      const totalCount = await UserModel.countDocuments({
        $or: [
          { "lifecycle.currentState": UserLifecycleState.OFFBOARDING },
          { "offboarding.status": { $in: ["in_progress", "completed"] } },
        ],
      });

      // Get paginated employees - include both active and completed offboarding
      const employees = await UserModel.find({
        $or: [
          { "lifecycle.currentState": UserLifecycleState.OFFBOARDING },
          { "offboarding.status": { $in: ["in_progress", "completed"] } },
        ],
      })
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
      next(error);
    }
  }

  // Complete a specific offboarding task
  static async completeTask(req, res) {
    try {
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
          const pdfBuffer = await pdfDoc.output("arraybuffer");

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
      console.error("Error completing task:", error);
      res
        .status(500)
        .json({ message: "Error completing task", error: error.message });
    }
  }

  // Get offboarding details
  static async getOffboardingDetails(req, res, next) {
    try {
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
      next(error);
    }
  }

  // Cancel offboarding
  static async cancelOffboarding(req, res, next) {
    try {
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
      next(error);
    }
  }

  static async updateExitInterview(req, res, next) {
    try {
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
      next(error);
    }
  }

  static async updateRehireEligibility(req, res, next) {
    try {
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
      next(error);
    }
  }

  static async generateFinalSettlementReport(req, res, next) {
    try {
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

      if (!employee.salaryGrade || !employee.salaryGrade.basicSalary) {
        console.warn(
          `No salary grade information found for employee ${employeeId}`
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
      const settlementDetails = await calculateFinalSettlement(employee);

      // Generate PDF report
      const doc = await generateFinalSettlementReport(
        employee,
        settlementDetails
      );
      const pdfBuffer = doc.output("arraybuffer");

      // Set response headers for PDF download
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=final_settlement_${employee.employeeId}.pdf`
      );

      // Send the PDF buffer
      res.send(Buffer.from(pdfBuffer));
    } catch (error) {
      next(error);
    }
  }

  static async emailFinalSettlementReport(req, res) {
    try {
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

      // Check if salary grade information exists
      if (!employee.salaryGrade || !employee.salaryGrade.basicSalary) {
        console.warn(
          `No salary grade information found for employee ${employeeId}`
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
        employee.salary = {
          basic: employee.salaryGrade.basicSalary,
          allowances: [],
          deductions: [],
        };
      }

      // Calculate final settlement
      console.log("Calculating final settlement details...");
      const settlementDetails = await calculateFinalSettlement(employee);
      console.log("Settlement details calculated:", settlementDetails);

      // Generate PDF report
      console.log("Generating PDF report...");
      const doc = await generateFinalSettlementReport(
        employee,
        settlementDetails
      );
      const pdfBuffer = doc.output("arraybuffer");
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
              
              <p>Please find attached your detailed final settlement report for your records.</p>
            </div>
            
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>For any queries, please contact:</p>
              <p class="contact-info">HR Department</p>
              <p>Email: hr@centuryinfosystems.com</p>
              <p>Phone: +234 1234567890</p>
              <p>© ${new Date().getFullYear()} Century Information Systems. All rights reserved.</p>
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
            filename: `final_settlement_${employee.employeeId}.pdf`,
            content: Buffer.from(pdfBuffer),
          },
        ],
      });

      console.log("Email sent successfully to:", employee.email);

      res.status(200).json({
        success: true,
        message: "Final settlement report sent via email",
      });
    } catch (error) {
      console.error("Error in emailFinalSettlementReport:", error);
      next(error);
    }
  }
}
