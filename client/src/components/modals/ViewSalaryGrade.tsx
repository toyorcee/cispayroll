import { useState, useEffect } from "react";
import { CircularProgress } from "@mui/material";
import { BaseModal } from "../shared/BaseModal";
import { salaryStructureService } from "../../services/salaryStructureService";
import { ISalaryGrade } from "../../types/salary";
import {
  FaMoneyBill,
  FaPercentage,
  FaChartLine,
  FaCalendarAlt,
  FaUserEdit,
} from "react-icons/fa";
import moment from "moment";
import { toast } from "react-toastify";

interface ViewSalaryGradeProps {
  isOpen: boolean;
  onClose: () => void;
  gradeId: string;
}

export default function ViewSalaryGrade({
  isOpen,
  onClose,
  gradeId,
}: ViewSalaryGradeProps) {
  const [grade, setGrade] = useState<ISalaryGrade | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGrade = async () => {
      try {
        const data = await salaryStructureService.getSalaryGrade(gradeId);
        // Calculate totals here
        const basicSalary = Number(data.basicSalary);
        let totalAllowances = 0;

        data.components.forEach((component) => {
          if (component.isActive && component.type === "allowance") {
            if (component.calculationMethod === "percentage") {
              totalAllowances += Math.round(
                (basicSalary * component.value) / 100
              );
            } else {
              totalAllowances += component.value;
            }
          }
        });

        setGrade({
          ...data,
          totalAllowances,
          grossSalary: basicSalary + totalAllowances,
        });
      } catch (error) {
        toast.error("Failed to fetch grade details");
        onClose(); // Close modal on error
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && gradeId) {
      fetchGrade();
    }
  }, [isOpen, gradeId, onClose]);

  if (!grade && !loading) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="xl"
      title={
        grade?.level ? `Grade Level ${grade.level}` : "Salary Grade Details"
      }
      className="overflow-hidden"
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <CircularProgress size={40} className="!text-green-600" />
          <p className="text-gray-500">Loading grade details...</p>
        </div>
      ) : grade ? (
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
          <div className="space-y-4">
            {/* Header */}
            <div className="border-b pb-3">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FaMoneyBill className="!text-green-600" />
                Grade Level {grade.level}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {grade.department?.name || "Global Grade Structure"}
              </p>
            </div>

            {/* Salary Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: "Basic Salary",
                  value: grade.basicSalary || 0,
                  bg: "gray",
                },
                {
                  label: "Total Allowances",
                  value: grade.totalAllowances || 0,
                  bg: "blue",
                },
                {
                  label: "Gross Salary",
                  value: grade.grossSalary || 0,
                  bg: "green",
                },
              ].map(({ label, value, bg }) => (
                <div
                  key={label}
                  className={`p-3 bg-${bg}-50 rounded-lg border border-${bg}-100`}
                >
                  <p className="text-sm text-gray-500 mb-1">{label}</p>
                  <p className={`text-lg font-semibold !text-${bg}-600`}>
                    ₦{value.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            {/* Description */}
            {grade.description && (
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Description</p>
                <p className="text-gray-700">{grade.description}</p>
              </div>
            )}

            {/* Components */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FaChartLine className="!text-green-600" size={18} />
                Salary Components
              </h3>
              <div className="space-y-2">
                {grade.components.map((component) => (
                  <div
                    key={component._id.toString()}
                    className="p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
                  >
                    <div className="grid grid-cols-4 gap-4 items-center">
                      <div>
                        <p className="text-sm text-gray-500">Component</p>
                        <p className="font-medium text-gray-900">
                          {component.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Type</p>
                        <div className="flex items-center gap-1 h-[24px] justify-center">
                          {component.calculationMethod === "percentage" ? (
                            <FaPercentage
                              className="!text-blue-600"
                              size={16}
                            />
                          ) : (
                            <FaMoneyBill
                              className="!text-green-600"
                              size={16}
                            />
                          )}
                          <span className="font-medium text-gray-900">
                            {component.calculationMethod === "percentage"
                              ? "Percentage"
                              : "Fixed"}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Value</p>
                        <p className="font-medium text-gray-900">
                          {component.calculationMethod === "percentage"
                            ? `${component.value}%`
                            : `₦${component.value.toLocaleString()}`}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                            ${
                              component.isActive
                                ? "bg-green-100 !text-green-700"
                                : "bg-red-100 !text-red-700"
                            }`}
                        >
                          {component.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Metadata */}
            <div className="flex items-center justify-between text-sm text-gray-500 pt-2 mt-4 border-t">
              <div className="flex items-center gap-2">
                <FaCalendarAlt className="text-gray-400" />
                <span>
                  Created {moment(grade.createdAt).format("MMM DD, YYYY")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FaUserEdit className="text-gray-400" />
                <span>
                  Updated {moment(grade.updatedAt).format("MMM DD, YYYY")}
                </span>
              </div>
            </div>

            {/* Action */}
            <div className="flex justify-end pt-4 sticky bottom-0 bg-white">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium !text-white !bg-green-600 rounded-md 
                         hover:!bg-green-700 transition-colors focus:outline-none focus:ring-2 
                         focus:ring-offset-2 focus:ring-green-500"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </BaseModal>
  );
}
