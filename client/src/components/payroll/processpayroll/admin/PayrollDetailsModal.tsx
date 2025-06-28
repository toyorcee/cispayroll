import React, { useState } from "react";
import {
  FaTimes,
  FaUser,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaChartLine,
  FaClock,
  FaCheckCircle,
  FaSpinner,
  FaBuilding,
  FaIdCard,
  FaShieldAlt,
  FaCalculator,
  FaReceipt,
  FaHandHoldingUsd,
  FaMinusCircle,
  FaPlusCircle,
  FaInfoCircle,
  FaGift,
  FaPercent,
  FaUserTie,
  FaChartBar,
  FaHistory,
  FaThumbsUp,
  FaThumbsDown,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { PayrollData } from "../../../../types/payroll";

interface PayrollDetailsModalProps {
  payroll: PayrollData;
  onClose: () => void;
}

const PayrollDetailsModal: React.FC<PayrollDetailsModalProps> = ({
  payroll,
  onClose,
}) => {
  const [_isLoading, _setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [showBreakdown, setShowBreakdown] = useState(true);

  const tabs = [
    { id: 0, name: "Overview", icon: FaInfoCircle, color: "text-blue-600" },
    { id: 1, name: "Earnings", icon: FaPlusCircle, color: "text-green-600" },
    { id: 2, name: "Deductions", icon: FaMinusCircle, color: "text-red-600" },
    { id: 3, name: "Approval", icon: FaShieldAlt, color: "text-purple-600" },
    { id: 4, name: "Performance", icon: FaChartLine, color: "text-orange-600" },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200";
      case "PROCESSING":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <FaCheckCircle className="text-green-600" />;
      case "PENDING":
        return <FaClock className="text-yellow-600" />;
      case "REJECTED":
        return <FaTimes className="text-red-600" />;
      case "PROCESSING":
        return <FaSpinner className="text-blue-600 animate-spin" />;
      default:
        return <FaInfoCircle className="text-gray-600" />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 300,
            duration: 0.3,
          }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 via-green-500 to-green-700 text-white p-6 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <FaReceipt className="text-2xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Payroll Details</h2>
                  <p className="text-green-100 flex items-center space-x-2">
                    <FaUser className="text-sm" />
                    <span>
                      {payroll.employee?.firstName} {payroll.employee?.lastName}
                    </span>
                    <span>•</span>
                    <FaCalendarAlt className="text-sm" />
                    <span>
                      {payroll.month}/{payroll.year}
                    </span>
                    <span>•</span>
                    <FaBuilding className="text-sm" />
                    <span>{payroll.department?.name}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors backdrop-blur-sm"
              >
                <FaTimes />
              </button>
            </div>
          </div>

          {/* Employee Info Card */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 flex-shrink-0">
            <div className="flex items-center space-x-6">
              {/* Employee Avatar */}
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {payroll.employee?.firstName?.charAt(0)}
                  {payroll.employee?.lastName?.charAt(0)}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                  <FaCheckCircle className="text-white text-xs" />
                </div>
              </div>

              {/* Employee Details */}
              <div className="flex-1">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <FaUser className="text-gray-400" />
                      <span className="font-medium">
                        {payroll.employee?.firstName}{" "}
                        {payroll.employee?.lastName}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FaIdCard className="text-gray-400" />
                      <span className="text-gray-600">
                        {payroll.employee?.employeeId}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FaUserTie className="text-gray-400" />
                      <span className="text-gray-600">
                        {payroll.salaryGrade?.level} -{" "}
                        {payroll.salaryGrade?.description}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <FaBuilding className="text-gray-400" />
                      <span className="text-gray-600">
                        {payroll.department?.name} ({payroll.department?.code})
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FaCalendarAlt className="text-gray-400" />
                      <span className="text-gray-600">
                        {new Date(0, payroll.month - 1).toLocaleString(
                          "default",
                          { month: "long" }
                        )}{" "}
                        {payroll.year}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <FaMoneyBillWave className="text-gray-400" />
                      <span className="font-semibold text-green-600">
                        Net Pay: {formatCurrency(payroll.totals?.netPay || 0)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FaChartBar className="text-gray-400" />
                      <span className="font-semibold text-blue-600">
                        Gross:{" "}
                        {formatCurrency(payroll.earnings?.totalEarnings || 0)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FaMinusCircle className="text-gray-400" />
                      <span className="font-semibold text-red-600">
                        Deductions:{" "}
                        {formatCurrency(
                          payroll.deductions?.totalDeductions || 0
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex flex-col items-end space-y-2">
                <div
                  className={`px-4 py-2 rounded-full text-sm font-medium border-2 ${getStatusColor(
                    payroll.status
                  )} flex items-center space-x-2`}
                >
                  {getStatusIcon(payroll.status)}
                  <span>{payroll.status}</span>
                </div>
                <div className="text-xs text-gray-500">
                  {formatDate(payroll.createdAt)}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 bg-white flex-shrink-0">
            <div className="flex space-x-1 p-4 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                      activeTab === tab.id
                        ? "bg-green-100 text-green-700 shadow-md"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Icon
                      className={`text-sm ${
                        activeTab === tab.id ? tab.color : ""
                      }`}
                    />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto bg-gray-50">
            <div className="p-6">
              <AnimatePresence mode="wait">
                {activeTab === 0 && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-green-600 font-medium text-sm">
                              Basic Salary
                            </p>
                            <p className="text-xl font-bold text-green-700">
                              {formatCurrency(payroll.basicSalary || 0)}
                            </p>
                          </div>
                          <FaCalculator className="text-green-500 text-xl" />
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-blue-600 font-medium text-sm">
                              Total Allowances
                            </p>
                            <p className="text-xl font-bold text-blue-700">
                              {formatCurrency(
                                payroll.allowances?.totalAllowances || 0
                              )}
                            </p>
                          </div>
                          <FaPlusCircle className="text-blue-500 text-xl" />
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl border border-yellow-200 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-yellow-600 font-medium text-sm">
                              Total Bonuses
                            </p>
                            <p className="text-xl font-bold text-yellow-700">
                              {formatCurrency(
                                payroll.bonuses?.totalBonuses || 0
                              )}
                            </p>
                          </div>
                          <FaGift className="text-yellow-500 text-xl" />
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-200 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-red-600 font-medium text-sm">
                              Total Deductions
                            </p>
                            <p className="text-xl font-bold text-red-700">
                              {formatCurrency(
                                payroll.deductions?.totalDeductions || 0
                              )}
                            </p>
                          </div>
                          <FaMinusCircle className="text-red-500 text-xl" />
                        </div>
                      </div>
                    </div>

                    {/* Final Summary */}
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-purple-800">
                            Final Net Pay
                          </h3>
                          <p className="text-3xl font-bold text-purple-700">
                            {formatCurrency(payroll.totals?.netPay || 0)}
                          </p>
                          <p className="text-sm text-purple-600 mt-1">
                            After all calculations and deductions
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-purple-600">
                            <p>
                              Gross:{" "}
                              {formatCurrency(
                                payroll.earnings?.totalEarnings || 0
                              )}
                            </p>
                            <p>
                              Deductions:{" "}
                              {formatCurrency(
                                payroll.deductions?.totalDeductions || 0
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 1 && (
                  <motion.div
                    key="earnings"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4"
                  >
                    <h3 className="text-lg font-semibold flex items-center">
                      <FaPlusCircle className="mr-2 text-green-600" />
                      Earnings Breakdown
                    </h3>

                    {/* Basic Salary */}
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <FaCalculator className="text-green-600" />
                          <div>
                            <p className="font-medium">Basic Salary</p>
                            <p className="text-sm text-gray-600">
                              Base salary from grade level{" "}
                              {payroll.salaryGrade?.level}
                            </p>
                          </div>
                        </div>
                        <p className="font-semibold text-green-700">
                          {formatCurrency(payroll.basicSalary || 0)}
                        </p>
                      </div>
                    </div>

                    {/* Grade Allowances */}
                    {payroll.allowances?.gradeAllowances?.map(
                      (allowance, index) => (
                        <div
                          key={index}
                          className="bg-blue-50 rounded-lg p-4 border border-blue-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <FaHandHoldingUsd className="text-blue-600" />
                              <div>
                                <p className="font-medium">{allowance.name}</p>
                                <p className="text-sm text-gray-600">
                                  {allowance.calculationMethod === "percentage"
                                    ? `${allowance.value || 0}% of basic salary`
                                    : "Fixed amount"}
                                </p>
                              </div>
                            </div>
                            <p className="font-semibold text-blue-700">
                              {formatCurrency(
                                allowance.amount || allowance.value || 0
                              )}
                            </p>
                          </div>
                        </div>
                      )
                    )}

                    {/* Additional Allowances */}
                    {payroll.allowances?.additionalAllowances?.map(
                      (allowance, index) => (
                        <div
                          key={index}
                          className="bg-purple-50 rounded-lg p-4 border border-purple-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <FaPlusCircle className="text-purple-600" />
                              <div>
                                <p className="font-medium">{allowance.name}</p>
                                <p className="text-sm text-gray-600">
                                  Additional allowance
                                </p>
                              </div>
                            </div>
                            <p className="font-semibold text-purple-700">
                              {formatCurrency(
                                allowance.value || allowance.amount || 0
                              )}
                            </p>
                          </div>
                        </div>
                      )
                    )}

                    {/* Bonuses */}
                    {payroll.bonuses?.items?.map((bonus, index) => (
                      <div
                        key={index}
                        className="bg-yellow-50 rounded-lg p-4 border border-yellow-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <FaGift className="text-yellow-600" />
                            <div>
                              <p className="font-medium">{bonus.description}</p>
                              <p className="text-sm text-gray-600">
                                Performance bonus
                              </p>
                            </div>
                          </div>
                          <p className="font-semibold text-yellow-700">
                            {formatCurrency(bonus.amount)}
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Total Allowances Summary */}
                    <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <FaChartBar className="text-green-600" />
                          <div>
                            <p className="font-medium">Total Allowances</p>
                            <p className="text-sm text-gray-600">
                              All allowances combined
                            </p>
                          </div>
                        </div>
                        <p className="font-semibold text-green-700 text-lg">
                          {formatCurrency(
                            payroll.allowances?.totalAllowances || 0
                          )}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 2 && (
                  <motion.div
                    key="deductions"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold flex items-center">
                        <FaMinusCircle className="mr-2 text-red-600" />
                        Deductions Breakdown
                      </h3>
                      <button
                        onClick={() => setShowBreakdown(!showBreakdown)}
                        className="flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        {showBreakdown ? (
                          <FaEyeSlash className="text-sm" />
                        ) : (
                          <FaEye className="text-sm" />
                        )}
                        <span className="text-sm">
                          {showBreakdown ? "Hide" : "Show"} Details
                        </span>
                      </button>
                    </div>

                    {/* Statutory Deductions */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-red-700 flex items-center">
                        <FaShieldAlt className="mr-2" />
                        Statutory Deductions
                      </h4>

                      {payroll.deductions?.breakdown?.statutory?.map(
                        (deduction, index) => (
                          <div
                            key={index}
                            className="bg-red-50 rounded-lg p-4 border border-red-200"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <FaShieldAlt className="text-red-600" />
                                <div>
                                  <p className="font-medium">
                                    {deduction.name}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {deduction.description}
                                  </p>
                                  {showBreakdown && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      Code: {deduction.code} • Type:{" "}
                                      {deduction.type}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <p className="font-semibold text-red-700">
                                {formatCurrency(deduction.amount)}
                              </p>
                            </div>
                          </div>
                        )
                      )}
                    </div>

                    {/* Voluntary Deductions */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-orange-700 flex items-center">
                        <FaHandHoldingUsd className="mr-2" />
                        Voluntary Deductions
                      </h4>

                      {payroll.deductions?.breakdown?.voluntary?.map(
                        (deduction, index) => (
                          <div
                            key={index}
                            className="bg-orange-50 rounded-lg p-4 border border-orange-200"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <FaHandHoldingUsd className="text-orange-600" />
                                <div>
                                  <p className="font-medium">
                                    {deduction.name}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {deduction.description}
                                  </p>
                                  {showBreakdown && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      Code: {deduction.code} • Type:{" "}
                                      {deduction.type} • Method:{" "}
                                      {deduction.calculationMethod || "N/A"}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <p className="font-semibold text-orange-700">
                                {formatCurrency(deduction.amount)}
                              </p>
                            </div>
                          </div>
                        )
                      )}
                    </div>

                    {/* Tax Details */}
                    {payroll.deductions?.tax && (
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <FaPercent className="text-blue-600" />
                            <div>
                              <p className="font-medium">PAYE Tax Details</p>
                              <p className="text-sm text-gray-600">
                                Taxable Amount:{" "}
                                {formatCurrency(
                                  payroll.deductions.tax.taxableAmount
                                )}{" "}
                                • Rate: {payroll.deductions.tax.taxRate}%
                              </p>
                            </div>
                          </div>
                          <p className="font-semibold text-blue-700">
                            {formatCurrency(payroll.deductions.tax.amount)}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Pension Details */}
                    {payroll.deductions?.pension && (
                      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <FaShieldAlt className="text-green-600" />
                            <div>
                              <p className="font-medium">
                                Pension Contribution
                              </p>
                              <p className="text-sm text-gray-600">
                                Pensionable Amount:{" "}
                                {formatCurrency(
                                  payroll.deductions.pension.pensionableAmount
                                )}{" "}
                                • Rate: {payroll.deductions.pension.rate}%
                              </p>
                            </div>
                          </div>
                          <p className="font-semibold text-green-700">
                            {formatCurrency(payroll.deductions.pension.amount)}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Total Deductions Summary */}
                    <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <FaMinusCircle className="text-red-600" />
                          <div>
                            <p className="font-medium">Total Deductions</p>
                            <p className="text-sm text-gray-600">
                              All deductions combined
                            </p>
                          </div>
                        </div>
                        <p className="font-semibold text-red-700 text-lg">
                          {formatCurrency(
                            payroll.deductions?.totalDeductions || 0
                          )}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 3 && (
                  <motion.div
                    key="approval"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4"
                  >
                    <h3 className="text-lg font-semibold flex items-center">
                      <FaShieldAlt className="mr-2 text-purple-600" />
                      Approval Workflow
                    </h3>

                    {payroll.approvalFlow && (
                      <div className="space-y-4">
                        {/* Current Status */}
                        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-purple-800">
                                Current Level
                              </p>
                              <p className="text-lg font-semibold text-purple-700">
                                {payroll.approvalFlow.currentLevel?.replace(
                                  "_",
                                  " "
                                )}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-purple-600">
                                Submitted
                              </p>
                              <p className="text-sm font-medium">
                                {payroll.approvalFlow.submittedAt
                                  ? formatDate(payroll.approvalFlow.submittedAt)
                                  : "Not submitted"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Approval History */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-700 flex items-center">
                            <FaHistory className="mr-2" />
                            Approval History
                          </h4>

                          {payroll.approvalFlow.history?.map((step, index) => (
                            <div
                              key={index}
                              className="flex items-center space-x-3 bg-white rounded-lg p-4 border border-gray-200"
                            >
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  step.status === "APPROVED"
                                    ? "bg-green-100"
                                    : "bg-gray-100"
                                }`}
                              >
                                {step.status === "APPROVED" ? (
                                  <FaThumbsUp className="text-green-600 text-sm" />
                                ) : step.status === "REJECTED" ? (
                                  <FaThumbsDown className="text-red-600 text-sm" />
                                ) : (
                                  <FaClock className="text-gray-400 text-sm" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium">
                                  {step.level?.replace("_", " ")}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {step.status} -{" "}
                                  {step.timestamp
                                    ? formatDate(step.timestamp)
                                    : "Pending"}
                                </p>
                                {step.remarks && (
                                  <p className="text-xs text-gray-500 mt-1 italic">
                                    "{step.remarks}"
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 4 && (
                  <motion.div
                    key="performance"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4"
                  >
                    <h3 className="text-lg font-semibold flex items-center">
                      <FaChartLine className="mr-2 text-orange-600" />
                      System Performance
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-green-600 font-medium">
                              Calculation Accuracy
                            </p>
                            <p className="text-2xl font-bold text-green-700">
                              100%
                            </p>
                          </div>
                          <FaCalculator className="text-green-500 text-2xl" />
                        </div>
                        <div className="mt-2">
                          <p className="text-sm text-green-600">
                            All calculations verified
                          </p>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-blue-600 font-medium">
                              Deductions Found
                            </p>
                            <p className="text-2xl font-bold text-blue-700">
                              {(payroll.deductions?.breakdown?.statutory
                                ?.length || 0) +
                                (payroll.deductions?.breakdown?.voluntary
                                  ?.length || 0)}
                            </p>
                          </div>
                          <FaMinusCircle className="text-blue-500 text-2xl" />
                        </div>
                        <div className="mt-2">
                          <p className="text-sm text-blue-600">
                            {payroll.deductions?.breakdown?.statutory?.length ||
                              0}{" "}
                            statutory,{" "}
                            {payroll.deductions?.breakdown?.voluntary?.length ||
                              0}{" "}
                            voluntary
                          </p>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl border border-yellow-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-yellow-600 font-medium">
                              Allowances Applied
                            </p>
                            <p className="text-2xl font-bold text-yellow-700">
                              {(payroll.allowances?.gradeAllowances?.length ||
                                0) +
                                (payroll.allowances?.additionalAllowances
                                  ?.length || 0)}
                            </p>
                          </div>
                          <FaPlusCircle className="text-yellow-500 text-2xl" />
                        </div>
                        <div className="mt-2">
                          <p className="text-sm text-yellow-600">
                            {payroll.allowances?.gradeAllowances?.length || 0}{" "}
                            grade,{" "}
                            {payroll.allowances?.additionalAllowances?.length ||
                              0}{" "}
                            additional
                          </p>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-purple-600 font-medium">
                              Total Components
                            </p>
                            <p className="text-2xl font-bold text-purple-700">
                              {(payroll.allowances?.gradeAllowances?.length ||
                                0) +
                                (payroll.allowances?.additionalAllowances
                                  ?.length || 0) +
                                (payroll.deductions?.breakdown?.statutory
                                  ?.length || 0) +
                                (payroll.deductions?.breakdown?.voluntary
                                  ?.length || 0)}
                            </p>
                          </div>
                          <FaChartBar className="text-purple-500 text-2xl" />
                        </div>
                        <div className="mt-2">
                          <p className="text-sm text-purple-600">
                            All payroll components
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-gray-50 p-4 border-t border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Generated on:</span>
                  <span className="text-sm font-medium">
                    {formatDate(payroll.createdAt)}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  onClick={onClose}
                >
                  <FaTimes />
                  <span>Close</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PayrollDetailsModal;
