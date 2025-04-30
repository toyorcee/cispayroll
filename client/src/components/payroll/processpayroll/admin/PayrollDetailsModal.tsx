import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tooltip,
} from "@mui/material";
import { PayrollData } from "../../../../types/payroll";

interface PayrollDetailsModalProps {
  payroll: PayrollData;
  onClose: () => void;
}

const PayrollDetailsModal = ({
  payroll,
  onClose,
}: PayrollDetailsModalProps) => {
  return (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle className="bg-green-600 text-white">
        Payroll Details
      </DialogTitle>
      <DialogContent className="bg-gray-50">
        <div className="grid grid-cols-2 gap-6 p-6">
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-semibold text-green-600 mb-3">
                Employee Information
              </h3>
              <div className="space-y-2">
                <p className="font-medium">{payroll.employee.fullName}</p>
                <p className="text-sm text-gray-500">
                  {payroll.employee.employeeId}
                </p>
                <p className="text-gray-600">
                  Department: {payroll.department.name}
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-semibold text-green-600 mb-3">Earnings</h3>
              <div className="space-y-2">
                <p className="flex justify-between">
                  <span className="text-gray-600">Basic Salary:</span>
                  <span className="font-medium">
                    ₦{payroll.totals.basicSalary.toLocaleString()}
                  </span>
                </p>

                {/* Grade Allowances */}
                <div className="border-t pt-2">
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Grade Allowances:
                  </p>
                  {payroll.allowances.gradeAllowances.map(
                    (allowance, index) => (
                      <p key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600 pl-2">
                          {allowance.name}:
                        </span>
                        <span>₦{allowance.amount.toLocaleString()}</span>
                      </p>
                    )
                  )}
                  <p className="flex justify-between text-sm font-medium mt-1">
                    <span className="text-gray-600">
                      Total Grade Allowances:
                    </span>
                    <span>
                      ₦{payroll.allowances.totalAllowances.toLocaleString()}
                    </span>
                  </p>
                </div>

                {/* Additional Allowances */}
                <div className="border-t pt-2">
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Additional Allowances:
                  </p>
                  {payroll.allowances.additionalAllowances.map(
                    (allowance, index) => (
                      <p key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600 pl-2">
                          {allowance.name}:
                        </span>
                        <span>₦{allowance.amount.toLocaleString()}</span>
                      </p>
                    )
                  )}
                </div>

                {/* Bonuses */}
                <div className="border-t pt-2">
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Bonuses:
                  </p>
                  {payroll.earnings.bonus.map((bonus, index) => (
                    <p key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600 pl-2">
                        {bonus.description}:
                      </span>
                      <span>₦{bonus.amount.toLocaleString()}</span>
                    </p>
                  ))}
                  <p className="flex justify-between text-sm font-medium mt-1">
                    <span className="text-gray-600">Total Bonuses:</span>
                    <span>₦{payroll.totals.totalBonuses.toLocaleString()}</span>
                  </p>
                </div>

                <p className="flex justify-between text-green-600 font-semibold border-t pt-2">
                  <span>Gross Earnings:</span>
                  <span>₦{payroll.totals.grossEarnings.toLocaleString()}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-semibold text-green-600 mb-3">Deductions</h3>
              <p className="flex justify-between">
                <span className="text-gray-600">Total Deductions:</span>
                <span className="font-medium">
                  ₦{payroll.totals.totalDeductions.toLocaleString()}
                </span>
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-semibold text-green-600 mb-3">Net Pay</h3>
              <p className="text-2xl font-bold text-green-600">
                ₦{payroll.totals.netPay.toLocaleString()}
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-semibold text-green-600 mb-3">Period</h3>
              <p className="text-gray-600">
                Start: {new Date(payroll.periodStart).toLocaleDateString()}
              </p>
              <p className="text-gray-600">
                End: {new Date(payroll.periodEnd).toLocaleDateString()}
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-semibold text-green-600 mb-3">Status</h3>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  payroll.status === "PENDING"
                    ? "bg-yellow-100 text-yellow-800"
                    : payroll.status === "APPROVED"
                    ? "bg-green-100 text-green-800"
                    : payroll.status === "REJECTED"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {payroll.status}
              </span>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="font-semibold text-green-600 mb-3">
                Approval History
              </h3>
              <div className="space-y-2">
                {payroll.approvalFlow?.history?.map((entry, index) => (
                  <div key={index} className="border-b pb-2 last:border-b-0">
                    <p className="text-sm font-medium">
                      {entry.action} by {entry.level}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(entry.timestamp).toLocaleString()}
                    </p>
                    {entry.remarks && (
                      <Tooltip title={entry.remarks} arrow placement="top">
                        <p className="text-sm text-gray-600 cursor-help truncate">
                          Remarks: {entry.remarks}
                        </p>
                      </Tooltip>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
      <DialogActions className="bg-gray-50 px-6 py-4">
        <Button
          onClick={onClose}
          variant="contained"
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PayrollDetailsModal;
