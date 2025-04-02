import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BaseModal } from "../../shared/BaseModal";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TablePagination,
} from "@mui/material";
import { FaHistory } from "react-icons/fa";
import {
  PayrollStatus,
  PayrollData,
  PayrollFilters,
} from "../../../types/payroll";
import { toast } from "react-toastify";
import { payrollService } from "../../../services/payrollService";

interface PayrollPeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewHistory: (employeeId: string) => void;
  isLoading?: boolean;
}

const getChipColor = (status: string) => {
  switch (status.toUpperCase()) {
    case PayrollStatus.PENDING:
      return "warning";
    case PayrollStatus.PROCESSING:
      return "info";
    case PayrollStatus.APPROVED:
      return "success";
    case PayrollStatus.REJECTED:
      return "error";
    case PayrollStatus.PAID:
      return "success";
    case PayrollStatus.CANCELLED:
      return "default";
    default:
      return "default";
  }
};

const PeriodModalSkeleton = () => (
  <div className="space-y-6">
    {/* Summary Statistics Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-gray-50 p-4 rounded-lg animate-pulse">
          <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
          <div className="h-6 w-32 bg-gray-300 rounded"></div>
        </div>
      ))}
    </div>

    {/* Table Skeleton */}
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="animate-pulse">
        {/* Header */}
        <div className="grid grid-cols-9 bg-gray-50 p-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <div key={i} className="h-4 bg-gray-200 rounded"></div>
          ))}
        </div>

        {/* Rows */}
        {[1, 2, 3, 4, 5].map((row) => (
          <div
            key={row}
            className="grid grid-cols-9 p-4 border-t border-gray-100"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((cell) => (
              <div key={cell} className="space-y-2">
                <div className="h-4 bg-gray-100 rounded w-[80%]"></div>
                {cell === 1 && (
                  <div className="h-3 bg-gray-50 rounded w-[60%]"></div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
);

const PayrollPeriodModal: React.FC<PayrollPeriodModalProps> = ({
  isOpen,
  onClose,
  onViewHistory,
  isLoading,
}) => {
  // Add filters state
  const [filters, setFilters] = useState<PayrollFilters>({
    status: "all",
    department: "all",
    frequency: "all",
    dateRange: "last12",
    page: 1,
    limit: 5,
  });

  // Use the same query as ProcessPayroll page
  const { data: payrollsData, isLoading: isPayrollsLoading } = useQuery({
    queryKey: ["payrolls", filters],
    queryFn: () => payrollService.getAllPayrolls(filters),
  });

  // Calculate summary from filtered payrolls
  const summary = {
    totalEmployees: payrollsData?.payrolls?.length || 0,
    totalNetPay:
      payrollsData?.payrolls
        ?.filter(
          (p: PayrollData) =>
            p.status === PayrollStatus.APPROVED ||
            p.status === PayrollStatus.PAID
        )
        .reduce(
          (sum: number, p: PayrollData) => sum + (p.totals.netPay || 0),
          0
        ) || 0,
    totalBasicSalary:
      payrollsData?.payrolls
        ?.filter(
          (p: PayrollData) =>
            p.status === PayrollStatus.APPROVED ||
            p.status === PayrollStatus.PAID
        )
        .reduce(
          (sum: number, p: PayrollData) => sum + (p.totals.basicSalary || 0),
          0
        ) || 0,
    totalAllowances:
      payrollsData?.payrolls
        ?.filter(
          (p: PayrollData) =>
            p.status === PayrollStatus.APPROVED ||
            p.status === PayrollStatus.PAID
        )
        .reduce(
          (sum: number, p: PayrollData) =>
            sum + (p.totals.totalAllowances || 0),
          0
        ) || 0,
    totalDeductions:
      payrollsData?.payrolls
        ?.filter(
          (p: PayrollData) =>
            p.status === PayrollStatus.APPROVED ||
            p.status === PayrollStatus.PAID
        )
        .reduce(
          (sum: number, p: PayrollData) =>
            sum + (p.totals.totalDeductions || 0),
          0
        ) || 0,
    statusBreakdown:
      payrollsData?.payrolls?.reduce(
        (acc: Record<PayrollStatus, number>, p: PayrollData) => {
          acc[p.status] = (acc[p.status] || 0) + 1;
          return acc;
        },
        {} as Record<PayrollStatus, number>
      ) || {},
  };

  const handleViewHistory = async (employeeId: string) => {
    try {
      if (!employeeId) {
        throw new Error("Employee ID is missing");
      }

      // Close the period modal first
      onClose();
      // Then show history
      onViewHistory(employeeId);
    } catch (error) {
      console.error("Failed to view history:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to view history"
      );
    }
  };

  const ActionButtons: React.FC<{ employeeId: string }> = ({ employeeId }) => (
    <div className="flex items-center space-x-1">
      {/* History Button */}
      <button
        onClick={() => {
          console.log("Employee ID for history:", employeeId);
          handleViewHistory(employeeId);
        }}
        disabled={!employeeId}
        className="text-gray-600 hover:text-gray-800 p-1.5 rounded hover:bg-gray-50 
                   transition-colors duration-200 flex items-center gap-1 min-w-[70px] 
                   justify-center disabled:opacity-50"
        title="View payment history"
      >
        <div className="flex items-center gap-1">
          <FaHistory className="h-4 w-4" />
          <span className="text-xs whitespace-nowrap">History</span>
        </div>
      </button>
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Payroll Details"
      maxWidth="max-w-7xl"
      className="z-[1000]"
    >
      {isLoading || isPayrollsLoading ? (
        <PeriodModalSkeleton />
      ) : (
        <div className="flex flex-col h-[80vh]">
          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-gray-700">Total Net Pay</p>
              <p className="text-lg font-semibold text-green-600">
                ₦{summary.totalNetPay.toLocaleString()}
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-gray-700">
                Total Employees
              </p>
              <p className="text-lg font-semibold text-blue-600">
                {summary.totalEmployees}
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-gray-700">
                Status Breakdown
              </p>
              <div className="flex gap-1 flex-wrap mt-1">
                {Object.entries(summary.statusBreakdown).map(
                  ([status, count]) => (
                    <Chip
                      key={status}
                      label={`${status}: ${count}`}
                      size="small"
                      color={getChipColor(status)}
                    />
                  )
                )}
              </div>
            </div>
          </div>

          {/* Scrollable Table Area */}
          <div className="flex-1 overflow-y-auto">
            <TableContainer component={Paper}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Grade Level</TableCell>
                    <TableCell>Basic Salary</TableCell>
                    <TableCell>Allowances</TableCell>
                    <TableCell>Deductions</TableCell>
                    <TableCell>Net Pay</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payrollsData?.payrolls.map((row: PayrollData) => (
                    <TableRow key={row._id} hover>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">
                            {row.employee.fullName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {row.employee.employeeId}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{row.department.name}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">
                            {row.salaryGrade.level}
                          </div>
                          <div className="text-xs text-gray-500">
                            {row.salaryGrade.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        ₦{row.totals.basicSalary.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        ₦{row.totals.totalAllowances.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        ₦{row.totals.totalDeductions.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        ₦{row.totals.netPay.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row.status}
                          color={getChipColor(row.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell className="min-w-[200px]">
                        <ActionButtons employeeId={row.employee._id} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>

          {/* Pagination outside scroll area */}
          <div className="mt-4 border-t pt-4">
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={payrollsData?.pagination?.total || 0}
              rowsPerPage={filters.limit}
              page={filters.page - 1}
              onPageChange={(_, newPage) =>
                setFilters((prev) => ({ ...prev, page: newPage + 1 }))
              }
              onRowsPerPageChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  limit: parseInt(event.target.value, 10),
                  page: 1, // Reset to first page when changing rows per page
                }))
              }
              size="small"
            />
          </div>
        </div>
      )}
    </BaseModal>
  );
};

export default PayrollPeriodModal;
