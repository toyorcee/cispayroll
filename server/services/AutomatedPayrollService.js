import cron from "node-cron";
import SystemSettings from "../models/SystemSettings.js";
import { PayrollService } from "./PayrollService.js";
import { NotificationService } from "./NotificationService.js";
import UserModel from "../models/User.js";
import PayrollModel from "../models/Payroll.js";
import SalaryGrade from "../models/SalaryStructure.js";
import { PAYROLL_STATUS, APPROVAL_LEVELS } from "../models/Payroll.js";
import AuditService from "./AuditService.js";
import { AuditAction, AuditEntity } from "../models/Audit.js";
import { NOTIFICATION_TYPES } from "../models/Notification.js";
import { Types } from "mongoose";

// Helper to get all active employees
async function getAllActiveEmployeeIds() {
  const employees = await UserModel.find({
    status: "active",
    role: { $ne: "SUPER_ADMIN" },
  }).select("_id");
  return employees.map((e) => e._id);
}

// Helper to get current month/year
function getCurrentMonthYear() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

// Automated payroll processing service method
async function processAutomatedPayroll(month, year, frequency, superAdminId) {
  try {
    console.log(
      `[AUTOMATED] Starting automated payroll for ${frequency} period (${month}/${year})`
    );

    // Get all active employees
    const employees = await UserModel.find({
      status: "active",
      role: { $ne: "SUPER_ADMIN" },
    }).populate("department");

    if (!employees.length) {
      console.log("[AUTOMATED] No active employees found");
      return { processed: 0, skipped: 0, failed: 0 };
    }

    const results = {
      total: employees.length,
      processed: 0,
      skipped: 0,
      failed: 0,
      successful: [],
      processedDetails: [],
      skippedDetails: [],
      failedDetails: [],
    };

    // Process each employee
    for (const employee of employees) {
      try {
        console.log(
          `[AUTOMATED] Processing employee: ${employee.firstName} ${employee.lastName}`
        );

        // Check for existing payroll
        const existingPayroll = await PayrollModel.findOne({
          employee: employee._id,
          month,
          year,
          frequency,
        });

        if (existingPayroll) {
          results.skipped++;
          results.skippedDetails.push(
            `${employee.firstName} ${employee.lastName} (${employee.employeeId}): Payroll already exists`
          );
          continue;
        }

        // Get employee's salary grade
        if (!employee.gradeLevel) {
          results.failed++;
          results.failedDetails.push(
            `${employee.firstName} ${employee.lastName} (${employee.employeeId}): No grade level assigned`
          );
          continue;
        }

        const salaryGrade = await SalaryGrade.findOne({
          level: employee.gradeLevel,
          isActive: true,
        });

        if (!salaryGrade) {
          results.failed++;
          results.failedDetails.push(
            `${employee.firstName} ${employee.lastName} (${employee.employeeId}): No active salary grade found for level ${employee.gradeLevel}`
          );
          continue;
        }

        // Calculate payroll using PayrollService
        const payrollData = await PayrollService.calculatePayroll(
          employee._id,
          salaryGrade._id,
          month,
          year,
          frequency
        );

        if (!payrollData) {
          results.failed++;
          results.failedDetails.push(
            `${employee.firstName} ${employee.lastName} (${employee.employeeId}): Failed to calculate payroll`
          );
          continue;
        }

        // Create payroll record with COMPLETED status (automated processing bypasses approval)
        const payroll = await PayrollModel.create({
          ...payrollData,
          employee: employee._id,
          department: employee.department._id,
          status: PAYROLL_STATUS.COMPLETED,
          processedBy: superAdminId,
          createdBy: superAdminId,
          updatedBy: superAdminId,
          payment: {
            accountName: "Pending",
            accountNumber: "Pending",
            bankName: "Pending",
          },
          approvalFlow: {
            currentLevel: APPROVAL_LEVELS.SUPER_ADMIN,
            history: [
              {
                level: APPROVAL_LEVELS.SUPER_ADMIN,
                status: "APPROVED",
                action: "APPROVE",
                user: superAdminId,
                timestamp: new Date(),
                remarks: "Payroll automatically processed by system",
              },
            ],
            submittedBy: superAdminId,
            submittedAt: new Date(),
            status: "APPROVED",
          },
        });

        // Create audit log
        await AuditService.logAction(
          AuditAction.CREATE,
          AuditEntity.PAYROLL,
          payroll._id,
          superAdminId,
          {
            status: "COMPLETED",
            action: "AUTOMATED_PAYROLL_CREATED",
            employeeId: employee._id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            month,
            year,
            frequency,
            departmentId: employee.department._id,
            createdBy: superAdminId,
            message: `Automated payroll created for ${employee.firstName} ${employee.lastName}`,
            approvalLevel: APPROVAL_LEVELS.SUPER_ADMIN,
          }
        );

        // Send notification to employee using the same method as SuperAdminController
        await NotificationService.createPayrollNotification(
          payroll,
          NOTIFICATION_TYPES.PAYROLL_COMPLETED,
          employee
        );

        results.processed++;
        results.processedDetails.push(
          `${employee.firstName} ${employee.lastName} (${employee.employeeId})`
        );
        results.successful.push({
          employeeId: employee._id,
          payrollId: payroll._id,
          department: employee.department._id,
        });
      } catch (error) {
        console.error(
          `[AUTOMATED] Error processing employee ${employee._id}:`,
          error
        );
        results.failed++;
        results.failedDetails.push(
          `Employee ID ${employee._id}: ${error.message}`
        );
      }
    }

    // Create bulk audit log
    if (results.processed > 0) {
      await AuditService.logAction(
        AuditAction.CREATE,
        AuditEntity.PAYROLL,
        new Types.ObjectId(),
        superAdminId,
        new Map([
          ["status", "COMPLETED"],
          ["action", "AUTOMATED_BULK_PAYROLL_CREATED"],
          ["month", month],
          ["year", year],
          ["frequency", frequency],
          ["createdBy", superAdminId],
          [
            "message",
            `Automated payroll created ${results.processed} payrolls for ${month}/${year}`,
          ],
          ["approvalLevel", APPROVAL_LEVELS.SUPER_ADMIN],
          ["total", results.total],
          ["processed", results.processed],
          ["skipped", results.skipped],
          ["failed", results.failed],
          ["processedEmployees", results.processedDetails],
          ["skippedEmployees", results.skippedDetails],
          ["failedEmployees", results.failedDetails],
        ])
      );
    }

    console.log(`[AUTOMATED] Completed automated payroll processing:`, results);
    return results;
  } catch (error) {
    console.error("[AUTOMATED] Error in automated payroll processing:", error);
    throw error;
  }
}

// Main scheduled task
export function startAutomatedPayrollTask() {
  // Run every day at 2am
  cron.schedule("0 2 * * *", async () => {
    try {
      console.log("[CRON] Checking if today is payroll processing day...");

      // Get system settings
      const settings = await SystemSettings.findOne();
      if (!settings || !settings.payrollSettings) {
        console.log("[CRON] No payroll settings found");
        return;
      }

      const { processingDay, payPeriod } = settings.payrollSettings;
      const { month, year } = getCurrentMonthYear();
      const today = new Date().getDate();

      // Only run on the processing day
      if (today !== processingDay) {
        console.log(
          `[CRON] Today (${today}) is not the processing day (${processingDay}). Skipping.`
        );
        return;
      }

      // Get a Super Admin user for audit purposes
      const superAdmin = await UserModel.findOne({
        role: "SUPER_ADMIN",
        status: "active",
      });

      if (!superAdmin) {
        console.log("[CRON] No active Super Admin found for audit purposes");
        return;
      }

      console.log(
        `[CRON] Running automated payroll for all employees for ${payPeriod} period (${month}/${year})...`
      );

      // Process payroll using our service method
      const results = await processAutomatedPayroll(
        month,
        year,
        payPeriod,
        superAdmin._id
      );

      // Send notification to Super Admin about completion
      await NotificationService.createPayrollNotification(
        { month, year, frequency: payPeriod, results },
        NOTIFICATION_TYPES.BULK_PAYROLL_PROCESSED,
        superAdmin
      );

      console.log("[CRON] Automated payroll processing complete.");
    } catch (err) {
      console.error("[CRON] Error in automated payroll task:", err);
    }
  });
}
