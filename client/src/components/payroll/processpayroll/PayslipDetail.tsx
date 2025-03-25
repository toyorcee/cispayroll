import React from "react";
import { Payslip } from "../../../types/payroll";
import {
  FaDownload,
  FaPrint,
  FaEnvelope,
} from "react-icons/fa";
import { useAuth } from "../../../context/AuthContext";
import { generatePayslipPDF } from "../../../utils/pdfGenerator";
import { PayrollBranding } from "../../shared/PayrollBranding";

interface PayslipDetailProps {
  payslip: Payslip;
  onClose: () => void;
}

export default function PayslipDetail({
  payslip,
  onClose,
}: PayslipDetailProps) {
  const { user } = useAuth();

  const handleDownload = async () => {
    await generatePayslipPDF(payslip);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEmail = async () => {
    // TODO: Implement email functionality
    console.log("Emailing payslip...");
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
        <div className="border-b pb-4 mb-4">
          <PayrollBranding />
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Payslip Details</h2>
          <div className="flex space-x-2">
            <button
              onClick={handleDownload}
              className="p-2 text-green-600 hover:text-green-800"
              title="Download PDF"
            >
              <FaDownload className="h-5 w-5" />
            </button>
            <button
              onClick={handlePrint}
              className="p-2 text-green-600 hover:text-green-800"
              title="Print"
            >
              <FaPrint className="h-5 w-5" />
            </button>
            <button
              onClick={handleEmail}
              className="p-2 text-green-600 hover:text-green-800"
              title="Email"
            >
              <FaEnvelope className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-6 print:text-black">
          {/* Header Information */}
          <div className="border-b pb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold text-green-600 mb-2">
                  Pay Period
                </h3>
                <p className="text-gray-600">
                  {payslip.month} {payslip.year}
                </p>
              </div>
              <div className="text-right">
                <h3 className="text-lg font-semibold text-green-600 mb-2">
                  Payment Date
                </h3>
                <p className="text-gray-600">
                  {payslip.paymentDate?.toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Earnings Section */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-green-600 mb-2">
              Earnings
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Basic Salary</span>
                <span>₦{payslip.basicSalary.toLocaleString()}</span>
              </div>
              {payslip.allowances.map((allowance, index) => (
                <div key={index} className="flex justify-between">
                  <span>{allowance.type}</span>
                  <span>₦{allowance.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Deductions Section */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-green-600 mb-2">
              Deductions
            </h3>
            <div className="space-y-2">
              {payslip.deductions.map((deduction, index) => (
                <div key={index} className="flex justify-between">
                  <span>{deduction.type}</span>
                  <span>₦{deduction.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold">Total Earnings</h3>
                <p className="text-xl text-green-600">
                  ₦
                  {(
                    payslip.basicSalary +
                    payslip.allowances.reduce((sum, a) => sum + a.amount, 0)
                  ).toLocaleString()}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Total Deductions</h3>
                <p className="text-xl text-red-600">
                  ₦
                  {payslip.deductions
                    .reduce((sum, d) => sum + d.amount, 0)
                    .toLocaleString()}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Net Pay</h3>
                <p className="text-2xl font-bold text-green-600">
                  ₦{payslip.netPay.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Actions and Footer */}
          <div className="border-t mt-6 pt-4">
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500">
                Powered by Century Information Systems |{" "}
                {new Date().getFullYear()}
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
