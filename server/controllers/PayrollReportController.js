import { ApiError } from "../utils/errorHandler.js";
import PayrollModel from "../models/Payroll.js";
import DepartmentModel from "../models/Department.js";
import { EmailService } from "../services/emailService.js";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import PayrollStatisticsLogger from "../utils/payrollStatisticsLogger.js";
import { AuditAction } from "../models/Audit.js";
import mongoose from "mongoose";

export class PayrollReportController {
  /**
   * Generate Payroll Report - Single method handles everything
   * GET /api/super-admin/payroll/reports
   *
   * Query Parameters:
   * - period: "current-month", "last-month", "last-3-months", "last-6-months", "last-year", "custom"
   * - startDate, endDate: for custom period
   * - format: "csv", "pdf", "json"
   * - action: "download", "email"
   * - recipientEmail: for email action
   */
  static async generateReport(req, res) {
    console.log("🚀 PAYROLL REPORT CONTROLLER CALLED!");
    console.log("📋 Request URL:", req.url);
    console.log("📋 Request Method:", req.method);
    console.log("📋 Request Query:", req.query);
    console.log("📋 Request Headers:", req.headers);
    console.log("📋 User:", req.user ? req.user._id : "No user");

    try {
      const {
        period = "current-month",
        startDate,
        endDate,
        department = "all",
        status = "all",
        format = "json",
        formats,
        action = "download",
        recipientEmail,
      } = req.query;

      console.log("📊 Generating payroll report", {
        period,
        startDate,
        endDate,
        department,
        status,
        format,
        formats,
        action,
        recipientEmail,
        userId: req.user._id,
      });

      // Validate format
      if (!["json", "csv", "pdf"].includes(format)) {
        return res.status(400).json({
          success: false,
          message: "Invalid format. Supported formats: json, csv, pdf",
        });
      }

      // Validate action
      if (!["download", "email"].includes(action)) {
        return res.status(400).json({
          success: false,
          message: "Invalid action. Supported actions: download, email",
        });
      }

      // Validate email action requires recipient
      if (action === "email" && !recipientEmail) {
        return res.status(400).json({
          success: false,
          message: "Recipient email is required for email action",
        });
      }

      // Build query filters
      const query = {};

      // Period filtering - use month/year like getAllPayrolls does
      if (period === "current-month") {
        const now = new Date();
        query.month = now.getMonth() + 1;
        query.year = now.getFullYear();
      } else if (period === "last-month") {
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        query.month = lastMonth.getMonth() + 1;
        query.year = lastMonth.getFullYear();
      } else if (period === "last-2-months") {
        const now = new Date();
        const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        query.createdAt = {
          $gte: twoMonthsAgo,
          $lte: now,
        };
      } else if (period === "last-3-months") {
        const now = new Date();
        const threeMonthsAgo = new Date(
          now.getFullYear(),
          now.getMonth() - 3,
          1
        );
        query.createdAt = {
          $gte: threeMonthsAgo,
          $lte: now,
        };
      } else if (period === "last-6-months") {
        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        query.createdAt = {
          $gte: sixMonthsAgo,
          $lte: now,
        };
      } else if (period === "last-year") {
        const now = new Date();
        const lastYear = new Date(now.getFullYear() - 1, 0, 1);
        query.createdAt = {
          $gte: lastYear,
          $lte: now,
        };
      } else if (period === "custom" && startDate && endDate) {
        query.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      } else if (period === "custom") {
        return res.status(400).json({
          success: false,
          message: "startDate and endDate are required for custom period",
        });
      }

      if (department !== "all") {
        query.department = department;
      }

      if (status !== "all") {
        query.status = status;
      }

      // Get payrolls with populated data
      const payrolls = await PayrollModel.find(query)
        .populate("employee", "firstName lastName employeeId email")
        .populate("department", "name code")
        .populate("salaryGrade", "level basicSalary description")
        .sort({ createdAt: -1 })
        .lean();

      console.log(`📊 Found ${payrolls.length} payrolls for period ${period}`);

      // Log sample payroll data for debugging
      if (payrolls.length > 0) {
        console.log("📋 Sample payroll data:", {
          employee: payrolls[0].employee,
          department: payrolls[0].department,
          salaryGrade: payrolls[0].salaryGrade,
          totals: payrolls[0].totals,
          allowances: payrolls[0].allowances?.length || 0,
          deductions: payrolls[0].deductions?.length || 0,
        });
      }

      // Calculate summary stats
      const summary = {
        totalPayrolls: payrolls.length,
        totalAmount: payrolls.reduce(
          (sum, p) => sum + (p.totals?.netPay || 0),
          0
        ),
        statusBreakdown: {},
        departmentBreakdown: {},
        period: {
          startDate:
            period === "current-month" || period === "last-month"
              ? `${query.year}-${String(query.month).padStart(2, "0")}-01`
              : period === "custom" && startDate
              ? startDate
              : new Date().toISOString().split("T")[0],
          endDate:
            period === "current-month" || period === "last-month"
              ? `${query.year}-${String(query.month).padStart(
                  2,
                  "0"
                )}-${new Date(query.year, query.month, 0).getDate()}`
              : period === "custom" && endDate
              ? endDate
              : new Date().toISOString().split("T")[0],
          period: period,
        },
      };

      // Group by status
      payrolls.forEach((payroll) => {
        const status = payroll.status || "Unknown";
        if (!summary.statusBreakdown[status]) {
          summary.statusBreakdown[status] = { count: 0, amount: 0 };
        }
        summary.statusBreakdown[status].count++;
        summary.statusBreakdown[status].amount += payroll.totals?.netPay || 0;
      });

      // Group by department
      payrolls.forEach((payroll) => {
        const deptName = payroll.department?.name || "Unknown";
        if (!summary.departmentBreakdown[deptName]) {
          summary.departmentBreakdown[deptName] = { count: 0, amount: 0 };
        }
        summary.departmentBreakdown[deptName].count++;
        summary.departmentBreakdown[deptName].amount +=
          payroll.totals?.netPay || 0;
      });

      const reportData = {
        summary,
        payrolls: payrolls.map((p) => ({
          // Employee Information
          employeeName:
            `${p.employee?.firstName || ""} ${
              p.employee?.lastName || ""
            }`.trim() || "Unknown",
          employeeId: p.employee?.employeeId || "N/A",
          employeeEmail: p.employee?.email || "N/A",

          // Department Information
          department: p.department?.name || "Unknown",
          departmentCode: p.department?.code || "N/A",

          // Salary Grade Information
          salaryGrade: p.salaryGrade?.level || "N/A",
          salaryGradeDescription: p.salaryGrade?.description || "N/A",
          basicSalary: p.salaryGrade?.basicSalary || 0,

          // Payroll Period
          month: p.month || "N/A",
          year: p.year || "N/A",
          frequency: p.frequency || "monthly",

          // Earnings Breakdown
          grossEarnings: p.totals?.grossEarnings || 0,
          basicSalaryAmount: p.totals?.basicSalary || 0,
          totalAllowances: p.totals?.totalAllowances || 0,
          totalBonuses: p.totals?.totalBonuses || 0,
          overtimePay: p.earnings?.overtime?.amount || 0,

          // Deductions Breakdown
          totalDeductions: p.totals?.totalDeductions || 0,
          taxDeductions: p.deductions?.tax?.amount || 0,
          otherDeductions:
            (p.deductions?.loans?.reduce(
              (sum, loan) => sum + (loan.amount || 0),
              0
            ) || 0) +
            (p.deductions?.others?.reduce(
              (sum, other) => sum + (other.amount || 0),
              0
            ) || 0),

          // Final Amounts
          netPay: p.totals?.netPay || 0,

          // Status and Dates
          status: p.status || "Unknown",
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,

          // Allowances Details (from the actual structure)
          allowances:
            [
              ...(p.allowances?.gradeAllowances?.map(
                (a) => `${a.name || "Unknown"}: ₦${a.amount || 0}`
              ) || []),
              ...(p.allowances?.additionalAllowances?.map(
                (a) => `${a.name || "Unknown"}: ₦${a.amount || 0}`
              ) || []),
            ].join("; ") || "N/A",

          // Deductions Details (from the actual structure)
          deductions:
            [
              ...(p.deductions?.loans?.map(
                (d) => `${d.description || "Unknown"}: ₦${d.amount || 0}`
              ) || []),
              ...(p.deductions?.others?.map(
                (d) => `${d.description || "Unknown"}: ₦${d.amount || 0}`
              ) || []),
              ...(p.deductions?.departmentSpecific?.map(
                (d) => `${d.name || "Unknown"}: ₦${d.amount || 0}`
              ) || []),
            ].join("; ") || "N/A",

          // Bonuses Details
          bonuses:
            p.bonuses?.items
              ?.map((b) => `${b.description || "Unknown"}: ₦${b.amount || 0}`)
              .join("; ") || "N/A",
        })),
      };

      console.log("✅ Report generated", {
        totalPayrolls: summary.totalPayrolls,
        totalAmount: summary.totalAmount,
        period: period,
        userId: req.user._id,
      });

      // Generate a unique report ID for logging
      const reportId = new mongoose.Types.ObjectId();

      // Log report generation
      await PayrollStatisticsLogger.logReportGenerated(
        reportId,
        req.user._id,
        format,
        period,
        {
          department,
          status,
          startDate: summary.period.startDate,
          endDate: summary.period.endDate,
          totalPayrolls: summary.totalPayrolls,
          totalAmount: summary.totalAmount,
        },
        {
          action,
          recipientEmail: action === "email" ? recipientEmail : undefined,
          formats: formats ? formats.split(",") : [format],
        }
      );

      // Handle email action
      if (action === "email") {
        let formatList = [];
        if (formats) {
          formatList = formats.split(",").map((f) => f.trim().toLowerCase());
        } else if (format) {
          formatList = [format.toLowerCase()];
        } else {
          formatList = ["pdf"];
        }
        return await PayrollReportController.sendEmailReport(
          reportData,
          formatList,
          recipientEmail,
          req.user,
          res
        );
      }

      // Handle download action
      return PayrollReportController.downloadReport(
        reportData,
        format,
        res,
        req.user,
        {
          userId: req.user._id,
          period: period,
          startDate: summary.period.startDate,
          endDate: summary.period.endDate,
          totalPayrolls: summary.totalPayrolls,
          totalAmount: summary.totalAmount,
        }
      );
    } catch (error) {
      console.error("❌ Error generating report", {
        error: error.message,
        stack: error.stack,
        userId: req.user._id,
      });

      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Failed to generate report",
        error: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  }

  /**
   * Send email with retry mechanism
   */
  static async sendEmailWithRetry(emailConfig, maxRetries = 3) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const emailService = new EmailService();
        await emailService.sendEmail(emailConfig);

        console.log(`✅ Email sent successfully on attempt ${attempt}`);
        return { success: true, attempt };
      } catch (error) {
        lastError = error;
        console.error(`❌ Email attempt ${attempt} failed:`, {
          error: error.message,
          code: error.code,
          attempt,
          maxRetries,
        });

        if (attempt < maxRetries) {
          // Exponential backoff: wait 2^attempt seconds
          const delay = Math.pow(2, attempt) * 1000;
          console.log(
            `⏳ Retrying in ${delay}ms... (attempt ${
              attempt + 1
            }/${maxRetries})`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(
      `Email failed after ${maxRetries} attempts. Last error: ${lastError.message}`
    );
  }

  /**
   * Send email report (support multiple attachments)
   */
  static async sendEmailReport(
    reportData,
    formatList,
    recipientEmail,
    user,
    res
  ) {
    try {
      // Generate file contents for each requested format
      const attachments = [];
      for (const fmt of formatList) {
        if (fmt === "csv") {
          attachments.push({
            filename: `payroll_report_${
              new Date().toISOString().split("T")[0]
            }.csv`,
            content: PayrollReportController.convertToCSV(reportData),
            contentType: "text/csv",
          });
        } else if (fmt === "pdf") {
          const pdfBuffer = await PayrollReportController.generatePDF(
            reportData
          );
          attachments.push({
            filename: `payroll_report_${
              new Date().toISOString().split("T")[0]
            }.pdf`,
            content: pdfBuffer,
            contentType: "application/pdf",
          });
        }
      }
      if (attachments.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No valid formats selected for attachment",
        });
      }

      // Create email content
      const emailSubject = `Payroll Report - ${reportData.summary.period.startDate} to ${reportData.summary.period.endDate}`;
      const emailMessage = `
        <p>Please find attached the payroll report for the period ${
          reportData.summary.period.startDate
        } to ${reportData.summary.period.endDate}.</p>
        <p><strong>Summary:</strong></p>
        <ul>
          <li>Total Payrolls: ${reportData.summary.totalPayrolls}</li>
          <li>Total Amount: NGN ${reportData.summary.totalAmount.toLocaleString()}</li>
        </ul>
        <p>This report was generated by ${user.fullName || user.email}.</p>
      `;

      // Send email with attachments using retry mechanism
      const emailConfig = {
        to: recipientEmail,
        subject: emailSubject,
        html: emailMessage,
        attachments,
      };

      const emailResult = await PayrollReportController.sendEmailWithRetry(
        emailConfig,
        3
      );

      console.log("✅ Report email sent successfully", {
        recipientEmail,
        formats: formatList,
        userId: user._id,
        attempts: emailResult.attempt,
      });

      // Log report email sent
      const reportId = new mongoose.Types.ObjectId();
      await PayrollStatisticsLogger.logReportEmailed(
        reportId,
        user._id,
        recipientEmail,
        formatList,
        reportData.summary.period.period,
        {
          department: reportData.summary.departmentBreakdown
            ? Object.keys(reportData.summary.departmentBreakdown).join(",")
            : "all",
          status: reportData.summary.statusBreakdown
            ? Object.keys(reportData.summary.statusBreakdown).join(",")
            : "all",
          startDate: reportData.summary.period.startDate,
          endDate: reportData.summary.period.endDate,
          totalPayrolls: reportData.summary.totalPayrolls,
          totalAmount: reportData.summary.totalAmount,
        },
        {
          emailSubject: `Payroll Report - ${reportData.summary.period.startDate} to ${reportData.summary.period.endDate}`,
          attachmentsCount: attachments.length,
        }
      );

      return res.status(200).json({
        success: true,
        message: `Payroll report sent via email successfully (${formatList.join(
          ", "
        )})`,
      });
    } catch (error) {
      console.error("❌ Error sending report email", {
        error: error.message,
        userId: user._id,
      });

      return res.status(500).json({
        success: false,
        message: error.message || "Failed to send report email",
      });
    }
  }

  /**
   * Download report
   */
  static async downloadReport(
    reportData,
    format,
    res,
    user = null,
    reportMetadata = {}
  ) {
    try {
      if (format === "csv") {
        const csv = PayrollReportController.convertToCSV(reportData);
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="payroll_report_${
            new Date().toISOString().split("T")[0]
          }.csv"`
        );

        // Log report download if user is provided
        if (user) {
          const reportId = new mongoose.Types.ObjectId();
          await PayrollStatisticsLogger.logReportDownloaded(
            reportId,
            user._id,
            format,
            reportData.summary.period.period,
            {
              department: reportData.summary.departmentBreakdown
                ? Object.keys(reportData.summary.departmentBreakdown).join(",")
                : "all",
              status: reportData.summary.statusBreakdown
                ? Object.keys(reportData.summary.statusBreakdown).join(",")
                : "all",
              startDate: reportData.summary.period.startDate,
              endDate: reportData.summary.period.endDate,
              totalPayrolls: reportData.summary.totalPayrolls,
              totalAmount: reportData.summary.totalAmount,
            },
            {
              ...reportMetadata,
              downloadMethod: "direct",
            }
          );
        }

        return res.send(csv);
      }

      if (format === "pdf") {
        return PayrollReportController.generatePDF(reportData)
          .then(async (pdfBuffer) => {
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
              "Content-Disposition",
              `attachment; filename="payroll_report_${
                new Date().toISOString().split("T")[0]
              }.pdf"`
            );

            // Log report download if user is provided
            if (user) {
              const reportId = new mongoose.Types.ObjectId();
              await PayrollStatisticsLogger.logReportDownloaded(
                reportId,
                user._id,
                format,
                reportData.summary.period.period,
                {
                  department: reportData.summary.departmentBreakdown
                    ? Object.keys(reportData.summary.departmentBreakdown).join(
                        ","
                      )
                    : "all",
                  status: reportData.summary.statusBreakdown
                    ? Object.keys(reportData.summary.statusBreakdown).join(",")
                    : "all",
                  startDate: reportData.summary.period.startDate,
                  endDate: reportData.summary.period.endDate,
                  totalPayrolls: reportData.summary.totalPayrolls,
                  totalAmount: reportData.summary.totalAmount,
                },
                {
                  ...reportMetadata,
                  downloadMethod: "direct",
                }
              );
            }

            return res.send(Buffer.from(pdfBuffer));
          })
          .catch((error) => {
            console.error("❌ PDF generation failed:", error);
            return res.status(500).json({
              success: false,
              message: "Failed to generate PDF report",
              error: error.message,
            });
          });
      }

      // Default: return JSON
      return res.status(200).json({
        success: true,
        message: "Payroll report generated successfully",
        data: reportData,
      });
    } catch (error) {
      console.error("❌ Error in downloadReport:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to generate report",
        error: error.message,
      });
    }
  }

  /**
   * Convert report data to CSV (perfect header/content alignment, quoting, completeness)
   */
  static convertToCSV(reportData) {
    try {
      const { payrolls } = reportData;
      // Define the exact header order
      const headers = [
        "Employee Name",
        "Employee ID",
        "Email",
        "Department",
        "Department Code",
        "Salary Grade",
        "Salary Grade Description",
        "Basic Salary (NGN)",
        "Month",
        "Year",
        "Frequency",
        "Gross Earnings (NGN)",
        "Basic Salary Amount (NGN)",
        "Total Allowances (NGN)",
        "Total Bonuses (NGN)",
        "Overtime Pay (NGN)",
        "Total Deductions (NGN)",
        "Tax Deductions (NGN)",
        "Other Deductions (NGN)",
        "Net Pay (NGN)",
        "Status",
        "Allowances Details",
        "Deductions Details",
        "Bonuses Details",
        "Created Date",
        "Updated Date",
      ];

      // Helper to quote any field with comma, quote, or newline
      const quote = (val) => {
        if (val === null || val === undefined) return "N/A";
        const str = String(val);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
      };

      // Build CSV rows
      const rows = payrolls.map((p) => [
        quote(p.employeeName || "N/A"),
        quote(p.employeeId || "N/A"),
        quote(p.employeeEmail || "N/A"),
        quote(p.department || "N/A"),
        quote(p.departmentCode || "N/A"),
        quote(p.salaryGrade || "N/A"),
        quote(p.salaryGradeDescription || "N/A"),
        (p.basicSalary || 0).toLocaleString(),
        quote(p.month || "N/A"),
        quote(p.year || "N/A"),
        quote(p.frequency || "N/A"),
        (p.grossEarnings || 0).toLocaleString(),
        (p.basicSalaryAmount || 0).toLocaleString(),
        (p.totalAllowances || 0).toLocaleString(),
        (p.totalBonuses || 0).toLocaleString(),
        (p.overtimePay || 0).toLocaleString(),
        (p.totalDeductions || 0).toLocaleString(),
        (p.taxDeductions || 0).toLocaleString(),
        (p.otherDeductions || 0).toLocaleString(),
        (p.netPay || 0).toLocaleString(),
        quote(p.status || "N/A"),
        quote(p.allowances || "N/A"),
        quote(p.deductions || "N/A"),
        quote(p.bonuses || "N/A"),
        p.createdAt ? quote(new Date(p.createdAt).toLocaleDateString()) : "N/A",
        p.updatedAt ? quote(new Date(p.updatedAt).toLocaleDateString()) : "N/A",
      ]);

      // Join header and rows
      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join(
        "\n"
      );
      return csv;
    } catch (error) {
      console.error("❌ Error converting to CSV:", error);
      throw new Error(`Failed to convert report to CSV: ${error.message}`);
    }
  }

  /**
   * Generate PDF using jsPDF
   */
  static async generatePDF(reportData) {
    try {
      const { summary, payrolls } = reportData;
      const PMS_GREEN = [34, 197, 94];

      // Create new PDF document
      const doc = new jsPDF();

      // Add PMS header in green
      doc.setFontSize(28);
      doc.setTextColor(...PMS_GREEN);
      doc.text("PMS", 105, 20, { align: "center" });
      doc.setTextColor(0, 0, 0); // Reset to black

      // Add title
      doc.setFontSize(16);
      doc.text("Payroll Report", 105, 32, { align: "center" });

      // Add generation info
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 42);
      doc.text(
        `Period: ${summary.period.startDate} to ${summary.period.endDate}`,
        20,
        48
      );

      // Add summary
      doc.setFontSize(13);
      doc.text("Summary", 20, 60);
      doc.setFontSize(10);
      doc.text(`Total Payrolls: ${summary.totalPayrolls}`, 20, 68);
      doc.text(
        `Total Amount: NGN ${(summary.totalAmount || 0).toLocaleString()}`,
        20,
        74
      );

      // Status breakdown table
      doc.setFontSize(12);
      doc.text("Status Breakdown", 20, 86);

      const statusData = Object.entries(summary.statusBreakdown).map(
        ([status, data]) => [
          status || "Unknown",
          data.count.toString(),
          `NGN ${(data.amount || 0).toLocaleString()}`,
        ]
      );

      if (statusData.length > 0) {
        autoTable(doc, {
          startY: 90,
          head: [["Status", "Count", "Amount (NGN)"]],
          body: statusData,
          theme: "grid",
          headStyles: { fillColor: PMS_GREEN },
        });
      }

      // Department breakdown table
      const statusTableEndY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 90;
      doc.setFontSize(12);
      doc.text("Department Breakdown", 20, statusTableEndY + 15);

      const deptData = Object.entries(summary.departmentBreakdown).map(
        ([dept, data]) => [
          dept || "Unknown",
          data.count.toString(),
          `NGN ${(data.amount || 0).toLocaleString()}`,
        ]
      );

      if (deptData.length > 0) {
        autoTable(doc, {
          startY: statusTableEndY + 20,
          head: [["Department", "Count", "Amount (NGN)"]],
          body: deptData,
          theme: "grid",
          headStyles: { fillColor: PMS_GREEN },
        });
      }

      // Detailed payrolls table (first 30 for readability)
      const payrollData = payrolls
        .slice(0, 30)
        .map((payroll) => [
          payroll.employeeName || "Unknown",
          payroll.department || "Unknown",
          payroll.salaryGrade || "N/A",
          (payroll.grossEarnings || 0).toLocaleString(),
          (payroll.totalAllowances || 0).toLocaleString(),
          (payroll.totalDeductions || 0).toLocaleString(),
          (payroll.netPay || 0).toLocaleString(),
          payroll.status || "Unknown",
        ]);

      if (payrollData.length > 0) {
        // Add a new landscape page for the detailed table
        doc.addPage("a4", "landscape");
        doc.setPage(doc.internal.getNumberOfPages());

        // Draw the heading at the top of the new page
        doc.setFontSize(12);
        doc.text("Detailed Payrolls", 14, 20); // 14 is a good left margin for landscape

        autoTable(doc, {
          startY: 28, // Just below the heading
          head: [
            [
              "Employee",
              "Department",
              "Grade",
              "Gross (NGN)",
              "Allowances (NGN)",
              "Deductions (NGN)",
              "Net Pay (NGN)",
              "Status",
            ],
          ],
          body: payrollData,
          theme: "grid",
          headStyles: { fillColor: PMS_GREEN },
          styles: { fontSize: 7 },
          columnStyles: {
            0: { cellWidth: 40 }, // Employee name
            1: { cellWidth: 40 }, // Department
            2: { cellWidth: 18 }, // Grade
            3: { cellWidth: 28 }, // Gross
            4: { cellWidth: 28 }, // Allowances
            5: { cellWidth: 28 }, // Deductions
            6: { cellWidth: 28 }, // Net Pay
            7: { cellWidth: 22 }, // Status
          },
          margin: { left: 14, right: 10 },
        });
      }

      // Add page numbers
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `Page ${i} of ${pageCount}`,
          105,
          doc.internal.pageSize.height - 10,
          { align: "center" }
        );
      }

      return doc.output("arraybuffer");
    } catch (error) {
      console.error("❌ Error generating PDF:", error);
      throw new Error(`Failed to generate PDF: ${error.message}`);
    }
  }
}
