import api from "./api";

export interface PayrollSummaryFilters {
  month?: number;
  year?: number;
  frequency?: string;
  summaryType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface PayrollSummaryResponse {
  success: boolean;
  data: PayrollSummary[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface PayrollSummary {
  _id: string;
  batchId: string;
  summaryType:
    | "SINGLE_EMPLOYEE"
    | "MULTIPLE_EMPLOYEES"
    | "ALL_EMPLOYEES"
    | "processing";
  status: "PROCESSING" | "COMPLETED" | "FAILED";
  month: number;
  year: number;
  frequency: string;
  totalAttempted: number;
  processed: number;
  skipped: number;
  failed: number;
  totalNetPay: number;
  totalGrossPay: number;
  totalDeductions: number;
  processingTime: number;
  department?: {
    _id: string;
    name: string;
    code: string;
  };
  processedBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    fullName?: string;
  };
  employeeDetails: Array<{
    employeeId:
      | string
      | {
          _id: string;
          employeeId: string;
          firstName: string;
          lastName: string;
          email: string;
          fullName: string;
        };
    name: string;
    status: "success" | "skipped" | "failed";
    netPay: number;
    grossPay: number;
    totalDeductions: number;
    department:
      | string
      | {
          _id: string;
          name: string;
          code: string;
        };
    departmentName: string;
    payrollId: string;
    _id: string;
  }>;
  departmentBreakdown: Record<string, any>;
  errors: Array<{
    type: string;
    message: string;
    code: string;
    timestamp: string;
  }>;
  warnings: Array<{
    type: string;
    message: string;
    code: string;
    timestamp: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollSummaryStatistics {
  totalBatches: number;
  totalEmployees: number;
  totalProcessed: number;
  totalSkipped: number;
  totalFailed: number;
  totalNetPay: number;
  totalGrossPay: number;
  totalDeductions: number;
  avgProcessingTime: number;
}

export interface PayrollSummaryAnalytics {
  month: number;
  year: number;
  departmentName?: string;
  departmentCode?: string;
  totalBatches: number;
  totalEmployees: number;
  totalProcessed: number;
  totalSkipped: number;
  totalFailed: number;
  totalNetPay: number;
  totalGrossPay: number;
  totalDeductions: number;
  avgProcessingTime: number;
}

class PayrollSummaryService {
  /**
   * Get all payroll summaries with pagination and filtering
   */
  static async getAllSummaries(
    filters: PayrollSummaryFilters = {}
  ): Promise<PayrollSummaryResponse> {
    try {
      console.log("🔍 [PayrollSummaryService] getAllSummaries called");
      console.log("📝 [PayrollSummaryService] Filters:", filters);

      const params = new URLSearchParams();

      if (filters.month) params.append("month", filters.month.toString());
      if (filters.year) params.append("year", filters.year.toString());
      if (filters.frequency) params.append("frequency", filters.frequency);
      if (filters.summaryType)
        params.append("summaryType", filters.summaryType);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (filters.page) params.append("page", filters.page.toString());
      if (filters.limit) params.append("limit", filters.limit.toString());

      const url = `/api/payroll-summaries?${params.toString()}`;
      console.log("🌐 [PayrollSummaryService] Making request to:", url);

      const response = await api.get(url);
      console.log(
        "✅ [PayrollSummaryService] Response received:",
        response.data
      );

      // The backend returns { success: true, data: [...], pagination: {...} }
      const result = {
        success: response.data.success,
        data: response.data.data,
        pagination: response.data.pagination,
      };

      console.log("📊 [PayrollSummaryService] Processed result:", result);
      return result;
    } catch (error: any) {
      console.error(
        "❌ [PayrollSummaryService] Error fetching payroll summaries:",
        error
      );
      console.error("❌ [PayrollSummaryService] Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  }

  /**
   * Get payroll summary by batch ID
   */
  static async getSummaryByBatchId(batchId: string): Promise<PayrollSummary> {
    try {
      console.log("🔍 [PayrollSummaryService] getSummaryByBatchId called");
      console.log("📝 [PayrollSummaryService] Batch ID:", batchId);

      const url = `/api/payroll-summaries/${batchId}`;
      console.log("🌐 [PayrollSummaryService] Making request to:", url);

      const response = await api.get(url);
      console.log(
        "✅ [PayrollSummaryService] Response received:",
        response.data
      );

      const result = response.data.data;
      console.log("📊 [PayrollSummaryService] Processed result:", result);

      return result;
    } catch (error: any) {
      console.error(
        "❌ [PayrollSummaryService] Error fetching payroll summary:",
        error
      );
      console.error("❌ [PayrollSummaryService] Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  }

  /**
   * Get processing statistics
   */
  static async getProcessingStatistics(): Promise<PayrollSummaryStatistics> {
    try {
      console.log("🔍 [PayrollSummaryService] getProcessingStatistics called");

      const url = "/api/payroll-summaries/statistics/processing";
      console.log("🌐 [PayrollSummaryService] Making request to:", url);

      const response = await api.get(url);
      console.log(
        "✅ [PayrollSummaryService] Response received:",
        response.data
      );

      const result = response.data.data;
      console.log("📊 [PayrollSummaryService] Processed result:", result);

      return result;
    } catch (error: any) {
      console.error(
        "❌ [PayrollSummaryService] Error fetching processing statistics:",
        error
      );
      console.error("❌ [PayrollSummaryService] Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  }

  /**
   * Get recent summaries for dashboard
   */
  static async getRecentSummaries(
    limit: number = 5
  ): Promise<PayrollSummary[]> {
    try {
      console.log("🔍 [PayrollSummaryService] getRecentSummaries called");
      console.log("📝 [PayrollSummaryService] Limit:", limit);

      const url = `/api/payroll-summaries/recent?limit=${limit}`;
      console.log("🌐 [PayrollSummaryService] Making request to:", url);

      const response = await api.get(url);
      console.log(
        "✅ [PayrollSummaryService] Response received:",
        response.data
      );

      const result = response.data.data;
      console.log("📊 [PayrollSummaryService] Processed result:", result);

      return result;
    } catch (error: any) {
      console.error(
        "❌ [PayrollSummaryService] Error fetching recent summaries:",
        error
      );
      console.error("❌ [PayrollSummaryService] Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  }

  /**
   * Get summary analytics for charts
   */
  static async getSummaryAnalytics(
    filters: PayrollSummaryFilters = {}
  ): Promise<PayrollSummaryAnalytics[]> {
    try {
      const params = new URLSearchParams();

      if (filters.month) params.append("month", filters.month.toString());
      if (filters.year) params.append("year", filters.year.toString());

      const response = await api.get(
        `/api/payroll-summaries/analytics?${params.toString()}`
      );
      return response.data.data;
    } catch (error: any) {
      console.error("❌ Error fetching summary analytics:", error);
      throw error;
    }
  }

  /**
   * Delete payroll summary (Super Admin only)
   */
  static async deleteSummary(batchId: string): Promise<{ message: string }> {
    try {
      const response = await api.delete(`/api/payroll-summaries/${batchId}`);
      return response.data;
    } catch (error: any) {
      console.error("❌ Error deleting payroll summary:", error);
      throw error;
    }
  }

  /**
   * Export payroll summary to PDF
   */
  static async exportSummaryToPDF(batchId: string): Promise<Blob> {
    try {
      const response = await api.get(
        `/api/payroll-summaries/${batchId}/export/pdf`,
        {
          responseType: "blob",
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("❌ Error exporting payroll summary:", error);
      throw error;
    }
  }

  /**
   * Export payroll summary to Excel
   */
  static async exportSummaryToExcel(batchId: string): Promise<Blob> {
    try {
      const response = await api.get(
        `/api/payroll-summaries/${batchId}/export/excel`,
        {
          responseType: "blob",
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("❌ Error exporting payroll summary:", error);
      throw error;
    }
  }

  /**
   * Get summary by date range
   */
  static async getSummariesByDateRange(
    startDate: string,
    endDate: string,
    filters: PayrollSummaryFilters = {}
  ): Promise<PayrollSummaryResponse> {
    try {
      const params = new URLSearchParams();
      params.append("startDate", startDate);
      params.append("endDate", endDate);

      if (filters.page) params.append("page", filters.page.toString());
      if (filters.limit) params.append("limit", filters.limit.toString());

      const response = await api.get(
        `/api/payroll-summaries/date-range?${params.toString()}`
      );
      return response.data;
    } catch (error: any) {
      console.error("❌ Error fetching summaries by date range:", error);
      throw error;
    }
  }

  /**
   * Get summary by department
   */
  static async getSummariesByDepartment(
    departmentId: string,
    filters: PayrollSummaryFilters = {}
  ): Promise<PayrollSummaryResponse> {
    try {
      const params = new URLSearchParams();
      params.append("departmentId", departmentId);

      if (filters.page) params.append("page", filters.page.toString());
      if (filters.limit) params.append("limit", filters.limit.toString());

      const response = await api.get(
        `/api/payroll-summaries/department?${params.toString()}`
      );
      return response.data;
    } catch (error: any) {
      console.error("❌ Error fetching summaries by department:", error);
      throw error;
    }
  }

  /**
   * Search summaries by batch ID or employee name
   */
  static async searchSummaries(
    searchTerm: string,
    filters: PayrollSummaryFilters = {}
  ): Promise<PayrollSummaryResponse> {
    try {
      const params = new URLSearchParams();
      params.append("search", searchTerm);

      if (filters.page) params.append("page", filters.page.toString());
      if (filters.limit) params.append("limit", filters.limit.toString());

      const response = await api.get(
        `/api/payroll-summaries/search?${params.toString()}`
      );
      return response.data;
    } catch (error: any) {
      console.error("❌ Error searching summaries:", error);
      throw error;
    }
  }
}

export default PayrollSummaryService;
