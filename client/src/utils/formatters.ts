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
export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
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
