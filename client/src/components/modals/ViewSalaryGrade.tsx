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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGradeDetails = async () => {
      try {
        setIsLoading(true);
        const data = await salaryStructureService.getSalaryGrade(gradeId);
        setGrade(data);
      } catch (error) {
        console.error("Failed to fetch grade details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && gradeId) {
      fetchGradeDetails();
    }
  }, [isOpen, gradeId]);

  if (!grade && !isLoading) return null;

  const {
    basicSalary = 0,
    totalAllowances = 0,
    grossSalary = 0,
  } = grade ? salaryStructureService.calculateTotalSalary(grade) : {};

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
      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <CircularProgress size={32} className="!text-green-600" />
        </div>
      ) : grade ? (
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
          <div className="space-y-4">
            {/* Header */}
            <div className="border-b pb-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FaMoneyBill className="!text-green-600" />
                  Grade Level {grade.level}
                </h2>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {grade.department?.name || "Global Grade Structure"}
              </p>
            </div>

            {/* Salary Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Basic Salary</p>
                <p className="text-lg font-semibold text-gray-900">
                  ₦{basicSalary.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-gray-500 mb-1">Total Allowances</p>
                <p className="text-lg font-semibold !text-blue-600">
                  ₦{totalAllowances.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                <p className="text-sm text-gray-500 mb-1">Gross Salary</p>
                <p className="text-lg font-semibold !text-green-600">
                  ₦{grossSalary.toLocaleString()}
                </p>
              </div>
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
                        <div className="flex items-center gap-1 h-[24px] text-center align-center justify-center">
                          {component.type === ComponentType.Percentage ? (
                            <>
                              <FaPercentage
                                className="!text-blue-600 shrink-0"
                                size={16}
                              />
                              <span className="font-medium text-gray-900">
                                Percentage
                              </span>
                            </>
                          ) : (
                            <>
                              <FaMoneyBill
                                className="!text-green-600 shrink-0"
                                size={16}
                              />
                              <span className="font-medium text-gray-900">
                                Fixed
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Value</p>
                        <p className="font-medium text-gray-900">
                          {component.type === ComponentType.Percentage
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
