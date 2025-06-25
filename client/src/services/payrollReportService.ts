import api from "./api";

export interface PayrollReportParams {
  period:
    | "current-month"
    | "last-month"
    | "last-2-months"
    | "last-3-months"
    | "last-6-months"
    | "last-year"
    | "custom";
  startDate?: string;
  endDate?: string;
  department?: string;
  status?: string;
  format: "csv" | "pdf" | "json";
  action: "download" | "email";
  recipientEmail?: string;
  formats?: string;
}

export interface PayrollReportData {
  summary: {
    totalPayrolls: number;
    totalAmount: number;
    statusBreakdown: Record<string, { count: number; amount: number }>;
    departmentBreakdown: Record<string, { count: number; amount: number }>;
    period: {
      startDate: string;
      endDate: string;
      period: string;
    };
  };
  payrolls: Array<{
    employeeName: string;
    employeeId: string;
    department: string;
    basicSalary: number;
    netPay: number;
    status: string;
    month: number;
    year: number;
    createdAt: string;
  }>;
}

class PayrollReportService {
  /**
   * Generate and handle payroll report - Single method for everything
   */
  async generateReport(
    params: PayrollReportParams
  ): Promise<PayrollReportData | Blob | { success: boolean; message: string }> {
    try {
      const queryParams = new URLSearchParams();

      // Add all parameters
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await api.get(
        `/api/super-admin/payroll/reports?${queryParams.toString()}`,
        {
          responseType:
            params.action === "download" && params.format !== "json"
              ? "blob"
              : "json",
        }
      );

      if (params.action === "download" && params.format !== "json") {
        return response.data as Blob;
      }

      if (params.action === "email") {
        return response.data as { success: boolean; message: string };
      }

      return response.data.data as PayrollReportData;
    } catch (error) {
      console.error("Error generating payroll report:", error);
      throw error;
    }
  }

  /**
   * Download CSV report
   */
  async downloadCSV(
    params: Omit<PayrollReportParams, "format" | "action">
  ): Promise<Blob> {
    return this.generateReport({
      ...params,
      format: "csv",
      action: "download",
    }) as Promise<Blob>;
  }

  /**
   * Download PDF report
   */
  async downloadPDF(
    params: Omit<PayrollReportParams, "format" | "action">
  ): Promise<Blob> {
    return this.generateReport({
      ...params,
      format: "pdf",
      action: "download",
    }) as Promise<Blob>;
  }

  /**
   * Send report via email
   */
  async sendReportEmail(
    params: Omit<PayrollReportParams, "format" | "action"> & {
      recipientEmail: string;
      formats?: string;
    }
  ): Promise<{ success: boolean; message: string }> {
    const result = await this.generateReport({
      ...params,
      format: "pdf",
      formats: params.formats,
      action: "email",
      recipientEmail: params.recipientEmail,
    });

    return result as { success: boolean; message: string };
  }

  /**
   * Get report data as JSON
   */
  async getReportData(
    params: Omit<PayrollReportParams, "format" | "action">
  ): Promise<PayrollReportData> {
    return this.generateReport({
      ...params,
      format: "json",
      action: "download",
    }) as Promise<PayrollReportData>;
  }
}

export default new PayrollReportService();
