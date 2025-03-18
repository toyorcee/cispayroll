import { UserDocument } from "../models/User.js";

export const calculateFinalSettlement = async (employee: UserDocument) => {
  const basicSalary = employee.salary || 0;
  const gratuity = basicSalary * 0.1; // 10% of basic salary
  const unusedLeave = (employee.leaveBalance || 0) * (basicSalary / 30); // Daily rate * unused leave days

  return basicSalary + gratuity + unusedLeave;
};
