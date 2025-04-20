// Remove the incorrect import
// import { UserDocument } from "../models/User.js";

/**
 * Calculates the final settlement amount for an employee
 * @param {Object} employee - The employee document
 * @returns {Object} The final settlement calculation details
 */
export const calculateFinalSettlement = async (employee) => {
  try {
    console.log(
      "Starting final settlement calculation for employee:",
      employee._id
    );

    if (!employee) {
      throw new Error("Employee data is required");
    }

    // Get basic salary with fallback to 0 if not set
    const basicSalary = employee.salary?.basic || 0;
    console.log("Basic salary:", basicSalary);

    if (basicSalary === 0) {
      console.warn("Warning: Employee has no basic salary set");
    }

    // Calculate gratuity (10% of basic salary)
    const gratuity = basicSalary * 0.1;
    console.log("Calculated gratuity:", gratuity);

    // Calculate unused leave payment (daily rate * unused leave days)
    // Daily rate is calculated as basic salary divided by 30 days
    const unusedLeaveDays = employee.leave?.annual || 0;
    console.log("Unused leave days:", unusedLeaveDays);

    const dailyRate = basicSalary / 30;
    console.log("Daily rate:", dailyRate);

    const unusedLeavePayment = unusedLeaveDays * dailyRate;
    console.log("Unused leave payment:", unusedLeavePayment);

    // Calculate total settlement
    const totalSettlement = basicSalary + gratuity + unusedLeavePayment;
    console.log("Total settlement calculated:", totalSettlement);

    const result = {
      basicSalary,
      gratuity,
      unusedLeaveDays,
      unusedLeavePayment,
      totalSettlement,
      calculationDate: new Date(),
    };

    console.log("Final settlement calculation result:", result);
    return result;
  } catch (error) {
    console.error("Error in calculateFinalSettlement:", error);
    console.error("Error stack:", error.stack);
    throw error;
  }
};
