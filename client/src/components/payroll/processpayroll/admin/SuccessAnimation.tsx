import React from "react";
import {
  FaCheckCircle,
  FaSpinner,
  FaExclamationTriangle,
} from "react-icons/fa";

interface SuccessAnimationProps {
  type: "single" | "multiple" | "department";
  results?: {
    total: number;
    processed: number;
    skipped: number;
    failed: number;
  };
  isProcessing?: boolean;
  error?: string;
}

export const SuccessAnimation: React.FC<SuccessAnimationProps> = ({
  type,
  results,
  isProcessing = false,
  error,
}) => {
  const getMessage = () => {
    if (error) {
      return "Payroll Processing Failed";
    }

    if (isProcessing) {
      return "Processing Payroll...";
    }

    if (!results) {
      return "Payroll Processed Successfully!";
    }

    switch (type) {
      case "single":
        return "Single Employee Payroll Processed Successfully!";
      case "multiple":
        return `Successfully processed ${results.processed} out of ${results.total} employees`;
      case "department":
        return `Department Payroll Processed: ${results.processed} processed, ${results.skipped} skipped, ${results.failed} failed`;
      default:
        return "Payroll Processed Successfully!";
    }
  };

  const getDetails = () => {
    if (error) {
      return (
        <div className="mt-4 text-sm text-red-600">
          <p className="mb-1">{error}</p>
          <p>
            Please try again with different parameters or contact support if the
            issue persists.
          </p>
        </div>
      );
    }

    if (!results || isProcessing) return null;

    return (
      <div className="mt-4 text-sm text-gray-600">
        {results.skipped > 0 && (
          <p className="mb-1">
            <span className="font-medium">{results.skipped}</span> employees
            skipped (already processed)
          </p>
        )}
        {results.failed > 0 && (
          <p className="mb-1">
            <span className="font-medium">{results.failed}</span> employees
            failed to process
          </p>
        )}
        {results.processed > 0 && (
          <p>
            <span className="font-medium">{results.processed}</span> employees
            processed successfully
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-xl max-w-md">
        {error ? (
          <FaExclamationTriangle className="mx-auto h-16 w-16 text-red-500 animate-pulse" />
        ) : isProcessing ? (
          <FaSpinner className="mx-auto h-16 w-16 text-blue-500 animate-spin" />
        ) : (
          <FaCheckCircle className="mx-auto h-16 w-16 text-green-500 animate-bounce" />
        )}
        <p className="mt-4 text-lg font-medium text-gray-900">{getMessage()}</p>
        {getDetails()}
      </div>
    </div>
  );
};
