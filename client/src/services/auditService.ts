import axios from "axios";
import { toast } from "react-toastify";
import { UserRole } from "../types/auth";

// Interfaces
export interface AuditLog {
  _id: string;
  action: string;
  entity: string;
  entityId: string;
  performedBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    department: {
      _id: string;
      name: string;
    };
  };
  details: {
    status: string;
    message: string;
    employeeName?: string;
    departmentName?: string;
    departmentId?: string;
    department?: string;
    [key: string]: any;
  };
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecentActivity
  extends Omit<AuditLog, "ipAddress" | "userAgent" | "updatedAt"> {}

export interface AuditLogResponse {
  success: boolean;
  data: AuditLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface RecentActivitiesResponse {
  success: boolean;
  data: RecentActivity[];
}

export interface AuditFilters {
  action?: string;
  entity?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  departmentId?: string;
}

// Query keys for React Query
export const AUDIT_LOGS_QUERY_KEY = "auditLogs";
export const RECENT_ACTIVITIES_QUERY_KEY = "recentActivities";
export const USER_ACTIVITY_QUERY_KEY = "userActivity";
export const ENTITY_HISTORY_QUERY_KEY = "entityHistory";
export const FAILED_PAYROLLS_QUERY_KEY = "failedPayrolls";

// Use the same BASE_URL pattern as other services
const baseURL = "/api";

class AuditService {
  private baseUrl: string;
  private queryClient: any;

  constructor() {
    this.baseUrl = `${baseURL}/audit`;
  }

  // Method to set the query client
  setQueryClient(queryClient: any) {
    this.queryClient = queryClient;
  }

  // Method to check and handle refresh header
  private handleRefreshHeader(response: any) {
    if (
      response?.headers?.["x-refresh-audit-logs"] === "true" &&
      this.queryClient
    ) {
      this.invalidateAllQueries(this.queryClient);
    }
  }

  setUserRole(_userRole?: string) {
    this.baseUrl = `${baseURL}/audit`;
  }

  // Get recent activities
  async getRecentActivities(limit: number = 10): Promise<RecentActivity[]> {
    try {
      const response = await axios.get<RecentActivitiesResponse>(
        `${this.baseUrl}/recent`,
        {
          params: { limit },
        }
      );
      this.handleRefreshHeader(response);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching recent activities:", error);
      toast.error("Failed to fetch recent activities");
      return [];
    }
  }

  // Get audit logs with pagination and filters
  async getAuditLogs(
    page: number = 1,
    limit: number = 10,
    filters?: AuditFilters
  ): Promise<AuditLogResponse> {
    try {
      const response = await axios.get<AuditLogResponse>(
        `${this.baseUrl}/logs`,
        {
          params: {
            page,
            limit,
            ...filters,
          },
        }
      );
      this.handleRefreshHeader(response);
      return response.data;
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast.error("Failed to fetch audit logs");
      return {
        success: false,
        data: [],
        pagination: {
          total: 0,
          page,
          limit,
          pages: 0,
        },
      };
    }
  }

  // Get user activity
  async getUserActivity(userId: string): Promise<AuditLog[]> {
    try {
      const response = await axios.get<AuditLogResponse>(
        `${this.baseUrl}/user/${userId}`
      );
      this.handleRefreshHeader(response);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching user activity:", error);
      toast.error("Failed to fetch user activity");
      return [];
    }
  }

  // Get entity history
  async getEntityHistory(
    entity: string,
    entityId: string
  ): Promise<AuditLog[]> {
    try {
      const response = await axios.get<AuditLogResponse>(
        `${this.baseUrl}/entity/${entity}/${entityId}`
      );
      this.handleRefreshHeader(response);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching entity history:", error);
      toast.error("Failed to fetch entity history");
      return [];
    }
  }

  // Get failed payroll summary
  async getFailedPayrollSummary(): Promise<{
    total: number;
    recentFailures: AuditLog[];
  }> {
    try {
      const response = await axios.get(`${this.baseUrl}/failed-payrolls`);
      this.handleRefreshHeader(response);
      return response.data.data;
    } catch (error) {
      console.error("Error fetching failed payroll summary:", error);
      toast.error("Failed to fetch failed payroll summary");
      return {
        total: 0,
        recentFailures: [],
      };
    }
  }

  // Invalidate all audit-related queries
  invalidateAllQueries(queryClient: any) {
    queryClient.invalidateQueries({ queryKey: [AUDIT_LOGS_QUERY_KEY] });
    queryClient.invalidateQueries({ queryKey: [RECENT_ACTIVITIES_QUERY_KEY] });
    queryClient.invalidateQueries({ queryKey: [USER_ACTIVITY_QUERY_KEY] });
    queryClient.invalidateQueries({ queryKey: [ENTITY_HISTORY_QUERY_KEY] });
    queryClient.invalidateQueries({ queryKey: [FAILED_PAYROLLS_QUERY_KEY] });
  }
}

// Create a singleton instance
const auditService = new AuditService();
export { auditService };
