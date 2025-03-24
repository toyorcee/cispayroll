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
} from "@mui/material";
import {
  FaFileAlt,
  FaFileInvoice,
  FaDownload,
  FaHistory,
} from "react-icons/fa";
import { PayrollStatus, PeriodPayrollResponse } from "../../../types/payroll";
import { generatePayslipPDF } from "../../../utils/pdfGenerator";
import { toast } from "react-toastify";
import { payrollService } from "../../../services/payrollService";
import { mapToPayslip } from "../../../utils/payrollUtils";

interface PayrollPeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PeriodPayrollResponse | null;
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

const PayrollPeriodModal: React.FC<PayrollPeriodModalProps> = ({
  isOpen,
  onClose,
  data,
  onViewPayslip,
  onViewHistory,
  isLoading,
}) => {
  if (!data) return null;

  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);

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
      // First fetch the payroll data and convert it to Payslip format
      const payrollData = await payrollService.getEmployeePayrollHistory(
        employeeId
      );
      const payslipData = mapToPayslip(payrollData);

      // Now generate PDF with the properly formatted payslip data
      await generatePayslipPDF(payslipData);
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast.error("Failed to generate PDF");
    }
  };

  const ActionButtons: React.FC<{ employeeId: string }> = ({ employeeId }) => (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onViewHistory(employeeId)}
        className="text-gray-600 hover:text-gray-800 p-2 rounded-full hover:bg-gray-50 transition-colors duration-200 flex items-center gap-1 cursor-pointer"
        title="View payment history"
      >
        <FaHistory className="h-4 w-4" />
        <span className="text-sm">History</span>
      </button>
      <button
        onClick={() => onViewPayslip(employeeId)}
        className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50 transition-colors duration-200 flex items-center gap-1 cursor-pointer"
        title="View payslip"
      >
        <FaFileInvoice className="h-4 w-4" />
        <span className="text-sm">View</span>
      </button>
      <button
        onClick={() => handleDownloadPDF(employeeId)}
        className="text-purple-600 hover:text-purple-800 p-2 rounded-full hover:bg-purple-50 transition-colors duration-200 flex items-center gap-1 cursor-pointer"
        title="Download PDF"
      >
        <FaDownload className="h-4 w-4" />
        <span className="text-sm">PDF</span>
      </button>
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Payroll Details - ${data.period.monthName} ${data.period.year}`}
      maxWidth="max-w-7xl"
    >
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
            <p className="text-sm font-medium text-gray-700">Total Employees</p>
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
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        ) : (
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
                      <TableCell>
                        <ActionButtons employeeId={row.employee.id} />
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
        )}
      </div>
    </BaseModal>
  );
};

export default PayrollPeriodModal;
