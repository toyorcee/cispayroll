import axios from "axios";

const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;
axios.defaults.withCredentials = true;

export interface ApprovalResponse {
  success: boolean;
  message: string;
  data: {
    payroll: any;
    nextApprover?: {
      id: string;
      name: string;
      position: string;
    } | null;
  };
}

const approvalService = {
  /**
   * Approve a payroll as HR Manager
   * @param payrollId - The ID of the payroll to approve
   * @param remarks - Optional remarks for the approval
   * @returns Promise with the approval response
   */
  approveAsHRManager: async (
    payrollId: string,
    remarks?: string
  ): Promise<ApprovalResponse> => {
    try {
      const response = await axios.patch(
        `${BASE_URL}/approvals/hr-manager/${payrollId}/approve`,
        { remarks }
      );
      return response.data;
    } catch (error: any) {
      console.error("Error approving payroll as HR Manager:", error);
      throw error;
    }
  },

  /**
   * Reject a payroll as HR Manager
   * @param payrollId - The ID of the payroll to reject
   * @param reason - Required reason for rejection
   * @returns Promise with the rejection response
   */
  rejectAsHRManager: async (
    payrollId: string,
    reason: string
  ): Promise<ApprovalResponse> => {
    try {
      const response = await axios.patch(
        `${BASE_URL}/approvals/hr-manager/${payrollId}/reject`,
        { reason }
      );
      return response.data;
    } catch (error: any) {
      console.error("Error rejecting payroll as HR Manager:", error);
      throw error;
    }
  },

  /**
   * Approve a payroll as Department Head
   * @param payrollId - The ID of the payroll to approve
   * @param remarks - Optional remarks for the approval
   * @returns Promise with the approval response
   */
  approveAsDepartmentHead: async (
    payrollId: string,
    remarks?: string
  ): Promise<ApprovalResponse> => {
    try {
      const response = await axios.patch(
        `${BASE_URL}/approvals/department-head/${payrollId}/approve`,
        { remarks }
      );
      return response.data;
    } catch (error: any) {
      console.error("Error approving payroll as Department Head:", error);
      throw error;
    }
  },

  /**
   * Reject a payroll as Department Head
   * @param payrollId - The ID of the payroll to reject
   * @param reason - Required reason for rejection
   * @returns Promise with the rejection response
   */
  rejectAsDepartmentHead: async (
    payrollId: string,
    reason: string
  ): Promise<ApprovalResponse> => {
    try {
      const response = await axios.patch(
        `${BASE_URL}/approvals/department-head/${payrollId}/reject`,
        { reason }
      );
      return response.data;
    } catch (error: any) {
      console.error("Error rejecting payroll as Department Head:", error);
      throw error;
    }
  },

  /**
   * Approve a payroll as Finance Director
   * @param payrollId - The ID of the payroll to approve
   * @param remarks - Optional remarks for the approval
   * @returns Promise with the approval response
   */
  approveAsFinanceDirector: async (
    payrollId: string,
    remarks?: string
  ): Promise<ApprovalResponse> => {
    try {
      const response = await axios.patch(
        `${BASE_URL}/approvals/finance-director/${payrollId}/approve`,
        { remarks }
      );
      return response.data;
    } catch (error: any) {
      console.error("Error approving payroll as Finance Director:", error);
      throw error;
    }
  },

  /**
   * Reject a payroll as Finance Director
   * @param payrollId - The ID of the payroll to reject
   * @param reason - Required reason for rejection
   * @returns Promise with the rejection response
   */
  rejectAsFinanceDirector: async (
    payrollId: string,
    reason: string
  ): Promise<ApprovalResponse> => {
    try {
      const response = await axios.patch(
        `${BASE_URL}/approvals/finance-director/${payrollId}/reject`,
        { reason }
      );
      return response.data;
    } catch (error: any) {
      console.error("Error rejecting payroll as Finance Director:", error);
      throw error;
    }
  },

  /**
   * Approve a payroll as Super Admin
   * @param payrollId - The ID of the payroll to approve
   * @param remarks - Optional remarks for the approval
   * @returns Promise with the approval response
   */
  approveAsSuperAdmin: async (
    payrollId: string,
    remarks?: string
  ): Promise<ApprovalResponse> => {
    try {
      const response = await axios.patch(
        `${BASE_URL}/approvals/super-admin/${payrollId}/approve`,
        { remarks }
      );
      return response.data;
    } catch (error: any) {
      console.error("Error approving payroll as Super Admin:", error);
      throw error;
    }
  },

  /**
   * Reject a payroll as Super Admin
   * @param payrollId - The ID of the payroll to reject
   * @param reason - Required reason for rejection
   * @returns Promise with the rejection response
   */
  rejectAsSuperAdmin: async (
    payrollId: string,
    reason: string
  ): Promise<ApprovalResponse> => {
    try {
      const response = await axios.patch(
        `${BASE_URL}/approvals/super-admin/${payrollId}/reject`,
        { reason }
      );
      return response.data;
    } catch (error: any) {
      console.error("Error rejecting payroll as Super Admin:", error);
      throw error;
    }
  },
};

export default approvalService;
