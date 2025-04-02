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
} from "@mui/material";
import { PayrollStatus } from "../../../types/payroll";

interface PayrollHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    employee: {
      id: string;
      name: string;
      employeeId: string;
      department: string;
      salaryGrade: string;
    };
    payrollHistory: Array<{
      period: {
        month: number;
        year: number;
      };
      earnings: {
        basicSalary: number;
        allowances: {
          gradeAllowances: Array<{
            _id: string;
            name: string;
            type: string;
            value: number;
            amount: number;
          }>;
          additionalAllowances: Array<{
            _id: string;
            name: string;
            type: string;
            value: number;
            amount: number;
          }>;
          totalAllowances: number;
        };
        bonuses: {
          items: Array<{
            id: string;
            description: string;
            amount: number;
          }>;
          totalBonuses: number;
        };
        totalEarnings: number;
      };
      deductions: {
        tax: {
          taxableAmount: number;
          taxRate: number;
          amount: number;
        };
        pension: {
          pensionableAmount: number;
          rate: number;
          amount: number;
        };
        nhf: {
          pensionableAmount: number;
          rate: number;
          amount: number;
        };
        loans: Array<{
          id: string;
          description: string;
          amount: number;
        }>;
        others: Array<{
          id: string;
          description: string;
          amount: number;
        }>;
        totalDeductions: number;
      };
      totals: {
        basicSalary: number;
        totalAllowances: number;
        totalBonuses: number;
        grossEarnings: number;
        totalDeductions: number;
        netPay: number;
      };
      status: PayrollStatus;
      processedAt: string;
    }>;
    summary: {
      totalRecords: number;
      latestPayroll: {
        period: { month: number; year: number };
        status: PayrollStatus;
        totals: {
          basicSalary: number;
          totalAllowances: number;
          totalBonuses: number;
          grossEarnings: number;
          totalDeductions: number;
          netPay: number;
        };
      } | null;
      totalPaid: number;
      averagePayroll: number;
    };
  } | null;
}

const statusColors: Record<PayrollStatus, string> = {
  [PayrollStatus.DRAFT]: "bg-gray-100 text-gray-800",
  [PayrollStatus.PENDING]: "bg-yellow-100 text-yellow-800",
  [PayrollStatus.PROCESSING]: "bg-blue-100 text-blue-800",
  [PayrollStatus.APPROVED]: "bg-green-100 text-green-800",
  [PayrollStatus.REJECTED]: "bg-red-100 text-red-800",
  [PayrollStatus.PAID]: "bg-green-100 text-green-800",
  [PayrollStatus.CANCELLED]: "bg-gray-100 text-gray-800",
};

// Update the cell styles with stronger borders
const periodCellStyle = "py-4 px-6 align-top !border-r !border-gray-300";
const basicSalaryCellStyle = "py-4 px-6 align-top !border-r !border-gray-300";
const allowancesCellStyle = "py-4 px-6 align-top !border-r !border-gray-300";
const deductionsCellStyle = "py-4 px-6 align-top !border-r !border-gray-300";
const netPayCellStyle = "py-4 px-6 align-top !border-r !border-gray-300";
const statusCellStyle = "py-4 px-6 align-top";

// Or alternatively, we can use a custom style with a more prominent border:
const tableCellWithBorder = "border-r-[1px] border-gray-300";

const PayrollHistoryModal: React.FC<PayrollHistoryModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const [page] = React.useState(0);
  const [rowsPerPage] = React.useState(5);

  // Only return null if we have no data
  if (!data) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Payroll History - ${data.employee.name}`}
      maxWidth="max-w-7xl"
    >
      <div className="space-y-6">
        {/* Employee Details */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            Employee Information
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Employee ID</p>
              <p className="text-base font-medium text-gray-900">
                {data.employee.employeeId}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="text-base font-medium text-gray-900">
                {data.employee.name}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Department</p>
              <p className="text-base font-medium text-gray-900">
                {data.employee.department}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Salary Grade</p>
              <p className="text-base font-medium text-gray-900">
                {data.employee.salaryGrade}
              </p>
            </div>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm font-medium text-gray-700">Total Records</p>
            <p className="text-xl font-semibold text-gray-900">
              {data.summary.totalRecords}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm font-medium text-gray-700">
              Total Paid Amount
            </p>
            <p className="text-xl font-semibold text-emerald-600">
              ₦{data.summary.totalPaid.toLocaleString()}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm font-medium text-gray-700">Average Payroll</p>
            <p className="text-xl font-semibold text-blue-600">
              ₦{data.summary.averagePayroll.toLocaleString()}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm font-medium text-gray-700">Latest Status</p>
            <span
              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                statusColors[
                  data.summary.latestPayroll?.status || PayrollStatus.PENDING
                ]
              }`}
            >
              {data.summary.latestPayroll?.status || "N/A"}
            </span>
          </div>
        </div>

        {/* Enhanced Payroll History Table */}
        <div className="max-h-[500px] overflow-y-auto">
          <TableContainer
            component={Paper}
            className="border border-gray-200 rounded-lg shadow-sm"
          >
            <Table size="medium">
              <TableHead>
                <TableRow className="bg-gray-50">
                  <TableCell
                    className={`${periodCellStyle} ${tableCellWithBorder}`}
                    width="12%"
                  >
                    <div className="font-medium text-gray-900">Period</div>
                    <div className="text-xs text-gray-500 font-normal mt-1">
                      Month/Year
                    </div>
                  </TableCell>
                  <TableCell
                    className={`${basicSalaryCellStyle} ${tableCellWithBorder}`}
                    width="16%"
                  >
                    <div className="font-medium text-gray-900">
                      Basic Salary
                    </div>
                    <div className="text-xs text-gray-500 font-normal mt-1">
                      Base Pay
                    </div>
                  </TableCell>
                  <TableCell
                    className={`${allowancesCellStyle} ${tableCellWithBorder}`}
                    width="24%"
                  >
                    <div className="font-medium text-gray-900">Allowances</div>
                    <div className="text-xs text-gray-500 font-normal mt-1">
                      Detailed Breakdown
                    </div>
                  </TableCell>
                  <TableCell
                    className={`${deductionsCellStyle} ${tableCellWithBorder}`}
                    width="24%"
                  >
                    <div className="font-medium text-gray-900">Deductions</div>
                    <div className="text-xs text-gray-500 font-normal mt-1">
                      Tax & Pension
                    </div>
                  </TableCell>
                  <TableCell
                    className={`${netPayCellStyle} ${tableCellWithBorder}`}
                    width="16%"
                  >
                    <div className="font-medium text-gray-900">Net Pay</div>
                    <div className="text-xs text-gray-500 font-normal mt-1">
                      Final Amount
                    </div>
                  </TableCell>
                  <TableCell className={statusCellStyle}>
                    <div className="font-medium text-gray-900">Status</div>
                    <div className="text-xs text-gray-500 font-normal mt-1">
                      Current
                    </div>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.payrollHistory
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row) => (
                    <TableRow
                      key={`${row.period.month}-${row.period.year}`}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <TableCell
                        className={`${periodCellStyle} ${tableCellWithBorder}`}
                      >
                        <div className="font-medium text-gray-900">{`${row.period.month}/${row.period.year}`}</div>
                      </TableCell>
                      <TableCell
                        className={`${basicSalaryCellStyle} ${tableCellWithBorder}`}
                      >
                        <span className="text-gray-900">
                          ₦{row.earnings.basicSalary.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell
                        className={`${allowancesCellStyle} ${tableCellWithBorder}`}
                      >
                        <span className="text-emerald-600">
                          ₦
                          {row.earnings.allowances.totalAllowances.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell
                        className={`${deductionsCellStyle} ${tableCellWithBorder}`}
                      >
                        <span className="text-red-600">
                          ₦{row.deductions.totalDeductions.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell
                        className={`${netPayCellStyle} ${tableCellWithBorder}`}
                      >
                        <span className="text-blue-600 font-medium">
                          ₦{row.totals.netPay.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className={statusCellStyle}>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            statusColors[row.status]
                          }`}
                        >
                          {row.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end space-x-4 pt-4">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium !text-white !bg-emerald-600 hover:!bg-emerald-700 border border-gray-300 rounded-md cursor-pointer transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

export default PayrollHistoryModal;
