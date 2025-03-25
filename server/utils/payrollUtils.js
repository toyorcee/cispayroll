import { UserDocument } from "../models/User.js";

/**
 * Calculates the final settlement amount for an employee
 * @param {Object} employee - The employee document
 * @param {number} [employee.salary] - The employee's basic salary
 * @param {number} [employee.leaveBalance] - The employee's unused leave days
 * @returns {Promise<number>} The total final settlement amount
 */
export const calculateFinalSettlement = async (employee) => {
  // Get basic salary with fallback to 0 if not set
  const basicSalary = employee.salary || 0;

  // Calculate gratuity (10% of basic salary)
  const gratuity = basicSalary * 0.1;

  // Calculate unused leave payment (daily rate * unused leave days)
  // Daily rate is calculated as basic salary divided by 30 days
  const unusedLeave = (employee.leaveBalance || 0) * (basicSalary / 30);

  // Return total settlement amount
  return basicSalary + gratuity + unusedLeave;
};
