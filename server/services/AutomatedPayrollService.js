import cron from "node-cron";
import SystemSettings from "../models/SystemSettings.js";
import { PayrollService } from "./PayrollService.js";
import { NotificationService } from "./NotificationService.js";
import UserModel from "../models/User.js";
import PayrollModel, { PAYROLL_STATUS } from "../models/Payroll.js";
import SalaryGrade from "../models/SalaryStructure.js";
import { APPROVAL_LEVELS } from "../models/Payroll.js";
import AuditService from "./AuditService.js";
import { AuditAction, AuditEntity } from "../models/Audit.js";
import { NOTIFICATION_TYPES } from "../models/Notification.js";
import { Types } from "mongoose";
import { ApiError } from "../utils/errorHandler.js";
import Audit from "../models/Audit.js";
import PayrollSummaryService from "./PayrollSummaryService.js";
import DepartmentModel from "../models/Department.js";
import { EmailService } from "./emailService.js";
import generatePayslipPDF from "../utils/pdfGenerator.js";
import PayrollSummaryModel, { SummaryType } from "../models/PayrollSummary.js";
import PaymentModel from "../models/Payment.js";
import PayrollStatisticsLogger from "../utils/payrollStatisticsLogger.js";

// Helper to get all active employees who are eligible for payroll
async function getAllActiveEmployeeIds() {
  const employees = await UserModel.find({
    status: "active",
    role: { $ne: "SUPER_ADMIN" },
  }).select("_id firstName lastName");

  const eligibleEmployees = [];
  const ineligibleEmployees = [];

  for (const employee of employees) {
    const eligibility = await PayrollService.checkOnboardingEligibility(
      employee._id
    );

    if (eligibility.eligible) {
      eligibleEmployees.push(employee._id);
    } else {
      ineligibleEmployees.push({
        id: employee._id,
        name: `${employee.firstName} ${employee.lastName}`,
        reason: eligibility.reason,
      });
      console.log(
        `❌ Excluding employee ${employee.firstName} ${employee.lastName}: ${eligibility.reason}`
      );
    }
  }

  if (ineligibleEmployees.length > 0) {
    console.log(
      `📊 Payroll eligibility summary: ${eligibleEmployees.length} eligible, ${ineligibleEmployees.length} ineligible`
    );
  }

  return eligibleEmployees;
}

// Helper to get current month/year
function getCurrentMonthYear() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

// Automated payroll processing service method
async function processAutomatedPayroll(month, year, frequency, superAdminId) {
  try {
    const startTime = Date.now();
    console.log(
      `🚀 [AUTOMATED] Starting automated payroll for ${frequency} period (${month}/${year})`
    );

    // Get super admin user
    const superAdminUser = await UserModel.findById(superAdminId)
      .populate("department", "name code")
      .select("+position +role +department");

    if (!superAdminUser) {
      throw new Error("Super admin user not found");
    }

    // Standardized summary object (matching controller)
    const processingSummary = {
      totalAttempted: 0,
      processed: 0,
      skipped: 0,
      failed: 0,
      errors: [],
      warnings: [],
      details: {
        month,
        year,
        frequency,
        processingTime: null,
        totalNetPay: 0,
        departmentBreakdown: {},
        employeeDetails: [],
      },
    };

    // Get all active employees (matching controller exactly)
    const employees = await UserModel.find({
      status: "active",
    }).populate("department");

    if (!employees || employees.length === 0) {
      console.log("[AUTOMATED] No active employees found");
      return { processed: 0, skipped: 0, failed: 0 };
    }

    processingSummary.totalAttempted = employees.length;
    console.log(`✅ [AUTOMATED] Found ${employees.length} active employees`);

    // Results object matching controller structure
    const results = {
      total: employees.length,
      processed: 0,
      skipped: 0,
      failed: 0,
      successful: [],
      failedEmployees: [],
      skippedEmployees: [],
    };

    // Process each employee with individual error handling (matching controller)
    for (let i = 0; i < employees.length; i++) {
      const employee = employees[i];
      const employeeIndex = i + 1;

      try {
        console.log(
          `\n🔄 [AUTOMATED] Processing employee ${employeeIndex}/${employees.length}: ${employee.firstName} ${employee.lastName} (${employee.employeeId})`
        );

        // Skip employees without department assignment (especially Super Admins)
        if (!employee.department) {
          const warning = `${employee.firstName} ${employee.lastName} (${employee.employeeId}): No department assigned - skipping payroll processing`;
          console.warn(`⚠️ [AUTOMATED] ${warning}`);

          results.skipped++;
          results.skippedEmployees.push({
            employeeId: employee._id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            employeeCode: employee.employeeId,
            reason: "No department assigned - skipping payroll processing",
            department: null,
            departmentName: null,
          });
          processingSummary.warnings.push({
            type: "NO_DEPARTMENT",
            message: warning,
            code: "EMPLOYEE_NO_DEPARTMENT",
            employeeId: employee._id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            role: employee.role,
          });
          continue;
        }

        // Check for existing payroll (matching controller)
        const existingPayroll = await PayrollModel.findOne({
          employee: employee._id,
          month,
          year,
          frequency,
        });

        if (existingPayroll) {
          const warning = `${employee.firstName} ${employee.lastName} (${employee.employeeId}): Payroll already exists for ${month}/${year}`;
          console.warn(`⚠️ [AUTOMATED] ${warning}`);

          results.skipped++;
          results.skippedEmployees.push({
            employeeId: employee._id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            employeeCode: employee.employeeId,
            reason: "Payroll already exists for this period",
            existingPayrollId: existingPayroll._id,
            department: employee.department?._id,
            departmentName: employee.department?.name,
          });
          processingSummary.warnings.push({
            type: "DUPLICATE_PAYROLL",
            message: warning,
            code: "PAYROLL_ALREADY_EXISTS",
            employeeId: employee._id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            period: `${month}/${year} (${frequency})`,
          });
          continue;
        }

        // Get employee's salary grade (matching controller)
        if (!employee.gradeLevel) {
          const error = `${employee.firstName} ${employee.lastName} (${employee.employeeId}): No grade level assigned`;
          console.error(`❌ [AUTOMATED] ${error}`);

          results.failed++;
          results.failedEmployees.push({
            employeeId: employee._id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            employeeCode: employee.employeeId,
            reason: "No grade level assigned",
            department: employee.department?._id,
            departmentName: employee.department?.name,
          });
          processingSummary.errors.push({
            type: "GRADE_ERROR",
            message: error,
            code: "NO_GRADE_LEVEL",
            employeeId: employee._id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
          });
          continue;
        }

        const salaryGrade = await SalaryGrade.findOne({
          level: employee.gradeLevel,
          isActive: true,
        });

        if (!salaryGrade) {
          const error = `${employee.firstName} ${employee.lastName} (${employee.employeeId}): No active salary grade found for level ${employee.gradeLevel}`;
          console.error(`❌ [AUTOMATED] ${error}`);

          results.failed++;
          results.failedEmployees.push({
            employeeId: employee._id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            employeeCode: employee.employeeId,
            reason: `No active salary grade for level ${employee.gradeLevel}`,
            department: employee.department?._id,
            departmentName: employee.department?.name,
          });
          processingSummary.errors.push({
            type: "GRADE_ERROR",
            message: error,
            code: "NO_ACTIVE_SALARY_GRADE",
            employeeId: employee._id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            gradeLevel: employee.gradeLevel,
          });
          continue;
        }

        // Calculate payroll (matching controller exactly)
        console.log(
          `🧮 [AUTOMATED] Calculating payroll for ${employee.firstName} ${employee.lastName} (${employee.employeeId})`
        );
        console.log(
          `📋 [AUTOMATED] Department: ${
            employee.department?.name || "Unknown"
          } (${employee.department?._id || "N/A"})`
        );

        const payrollData = await PayrollService.calculatePayroll(
          employee._id,
          salaryGrade._id,
          month,
          year,
          frequency,
          employee.department?._id
        );

        if (!payrollData) {
          const error = `${employee.firstName} ${employee.lastName} (${employee.employeeId}): Failed to calculate payroll`;
          console.error(`❌ [AUTOMATED] ${error}`);

          results.failed++;
          results.failedEmployees.push({
            employeeId: employee._id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            employeeCode: employee.employeeId,
            reason: "Payroll calculation failed",
            department: employee.department?._id,
            departmentName: employee.department?.name,
          });
          processingSummary.errors.push({
            type: "CALCULATION_ERROR",
            message: error,
            code: "PAYROLL_CALCULATION_FAILED",
            employeeId: employee._id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
          });
          continue;
        }

        // Create payroll record with APPROVED status (matching controller exactly)
        const payroll = await PayrollModel.create({
          ...payrollData,
          employee: employee._id,
          department: employee.department?._id,
          status: PAYROLL_STATUS.APPROVED,
          processedBy: superAdminUser._id,
          createdBy: superAdminUser._id,
          updatedBy: superAdminUser._id,
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
                user: superAdminUser._id,
                timestamp: new Date(),
                remarks:
                  "Payroll created and approved by Super Admin (Automated)",
              },
            ],
            submittedBy: superAdminUser._id,
            submittedAt: new Date(),
            status: "APPROVED",
          },
        });

        results.processed++;
        results.successful.push({
          employeeId: employee._id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          employeeCode: employee.employeeId,
          payrollId: payroll._id,
          payroll: payroll,
          netPay: payroll.totals?.netPay,
          grossPay: payroll.totals?.grossEarnings,
          totalDeductions: payroll.totals?.totalDeductions,
          department: employee.department?._id,
          departmentName: employee.department?.name,
        });

        // Update department breakdown (matching controller)
        const deptName = employee.department?.name || "Unknown";
        if (!processingSummary.details.departmentBreakdown[deptName]) {
          processingSummary.details.departmentBreakdown[deptName] = {
            count: 0,
            totalNetPay: 0,
            employees: [],
          };
        }
        processingSummary.details.departmentBreakdown[deptName].count++;
        processingSummary.details.departmentBreakdown[deptName].totalNetPay +=
          payroll.totals?.netPay || 0;
        processingSummary.details.departmentBreakdown[deptName].employees.push({
          name: `${employee.firstName} ${employee.lastName}`,
          employeeCode: employee.employeeId,
          netPay: payroll.totals?.netPay,
        });

        // Audit logging (matching controller)
        await PayrollStatisticsLogger.logPayrollAction({
          action: AuditAction.CREATE,
          payrollId: payroll._id,
          userId: superAdminUser._id,
          status: PAYROLL_STATUS.APPROVED,
          details: {
            employeeId: employee._id,
            departmentId: employee.department?._id,
            month,
            year,
            frequency,
            netPay: payroll.totals?.netPay,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            departmentName: employee.department?.name,
            createdBy: superAdminUser._id,
            position: superAdminUser.position,
            role: superAdminUser.role,
            message: `Created and approved payroll for ${employee.firstName} ${employee.lastName} (Automated)`,
            approvalLevel: APPROVAL_LEVELS.SUPER_ADMIN,
            remarks: "Payroll created and approved by Super Admin (Automated)",
          },
        });

        console.log(
          `✅ [AUTOMATED] Created payroll for ${employee.firstName} ${employee.lastName} with APPROVED status`
        );
      } catch (error) {
        console.error(
          `❌ [AUTOMATED] Error processing employee ${employee._id}:`,
          error
        );
        const errorMessage = `Employee ID ${employee._id}: ${error.message}`;

        results.failed++;
        results.failedEmployees.push({
          employeeId: employee._id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          employeeCode: employee.employeeId,
          reason: error.message,
          department: employee.department?._id,
          departmentName: employee.department?.name,
        });
        processingSummary.errors.push({
          type: "PROCESSING_ERROR",
          message: errorMessage,
          code: "EMPLOYEE_PROCESSING_FAILED",
          employeeId: employee._id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          index: employeeIndex,
          originalError: error.message,
        });
      }
    }

    // Calculate processing time (matching controller)
    const processingTime = Date.now() - startTime;
    processingSummary.details.processingTime = processingTime;
    results.processingTime = processingTime;

    // Update summary totals (matching controller)
    processingSummary.processed = results.processed;
    processingSummary.skipped = results.skipped;
    processingSummary.failed = results.failed;
    processingSummary.details.totalNetPay = results.successful.reduce(
      (sum, emp) => sum + (emp.netPay || 0),
      0
    );

    // Add employee details to summary (matching controller exactly)
    processingSummary.details.employeeDetails = [
      ...results.successful.map((emp) => ({
        status: "success",
        name: emp.employeeName,
        employeeId: emp.employeeId,
        employeeCode: emp.employeeCode,
        netPay: emp.netPay,
        grossPay: emp.grossPay,
        totalDeductions: emp.totalDeductions,
        department: emp.department,
        departmentName: emp.departmentName,
        payrollId: emp.payrollId,
      })),
      ...results.skippedEmployees.map((emp) => ({
        status: "skipped",
        name: emp.employeeName,
        employeeId: emp.employeeId,
        employeeCode: emp.employeeCode,
        reason: emp.reason,
        department: emp.department,
        departmentName: emp.departmentName,
        netPay: 0,
        grossPay: 0,
        totalDeductions: 0,
      })),
      ...results.failedEmployees.map((emp) => ({
        status: "failed",
        name: emp.employeeName,
        employeeId: emp.employeeId,
        employeeCode: emp.employeeCode,
        reason: emp.reason,
        department: emp.department,
        departmentName: emp.departmentName,
        netPay: 0,
        grossPay: 0,
        totalDeductions: 0,
      })),
    ];

    console.log(`\n🎉 [AUTOMATED] All employees processing completed!`);
    console.log(
      `📊 [AUTOMATED] Final Summary:`,
      JSON.stringify(processingSummary, null, 2)
    );

    // SAVE SUMMARY TO DATABASE (matching controller)
    const summaryData = {
      batchId: `BATCH_AUTO_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      processedBy: superAdminUser._id,
      department: null, // All departments for all employees
      month,
      year,
      frequency,
      processingTime: processingTime,
      totalAttempted: results.total,
      processed: results.processed,
      skipped: results.skipped,
      failed: results.failed,
      totalNetPay: results.successful.reduce(
        (sum, emp) => sum + (emp.netPay || 0),
        0
      ),
      totalGrossPay: results.successful.reduce(
        (sum, emp) => sum + (emp.grossPay || 0),
        0
      ),
      totalDeductions: results.successful.reduce(
        (sum, emp) => sum + (emp.totalDeductions || 0),
        0
      ),
      departmentBreakdown: processingSummary.details.departmentBreakdown,
      employeeDetails: processingSummary.details.employeeDetails,
      errors: processingSummary.errors,
      warnings: processingSummary.warnings,
      summaryType: SummaryType.PROCESSING,
      createdBy: superAdminUser._id,
    };

    // Save the summary to database
    await PayrollSummaryService.createSummary(summaryData);
    console.log(
      "💾 [AUTOMATED] Payroll summary saved to database with batch ID:",
      summaryData.batchId
    );

    // Create a single audit log for the bulk action (matching controller)
    if (results.processed > 0) {
      await PayrollStatisticsLogger.logBatchOperation(
        "PROCESS_ALL_EMPLOYEES_AUTOMATED",
        results.successful.map((s) => s.payrollId),
        superAdminUser._id,
        {
          month,
          year,
          frequency,
          totalEmployees: results.total,
          processedCount: results.processed,
          skippedCount: results.skipped,
          failedCount: results.failed,
          totalAmount: results.successful.reduce(
            (sum, emp) => sum + (emp.netPay || 0),
            0
          ),
          processingTime: processingTime,
          remarks: `Automated processing: ${results.processed} payrolls for ${month}/${year}`,
          message: `Automated: Created and approved ${results.processed} payrolls for ${month}/${year}`,
          approvalLevel: APPROVAL_LEVELS.SUPER_ADMIN,
          createdBy: superAdminUser._id,
          position: superAdminUser.position,
          role: superAdminUser.role,
          processedEmployees: results.successful.map((emp) => emp.employeeName),
          skippedEmployees: results.skippedEmployees.map(
            (emp) => emp.employeeName
          ),
          failedEmployees: results.failedEmployees.map(
            (emp) => emp.employeeName
          ),
        }
      );
    }

    console.log(
      `🎉 [AUTOMATED] Automated payroll processing completed successfully in ${processingTime}ms!`
    );
    console.log(
      `📊 [AUTOMATED] Summary: ${results.processed} processed, ${results.skipped} skipped, ${results.failed} failed`
    );

    return {
      success: true,
      message: "Automated payroll processing completed successfully",
      data: {
        total: results.total,
        processed: results.processed,
        skipped: results.skipped,
        failed: results.failed,
        processingTime: processingTime,
        batchId: summaryData.batchId,
      },
      summary: processingSummary,
    };
  } catch (error) {
    console.error("❌ [AUTOMATED] Automated payroll processing failed:", error);
    throw error;
  }
}

/**
 * Initiate payments for approved payrolls
 */
async function initiatePaymentsForApprovedPayrolls(payrollIds, superAdminId) {
  const results = {
    successful: [],
    failed: [],
  };

  for (const payrollId of payrollIds) {
    try {
      const payroll = await PayrollModel.findById(payrollId)
        .populate("employee", "firstName lastName")
        .populate("department", "name");

      if (!payroll) {
        results.failed.push({ payrollId, error: "Payroll not found" });
        continue;
      }

      // Update payroll status to PENDING_PAYMENT
      const updatedPayroll = await PayrollModel.findByIdAndUpdate(
        payrollId,
        {
          status: PAYROLL_STATUS.PENDING_PAYMENT,
          payment: {
            amount: payroll.totalAmount,
            method: "BANK_TRANSFER",
            reference: `PAY-${Date.now()}-${payrollId}`,
            bankDetails: {
              bankName: "Pending",
              accountNumber: "Pending",
              accountName: "Pending",
            },
            notes: "Payment initiated via automated processing",
          },
          approvalFlow: {
            ...payroll.approvalFlow,
            currentLevel: APPROVAL_LEVELS.SUPER_ADMIN,
            history: [
              ...(payroll.approvalFlow.history || []),
              {
                level: APPROVAL_LEVELS.SUPER_ADMIN,
                status: "APPROVED",
                user: superAdminId,
                action: "APPROVE",
                updatedBy: superAdminId,
                updatedAt: new Date(),
                remarks: "Payment initiated via automated processing",
              },
            ],
            submittedBy: superAdminId,
            submittedAt: new Date(),
            status: PAYROLL_STATUS.PENDING_PAYMENT,
          },
        },
        { new: true }
      );

      // Audit logging
      await PayrollStatisticsLogger.logPayrollAction({
        action: AuditAction.PAYMENT_PROCESSED,
        payrollId: payrollId,
        userId: superAdminId,
        status: PAYROLL_STATUS.PENDING_PAYMENT,
        details: {
          previousStatus: PAYROLL_STATUS.APPROVED,
          paymentReference: updatedPayroll.payment.reference,
          method: "BANK_TRANSFER",
          notes: "Payment initiated via automated processing",
          employeeName: `${payroll.employee?.firstName} ${payroll.employee?.lastName}`,
          departmentName: payroll.department?.name,
          createdBy: superAdminId,
          message: `Payment initiated for ${payroll.employee?.firstName} ${payroll.employee?.lastName}`,
          approvalLevel: APPROVAL_LEVELS.SUPER_ADMIN,
          remarks: "Payment initiated via automated processing",
        },
      });

      results.successful.push({
        payrollId,
        status: PAYROLL_STATUS.PENDING_PAYMENT,
        payment: updatedPayroll.payment,
      });
    } catch (error) {
      console.error(
        `❌ [AUTOMATED] Failed to initiate payment for payroll ${payrollId}:`,
        error.message
      );
      results.failed.push({ payrollId, error: error.message });
    }
  }

  return results;
}

/**
 * Mark all pending payment payrolls as paid
 */
async function markPaymentsAsPaid(payrollIds, superAdminId) {
  const results = {
    successful: [],
    failed: [],
  };

  for (const payrollId of payrollIds) {
    try {
      const payroll = await PayrollModel.findById(payrollId)
        .populate("employee", "firstName lastName")
        .populate("department", "name");

      if (!payroll) {
        results.failed.push({ payrollId, error: "Payroll not found" });
        continue;
      }

      if (payroll.status !== PAYROLL_STATUS.PENDING_PAYMENT) {
        results.failed.push({
          payrollId,
          error: `Payroll must be in PENDING_PAYMENT status. Current status: ${payroll.status}`,
        });
        continue;
      }

      // Update payroll status to PAID
      const updatedPayroll = await PayrollModel.findByIdAndUpdate(
        payrollId,
        {
          status: PAYROLL_STATUS.PAID,
          "payment.status": "PAID",
          "payment.paidAt": new Date(),
          approvalFlow: {
            history: [
              ...(payroll.approvalFlow.history || []),
              {
                level: APPROVAL_LEVELS.SUPER_ADMIN,
                status: "APPROVED",
                user: superAdminId,
                action: "APPROVE",
                updatedBy: superAdminId,
                updatedAt: new Date(),
                remarks: "Payment completed successfully",
              },
            ],
            currentLevel: APPROVAL_LEVELS.SUPER_ADMIN,
            status: "APPROVED",
            approvedAt: new Date(),
            approvedBy: superAdminId,
          },
        },
        { new: true }
      );

      // Log successful payment
      console.log(
        `✅ Payment marked as PAID for payroll ${payrollId} - Employee: ${payroll.employee.firstName} ${payroll.employee.lastName}`
      );

      results.successful.push({
        payrollId,
        employeeName: `${payroll.employee.firstName} ${payroll.employee.lastName}`,
        department: payroll.department.name,
        amount: payroll.totalAmount,
      });
    } catch (error) {
      console.error(
        `❌ Error marking payment as PAID for payroll ${payrollId}:`,
        error
      );
      results.failed.push({ payrollId, error: error.message });
    }
  }

  return results;
}

/**
 * Send payslips to paid payrolls
 */
async function sendPayslipsToPaidPayrolls(payrollIds, superAdminId) {
  const results = {
    successful: [],
    failed: [],
  };

  for (const payrollId of payrollIds) {
    try {
      const payroll = await PayrollModel.findById(payrollId)
        .populate("employee", "firstName lastName email")
        .populate("department", "name")
        .populate("salaryGrade");

      if (!payroll) {
        results.failed.push({ payrollId, error: "Payroll not found" });
        continue;
      }

      // Check if email was already sent
      if (payroll.emailSent) {
        console.log(
          `⏭️ [AUTOMATED] Skipping payroll ${payrollId} - email already sent`
        );
        continue;
      }

      // Prepare PDF data - match SuperAdminController exactly
      const pdfData = {
        employee: payroll.employee,
        department: payroll.department,
        month: payroll.month,
        year: payroll.year,
        basicSalary: payroll.basicSalary,
        earnings: {
          basicSalary: payroll.basicSalary,
          overtime: payroll.earnings.overtime,
          bonus: payroll.earnings.bonus,
          totalEarnings: payroll.earnings.totalEarnings,
        },
        deductions: {
          tax: payroll.deductions.tax,
          pension: payroll.deductions.pension,
          nhf: payroll.deductions.nhf,
          loans: payroll.deductions.loans,
          others: payroll.deductions.others,
          totalDeductions: payroll.deductions.totalDeductions,
          breakdown: payroll.deductions.breakdown,
        },
        totals: {
          grossEarnings: payroll.totals.grossEarnings,
          totalDeductions: payroll.totals.totalDeductions,
          netPay: payroll.totals.netPay,
        },
        paymentDetails: {
          status: payroll.status,
          paymentDate: payroll.approvalFlow?.paidAt || new Date(),
        },
        gradeAllowances: payroll.allowances?.gradeAllowances || [],
        additionalAllowances: payroll.allowances?.additionalAllowances || [],
        personalBonuses: payroll.bonuses?.items || [],
      };

      // Generate PDF
      const pdfDoc = generatePayslipPDF(pdfData);
      const pdfBuffer = await pdfDoc.output("arraybuffer");

      // Create email service instance
      const emailService = new EmailService();

      // Retry logic for email sending - match SuperAdminController
      const maxRetries = 3;
      let lastError = null;
      let attempt = 0;
      let emailSent = false;

      for (attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(
            `📧 [AUTOMATED] Attempt ${attempt}/${maxRetries} - Sending payslip to ${payroll.employee.email} (ID: ${payrollId})`
          );

          // Send email
          await emailService.sendPayslipEmail(
            payroll.employee.email,
            pdfData,
            pdfBuffer
          );

          console.log(
            `✅ [AUTOMATED] Payslip sent successfully on attempt ${attempt} for ${payroll.employee.email}`
          );
          emailSent = true;
          break;
        } catch (error) {
          lastError = error;
          console.error(
            `❌ [AUTOMATED] Attempt ${attempt}/${maxRetries} failed for ${payroll.employee.email}:`,
            {
              error: error.message,
              code: error.code,
              payrollId: payrollId,
            }
          );

          // If this is not the last attempt, wait before retrying
          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
            console.log(
              `⏳ [AUTOMATED] Waiting ${delay}ms before retry for ${payroll.employee.email}...`
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }

      if (emailSent) {
        // Update payroll to mark email as sent
        await PayrollModel.findByIdAndUpdate(payrollId, {
          $set: {
            emailSent: true,
            emailSentAt: new Date(),
          },
        });

        // Create notification for employee - match SuperAdminController
        await NotificationService.createNotification(
          payroll.employee._id,
          NOTIFICATION_TYPES.PAYROLL_COMPLETED,
          payroll.employee,
          payroll,
          null,
          { recipientId: payroll.employee._id }
        );

        // ✅ Status remains PAID - do NOT change to APPROVED
        console.log(
          `✅ [AUTOMATED] Payslip sent and notification created for payroll ${payrollId}`
        );

        results.successful.push({
          payrollId,
          employeeName: `${payroll.employee.firstName} ${payroll.employee.lastName}`,
          email: payroll.employee.email,
          attempt: attempt,
        });
      } else {
        // Update payroll record to mark email as failed
        await PayrollModel.findByIdAndUpdate(payrollId, {
          $set: {
            emailSent: false,
            emailSentAt: new Date(),
            emailError: lastError.message,
          },
        });

        console.error(
          `💥 [AUTOMATED] All ${maxRetries} attempts failed for payroll ${payrollId}:`,
          lastError.message
        );

        results.failed.push({
          payrollId,
          employeeName: `${payroll.employee.firstName} ${payroll.employee.lastName}`,
          employeeEmail: payroll.employee.email,
          error: lastError.message,
          attempts: maxRetries,
        });
      }
    } catch (error) {
      console.error(
        `❌ [AUTOMATED] Failed to send payslip for payroll ${payrollId}:`,
        error.message
      );
      results.failed.push({ payrollId, error: error.message });
    }
  }

  return results;
}

/**
 * Create batch summary
 */
async function createBatchSummary(params) {
  const {
    month,
    year,
    frequency,
    results,
    paymentResults,
    paidResults,
    payslipResults,
    superAdminId,
    startTime,
  } = params;

  // Calculate totals from successful payrolls
  const successfulPayrolls = await PayrollModel.find({
    _id: { $in: results.successful },
  }).populate("employee department");

  const totalNetPay = successfulPayrolls.reduce(
    (sum, payroll) => sum + (payroll.totals.netPay || 0),
    0
  );
  const totalGrossPay = successfulPayrolls.reduce(
    (sum, payroll) => sum + (payroll.totals.grossEarnings || 0),
    0
  );
  const totalDeductions = successfulPayrolls.reduce(
    (sum, payroll) => sum + (payroll.totals.totalDeductions || 0),
    0
  );

  // Build employee details array
  const employeeDetails = [];

  // Add successful employees
  for (const payroll of successfulPayrolls) {
    employeeDetails.push({
      employeeId: payroll.employee._id,
      name: `${payroll.employee.firstName} ${payroll.employee.lastName}`,
      status: "success",
      netPay: payroll.totals.netPay || 0,
      grossPay: payroll.totals.grossEarnings || 0,
      totalDeductions: payroll.totals.totalDeductions || 0,
      department: payroll.department._id, // Ensure this is an ObjectId
      departmentName: payroll.department.name,
      payrollId: payroll._id,
    });
  }

  // Add failed employees
  // Note: Skipping failed employees in employeeDetails since they don't have valid ObjectIds
  // Failed employees are tracked in processingErrors instead
  /*
  for (const failedDetail of results.failedDetails) {
    const nameMatch = failedDetail.match(/^([^(]+)/);
    const reasonMatch = failedDetail.match(/: (.+)$/);

    employeeDetails.push({
      employeeId: null,
      name: nameMatch ? nameMatch[1].trim() : "Unknown Employee",
      status: "failed",
      netPay: 0,
      grossPay: 0,
      totalDeductions: 0,
      department: null,
      departmentName: "Unknown",
      reason: reasonMatch ? reasonMatch[1] : "Processing failed",
    });
  }
  */

  const batchSummary = await PayrollSummaryModel.create({
    batchId: `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    month,
    year,
    frequency,
    processingTime: Date.now() - startTime,
    totalAttempted: results.processed + results.skipped + results.failed,
    processed: results.processed,
    skipped: results.skipped,
    failed: results.failed,
    totalNetPay,
    totalGrossPay,
    totalDeductions,
    processedBy: superAdminId,
    employeeDetails,
    processingErrors: results.failedDetails.map((detail) => ({
      type: "PROCESSING_ERROR",
      message: detail,
      timestamp: new Date(),
    })),
  });

  return batchSummary;
}

/**
 * Send final notifications
 */
async function sendFinalNotifications(batchSummary, superAdminId) {
  const summaryMsg = `Automated payroll batch processing completed for ${batchSummary.month}/${batchSummary.year} (${batchSummary.frequency}):
- ${batchSummary.processedEmployees} employees processed and completed
- ${batchSummary.skippedEmployees} skipped (already exists)
- ${batchSummary.failedEmployees} failed
- ${batchSummary.paymentsInitiated} payments initiated
- ${batchSummary.paymentsCompleted} payments completed
- ${batchSummary.payslipsSent} payslips sent
See batch details for more info.`;

  // Find recipients
  const recipients = [];

  // Super Admin
  const superAdminUser = await UserModel.findOne({
    role: /super_admin/i,
    status: "active",
  });
  if (superAdminUser) recipients.push(superAdminUser);

  // Head of HR
  const hrDept = await DepartmentModel.findOne({
    name: /human resources|hr/i,
    status: "active",
  });
  if (hrDept) {
    const hrHead = await UserModel.findOne({
      department: hrDept._id,
      role: /admin|head/i,
      status: "active",
    });
    if (hrHead) recipients.push(hrHead);
  }

  // Accountants
  const accountants = await UserModel.find({
    role: /accountant/i,
    status: "active",
  });
  recipients.push(...accountants);

  // Send notifications
  for (const recipient of recipients) {
    try {
      await NotificationService.createNotification(
        recipient._id,
        NOTIFICATION_TYPES.PAYROLL_APPROVED,
        recipient,
        null,
        null,
        {
          recipientId: recipient._id,
          message: summaryMsg,
          batchSummaryId: batchSummary._id,
        }
      );
    } catch (error) {
      console.error(
        `❌ [AUTOMATED] Failed to send notification to ${recipient.firstName} ${recipient.lastName}:`,
        error.message
      );
    }
  }
}

// ===== CRON JOB SETUP =====
// Dynamic cron job that runs at 1:30 PM every day

// Function to get super admin ID
async function getSuperAdminId() {
  try {
    const superAdmin = await UserModel.findOne({
      role: /super_admin/i,
      status: "active",
    });

    if (!superAdmin) {
      console.error(
        "❌ [CRON] No active super admin found for automated payroll"
      );
      return null;
    }

    return superAdmin._id;
  } catch (error) {
    console.error("❌ [CRON] Error getting super admin:", error);
    return null;
  }
}

// Function to get next scheduled run time
function getNextScheduledTime() {
  const now = new Date();
  const scheduledTime = new Date();
  scheduledTime.setHours(13, 30, 0, 0); 

  // If it's already past 1:30 PM today, schedule for tomorrow
  if (now > scheduledTime) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  return scheduledTime;
}

function formatTime(date) {
  return date.toLocaleString("en-US", {
    timeZone: "Africa/Lagos",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

// Main cron job function
async function runAutomatedPayrollCron() {
  try {
    console.log("🚀 [CRON] Starting automated payroll cron job...");

    // === CHECK SUPER ADMIN SETTINGS FOR PROCESSING DAY ===
    const systemSettings = await SystemSettings.findOne();
    if (!systemSettings) {
      console.log(
        "⚠️ [CRON] No system settings found, proceeding with default settings"
      );
    } else {
      const today = new Date();
      const currentDayOfMonth = today.getDate(); // Day of month (1-31)
      const processingDay = systemSettings.payrollSettings?.processingDay || 28;

      console.log(
        `📅 [CRON] Today: ${today.toLocaleDateString()}, Day of month: ${currentDayOfMonth}`
      );
      console.log(
        `⚙️ [CRON] Processing day setting: ${processingDay} (day of month)`
      );

      if (currentDayOfMonth !== processingDay) {
        console.log(
          `⏭️ [CRON] Today is not the processing day. Skipping automated payroll.`
        );
        return;
      }

      console.log(
        `✅ [CRON] Today is the processing day. Proceeding with automated payroll.`
      );
    }

    const superAdminId = await getSuperAdminId();
    if (!superAdminId) {
      console.error(
        "❌ [CRON] Cannot run automated payroll without super admin"
      );
      return;
    }

    const { month, year } = getCurrentMonthYear();
    const frequency = "monthly"; // Default to monthly

    console.log(
      `📅 [CRON] Processing payroll for ${month}/${year} (${frequency})`
    );
    console.log(`👤 [CRON] Super Admin ID: ${superAdminId}`);

    const result = await processAutomatedPayroll(
      month,
      year,
      frequency,
      superAdminId
    );

    console.log("✅ [CRON] Automated payroll cron job completed successfully");
    console.log("📊 [CRON] Results:", result);
  } catch (error) {
    console.error("❌ [CRON] Automated payroll cron job failed:", error);
  }
}

// Get current time and next scheduled time for logging
const currentTime = new Date();
const nextScheduledTime = getNextScheduledTime();

console.log("⏰ [CRON] Setting up automated payroll cron job...");
console.log(`🕐 [CRON] Current time: ${formatTime(currentTime)}`);
console.log(`🎯 [CRON] Next scheduled run: ${formatTime(nextScheduledTime)}`);

// Schedule the cron job - Run at 1:30 PM every day
const cronJob = cron.schedule(
  "30 13 * * *", // Run at 1:30 PM every day
  async () => {
    console.log("🔔 [CRON] Cron job triggered at:", formatTime(new Date()));
    await runAutomatedPayrollCron();
  },
  {
    scheduled: true,
    timezone: "Africa/Lagos", // Nigeria timezone
  }
);

console.log("✅ [CRON] Automated payroll cron job scheduled successfully");
console.log("📋 [CRON] Job will run daily at: 1:30 PM (Africa/Lagos timezone)");
console.log(
  `⏱️ [CRON] Time until next run: ${Math.round(
    (nextScheduledTime - currentTime) / 1000 / 60
  )} minutes`
);

// Export the function that server.js expects
export function startAutomatedPayrollTask() {
  console.log("🚀 [AUTOMATED] Starting automated payroll task...");
  return cronJob;
}

// Export the cron job for potential manual control
export { cronJob, runAutomatedPayrollCron };

// Also export the main function for manual execution
export { processAutomatedPayroll };
