import React from "react";
import { useQuery } from "@tanstack/react-query";
import { payrollService } from "../../services/payrollService";
import { PieChart, BarChart } from "../charts";

interface Statistics {
  totalPayrolls: number;
  processingPayrolls: number;
  completedPayrolls: number;
  failedPayrolls: number;
  approvedPayrolls: number;
  paidPayrolls: number;
  pendingPaymentPayrolls: number;
  processingRate: number;
  completionRate: number;
  failureRate: number;
  approvalRate: number;
  paymentRate: number;
  pendingPaymentRate: number;
  totalAmountApproved: number;
  totalAmountPaid: number;
  totalAmountPending: number;
  totalAmountProcessing: number;
  totalAmountPendingPayment: number;
}

const PayrollStatistics: React.FC = () => {
  const {
    data: statistics,
    isLoading,
    error,
  } = useQuery<Statistics>({
    queryKey: ["payrollStatistics"],
    queryFn: () => payrollService.getProcessingStatistics(),
  });

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        Loading statistics...
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error loading statistics</div>;
  }

  if (!statistics) {
    return null;
  }

  const statusData = {
    labels: ["Paid", "Processing", "Pending Payment", "Failed", "Approved"],
    datasets: [
      {
        data: [
          statistics.paidPayrolls,
          statistics.processingPayrolls,
          statistics.pendingPaymentPayrolls,
          statistics.failedPayrolls,
          statistics.approvedPayrolls,
        ],
        backgroundColor: [
          "#42A5F5", // Blue for Paid
          "#FFA726", // Orange for Processing
          "#7E57C2", // Purple for Pending Payment
          "#EF5350", // Red for Failed
          "#66BB6A", // Green for Approved
        ],
        borderColor: ["#42A5F5", "#FFA726", "#7E57C2", "#EF5350", "#66BB6A"],
        borderWidth: 1,
      },
    ],
  };

  const amountData = {
    labels: ["Paid", "Pending Payment", "Processing", "Approved"],
    datasets: [
      {
        label: "Amount",
        data: [
          statistics.totalAmountPaid,
          statistics.totalAmountPendingPayment,
          statistics.totalAmountProcessing,
          statistics.totalAmountApproved,
        ],
        backgroundColor: [
          "#42A5F5", // Blue for Paid
          "#7E57C2", // Purple for Pending Payment
          "#FFA726", // Orange for Processing
          "#66BB6A", // Green for Approved
        ],
        borderColor: ["#42A5F5", "#7E57C2", "#FFA726", "#66BB6A"],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">
            Payroll Status Distribution
          </h3>
          <PieChart data={statusData} />
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Amount Distribution</h3>
          <BarChart data={amountData} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="text-sm font-medium text-gray-500">Total Payrolls</h4>
          <p className="text-2xl font-bold">{statistics.totalPayrolls}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="text-sm font-medium text-gray-500">Payment Rate</h4>
          <p className="text-2xl font-bold">
            {formatPercentage(statistics.paymentRate)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="text-sm font-medium text-gray-500">Approval Rate</h4>
          <p className="text-2xl font-bold">
            {formatPercentage(statistics.approvalRate)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="text-sm font-medium text-gray-500">
            Total Amount Paid
          </h4>
          <p className="text-2xl font-bold">
            {formatCurrency(statistics.totalAmountPaid)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PayrollStatistics;
