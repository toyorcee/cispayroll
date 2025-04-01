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
  CircularProgress,
} from "@mui/material";
import { FaFileInvoice, FaDownload, FaHistory, FaTrash } from "react-icons/fa";
import {
  // PayrollFrequency,
  PayrollStatus,
  PeriodPayrollResponse,
  PayrollData,
  PayrollFilters,
} from "../../../types/payroll";
import { generatePayslipPDF } from "../../../utils/pdfGenerator";
import { toast } from "react-toastify";
import { payrollService } from "../../../services/payrollService";
import { mapToPayslip } from "../../../utils/payrollUtils";
import { PaySlip } from "./PaySlip";

interface PayrollPeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewPayslip: (employeeId: string) => void;
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

const mapPayslipDataToComponentFormat = (
  data: PeriodPayrollResponse["data"]
): PayrollData => {
  console.log("Raw payslip data:", data); // Debug log

  return {
    _id: data.payslipId,
    employee: {
      _id: data.employee.id,
      employeeId: data.employee.employeeId,
      firstName: data.employee.name.split(" ")[0],
      lastName: data.employee.name.split(" ")[1] || "",
      fullName: data.employee.name,
    },
    department: {
      _id: "default",
      name: data.employee.department,
      code: "",
    },
    allowances: {
      gradeAllowances: data.earnings.allowances.gradeAllowances,
      additionalAllowances: data.earnings.allowances.additionalAllowances,
      totalAllowances: data.earnings.allowances.totalAllowances,
    },
    earnings: {
      overtime: data.earnings.overtime,
      bonus: data.earnings.bonus,
      totalEarnings: data.earnings.totalEarnings,
    },
    deductions: {
      tax: data.deductions.tax,
      pension: data.deductions.pension,
      nhf: data.deductions.nhf,
      others: data.deductions.others,
      totalDeductions: data.deductions.totalDeductions,
    },
    totals: {
      basicSalary: data.totals.basicSalary,
      totalAllowances: data.totals.totalAllowances,
      totalBonuses: data.totals.totalBonuses,
      grossEarnings: data.totals.grossEarnings,
      totalDeductions: data.totals.totalDeductions,
      netPay: data.totals.netPay,
    },
    salaryGrade: {
      level: data.employee.salaryGrade,
      description: data.employee.department,
    },
    basicSalary: data.earnings.basicSalary,
    month: data.period.month,
    year: data.period.year,
    status: data.status,
    createdAt: data.timestamps.createdAt,
    updatedAt: data.timestamps.updatedAt,
    periodStart: data.period.startDate,
    periodEnd: data.period.endDate,
    bonuses: {
      items: data.earnings.bonus,
      totalBonuses: data.totals.totalBonuses,
    },
    approvalFlow: {
      submittedBy: data.approvalFlow.submittedBy.name,
      submittedAt: data.approvalFlow.submittedAt,
      approvedBy: data.approvalFlow.approvedBy.name,
      approvedAt: data.approvalFlow.approvedAt,
      rejectedBy: undefined,
      rejectedAt: undefined,
      paidBy: undefined,
      paidAt: undefined,
      remarks: data.approvalFlow.remarks,
    },
    processedBy: data.processedBy.name,
    payment: {
      bankName: data.paymentDetails.bankName,
      accountName: data.paymentDetails.accountName,
      accountNumber: data.paymentDetails.accountNumber,
    },
  };
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
  onViewPayslip,
  onViewHistory,
  isLoading,
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [showPayslip, setShowPayslip] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<PayrollData | null>(
    null
  );
  const [loadingPayslipId, setLoadingPayslipId] = useState<string | null>(null);
  const [loadingDeleteId, setLoadingDeleteId] = useState<string | null>(null);
  const [loadingDownloadId, setLoadingDownloadId] = useState<string | null>(
    null
  );
  const [loadingHistoryId, setLoadingHistoryId] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [payrollToDelete, setPayrollToDelete] = useState<string | null>(null);

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

  const handleChangePage = (_: unknown, newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage + 1 }));
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFilters((prev) => ({
      ...prev,
      limit: parseInt(event.target.value, 10),
      page: 1, // Reset to first page when changing rows per page
    }));
  };

  const handleDownloadPDF = async (employeeId: string) => {
    try {
      setLoadingDownloadId(employeeId);
      const payrollData = await payrollService.getEmployeePayrollHistory(
        employeeId
      );
      const payslipData = mapToPayslip(payrollData);
      await generatePayslipPDF(payslipData);
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setLoadingDownloadId(null);
    }
  };

  const handleViewPayslip = async (payslipId: string) => {
    try {
      setLoadingPayslipId(payslipId);
      const response = await payrollService.viewPayslip(payslipId);
      console.log("Payslip API response:", response); // Debug log

      if (response.success) {
        const mappedData = mapPayslipDataToComponentFormat(response.data);
        console.log("Mapped payslip data:", mappedData); // Debug log
        setSelectedPayslip(mappedData);
      setShowPayslip(true);
      } else {
        toast.error(response.message || "Failed to fetch payslip details");
      }
    } catch (error) {
      console.error("Error fetching payslip:", error);
      toast.error("Failed to fetch payslip details");
    } finally {
      setLoadingPayslipId(null);
    }
  };

  const handleClosePayslip = () => {
    setShowPayslip(false);
    setSelectedPayslip(null);
    onClose();
  };

  const handleDelete = (payrollId: string) => {
    setPayrollToDelete(payrollId);
    setShowDeleteConfirmation(true);
    onClose();
  };

  const handleViewHistory = async (employeeId: string) => {
    try {
      if (!employeeId) {
        throw new Error("Employee ID is missing");
      }

      setLoadingHistoryId(employeeId);
      // Close the period modal first
      onClose();
      // Then show history
      onViewHistory(employeeId);
    } catch (error) {
      console.error("Failed to view history:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to view history"
      );
    } finally {
      setLoadingHistoryId(null);
    }
  };

  const ActionButtons: React.FC<{ employeeId: string; payrollId: string }> = ({
    employeeId,
    payrollId,
  }) => (
    <div className="flex items-center space-x-1">
      {/* History Button */}
      <button
        onClick={() => {
          console.log("Employee ID for history:", employeeId);
          handleViewHistory(employeeId);
        }}
        disabled={!employeeId || loadingHistoryId === employeeId}
        className="text-gray-600 hover:text-gray-800 p-1.5 rounded hover:bg-gray-50 
                   transition-colors duration-200 flex items-center gap-1 min-w-[70px] 
                   justify-center disabled:opacity-50"
        title="View payment history"
      >
        {loadingHistoryId === employeeId ? (
          <div className="flex items-center gap-1">
            <CircularProgress
              size={14}
              thickness={4}
              className="!text-green-500"
            />
            <span className="text-xs text-green-500">Loading...</span>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <FaHistory className="h-4 w-4" />
            <span className="text-xs whitespace-nowrap">History</span>
          </div>
        )}
      </button>

      {/* View Button */}
      <button
        onClick={() => handleViewPayslip(payrollId)}
        disabled={loadingPayslipId === payrollId}
        className="text-blue-600 hover:text-blue-800 p-1.5 rounded hover:bg-blue-50 transition-colors duration-200 flex items-center gap-1 disabled:opacity-50 min-w-[60px] justify-center"
        title="View payslip"
      >
        {loadingPayslipId === payrollId ? (
          <div className="flex items-center gap-1">
            <CircularProgress
              size={16}
              thickness={4}
              className="!text-blue-500"
            />
            <span className="text-xs">View</span>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <FaFileInvoice className="h-4 w-4" />
            <span className="text-xs whitespace-nowrap">View</span>
          </div>
        )}
      </button>

      {/* PDF Button */}
      <button
        onClick={() => handleDownloadPDF(employeeId)}
        disabled={loadingDownloadId === employeeId}
        className="text-purple-600 hover:text-purple-800 p-1.5 rounded hover:bg-purple-50 transition-colors duration-200 flex items-center gap-1 disabled:opacity-50 min-w-[55px] justify-center"
        title="Download PDF"
      >
        {loadingDownloadId === employeeId ? (
          <div className="flex items-center gap-1">
            <CircularProgress
              size={16}
              thickness={4}
              className="!text-purple-500"
            />
            <span className="text-xs whitespace-nowrap">PDF</span>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <FaDownload className="h-4 w-4" />
            <span className="text-xs whitespace-nowrap">PDF</span>
          </div>
        )}
      </button>

      {/* Delete Button */}
      <button
        onClick={() => handleDelete(payrollId)}
        disabled={loadingDeleteId === payrollId}
        className="text-red-600 hover:text-red-800 p-1.5 rounded hover:bg-red-50 transition-colors duration-200 flex items-center gap-1 disabled:opacity-50 min-w-[70px] justify-center"
        title="Delete payroll"
      >
        {loadingDeleteId === payrollId ? (
          <div className="flex items-center gap-1">
            <CircularProgress
              size={16}
              thickness={4}
              className="!text-red-500"
            />
            <span className="text-xs">Delete</span>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <FaTrash className="h-4 w-4" />
            <span className="text-xs whitespace-nowrap">Delete</span>
          </div>
        )}
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
      {showPayslip && selectedPayslip ? (
        <div className="p-4">
          <PaySlip data={selectedPayslip} onPrint={handleClosePayslip} />
        </div>
      ) : isLoading || isPayrollsLoading ? (
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
                        <ActionButtons
                          employeeId={row.employee._id}
                          payrollId={row._id}
                        />
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
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              size="small"
            />
          </div>
        </div>
      )}
      {showPayslip && selectedPayslip && (
        <div className="p-4">
          <PaySlip data={selectedPayslip} onPrint={handleClosePayslip} />
        </div>
      )}
    </BaseModal>
  );
};

export default PayrollPeriodModal;
