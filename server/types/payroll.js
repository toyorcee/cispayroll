// Unified Status Enums
export const PayrollStatus = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  PAID: "PAID",
  CANCELLED: "CANCELLED",
};

export const AllowanceType = {
  HOUSING: "housing",
  TRANSPORT: "transport",
  MEAL: "meal",
  HAZARD: "hazard",
  OTHER: "other",
};

export const DeductionType = {
  TAX: "tax",
  PENSION: "pension",
  NHF: "nhf",
  LOAN: "loan",
  UNION_DUES: "unionDues",
  OTHER: "other",
};

export const BonusType = {
  PERFORMANCE: "performance",
  THIRTEENTH_MONTH: "thirteenth_month",
  SPECIAL: "special",
  ACHIEVEMENT: "achievement",
  RETENTION: "retention",
  PROJECT: "project",
};

export const PayrollFrequency = {
  DAILY: "daily",
  WEEKLY: "weekly",
  BI_WEEKLY: "bi-weekly",
  SEMI_MONTHLY: "semi-monthly",
  MONTHLY: "monthly",
  YEARLY: "yearly",
};