// Remove the incorrect import
// import { UserDocument } from "../models/User.js";

import { PayrollService } from "../services/PayrollService.js";

/**
 * Calculates the final settlement amount for an employee
 * @param {Object} employee - The employee document
 * @param {number} exitMonth - The month of exit (1-12)
 * @param {number} exitYear - The year of exit
 * @param {Object} options - Additional options for the payroll calculation
 * @returns {Object} The final settlement calculation details
 */
export const calculateFinalSettlement = async (
  employee,
  exitMonth,
  exitYear,
  options = {}
) => {
  try {
    console.log("[calculateFinalSettlement] Entry");
    console.log("[calculateFinalSettlement] Params:", {
      employeeId: employee?._id,
      exitMonth,
      exitYear,
    });

    if (!employee) {
      console.error(
        "[calculateFinalSettlement] Error: Employee data is required"
      );
      throw new Error("Employee data is required");
    }

    // Get basic salary with fallback to 0 if not set
    const basicSalary = employee.salary?.basic || 0;
    console.log("[calculateFinalSettlement] Basic salary:", basicSalary);

    if (basicSalary === 0) {
      console.warn(
        "[calculateFinalSettlement] Warning: Employee has no basic salary set"
      );
    }

    // Calculate gratuity (10% of basic salary)
    const gratuity = basicSalary * 0.1;
    console.log("[calculateFinalSettlement] Calculated gratuity:", gratuity);

    // Use the new unused leave days field
    const unusedLeaveDays = employee.offboarding?.unusedLeaveDays || 0;
    console.log(
      "[calculateFinalSettlement] Unused leave days (from offboarding):",
      unusedLeaveDays
    );

    const dailyRate = basicSalary / 30;
    console.log("[calculateFinalSettlement] Daily rate:", dailyRate);

    const unusedLeavePayment = unusedLeaveDays * dailyRate;
    console.log(
      "[calculateFinalSettlement] Unused leave payment:",
      unusedLeavePayment
    );

    // Get bonuses, allowances, deductions for the exit month
    let totalBonuses = 0;
    let totalAllowances = 0;
    let totalDeductions = 0;
    let payrollComponents;
    try {
      console.log(
        "[calculateFinalSettlement] Fetching payroll components for exit month/year..."
      );
      payrollComponents = await PayrollService.calculateEmployeePayroll(
        employee,
        employee.salaryGrade,
        exitMonth,
        exitYear,
        undefined,
        undefined,
        options
      );
      console.log(
        "[calculateFinalSettlement] PayrollService.calculateEmployeePayroll result:",
        payrollComponents
      );
      // Allowances: sum if array, use directly if number
      if (Array.isArray(payrollComponents.allowances)) {
        totalAllowances = payrollComponents.allowances.reduce(
          (sum, a) => sum + (a.amount || 0),
          0
        );
      } else {
        totalAllowances = payrollComponents.allowances || 0;
      }
      // Deductions: use totalDeductions
      totalDeductions = payrollComponents.totalDeductions || 0;
      // Bonuses: set to 0 unless you have a field for it
      totalBonuses = 0;
      console.log("[calculateFinalSettlement] Calculated:", {
        totalAllowances,
        totalDeductions,
        totalBonuses,
      });
    } catch (err) {
      console.error(
        "[calculateFinalSettlement] Error calculating payroll components for final settlement:",
        err
      );
      if (err instanceof Error) {
        console.error("[calculateFinalSettlement] Error message:", err.message);
        console.error("[calculateFinalSettlement] Error stack:", err.stack);
        if ("statusCode" in err) {
          console.error(
            "[calculateFinalSettlement] Error statusCode:",
            err.statusCode
          );
        }
      } else {
        console.error(
          "[calculateFinalSettlement] Error (non-Error object):",
          JSON.stringify(err)
        );
      }
    }

    // Calculate total settlement
    const totalSettlement =
      basicSalary +
      gratuity +
      unusedLeavePayment +
      totalBonuses +
      totalAllowances -
      totalDeductions;
    console.log(
      "[calculateFinalSettlement] Total settlement calculated:",
      totalSettlement
    );

    const result = {
      basicSalary,
      gratuity,
      unusedLeaveDays,
      unusedLeavePayment,
      totalBonuses,
      totalAllowances,
      totalDeductions,
      totalSettlement,
      calculationDate: new Date(),
      payrollData: payrollComponents || {
        allowances: [],
        deductions: { statutory: [], voluntary: [] },
        grossSalary: basicSalary + totalAllowances,
        netSalary: basicSalary + totalAllowances - totalDeductions,
        totalDeductions,
      },
    };

    console.log("[calculateFinalSettlement] Result:", result);
    console.log("[calculateFinalSettlement] Exit");
    return result;
  } catch (error) {
    console.error("[calculateFinalSettlement] Error:", error);
    console.error("[calculateFinalSettlement] Error stack:", error.stack);
    throw error;
  }
};
