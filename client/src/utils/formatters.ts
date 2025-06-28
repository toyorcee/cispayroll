/**
 * Format a number as currency (NGN)
 * @param amount The amount to format
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number | undefined): string => {
  if (!amount) return "₦0.00";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amount);
};

/**
 * Format a date to a readable string
 * @param date The date to format
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string | undefined | null): string => {
  if (!date) return "N/A";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return "Invalid Date";
  return dateObj.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Format a number with commas for thousands
 * @param num The number to format
 * @returns Formatted number string
 */
export const formatNumber = (num: number | undefined): string => {
  if (num === undefined) return "0";
  return num.toLocaleString("en-NG");
};

/**
 * Format a percentage
 * @param value The value to format as percentage
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number | undefined): string => {
  if (value === undefined) return "0%";
  return `${value.toFixed(2)}%`;
};

/**
 * Convert settlement details to CSV format
 * @param settlementDetails The settlement details object (single or bulk)
 * @returns CSV string
 */
export const settlementToCSV = (settlementDetails: any): string => {
  const headers = [
    "Employee Name",
    "Employee ID",
    "Department",
    "Position",
    "Basic Salary",
    "Total Allowances",
    "Total Deductions",
    "Net Pay",
    "Final Settlement Amount",
  ];

  // Handle both single and bulk settlement details
  let settlements = [];
  if (Array.isArray(settlementDetails)) {
    settlements = settlementDetails;
  } else if (
    settlementDetails.settlementDetails &&
    Array.isArray(settlementDetails.settlementDetails)
  ) {
    settlements = settlementDetails.settlementDetails;
  } else if (settlementDetails.settlementDetails) {
    settlements = [settlementDetails];
  } else {
    settlements = [settlementDetails];
  }

  const rows = settlements.map((row: any) => [
    row.employee?.fullName || "",
    row.employee?._id || "",
    row.employee?.department?.name || "",
    row.employee?.position || "",
    row.settlementDetails?.basicSalary || 0,
    row.settlementDetails?.totalAllowances || 0,
    row.settlementDetails?.totalDeductions || 0,
    row.settlementDetails?.payrollData?.netSalary || 0,
    row.settlementDetails?.totalSettlement || 0,
  ]);

  return [headers.join(","), ...rows.map((row: any[]) => row.join(","))].join(
    "\n"
  );
};
