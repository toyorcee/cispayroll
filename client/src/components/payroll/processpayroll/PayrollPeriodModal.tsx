import React from "react";
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
} from "../../../types/payroll";
import { generatePayslipPDF } from "../../../utils/pdfGenerator";
import { toast } from "react-toastify";
import { payrollService } from "../../../services/payrollService";
import { mapToPayslip } from "../../../utils/payrollUtils";
import { PaySlip } from "./PaySlip";
import { ConfirmationModal } from "../../modals/ConfirmationModal";

interface PayrollPeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PeriodPayrollResponse | null;
  onViewPayslip: (employeeId: string) => void;
  onViewHistory: (employeeId: string) => void;
  isLoading?: boolean;
  onShowPeriodModal?: () => void;
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
  data: PeriodPayrollResponse["employees"][number]
): PayrollData => {
  return {
    _id: data.id,
    employee: {
      _id: data.employee.id,
      employeeId: data.employee.employeeId,
      firstName: data.employee.name.split(" ")[0],
      lastName: data.employee.name.split(" ")[1] || "",
      fullName: data.employee.name,
    },
    allowances: {
      gradeAllowances: [],
      additionalAllowances: [],
      totalAllowances: data.payroll.totalAllowances,
    },
    earnings: {
      overtime: {
        hours: 0,
        rate: 0,
        amount: 0,
      },
      bonus: [],
      totalEarnings: data.payroll.basicSalary + data.payroll.totalAllowances,
    },
    deductions: {
      tax: {
        taxableAmount: 0,
        taxRate: 0,
        amount: 0,
      },
      pension: {
        pensionableAmount: 0,
        rate: 0,
        amount: 0,
      },
      nhf: {
        rate: 0,
        amount: 0,
      },
      others: Array.isArray(data.payroll.deductions?.others)
        ? data.payroll.deductions.others.map(
            (item: { description: string; amount: number }) => ({
              name: item.description || "Unknown",
              amount: item.amount || 0,
            })
          )
        : [],
      totalDeductions: data.payroll.totalDeductions,
    },
    totals: {
      basicSalary: data.payroll.basicSalary,
      totalAllowances: data.payroll.totalAllowances,
      totalBonuses: 0,
      grossEarnings: data.payroll.basicSalary + data.payroll.totalAllowances,
      totalDeductions: data.payroll.totalDeductions,
      netPay: data.payroll.netPay,
    },
    salaryGrade: {
      level: data.salaryGrade.level,
      description: data.salaryGrade.description,
    },
    basicSalary: data.payroll.basicSalary,
    month: data.payroll.month,
    year: data.payroll.year,

    status: data.status,
    createdAt: data.processedAt,
    periodStart: "",
    periodEnd: "",
    bonuses: {
      items: [],
      totalBonuses: 0,
    },
    approvalFlow: [],
    processedBy: "",
    payment: {
      bankName: "",
      accountName: "",
      accountNumber: "",
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
  data,
  onViewPayslip,
  onViewHistory,
  isLoading,
  onShowPeriodModal,
}) => {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  // const [payslipData, setPayslipData] = React.useState<any>(null);
  const [showPayslip, setShowPayslip] = React.useState(false);
  const [selectedPayslip, setSelectedPayslip] = React.useState<ReturnType<
    typeof mapPayslipDataToComponentFormat
  > | null>(null);
  const [loadingPayslipId, setLoadingPayslipId] = React.useState<string | null>(
    null
  );
  const [loadingDeleteId, setLoadingDeleteId] = React.useState<string | null>(
    null
  );
  const [loadingDownloadId, setLoadingDownloadId] = React.useState<
    string | null
  >(null);
  const [activeModal, setActiveModal] = React.useState<
    "period" | "payslip" | "none" | "history"
  >("period");
  const [loadingHistoryId, setLoadingHistoryId] = React.useState<string | null>(
    null
  );
  const [showDeleteConfirmation, setShowDeleteConfirmation] =
    React.useState(false);
  const [payrollToDelete, setPayrollToDelete] = React.useState<string | null>(
    null
  );

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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

  const handleViewPayslip = async (payrollId: string) => {
    try {
      setLoadingPayslipId(payrollId);
      onClose();
      const payslipData = await payrollService.viewPayslip(payrollId);
      const formattedData = mapPayslipDataToComponentFormat(payslipData);
      setSelectedPayslip(formattedData);
      setShowPayslip(true);
    } catch (error) {
      console.error("Failed to view payslip:", error);
      toast.error("Failed to view payslip");
    } finally {
      setLoadingPayslipId(null);
    }
  };

  const handleClosePayslip = () => {
    setShowPayslip(false);
    setSelectedPayslip(null);
    setActiveModal("period");
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
      console.log("Viewing history for employee:", employeeId);

      // Close modal after setting loading state
      onClose();

      // Call the parent handler
      await onViewHistory(employeeId);
    } catch (error) {
      console.error("Failed to view history:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to view history"
      );
      // Reopen the period modal if there's an error
      if (onShowPeriodModal) {
        onShowPeriodModal();
      }
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
          console.log("Employee ID for history:", employeeId); // Add this log
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
              size={16}
              thickness={4}
              className="!text-gray-500"
            />
            <span className="text-xs">History</span>
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
            <span className="text-xs">PDF</span>
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
      title={
        data
          ? `Payroll Details - ${data.period.monthName} ${data.period.year}`
          : "Loading Payroll Details..."
      }
      maxWidth="max-w-7xl"
      className="z-[1000]"
    >
      {isLoading || !data ? (
        <PeriodModalSkeleton />
      ) : (
        <div className="space-y-6">
          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-700">Total Net Pay</p>
              <p className="text-xl font-semibold text-green-600">
                ₦{data.summary.totalNetPay.toLocaleString()}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-700">
                Total Employees
              </p>
              <p className="text-xl font-semibold text-blue-600">
                {data.summary.totalEmployees}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-700">
                Status Breakdown
              </p>
              <div className="flex gap-2 flex-wrap mt-2">
                {Object.entries(data.summary.statusBreakdown).map(
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

          {/* Employees Table */}
          <TableContainer component={Paper}>
            <Table>
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
                {data.employees
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{row.employee.name}</div>
                          <div className="text-sm text-gray-500">
                            {row.employee.employeeId}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{row.department}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {row.salaryGrade.level}
                          </div>
                          <div className="text-sm text-gray-500">
                            {row.salaryGrade.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        ₦{row.payroll.basicSalary.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        ₦{row.payroll.totalAllowances.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        ₦{row.payroll.totalDeductions.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        ₦{row.payroll.netPay.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row.status}
                          color={getChipColor(row.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell className="min-w-[250px]">
                        <ActionButtons
                          employeeId={row.employee.id}
                          payrollId={row.id}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={data.employees.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </TableContainer>
        </div>
      )}
    </BaseModal>
  );
};

export default PayrollPeriodModal;
