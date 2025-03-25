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
import {
  FaFileAlt,
  FaFileInvoice,
  FaDownload,
  FaHistory,
  FaTrash,
} from "react-icons/fa";
import { PayrollStatus, PeriodPayrollResponse } from "../../../types/payroll";
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

const mapPayslipDataToComponentFormat = (data: any) => {
  return {
    _id: data.payslipId,
    employee: {
      _id: data.employee.id,
      employeeId: data.employee.employeeId,
      firstName: data.employee.name.split(" ")[0],
      lastName: data.employee.name.split(" ")[1] || "",
      fullName: data.employee.name,
    },
    salaryGrade: {
      _id: "grade-id", // This might need to be adjusted
      level: data.employee.salaryGrade,
      description: data.employee.department,
    },
    month: data.period.month,
    year: data.period.year,
    basicSalary: data.earnings.basicSalary,
    earnings: {
      overtime: data.earnings?.overtime || { hours: 0, rate: 0, amount: 0 },
      bonus: [],
      totalEarnings: data.earnings.totalEarnings,
    },
    deductions: data.deductions,
    totals: data.summary,
    payment: data.paymentDetails,
    allowances: {
      gradeAllowances: data.earnings.allowances.gradeAllowances,
      additionalAllowances: [],
      totalAllowances: data.earnings.allowances.totalAllowances,
    },
    status: data.status,
    createdAt: data.processedAt,
    frequency: "monthly", // Add default if not provided
    periodStart: data.periodStart || new Date(),
    periodEnd: data.periodEnd || new Date(),
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
  const [payslipData, setPayslipData] = React.useState<any>(null);
  const [showPayslip, setShowPayslip] = React.useState(false);
  const [selectedPayslip, setSelectedPayslip] = React.useState<any>(null);
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

  const handleChangePage = (event: unknown, newPage: number) => {
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
      setLoadingHistoryId(employeeId);
      onClose();
      await onViewHistory(employeeId);
    } catch (error) {
      console.error("Failed to view history:", error);
      toast.error("Failed to view history");
    } finally {
      setLoadingHistoryId(null);
    }
  };

  const ActionButtons: React.FC<{ employeeId: string; payrollId: string }> = ({
    employeeId,
    payrollId,
  }) => (
    <div className="flex items-center space-x-1">
      {/* History Button - Fixed loading state */}
      <button
        onClick={() => handleViewHistory(employeeId)}
        disabled={loadingHistoryId === employeeId}
        className="text-gray-600 hover:text-gray-800 p-1.5 rounded hover:bg-gray-50 transition-colors duration-200 flex items-center gap-1 min-w-[70px] justify-center disabled:opacity-50"
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
    <>
      {/* Period Modal */}
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
                <p className="text-sm font-medium text-gray-700">
                  Total Net Pay
                </p>
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
                            <div className="font-medium">
                              {row.employee.name}
                            </div>
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

      {/* PaySlip Modal Overlay */}
      {showPayslip && selectedPayslip && (
        <div className="fixed inset-0 bg-black/50 z-[100] overflow-y-auto">
          <div className="min-h-screen pt-20 pb-10">
            <div className="w-[210mm] lg:ml-[400px] mx-auto bg-white rounded-lg shadow-xl">
              <div className="bg-green-600 px-6 py-4 flex justify-between items-center rounded-t-lg">
                <h2 className="text-xl font-semibold text-white">
                  Payslip Details
                </h2>
                <button
                  onClick={() => {
                    handleClosePayslip();
                  }}
                  className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 flex items-center gap-2 transition-colors"
                >
                  <span>Close</span>
                </button>
              </div>

              <div className="px-8 py-6">
                <PaySlip
                  data={selectedPayslip}
                  onPrint={() => window.print()}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={() => {
          setShowDeleteConfirmation(false);
          setPayrollToDelete(null);
          setLoadingDeleteId(null);
          if (onShowPeriodModal) onShowPeriodModal();
        }}
        onConfirm={async () => {
          if (!payrollToDelete) return;
          try {
            setLoadingDeleteId(payrollToDelete);
            await payrollService.deletePayroll(payrollToDelete);
            toast.success("Payroll deleted successfully");
            setShowDeleteConfirmation(false);
            if (onShowPeriodModal) onShowPeriodModal();
          } catch (error) {
            console.error("Failed to delete payroll:", error);
            toast.error("Failed to delete payroll");
            if (onShowPeriodModal) onShowPeriodModal();
          } finally {
            setLoadingDeleteId(null);
            setPayrollToDelete(null);
          }
        }}
        title="Delete Payroll Record"
        message={`Are you sure you want to delete this payroll record? This action cannot be undone.`}
        confirmText={
          loadingDeleteId === payrollToDelete ? "Deleting..." : "Delete"
        }
        cancelText="Cancel"
      />
    </>
  );
};

export default PayrollPeriodModal;
